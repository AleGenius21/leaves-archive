/**
 * Formatta una data YYYY-MM-DD in formato italiano (es. "Gio 18 Dic")
 * @param {string} dateString - Data in formato YYYY-MM-DD
 * @returns {string} Data formattata in italiano
 */
function formatDateItalian(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    
    const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    
    return `${giorniSettimana[date.getDay()]} ${date.getDate()} ${mesi[date.getMonth()]}`;
}

/**
 * Estrae e formatta la quantità (giorni per FERIE, ore per PERMESSO) da moorea_obj.meta
 * Per FERIE: estrae meta.days e formatta come "{days}g" (es. "3g")
 * Per PERMESSO: estrae meta.hours e formatta come "{hours}h" (es. "5h")
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @returns {string} Stringa formattata con quantità (es. "3g" o "5h")
 */
function extractQuantityFromMoorea(data) {
    // Priorità all'oggetto moorea nuovo
    if (data.moorea_obj && data.moorea_obj.meta) {
        const meta = data.moorea_obj.meta;
        const isPermesso = data.type === 2 || data.type_name === 'PERMESSO';

        if (isPermesso) {
            // Se c'è hours (decimal), formattalo
            if (typeof meta.hours === 'number') {
                // Arrotonda a 2 decimali o intero
                return parseFloat(meta.hours.toFixed(2)) + 'h';
            }
            // Fallback su quantitaOre (spesso in minuti nel nuovo JSON)
            if (data.quantitaOre) {
                // Se > 8 probabilmente sono minuti
                if (data.quantitaOre > 24) {
                     return Math.round(data.quantitaOre / 60) + 'h';
                }
                return data.quantitaOre + 'h';
            }
        } else {
            // FERIE
            if (typeof meta.days === 'number') {
                return meta.days + 'g';
            }
        }
    }
    return '';
}

/**
 * Estrae le informazioni di data e orario da dataInizio/dataFine, con logica separata per FERIE e PERMESSO
 * Per FERIE: mostra range "Da X a Y" se date diverse, altrimenti solo data
 * Per PERMESSO: mostra data + orari solo se non giornata intera
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @returns {Object} Oggetto con { dateText: string, timeText: string|null }
 */
function extractDateInfoFromMoorea(data) {
    const isPermesso = data.type === 2 || data.type_name === 'PERMESSO';
    
    let dateText = '';
    let timeText = null;

    // Uso dataInizio root level (YYYY-MM-DD)
    if (data.dataInizio) {
        if (isPermesso) {
            dateText = formatDateItalian(data.dataInizio);
            
            // Se non è giornata intera, cerchiamo gli orari
            if (data.giornataIntera === 0 || data.giornataIntera === false) {
                // Il nuovo JSON ha oraInizio: "11:00:00"
                if (data.oraInizio && data.oraFine) {
                    // Prendi solo i primi 5 caratteri (HH:MM)
                    const start = String(data.oraInizio).substring(0, 5);
                    const end = String(data.oraFine).substring(0, 5);
                    timeText = `${start} - ${end}`;
                }
            }
        } else {
            // FERIE
            if (data.dataFine && data.dataFine !== data.dataInizio) {
                dateText = 'Da ' + formatDateItalian(data.dataInizio) + ' a ' + formatDateItalian(data.dataFine);
            } else {
                dateText = formatDateItalian(data.dataInizio);
            }
        }
    }
    
    return { dateText, timeText };
}

/**
 * Converte colore in RGB (Helper)
 */
function parseColorToRgb(color) {
    if (!color || typeof color !== 'string') return null;
    const trimmedColor = color.trim();
    if (trimmedColor.startsWith('#')) {
        const hex = trimmedColor.slice(1);
        if (hex.length === 6) {
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }
    }
    return null;
}

/**
 * Calcola luminosità per colore testo (Helper)
 */
function getRelativeLuminance(color) {
    const rgb = parseColorToRgb(color);
    if (!rgb) return 0.5;
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    // Semplificazione luminosità
    return (0.2126 * r + 0.7152 * g + 0.0722 * b);
}


