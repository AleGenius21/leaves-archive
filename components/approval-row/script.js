/**
 * Formatta una data YYYY-MM-DD in formato italiano (es. "Gio 18 Dic")
 * @param {string} dateString - Data in formato YYYY-MM-DD
 * @returns {string} Data formattata in italiano
 */
function formatDateItalian(dateString) {
	if (!dateString) return '';
	
	const date = new Date(dateString + 'T00:00:00'); // Aggiungi ora per evitare problemi di fuso orario
	if (isNaN(date.getTime())) return dateString; // Se la data non è valida, ritorna la stringa originale
	
	const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
	const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
	
	const giornoSettimana = giorniSettimana[date.getDay()];
	const giorno = date.getDate();
	const mese = mesi[date.getMonth()];
	
	return `${giornoSettimana} ${giorno} ${mese}`;
}

/**
 * Estrae e formatta la quantità (giorni per FERIE, ore per PERMESSO) da moorea_obj.meta
 * Per FERIE: estrae meta.days e formatta come "{days}g" (es. "3g")
 * Per PERMESSO: estrae meta.hours e formatta come "{hours}h" (es. "5h")
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @returns {string} Stringa formattata con quantità (es. "3g" o "5h")
 */
function extractQuantityFromMoorea(data) {
	if (data.moorea_obj && data.moorea_obj.meta) {
		const meta = data.moorea_obj.meta;
		// Determina se è PERMESSO o FERIE
		const isPermesso = data.type_id === 2 || data.type_name === 'Permessi' || data.tipo_richiesta === 'PERMESSO';
		
		if (isPermesso && typeof meta.hours === 'number') {
			// PERMESSO: usa meta.hours e formatta come "5h"
			return meta.hours + 'h';
		} else if (!isPermesso && typeof meta.days === 'number') {
			// FERIE: usa meta.days e formatta come "3g"
			return meta.days + 'g';
		}
	}
	// Fallback ai campi legacy
	// Se abbiamo ore legacy, assumiamo che sia PERMESSO
	if (typeof data.ore === 'number' && data.ore > 0) {
		return data.ore + 'h';
	}
	// Default: restituisci stringa vuota se non ci sono dati
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
	// Determina se è PERMESSO o FERIE
	const isPermesso = data.type_id === 2 || data.type_name === 'Permessi' || data.tipo_richiesta === 'PERMESSO';
	
	// Prova a usare dataInizio/dataFine (struttura Admin Desktop - root level)
	if (data.dataInizio) {
		let dateText = '';
		let timeText = null;
		
		if (isPermesso) {
			// PERMESSO: usa solo dataInizio (i permessi sono sempre su un solo giorno)
			dateText = formatDateItalian(data.dataInizio);
			
			// Verifica se è giornata intera
			const giornataIntera = data.giornataIntera === 1 || data.giornataIntera === true;
			
			if (!giornataIntera) {
				// Non giornata intera: estrai orari
				// Prova root level prima
				if (data.oraInizio && data.oraFine) {
					if (typeof data.oraInizio === 'string' && typeof data.oraFine === 'string') {
						timeText = `${data.oraInizio} - ${data.oraFine}`;
					} else if (typeof data.oraInizio === 'number' && typeof data.oraFine === 'number') {
						// Converti da minuti a HH:MM
						const hoursInizio = Math.floor(data.oraInizio / 60);
						const minsInizio = data.oraInizio % 60;
						const hoursFine = Math.floor(data.oraFine / 60);
						const minsFine = data.oraFine % 60;
						const orarioInizio = String(hoursInizio).padStart(2, '0') + ':' + String(minsInizio).padStart(2, '0');
						const orarioFine = String(hoursFine).padStart(2, '0') + ':' + String(minsFine).padStart(2, '0');
						timeText = `${orarioInizio} - ${orarioFine}`;
					}
				}
			}
			// Se giornataIntera === true, timeText rimane null
		} else {
			// FERIE: gestisci range date
			if (data.dataFine && data.dataFine !== data.dataInizio) {
				// Date diverse: formatta come "Da Mer 18 Dic a Mar 24 Dic"
				dateText = 'Da ' + formatDateItalian(data.dataInizio) + ' a ' + formatDateItalian(data.dataFine);
			} else {
				// Date uguali: mostra solo dataInizio
				dateText = formatDateItalian(data.dataInizio);
			}
		}
		
		return { dateText, timeText };
	}
	
	// Fallback: prova a estrarre da moorea_obj.leaves
	if (data.moorea_obj && data.moorea_obj.leaves && Array.isArray(data.moorea_obj.leaves) && data.moorea_obj.leaves.length > 0) {
		const leaves = data.moorea_obj.leaves;
		
		// Ordina i leaves per dataInizio
		const sortedLeaves = [...leaves].sort((a, b) => {
			const dateA = new Date(a.dataInizio || a.dataFine || '');
			const dateB = new Date(b.dataInizio || b.dataFine || '');
			return dateA - dateB;
		});
		
		// Prendi la prima e ultima data
		const firstLeave = sortedLeaves[0];
		const lastLeave = sortedLeaves[sortedLeaves.length - 1];
		
		const firstDate = firstLeave.dataInizio || firstLeave.dataFine || '';
		const lastDate = lastLeave.dataFine || lastLeave.dataInizio || '';
		
		let dateText = '';
		let timeText = null;
		
		if (isPermesso) {
			// PERMESSO: usa solo la prima data
			dateText = formatDateItalian(firstDate);
			
			// Verifica giornataIntera (può essere nel leave o a livello root)
			const giornataIntera = (firstLeave.interaGiornata === 1) || (data.giornataIntera === 1 || data.giornataIntera === true);
			
			if (!giornataIntera) {
				// Cerca orari nei leaves
				const orarioInizio = firstLeave.orarioInizio || firstLeave.timeInizio || firstLeave.orario_inizio;
				const orarioFine = firstLeave.orarioFine || firstLeave.timeFine || firstLeave.orario_fine;
				
				if (orarioInizio && orarioFine) {
					timeText = `${orarioInizio} - ${orarioFine}`;
				}
			}
		} else {
			// FERIE: gestisci range date
			if (firstDate === lastDate || sortedLeaves.length === 1) {
				dateText = formatDateItalian(firstDate);
			} else {
				// Date diverse: formatta come "Da X a Y"
				dateText = 'Da ' + formatDateItalian(firstDate) + ' a ' + formatDateItalian(lastDate);
			}
		}
		
		return { dateText, timeText };
	}
	
	// Fallback ai campi legacy
	let dateText = data.data || '';
	let timeText = null;
	
	if (isPermesso && data.orario_inizio && data.orario_fine) {
		timeText = `${data.orario_inizio} - ${data.orario_fine}`;
	}
	
	return { dateText, timeText };
}

