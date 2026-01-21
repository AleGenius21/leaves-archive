/**
 * Formatta una data YYYY-MM-DD in formato "dd/MM/yy" (es. "22/01/25")
 * @param {string} dateString 
 * @returns {string}
 */
function formatDateDDMMYY(dateString) {
	if (!dateString) return '';
	const date = new Date(dateString + 'T00:00:00');
	if (isNaN(date.getTime())) return dateString;

	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear()).slice(-2); // Ultime 2 cifre

	return `${day}/${month}/${year}`;
}

/**
 * Formatta una data YYYY-MM-DD in formato "Gio dd/MM/yy" (es. "Gio 28/01/26")
 * Restituisce HTML con span per il giorno della settimana
 * @param {string} dateString 
 * @returns {string}
 */
function formatDayDDMMYY(dateString) {
	if (!dateString) return '';
	const date = new Date(dateString + 'T00:00:00');
	if (isNaN(date.getTime())) return dateString;

	const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
	const giornoSettimana = giorniSettimana[date.getDay()];
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear()).slice(-2);

	return `<span class="day-name">${giornoSettimana}</span> ${day}/${month}/${year}`;
}

/**
 * Formatta un orario da HH:mm:ss a HH:mm (rimuove i secondi)
 * @param {string} timeString - Orario in formato HH:mm:ss o HH:mm
 * @returns {string} Orario formattato come HH:mm
 */
function formatTimeToHHMM(timeString) {
	if (!timeString || typeof timeString !== 'string') return timeString || '';
	// Se la stringa è lunga almeno 5 caratteri (es. 09:00 o 09:00:00), prendi i primi 5
	return timeString.length >= 5 ? timeString.substring(0, 5) : timeString;
}

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
 * Normalizza una quantità di ore o giorni secondo le regole specificate
 * Per ORE: arrotonda a intero o step di 0.5 (1 = 1 ora, 2.5 = 2 ore 30 min, 2.77 → 3 = 3 ore)
 * Per GIORNI: arrotonda sempre ad un intero
 * @param {number} value - Valore da normalizzare
 * @param {string} unit - Unità: 'hours' per ore, 'days' per giorni
 * @returns {number} Valore normalizzato
 */
function normalizeQuantity(value, unit) {
	if (typeof value !== 'number' || isNaN(value)) {
		return value;
	}
	if (unit === 'hours') {
		const remainder = value % 1;
		if (remainder === 0 || remainder === 0.5) {
			return value;
		}
		if (remainder < 0.25) {
			return Math.floor(value);
		} else if (remainder < 0.75) {
			return Math.floor(value) + 0.5;
		} else {
			return Math.ceil(value);
		}
	} else if (unit === 'days') {
		return Math.round(value);
	}
	return value;
}

/**
 * Verifica se una richiesta è "Last Minute" in base al tipo e alla data di creazione
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @param {number} typeValue - Tipo di richiesta: 1=Ferie, 2=Permessi
 * @returns {boolean} True se la richiesta è Last Minute
 */
function isLastMinute(data, typeValue) {
	if (!data.created_at) return false;
	const createdDate = new Date(data.created_at);
	if (isNaN(createdDate.getTime())) return false;
	const now = new Date();
	const diffHours = (now - createdDate) / (1000 * 60 * 60);
	if (typeValue === 1) {
		return diffHours < 72; // FERIE: Last Minute se < 72h
	} else if (typeValue === 2) {
		return diffHours < 24; // PERMESSO: Last Minute se < 24h
	}
	return false;
}

/**
 * Verifica se una richiesta è "In Scadenza" in base al tipo e alla data di inizio
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @param {number} typeValue - Tipo di richiesta: 1=Ferie, 2=Permessi
 * @returns {boolean} True se la richiesta è In Scadenza
 */
function isInScadenza(data, typeValue) {
	if (!data.dataInizio) return false;
	const dataInizio = new Date(data.dataInizio + 'T00:00:00');
	if (isNaN(dataInizio.getTime())) return false;
	const oggi = new Date();
	oggi.setHours(0, 0, 0, 0);
	dataInizio.setHours(0, 0, 0, 0);
	if (typeValue === 1) {
		const diffDays = (dataInizio - oggi) / (1000 * 60 * 60 * 24);
		return diffDays >= 0 && diffDays < 21; // FERIE: < 21 giorni
	} else if (typeValue === 2) {
		let dataInizioConOra = new Date(dataInizio);
		const giornataIntera = data.giornataIntera === 1 || data.giornataIntera === true;
		if (data.oraInizio && !giornataIntera) {
			const oraParts = data.oraInizio.split(':');
			if (oraParts.length >= 2) {
				const ore = parseInt(oraParts[0], 10);
				const minuti = parseInt(oraParts[1], 10);
				if (!isNaN(ore) && !isNaN(minuti)) {
					dataInizioConOra.setHours(ore, minuti, 0, 0);
				}
			}
		}
		const oraAttuale = new Date();
		const diffHours = (dataInizioConOra - oraAttuale) / (1000 * 60 * 60);
		return diffHours >= 0 && diffHours < 24; // PERMESSO: < 24h
	}
	return false;
}