/**
 * Applica lo stile al badge reparto con colore dinamico
 * Gestisce automaticamente il colore del testo per garantire leggibilità
 * @param {HTMLElement} badgeElement - Elemento DOM del badge reparto
 * @param {string} departmentColor - Colore del reparto (es. "#FF0000", "rgb(255,0,0)", "hsl(0,100%,50%)")
 */
function applyBadgeStyle(element, color) {
    if (!element || !color) return;
    element.style.backgroundColor = color;
    element.style.color = getRelativeLuminance(color) > 0.45 ? '#000000' : '#ffffff';
}

/**
 * Applica lo stile al badge mansione con colore dinamico
 * Gestisce automaticamente il colore del testo per garantire leggibilità
 * @param {HTMLElement} badgeElement - Elemento DOM del badge mansione
 * @param {string} taskColor - Colore della mansione (es. "#00FF00", "rgb(0,255,0)", "hsl(120,100%,50%)")
 */
function applyTaskBadgeStyle(badgeElement, taskColor) {
	if (!badgeElement || !taskColor) {
		// Se non c'è colore, mantieni lo stile CSS di default
		return;
	}
	
	// Applica il colore di sfondo
	badgeElement.style.backgroundColor = taskColor;
	
	// Calcola la luminosità relativa per determinare il colore del testo
	const luminance = getRelativeLuminance(taskColor);
	
	// Se il colore è chiaro (luminosità > 0.5), usa testo nero, altrimenti bianco
	// Usiamo una soglia leggermente più bassa (0.45) per garantire migliore leggibilità
	const textColor = luminance > 0.45 ? '#000000' : '#ffffff';
	badgeElement.style.color = textColor;
}

/**
 * Crea una riga di approvazione per ferie/permessi
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @param {string} data.nome - Nome completo del dipendente
 * @param {string} data.immagine - URL o path dell'immagine profilo
 * @param {string} data.mansione - Ruolo/mansione del dipendente
 * @param {string} data.cantiere - Sito di lavoro
 * @param {string} data.tipo_richiesta - Tipo di richiesta ("FERIE" o "PERMESSO")
 * @param {string} [data.data] - Data della richiesta (formato: "Gio 18 Dic") - legacy, preferire moorea_obj
 * @param {number} [data.ore] - Totale ore della richiesta - legacy, preferire moorea_obj.meta.hours
 * @param {string} [data.orario_inizio] - Orario di inizio (opzionale, es. "08:00") - legacy
 * @param {string} [data.orario_fine] - Orario di fine (opzionale, es. "17:00") - legacy
 * @param {string} [data.saldo_residuo] - Saldo residuo (opzionale, es. "12gg" o "120h")
 * @param {Object} [data.moorea_obj] - Oggetto moorea con meta e leaves
 * @param {Object} [data.moorea_obj.meta] - Metadati con hours, days, leave_details_txt
 * @param {Array} [data.moorea_obj.leaves] - Array di oggetti leaves con dataInizio, dataFine, quantitaOre
 * @param {string} [data.task_name] - Nome mansione (preferire su mansione)
 * @param {string} [data.task_color] - Colore mansione (hex, rgb, hsl, nome CSS)
 * @param {string} [data.department_name] - Nome reparto (preferire su reparto)
 * @param {string} [data.department_color] - Colore reparto (hex, rgb, hsl, nome CSS)
 * @param {string} [data.type_name] - Nome tipo richiesta (preferire su tipo_richiesta)
 * @param {number} [data.type_id] - ID tipo richiesta (1=FERIE, 2=PERMESSO)
 * @param {string} [data.dataInizio] - Data inizio (root level, struttura Admin Desktop)
 * @param {string} [data.dataFine] - Data fine (root level, struttura Admin Desktop)
 * @param {boolean|number} [data.giornataIntera] - Se true/1, permesso giornata intera
 * @param {string|number} [data.oraInizio] - Ora inizio (root level, stringa HH:MM o minuti)
 * @param {string|number} [data.oraFine] - Ora fine (root level, stringa HH:MM o minuti)
 * @returns {HTMLElement} Elemento DOM della riga di approvazione
*/