/**
 * Converte un colore in formato RGB
 * Supporta hex (#RRGGBB, #RGB), rgb(r,g,b), hsl(h,s%,l%), e nomi colore CSS
 * @param {string} color - Colore in qualsiasi formato supportato
 * @returns {{r: number, g: number, b: number}|null} Oggetto con componenti RGB o null se non valido
 */
function parseColorToRgb(color) {
	if (!color || typeof color !== 'string') return null;
	
	const trimmedColor = color.trim();
	
	// Hex color (#RRGGBB o #RGB)
	if (trimmedColor.startsWith('#')) {
		const hex = trimmedColor.slice(1);
		if (hex.length === 6) {
			const r = parseInt(hex.substring(0, 2), 16);
			const g = parseInt(hex.substring(2, 4), 16);
			const b = parseInt(hex.substring(4, 6), 16);
			if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
				return { r, g, b };
			}
		} else if (hex.length === 3) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
				return { r, g, b };
			}
		}
		return null;
	}
	
	// RGB/RGBA format: rgb(r, g, b) o rgba(r, g, b, a)
	const rgbMatch = trimmedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (rgbMatch) {
		const r = parseInt(rgbMatch[1], 10);
		const g = parseInt(rgbMatch[2], 10);
		const b = parseInt(rgbMatch[3], 10);
		if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
			return { r, g, b };
		}
	}
	
	// HSL format: hsl(h, s%, l%) o hsla(h, s%, l%, a)
	const hslMatch = trimmedColor.match(/^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
	if (hslMatch) {
		const h = parseInt(hslMatch[1], 10) / 360;
		const s = parseInt(hslMatch[2], 10) / 100;
		const l = parseInt(hslMatch[3], 10) / 100;
		
		// Converti HSL a RGB
		const c = (1 - Math.abs(2 * l - 1)) * s;
		const x = c * (1 - Math.abs((h * 6) % 2 - 1));
		const m = l - c / 2;
		
		let r, g, b;
		if (h < 1/6) {
			r = c; g = x; b = 0;
		} else if (h < 2/6) {
			r = x; g = c; b = 0;
		} else if (h < 3/6) {
			r = 0; g = c; b = x;
		} else if (h < 4/6) {
			r = 0; g = x; b = c;
		} else if (h < 5/6) {
			r = x; g = 0; b = c;
		} else {
			r = c; g = 0; b = x;
		}
		
		return {
			r: Math.round((r + m) * 255),
			g: Math.round((g + m) * 255),
			b: Math.round((b + m) * 255)
		};
	}
	
	// Fallback: prova a creare un elemento temporaneo per ottenere il colore RGB
	// (utile per nomi colore CSS come "red", "blue", ecc.)
	try {
		const tempDiv = document.createElement('div');
		tempDiv.style.color = trimmedColor;
		tempDiv.style.position = 'absolute';
		tempDiv.style.visibility = 'hidden';
		document.body.appendChild(tempDiv);
		const computedColor = window.getComputedStyle(tempDiv).color;
		document.body.removeChild(tempDiv);
		
		const rgbComputed = computedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		if (rgbComputed) {
			return {
				r: parseInt(rgbComputed[1], 10),
				g: parseInt(rgbComputed[2], 10),
				b: parseInt(rgbComputed[3], 10)
			};
		}
	} catch (e) {
		// Ignora errori
	}
	
	return null;
}