/**
 * Estrae e formatta la quantità (giorni per FERIE, ore per PERMESSO) da moorea_obj.meta
 * Per FERIE: estrae meta.days e formatta come "{days}g" (es. "3g")
 * Per PERMESSO: estrae meta.hours e formatta come "{hours}h" (es. "5h")
 * Usa normalizeQuantity per normalizzare i valori
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @returns {string} Stringa formattata con quantità (es. "3g" o "5h")
 */
function extractQuantityFromMoorea(data) {
	if (data.moorea_obj && data.moorea_obj.meta) {
		const meta = data.moorea_obj.meta;
		// Determina se è PERMESSO o FERIE - nuova struttura: type, fallback a type_id
		const typeValue = data.type !== undefined ? data.type : (data.type_id !== undefined ? data.type_id : null);
		const isPermesso = typeValue === 2 || data.type_name === 'Permessi' || data.type_name === 'PERMESSO';

		if (isPermesso && typeof meta.hours === 'number') {
			// PERMESSO: usa meta.hours e normalizza, poi formatta come "5h"
			const normalizedHours = normalizeQuantity(meta.hours, 'hours');
			return normalizedHours + 'h';
		} else if (!isPermesso && typeof meta.days === 'number') {
			// FERIE: usa meta.days e normalizza, poi formatta come "3g"
			const normalizedDays = normalizeQuantity(meta.days, 'days');
			return normalizedDays + 'g';
		}
	}
	// Fallback ai campi legacy
	// Se abbiamo ore legacy, assumiamo che sia PERMESSO
	if (typeof data.ore === 'number' && data.ore > 0) {
		const normalizedHours = normalizeQuantity(data.ore, 'hours');
		return normalizedHours + 'h';
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
	// Determina se è PERMESSO o FERIE - nuova struttura: type, fallback a type_id
	const typeValue = data.type !== undefined ? data.type : (data.type_id !== undefined ? data.type_id : null);
	const isPermesso = typeValue === 2 || data.type_name === 'Permessi' || data.type_name === 'PERMESSO';

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
						// MODIFICA: Uso formatTimeToHHMM per rimuovere i secondi
						timeText = `${formatTimeToHHMM(data.oraInizio)} - ${formatTimeToHHMM(data.oraFine)}`;
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
					// MODIFICA: Uso formatTimeToHHMM per rimuovere i secondi
					timeText = `${formatTimeToHHMM(orarioInizio)} - ${formatTimeToHHMM(orarioFine)}`;
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
		// MODIFICA: Uso formatTimeToHHMM per rimuovere i secondi
		timeText = `${formatTimeToHHMM(data.orario_inizio)} - ${formatTimeToHHMM(data.orario_fine)}`;
	}

	return { dateText, timeText };
}

/**
 * Converte colore in RGB (Helper)
 * Supporta hex (#RRGGBB), rgb(), hsl(), nomi CSS
 */
function parseColorToRgb(color) {
	if (!color || typeof color !== 'string') return null;
	const trimmedColor = color.trim();
	
	// Hex color (#RRGGBB)
	if (trimmedColor.startsWith('#')) {
		const hex = trimmedColor.slice(1);
		if (hex.length === 6) {
			return {
				r: parseInt(hex.substring(0, 2), 16),
				g: parseInt(hex.substring(2, 4), 16),
				b: parseInt(hex.substring(4, 6), 16)
			};
		}
		if (hex.length === 3) {
			// Short hex (#RGB)
			return {
				r: parseInt(hex[0] + hex[0], 16),
				g: parseInt(hex[1] + hex[1], 16),
				b: parseInt(hex[2] + hex[2], 16)
			};
		}
	}
	
	// RGB color (rgb(r, g, b) or rgba(r, g, b, a))
	const rgbMatch = trimmedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
	if (rgbMatch) {
		return {
			r: parseInt(rgbMatch[1], 10),
			g: parseInt(rgbMatch[2], 10),
			b: parseInt(rgbMatch[3], 10)
		};
	}
	
	// HSL color (hsl(h, s%, l%) or hsla(h, s%, l%, a))
	const hslMatch = trimmedColor.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/i);
	if (hslMatch) {
		const h = parseInt(hslMatch[1], 10) / 360;
		const s = parseInt(hslMatch[2], 10) / 100;
		const l = parseInt(hslMatch[3], 10) / 100;
		
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
	
	// CSS color names - mappatura base
	const colorNames = {
		'black': { r: 0, g: 0, b: 0 },
		'white': { r: 255, g: 255, b: 255 },
		'red': { r: 255, g: 0, b: 0 },
		'green': { r: 0, g: 128, b: 0 },
		'blue': { r: 0, g: 0, b: 255 },
		'yellow': { r: 255, g: 255, b: 0 },
		'cyan': { r: 0, g: 255, b: 255 },
		'magenta': { r: 255, g: 0, b: 255 },
		'orange': { r: 255, g: 165, b: 0 },
		'firebrick': { r: 178, g: 34, b: 34 }
	};
	
	const lowerColor = trimmedColor.toLowerCase();
	if (colorNames[lowerColor]) {
		return colorNames[lowerColor];
	}
	
	// Fallback: prova a usare un elemento temporaneo per ottenere il colore
	try {
		const tempEl = document.createElement('div');
		tempEl.style.color = trimmedColor;
		document.body.appendChild(tempEl);
		const computedColor = window.getComputedStyle(tempEl).color;
		document.body.removeChild(tempEl);
		
		const rgbComputed = computedColor.match(/\d+/g);
		if (rgbComputed && rgbComputed.length >= 3) {
			return {
				r: parseInt(rgbComputed[0], 10),
				g: parseInt(rgbComputed[1], 10),
				b: parseInt(rgbComputed[2], 10)
			};
		}
	} catch (e) {
		// Ignora errori
	}
	
	return null;
}

