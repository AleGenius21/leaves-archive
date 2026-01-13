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
 * Estrae le ore totali da moorea_obj.meta.hours, con fallback ai campi legacy
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @returns {number} Numero di ore totali
 */
function extractHoursFromMoorea(data) {
	if (data.moorea_obj && data.moorea_obj.meta && typeof data.moorea_obj.meta.hours === 'number') {
		return data.moorea_obj.meta.hours;
	}
	// Fallback ai campi legacy
	return data.ore || 0;
}

/**
 * Estrae le informazioni di data e orario da moorea_obj.leaves, con fallback ai campi legacy
 * @param {Object} data - Oggetto contenente i dati della richiesta
 * @returns {Object} Oggetto con { dateText: string, timeText: string|null }
 */
function extractDateInfoFromMoorea(data) {
	// Prova a estrarre da moorea_obj.leaves
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
		
		// Se c'è una sola data o le date sono uguali, mostra solo quella
		let dateText = '';
		if (firstDate === lastDate || sortedLeaves.length === 1) {
			dateText = formatDateItalian(firstDate);
		} else {
			// Mostra range di date (prima data)
			dateText = formatDateItalian(firstDate);
		}
		
		// Estrai orari se presenti (solo per PERMESSO e se interaGiornata è 0 o mancante)
		let timeText = null;
		if (data.tipo_richiesta === 'PERMESSO' && firstLeave) {
			// Cerca orari nei leaves (potrebbero essere in campi come orarioInizio/orarioFine o timeInizio/timeFine)
			const orarioInizio = firstLeave.orarioInizio || firstLeave.timeInizio || firstLeave.orario_inizio;
			const orarioFine = firstLeave.orarioFine || firstLeave.timeFine || firstLeave.orario_fine;
			
			if (orarioInizio && orarioFine) {
				timeText = `${orarioInizio} - ${orarioFine}`;
			}
		}
		
		return { dateText, timeText };
	}
	
	// Fallback ai campi legacy
	let dateText = data.data || '';
	let timeText = null;
	if (data.orario_inizio && data.orario_fine) {
		timeText = `${data.orario_inizio} - ${data.orario_fine}`;
	}
	
	return { dateText, timeText };
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
 * @param {string} [data.stato] - Stato della richiesta ("Approvato" o "Rifiutato")
 * @param {Object} [data.moorea_obj] - Oggetto moorea con meta e leaves
 * @param {Object} [data.moorea_obj.meta] - Metadati con hours, days, leave_details_txt
 * @param {Array} [data.moorea_obj.leaves] - Array di oggetti leaves con dataInizio, dataFine, quantitaOre
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
	badgeMansione.textContent = data.mansione;

	const badgeReparto = document.createElement('span');
	badgeReparto.className = 'badge-reparto';
	badgeReparto.textContent = data.reparto || '';

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
	// Aggiungi classe specifica in base al tipo di richiesta
	if (data.tipo_richiesta === 'FERIE') {
		typeBadge.classList.add('badge-ferie');
	} else if (data.tipo_richiesta === 'PERMESSO') {
		typeBadge.classList.add('badge-permessi');
	}
	typeBadge.textContent = data.tipo_richiesta;

	const hoursSpan = document.createElement('span');
	hoursSpan.className = 'request-hours';
	const totalHours = extractHoursFromMoorea(data);
	hoursSpan.textContent = totalHours + 'h';

	const datetimeSpan = document.createElement('span');
	datetimeSpan.className = 'request-datetime';
	const dateInfo = extractDateInfoFromMoorea(data);
	let datetimeText = dateInfo.dateText;
	if (dateInfo.timeText) {
		datetimeText += ' | ' + dateInfo.timeText;
	}
	datetimeSpan.textContent = datetimeText;

	// Badge stato (Approvato/Rifiutato)
	const stateBadge = document.createElement('span');
	stateBadge.className = 'request-state-badge';
	if (data.stato === 'Approvato') {
		stateBadge.classList.add('badge-approvato');
	} else if (data.stato === 'Rifiutato') {
		stateBadge.classList.add('badge-rifiutato');
	}
	stateBadge.textContent = data.stato || '';

	requestDetails.appendChild(typeBadge);
	requestDetails.appendChild(hoursSpan);
	requestDetails.appendChild(datetimeSpan);
	requestDetails.appendChild(stateBadge);

	// Assemblaggio riga
	row.appendChild(employeeProfile);
	row.appendChild(requestDetails);

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