/**
 * Calcola la luminosità relativa di un colore secondo WCAG
 * @param {string} color - Colore in qualsiasi formato supportato
 * @returns {number} Luminosità relativa (0-1), dove >0.5 è chiaro
 */
function getRelativeLuminance(color) {
	const rgb = parseColorToRgb(color);
	if (!rgb) return 0.5; // Default: assume colore medio se non valido
	
	// Normalizza i valori RGB (0-1)
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;
	
	// Applica gamma correction
	const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
	const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
	const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
	
	// Calcola luminosità relativa secondo WCAG
	const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
	
	return luminance;
}

/**
 * Applica lo stile al badge reparto con colore dinamico
 * Gestisce automaticamente il colore del testo per garantire leggibilità
 * @param {HTMLElement} badgeElement - Elemento DOM del badge reparto
 * @param {string} departmentColor - Colore del reparto (es. "#FF0000", "rgb(255,0,0)", "hsl(0,100%,50%)")
 */
function applyDepartmentBadgeStyle(badgeElement, departmentColor) {
	if (!badgeElement || !departmentColor) {
		// Se non c'è colore, mantieni lo stile CSS di default
		return;
	}
	
	// Applica il colore di sfondo
	badgeElement.style.backgroundColor = departmentColor;
	
	// Calcola la luminosità relativa per determinare il colore del testo
	const luminance = getRelativeLuminance(departmentColor);
	
	// Se il colore è chiaro (luminosità > 0.5), usa testo nero, altrimenti bianco
	// Usiamo una soglia leggermente più bassa (0.45) per garantire migliore leggibilità
	const textColor = luminance > 0.45 ? '#000000' : '#ffffff';
	badgeElement.style.color = textColor;
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
	// Creazione elemento riga principale
	const row = document.createElement('div');
	row.className = 'approval-row';
	row.setAttribute('data-request-id', data.id || Math.random().toString(36).substr(2, 9));

	// Sezione profilo dipendente (sinistra)
	const employeeProfile = document.createElement('div');
	employeeProfile.className = 'employee-profile';

	const avatar = document.createElement('img');
	avatar.className = 'employee-avatar';

	// Genera URL pravatar.cc basato su ID o nome per avere avatar diversi
	function generateAvatarUrl(data) {
		if (data.immagine) {
			return data.immagine;
		}
		// Usa l'ID se disponibile, altrimenti genera un numero dal nome
		let seed = data.id || 0;
		if (!seed && data.nome) {
			// Genera un numero determinato dal nome (1-70)
			let hash = 0;
			for (let i = 0; i < data.nome.length; i++) {
				hash = ((hash << 5) - hash) + data.nome.charCodeAt(i);
				hash = hash & hash; // Convert to 32bit integer
			}
			seed = Math.abs(hash % 70) + 1;
		}
		return `https://i.pravatar.cc/43?img=${seed || Math.floor(Math.random() * 70) + 1}`;
	}

	avatar.src = generateAvatarUrl(data);
	avatar.alt = data.nome;
	avatar.onerror = function () {
		// Fallback a pravatar.cc con numero casuale
		this.src = `https://i.pravatar.cc/43?img=${Math.floor(Math.random() * 70) + 1}`;
	};

	const employeeInfo = document.createElement('div');
	employeeInfo.className = 'employee-info';

	const employeeName = document.createElement('p');
	employeeName.className = 'employee-name';
	employeeName.textContent = data.nome;

	const employeeBadges = document.createElement('div');
	employeeBadges.className = 'employee-badges';

	const badgeMansione = document.createElement('span');
	badgeMansione.className = 'badge-mansione';
	badgeMansione.textContent = data.task_name || data.mansione || '';
	// Applica lo stile con colore dinamico se disponibile
	if (data.task_color) {
		applyTaskBadgeStyle(badgeMansione, data.task_color);
	}

	const badgeReparto = document.createElement('span');
	badgeReparto.className = 'badge-reparto';
	badgeReparto.textContent = data.department_name || data.reparto || '';
	// Applica lo stile con colore dinamico se disponibile
	if (data.department_color) {
		applyDepartmentBadgeStyle(badgeReparto, data.department_color);
	}

	employeeBadges.appendChild(badgeMansione);
	employeeBadges.appendChild(badgeReparto);
	employeeInfo.appendChild(employeeName);
	employeeInfo.appendChild(employeeBadges);
	employeeProfile.appendChild(avatar);
	employeeProfile.appendChild(employeeInfo);

	// Sezione dettagli richiesta (centro)
	const requestDetails = document.createElement('div');
	requestDetails.className = 'request-details';

	const typeBadge = document.createElement('span');
	typeBadge.className = 'request-type-badge';
	// Determina tipo richiesta (preferire type_name, fallback a tipo_richiesta)
	const tipoRichiesta = data.type_name || data.tipo_richiesta || '';
	// Aggiungi classe specifica in base al tipo di richiesta
	if (tipoRichiesta === 'Ferie' || data.tipo_richiesta === 'FERIE' || data.type_id === 1) {
		typeBadge.classList.add('badge-ferie');
	} else if (tipoRichiesta === 'Permessi' || data.tipo_richiesta === 'PERMESSO' || data.type_id === 2) {
		typeBadge.classList.add('badge-permessi');
	}
	typeBadge.textContent = tipoRichiesta || data.tipo_richiesta || '';

	const quantitySpan = document.createElement('span');
	quantitySpan.className = 'request-quantity px-2';
	const quantityText = extractQuantityFromMoorea(data);
	quantitySpan.textContent = quantityText;

	const datetimeSpan = document.createElement('span');
	datetimeSpan.className = 'request-datetime';
	const dateInfo = extractDateInfoFromMoorea(data);
	const isPermesso = data.type_id === 2 || data.type_name === 'Permessi' || data.tipo_richiesta === 'PERMESSO';
	
	// Per PERMESSO non giornata intera, crea due span separati per gestire meglio lo spacing
	if (isPermesso && dateInfo.timeText) {
		const dateSpan = document.createElement('span');
		dateSpan.textContent = dateInfo.dateText;
		
		const separatorSpan = document.createElement('span');
		separatorSpan.className = 'datetime-separator';
		separatorSpan.textContent = ' | ';
		
		const timeSpan = document.createElement('span');
		timeSpan.className = 'datetime-time';
		timeSpan.textContent = dateInfo.timeText;
		
		datetimeSpan.appendChild(dateSpan);
		datetimeSpan.appendChild(separatorSpan);
		datetimeSpan.appendChild(timeSpan);
	} else {
		// Per FERIE o permesso giornata intera, mostra solo la data
		datetimeSpan.textContent = dateInfo.dateText;
	}

	requestDetails.appendChild(typeBadge);
	requestDetails.appendChild(quantitySpan);
	requestDetails.appendChild(datetimeSpan);

	// Icona stato (spunta verde se status=1, X rossa se status=2)
	const statusIcon = document.createElement('div');
	statusIcon.className = 'approval-row-status-icon';
	
	if (data.status === 1) {
		const checkIcon = document.createElement('i');
		checkIcon.className = 'bi bi-check-lg';
		statusIcon.appendChild(checkIcon);
		statusIcon.classList.add('status-approved');
	} else if (data.status === 2) {
		const xIcon = document.createElement('i');
		xIcon.className = 'bi bi-x-lg';
		statusIcon.appendChild(xIcon);
		statusIcon.classList.add('status-rejected');
	}

	// Assemblaggio riga
	row.appendChild(employeeProfile);
	row.appendChild(requestDetails);
	if (data.status === 1 || data.status === 2) {
		row.appendChild(statusIcon);
	}

	// Click sulla riga per aprire il pannello di dettaglio
	row.addEventListener('click', function(e) {
		// Verifica che openDetailPanel sia disponibile
		if (typeof openDetailPanel === 'function') {
			openDetailPanel(data);
		} else {
			console.warn('openDetailPanel non disponibile. Assicurati che detail-panel.js sia caricato.');
		}
	});

	return row;
}