/**
 * Calcola luminosità relativa per colore testo (Helper)
 * Implementazione WCAG completa con gamma correction
 */
function getRelativeLuminance(color) {
	const rgb = parseColorToRgb(color);
	if (!rgb) return 0.5;
	
	// Normalizza valori RGB a 0-1
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;
	
	// Applica gamma correction (linearizzazione)
	const linearize = (val) => {
		return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
	};
	
	const rLinear = linearize(r);
	const gLinear = linearize(g);
	const bLinear = linearize(b);
	
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
	let badgeSlotCounter = 0;
	
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
    if (data.task_color) applyTaskBadgeStyle(badgeMansione, data.task_color);

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

    // ---------------------------------------------------------
    // SEZIONE 2: Dettagli Richiesta (Centro) con WRAPPER
    // ---------------------------------------------------------
    const requestDetails = document.createElement('div');
    requestDetails.className = 'request-details';

    // Determina tipo
    const typeValue = data.type !== undefined ? data.type : (data.type_id !== undefined ? data.type_id : null);
    const tipoRichiesta = data.type_name || data.tipo_richiesta || '';
    const isPermesso = typeValue === 2 || tipoRichiesta === 'Permessi' || tipoRichiesta === 'PERMESSO';

    // --- 2.1 Tipo Richiesta (Wrapper min-width: 90px) ---
    const typeWrapper = document.createElement('div');
    typeWrapper.className = 'rd-wrapper-type'; // CSS include position: relative

    const typeBadge = document.createElement('span');
    typeBadge.className = 'request-type-badge';

    if (tipoRichiesta === 'Ferie' || tipoRichiesta === 'FERIE' || typeValue === 1) {
        typeBadge.classList.add('badge-ferie');
    } else if (tipoRichiesta === 'Permessi' || tipoRichiesta === 'PERMESSO' || typeValue === 2) {
        typeBadge.classList.add('badge-permessi');
    }
    typeBadge.textContent = tipoRichiesta || '';

    typeWrapper.appendChild(typeBadge);

    // Badge Last Minute
    const showLastMinute = isLastMinute(data, typeValue);
    if (showLastMinute) {
        const lmBadge = document.createElement('div');
        lmBadge.className = 'status-floating-badge badge-last-minute';
        lmBadge.textContent = 'LAST MINUTE';
        badgeSlotCounter++;
        lmBadge.classList.add('badge-slot-' + badgeSlotCounter);
        typeWrapper.appendChild(lmBadge);
    }

    // --- 2.2 Quantità (Wrapper min-width: 45px) ---
    const quantityWrapper = document.createElement('div');
    quantityWrapper.className = 'rd-wrapper-quantity';

    const quantitySpan = document.createElement('span');
    quantitySpan.className = 'request-quantity px-2';

    // *** MODIFICA: Logica avanzata per visualizzazione quantità ***
    const quantityText = extractQuantityFromMoorea(data); // Restituisce es. "3g" o "5h"

    if (quantityText && quantityText.length > 0) {
        // Estrai l'ultimo carattere per capire l'unità (g o h)
        const unitChar = quantityText.slice(-1).toLowerCase();
        // Estrai la parte numerica
        const numberVal = quantityText.slice(0, -1);
        const numericValue = parseFloat(numberVal);

        let label = '';
        if (unitChar === 'g') {
            label = (numberVal === '1') ? 'giorno' : 'giorni';
            quantitySpan.innerHTML = `
                <span class="qty-number">${numberVal}</span>
                <span class="qty-label pt-1">${label}</span>
            `;
        } else if (unitChar === 'h') {
            label = (numberVal === '1') ? 'ora' : 'ore';
            const isInteger = Number.isInteger(numericValue);

            if (isInteger) {
                quantitySpan.innerHTML = `
                    <span class="qty-number">${numberVal}</span>
                    <span class="qty-label">${label}</span>
                `;
            } else {
                // ORE NON INTERE (es. 2.5, 4.5): mostra "2 h 30 min" sulla stessa riga, "ORE" centrato sotto
                const hoursInt = Math.floor(numericValue);
                quantitySpan.innerHTML = `
                    <span class="qty-columns-wrapper">
                        <span class="qty-row-top">
                            <span class="qty-number">${hoursInt}</span>
                            <span class="qty-hours-h pe-1">h</span>
                            <span class="qty-minutes-number">30</span>
                            <span class="qty-minutes-label">min</span>
                        </span>
                        <span class="qty-row-bottom">
                            <span class="qty-label">ORE</span>
                        </span>
                    </span>
                `;
            }
        } else {
            quantitySpan.textContent = quantityText;
        }
    } else {
        quantitySpan.textContent = '';
    }

    quantityWrapper.appendChild(quantitySpan);

    // --- 2.3 Data e Ora (Wrapper min-width: 165px) ---
    const datetimeWrapper = document.createElement('div');
    datetimeWrapper.className = 'rd-wrapper-datetime ms-4'; // CSS include position: relative

    // *** MODIFICA: Nuova logica per formattazione date (Ferie singola riga, Permessi invariati) ***
    const dateInfo = extractDateInfoFromMoorea(data);
    
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.alignItems = 'flex-start';

    if (!isPermesso) {
        // --- FERIE: Solo una riga "Da X a Y", testo normale ---
        
        let start = '', end = '';
        if (data.dataInizio) {
            start = formatDateDDMMYY(data.dataInizio);
            end = data.dataFine ? formatDateDDMMYY(data.dataFine) : start;
        } 
        else if (data.moorea_obj && data.moorea_obj.leaves && data.moorea_obj.leaves.length > 0) {
            const leaves = data.moorea_obj.leaves;
            const sortedLeaves = [...leaves].sort((a, b) => new Date(a.dataInizio) - new Date(b.dataInizio));
            start = formatDateDDMMYY(sortedLeaves[0].dataInizio);
            end = formatDateDDMMYY(sortedLeaves[sortedLeaves.length - 1].dataFine || sortedLeaves[sortedLeaves.length - 1].dataInizio);
        }

        if (start) {
            let htmlText;
            if (start === end) {
                htmlText = `Il ${start}`;
            } else {
                htmlText = `<span class="date-preposition">Da</span> ${start} <span class="date-preposition">a</span> ${end}`;
            }
            
            const simpleSpan = document.createElement('span');
            simpleSpan.className = 'date-range-normal';
            simpleSpan.innerHTML = htmlText;
            textContainer.appendChild(simpleSpan);
        }
        
    } else {
        // --- PERMESSO: Data estesa + orari (Invariato) ---
        
        let formattedDate = '';
        if (data.dataInizio) {
            formattedDate = formatDayDDMMYY(data.dataInizio);
        } else if (data.moorea_obj && data.moorea_obj.leaves && data.moorea_obj.leaves.length > 0) {
            formattedDate = formatDayDDMMYY(data.moorea_obj.leaves[0].dataInizio);
        } else {
            formattedDate = dateInfo.dateText; 
        }

        const span = document.createElement('span');
        span.className = 'request-datetime';

        if (dateInfo.timeText) {
            span.innerHTML = `${formattedDate} <span class="datetime-separator">|</span> <span class="datetime-time">${dateInfo.timeText}</span>`;
        } else {
            span.textContent = formattedDate;
        }
        textContainer.appendChild(span);
    }

    datetimeWrapper.appendChild(textContainer);

    // Badge In Scadenza
    const showInScadenza = isInScadenza(data, typeValue);
    if (showInScadenza) {
        const scadenzaBadge = document.createElement('div');
        scadenzaBadge.className = 'status-floating-badge badge-scadenza';
        scadenzaBadge.textContent = 'IN SCADENZA';
        badgeSlotCounter++;
        scadenzaBadge.classList.add('badge-slot-' + badgeSlotCounter);
        datetimeWrapper.appendChild(scadenzaBadge);
    }

    // Appendere i wrapper al contenitore principale
    requestDetails.appendChild(typeWrapper);
    requestDetails.appendChild(quantityWrapper);
    requestDetails.appendChild(datetimeWrapper);

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