function createApprovalRow(data) {
    const row = document.createElement('div');
    row.className = 'approval-row';
    row.setAttribute('data-request-id', data.id);

    // --- Profilo Dipendente ---
    const employeeProfile = document.createElement('div');
    employeeProfile.className = 'employee-profile';

    const avatar = document.createElement('img');
    avatar.className = 'employee-avatar';
    // NUOVO CAMPO: profile_pic, fallback su immagine, fallback su pravatar
    avatar.src = data.profile_pic || data.immagine || `https://i.pravatar.cc/43?img=${(data.id % 70) + 1}`;
    avatar.alt = data.nominativo || data.nome;
    avatar.onerror = function() { this.src = `https://i.pravatar.cc/43?img=${(data.id % 70) + 1}`; };

    const employeeInfo = document.createElement('div');
    employeeInfo.className = 'employee-info';

    const employeeName = document.createElement('p');
    employeeName.className = 'employee-name';
    // NUOVO CAMPO: nominativo
    employeeName.textContent = data.nominativo || data.nome || 'Sconosciuto';

    const employeeBadges = document.createElement('div');
    employeeBadges.className = 'employee-badges';

    // Mansione
    const badgeMansione = document.createElement('span');
    badgeMansione.className = 'badge-mansione';
    badgeMansione.textContent = data.task_name || data.mansione || '';
    if (data.task_color) applyBadgeStyle(badgeMansione, data.task_color);

    // Reparto
    const badgeReparto = document.createElement('span');
    badgeReparto.className = 'badge-reparto';
    badgeReparto.textContent = data.department_name || data.reparto || '';
    if (data.department_color) applyBadgeStyle(badgeReparto, data.department_color);

    if(badgeMansione.textContent) employeeBadges.appendChild(badgeMansione);
    if(badgeReparto.textContent) employeeBadges.appendChild(badgeReparto);
    
    employeeInfo.appendChild(employeeName);
    employeeInfo.appendChild(employeeBadges);
    employeeProfile.appendChild(avatar);
    employeeProfile.appendChild(employeeInfo);

    // --- Dettagli Richiesta ---
    const requestDetails = document.createElement('div');
    requestDetails.className = 'request-details';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'request-type-badge';
    // NUOVO CAMPO: type_name
    const tipoRichiesta = data.type_name || data.tipo_richiesta || '';
    
    if (tipoRichiesta.toUpperCase() === 'FERIE' || data.type === 1) {
        typeBadge.classList.add('badge-ferie');
    } else {
        typeBadge.classList.add('badge-permessi');
    }
    typeBadge.textContent = tipoRichiesta;

    const quantitySpan = document.createElement('span');
    quantitySpan.className = 'request-quantity px-2';
    quantitySpan.textContent = extractQuantityFromMoorea(data);

    const datetimeSpan = document.createElement('span');
    datetimeSpan.className = 'request-datetime';
    
    const dateInfo = extractDateInfoFromMoorea(data);
    
    if (dateInfo.timeText) {
        datetimeSpan.innerHTML = `<span>${dateInfo.dateText}</span><span class="datetime-separator">|</span><span class="datetime-time">${dateInfo.timeText}</span>`;
    } else {
        datetimeSpan.textContent = dateInfo.dateText;
    }

    requestDetails.appendChild(typeBadge);
    requestDetails.appendChild(quantitySpan);
    requestDetails.appendChild(datetimeSpan);

    // --- Icona Stato ---
    const statusIcon = document.createElement('div');
    statusIcon.className = 'approval-row-status-icon';
    
    // NUOVO CAMPO: status (int). 1=Approvato, 2=Rifiutato.
    // A volte arriva 0 (In attesa/Nuovo), gestiamo anche quello.
    if (data.status === 1) {
        statusIcon.innerHTML = '<i class="bi bi-check-lg"></i>';
        statusIcon.classList.add('status-approved');
    } else if (data.status === 2) {
        statusIcon.innerHTML = '<i class="bi bi-x-lg"></i>';
        statusIcon.classList.add('status-rejected');
    } else if (data.status === 0) {
        // Opzionale: icona per "In attesa" se serve
        statusIcon.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        statusIcon.style.color = '#f59e0b'; // Amber
    }

    row.appendChild(employeeProfile);
    row.appendChild(requestDetails);
    row.appendChild(statusIcon);

    row.addEventListener('click', function() {
        if (typeof openDetailPanel === 'function') openDetailPanel(data);
    });

    return row;
}
