/**
 * Detail Panel Component
 * Gestisce l'apertura e chiusura del pannello laterale di dettaglio con calendario mese per mese
 */

let detailPanelElement = null;
let listSectionElement = null;
let isInitialized = false;
let currentRequestData = null;
let allRequestsForCalendar = [];
let allCalendarData = []; // Tutti i dati disponibili per il calendario
let selectedDay = null; // Giorno selezionato nel calendario {year, month, day}
let selectedPeriodStart = null; // Data inizio periodo selezionato
let selectedPeriodEnd = null; // Data fine periodo selezionato

/**
 * Inizializza il componente detail panel
 * @param {Array} calendarData - Dati opzionali per il calendario (se forniti, vengono caricati dopo l'inizializzazione)
 */
function initDetailPanel(calendarData = null) {
	if (isInitialized) {
		return;
	}

	detailPanelElement = document.getElementById('detail-panel');
	listSectionElement = document.getElementById('listSection');

	if (!detailPanelElement || !listSectionElement) {
		console.error('Detail panel: elementi non trovati');
		return;
	}

	// Carica il contenuto HTML del pannello
	loadPanelContent().then(() => {
		// Apri automaticamente il panel per mostrare sempre il calendario
		detailPanelElement.classList.add('panel-open');
		listSectionElement.classList.add('panel-open');

		// Se sono stati forniti dati per il calendario, caricali ora
		if (calendarData && Array.isArray(calendarData) && calendarData.length > 0) {
			loadCalendarData(calendarData);
		}
	});

	isInitialized = true;
}

/**
 * Carica il contenuto HTML del pannello
 */
function loadPanelContent() {
	return new Promise((resolve, reject) => {
		if (detailPanelElement) {
			// Carica il contenuto HTML
			fetch('components/detail-panel/detail-panel.html')
				.then(response => response.text())
				.then(html => {
					detailPanelElement.innerHTML = html;

					// Attach event listener al pulsante di chiusura
					const closeBtn = document.getElementById('btnClosePanel');
					if (closeBtn) {
						closeBtn.addEventListener('click', closeDetailPanel);
					}

					// Setup event listeners per i preset buttons
					setupPresetButtons();

					resolve();
				})
				.catch(error => {
					console.error('Errore nel caricamento del detail panel:', error);
					// Fallback: crea struttura base
					detailPanelElement.innerHTML = `
                        <button class="btn-close-panel" id="btnClosePanel" aria-label="Chiudi" type="button">
                            <i class="bi bi-x-lg"></i>
                        </button>
                        <div class="panel-content">
                            <div class="periodo-presets-container" id="periodoPresetsContainer">
                                <button type="button" class="preset-btn" data-preset="next-week">Prossima settimana</button>
                                <button type="button" class="preset-btn" data-preset="next-15-days">Prossimi 15 giorni</button>
                                <button type="button" class="preset-btn" data-preset="next-month">Prossimo mese</button>
                            </div>
                            <div class="calendar-container" id="calendarContainer">
                                <!-- I calendari mese per mese verranno generati dinamicamente qui -->
                            </div>
                        </div>
                    `;

					const closeBtn = document.getElementById('btnClosePanel');
					if (closeBtn) {
						closeBtn.addEventListener('click', closeDetailPanel);
					}

					// Setup event listeners per i preset buttons
					setupPresetButtons();

					resolve();
				});
		} else {
			reject('Detail panel element not found');
		}
	});
}

/**
 * Apre il pannello di dettaglio con i dati della richiesta
 * @param {Object} requestData - Dati della richiesta selezionata
 */
function openDetailPanel(requestData) {
	if (!detailPanelElement || !listSectionElement) {
		console.error('Detail panel: elementi non trovati');
		return;
	}

	currentRequestData = requestData;

	// Ottieni tutte le richieste filtrate dalla lista corrente
	// Usa filteredRequestsData se disponibile globalmente, altrimenti usa allRequestsData
	if (typeof window.filteredRequestsData !== 'undefined' && window.filteredRequestsData && window.filteredRequestsData.length > 0) {
		allRequestsForCalendar = [...window.filteredRequestsData];
	} else if (typeof window.allRequestsData !== 'undefined' && window.allRequestsData && window.allRequestsData.length > 0) {
		allRequestsForCalendar = [...window.allRequestsData];
	} else {
		allRequestsForCalendar = [];
	}

	// Aggiungi classe per aprire il pannello
	detailPanelElement.classList.add('panel-open');
	listSectionElement.classList.add('panel-open');

	// Renderizza il calendario
	renderCalendar();
}

/**
 * Chiude il pannello di dettaglio
 * Nota: Il panel rimane sempre aperto, questa funzione può essere usata per altri scopi
 */
function closeDetailPanel() {
	if (!detailPanelElement || !listSectionElement) {
		return;
	}

	// Non chiudere completamente il panel, mantienilo sempre visibile
	// Rimuovi solo la selezione corrente
	currentRequestData = null;
	selectedDay = null;

	// Rimuovi evidenziazione giorno selezionato
	const selectedDayElements = document.querySelectorAll('.calendar-day.selected-day');
	selectedDayElements.forEach(el => el.classList.remove('selected-day'));
}

/**
 * Carica i dati per il calendario
 * @param {Array} data - Array di dati delle richieste (per ora sampleData, in futuro sarà da API)
 */
function loadCalendarData(data) {
	if (!Array.isArray(data)) {
		console.error('loadCalendarData: data deve essere un array');
		return;
	}

	// Filtra solo richieste con stato "Approvato" o "Rifiutato" per il calendario
	const archiveData = data.filter(req =>
		req.stato === 'Approvato' || req.stato === 'Rifiutato'
	);

	allCalendarData = [...archiveData];
	window.allCalendarData = allCalendarData; // Esponi globalmente per accesso da filters.js
	allRequestsForCalendar = [...archiveData];

	// Renderizza il calendario
	renderCalendar();
}

/**
 * Renderizza il calendario mese per mese con tutte le richieste
 * @param {Array} data - Dati opzionali da usare (se non forniti, usa allCalendarData o allRequestsForCalendar)
 */
function renderCalendar(data = null) {
	const calendarContainer = document.getElementById('calendarContainer');
	if (!calendarContainer) {
		console.warn('renderCalendar: calendarContainer non trovato nel DOM');
		return;
	}

	// Svuota il container
	calendarContainer.innerHTML = '';

	// Usa i dati forniti, altrimenti usa allCalendarData se disponibile, altrimenti allRequestsForCalendar
	const requestsToUse = data || allCalendarData || allRequestsForCalendar || [];

	// Non mostrare più il messaggio "Nessuna richiesta" perché mostreremo sempre i 12 mesi

	// Estrai tutti i mesi unici dalle richieste
	const monthsMap = new Map();

	requestsToUse.forEach(request => {
		if (!request.moorea_obj || !request.moorea_obj.leaves || !Array.isArray(request.moorea_obj.leaves)) {
			return;
		}

		request.moorea_obj.leaves.forEach(leave => {
			const dateStr = leave.dataInizio || leave.dataFine;
			if (!dateStr) return;

			const date = new Date(dateStr + 'T00:00:00');
			if (isNaN(date.getTime())) return;

			const year = date.getFullYear();
			const month = date.getMonth(); // 0-11

			const monthKey = `${year}-${month}`;

			if (!monthsMap.has(monthKey)) {
				monthsMap.set(monthKey, {
					year: year,
					month: month,
					requests: []
				});
			}

			// Aggiungi la richiesta al mese se non è già presente
			const monthData = monthsMap.get(monthKey);
			if (!monthData.requests.find(r => r.id === request.id)) {
				monthData.requests.push(request);
			}
		});
	});

	// Aggiungi sempre il mese corrente e i prossimi 11 mesi (totale 12 mesi)
	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonth = today.getMonth(); // 0-11

	for (let i = 0; i < 12; i++) {
		const month = currentMonth + i;

		// Gestisci il cambio anno
		const actualYear = currentYear + Math.floor(month / 12);
		const actualMonth = month % 12;

		const monthKey = `${actualYear}-${actualMonth}`;

		// Se il mese non è già nella mappa, aggiungilo con array requests vuoto
		if (!monthsMap.has(monthKey)) {
			monthsMap.set(monthKey, {
				year: actualYear,
				month: actualMonth,
				requests: []
			});
		}
	}

	// Se c'è un periodo selezionato, assicurati che i suoi mesi siano inclusi anche se non hanno richieste
	if (selectedPeriodStart && selectedPeriodEnd) {
		const startDate = new Date(selectedPeriodStart);
		const endDate = new Date(selectedPeriodEnd);
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(0, 0, 0, 0);

		// Itera attraverso tutti i mesi nel range del periodo selezionato
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth();
			const monthKey = `${year}-${month}`;

			// Se il mese non è già nella mappa, aggiungilo con array requests vuoto
			if (!monthsMap.has(monthKey)) {
				monthsMap.set(monthKey, {
					year: year,
					month: month,
					requests: []
				});
			}

			// Passa al mese successivo
			currentDate.setMonth(currentDate.getMonth() + 1);
			currentDate.setDate(1); // Imposta al primo giorno del mese
		}
	}

	// Filtra i mesi per mostrare solo dal mese corrente in poi (riutilizza currentYear e currentMonth già dichiarate)
	const filteredMonths = Array.from(monthsMap.values()).filter(monthData => {
		// Includi solo mesi dal mese corrente in poi
		if (monthData.year > currentYear) {
			return true;
		}
		if (monthData.year === currentYear && monthData.month >= currentMonth) {
			return true;
		}
		return false;
	});

	// Ordina i mesi cronologicamente (dal più vecchio al più recente)
	const sortedMonths = filteredMonths.sort((a, b) => {
		if (a.year !== b.year) {
			return a.year - b.year;
		}
		return a.month - b.month;
	});

	// Genera calendario per ogni mese
	sortedMonths.forEach(monthData => {
		const monthCalendar = generateMonthCalendar(monthData.year, monthData.month, monthData.requests, currentRequestData);
		calendarContainer.appendChild(monthCalendar);
	});
}

/**
 * Genera il calendario per un singolo mese
 * @param {number} year - Anno
 * @param {number} month - Mese (0-11)
 * @param {Array} requests - Array di richieste per questo mese
 * @param {Object} selectedRequest - Richiesta selezionata (opzionale, per evidenziarla)
 * @returns {HTMLElement} Elemento DOM del calendario del mese
 */
function generateMonthCalendar(year, month, requests, selectedRequest) {
	const monthContainer = document.createElement('div');
	monthContainer.className = 'month-calendar';

	// Header del mese
	const monthHeader = document.createElement('div');
	monthHeader.className = 'month-header';
	const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
		'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
	monthHeader.textContent = `${monthNames[month]} ${year}`;
	monthContainer.appendChild(monthHeader);

	// Griglia calendario
	const calendarGrid = document.createElement('div');
	calendarGrid.className = 'calendar-grid';

	// Header giorni settimana
	const weekdays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
	weekdays.forEach(day => {
		const dayHeader = document.createElement('div');
		dayHeader.className = 'calendar-weekday';
		dayHeader.textContent = day;
		calendarGrid.appendChild(dayHeader);
	});

	// Calcola il primo giorno del mese e quanti giorni ci sono
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const daysInMonth = lastDay.getDate();
	const startingDayOfWeek = firstDay.getDay(); // 0 = Domenica

	// Crea mappa delle date con richieste per questo mese
	const dateRequestsMap = new Map();

	requests.forEach(request => {
		if (!request.moorea_obj || !request.moorea_obj.leaves) return;

		request.moorea_obj.leaves.forEach(leave => {
			const dateStr = leave.dataInizio || leave.dataFine;
			if (!dateStr) return;

			const date = new Date(dateStr + 'T00:00:00');
			if (isNaN(date.getTime())) return;

			if (date.getFullYear() === year && date.getMonth() === month) {
				const day = date.getDate();
				const dateKey = `${year}-${month}-${day}`;

				if (!dateRequestsMap.has(dateKey)) {
					dateRequestsMap.set(dateKey, []);
				}

				dateRequestsMap.get(dateKey).push({
					request: request,
					leave: leave
				});
			}
		});
	});

	// Aggiungi celle vuote per allineare il primo giorno
	for (let i = 0; i < startingDayOfWeek; i++) {
		const emptyCell = document.createElement('div');
		emptyCell.className = 'calendar-day empty';
		calendarGrid.appendChild(emptyCell);
	}

	// Aggiungi celle per ogni giorno del mese
	for (let day = 1; day <= daysInMonth; day++) {
		const dayCell = document.createElement('div');
		dayCell.className = 'calendar-day';
		// Aggiungi attributi data per identificare il giorno
		dayCell.setAttribute('data-year', year);
		dayCell.setAttribute('data-month', month);
		dayCell.setAttribute('data-day', day);

		// Numero del giorno
		const dayNumber = document.createElement('div');
		dayNumber.className = 'calendar-day-number';
		dayNumber.textContent = day;

		// Aggiungi classe sunday se è domenica
		const dayOfWeek = new Date(year, month, day).getDay();
		if (dayOfWeek === 0) { // 0 = Domenica
			dayNumber.classList.add('sunday');
		}

		dayCell.appendChild(dayNumber);

		const dateKey = `${year}-${month}-${day}`;
		const dayRequests = dateRequestsMap.get(dateKey) || [];

		// Conta richieste per tipo (usando Set per evitare duplicati)
		const ferieRequests = new Set();
		const permessoRequests = new Set();
		let hasSelectedRequest = false;
		let hasApproved = false;
		let hasRejected = false;

		if (dayRequests.length > 0) {
			dayCell.classList.add('has-requests');

			// Conta richieste uniche per tipo
			dayRequests.forEach(({ request, leave }) => {
				// Mappatura nuovo JSON: type 1=FERIE, 2=PERMESSO
				const isFerie = request.type === 1 || request.type_name === 'FERIE';
				const isPermesso = request.type === 2 || request.type_name === 'PERMESSO';

				// Mappatura Status int
				const status = request.status; // 1=Approvato, 2=Rifiutato

				if (isFerie) {
					ferieRequests.add(request.id);
				} else if (isPermesso) {
					permessoRequests.add(request.id);
				}

				// Controlla status per i bordi
				if (status === 1) {
					hasApproved = true;
				} else if (status === 2) {
					hasRejected = true;
				}

				// Se questa è la richiesta selezionata, evidenziala
				if (selectedRequest && request.id === selectedRequest.id) {
					hasSelectedRequest = true;
				}

			});

			// Aggiungi classi per stato (bordi)
			if (hasApproved) {
				dayCell.classList.add('stato-approvato');
			}
			if (hasRejected) {
				dayCell.classList.add('stato-rifiutato');
			}

			// Aggiungi classe per richiesta selezionata
			if (hasSelectedRequest) {
				dayCell.classList.add('selected-request');
			}

			// Crea container per i badge
			const badgesContainer = document.createElement('div');
			badgesContainer.className = 'calendar-day-badges';

			// Aggiungi badge per FERIE se ci sono richieste
			if (ferieRequests.size > 0) {
				const ferieBadge = document.createElement('div');
				ferieBadge.className = 'calendar-badge calendar-badge-ferie';
				ferieBadge.textContent = `${ferieRequests.size} in Ferie`;
				badgesContainer.appendChild(ferieBadge);
			}

			// Aggiungi badge per PERMESSO se ci sono richieste
			if (permessoRequests.size > 0) {
				const permessoBadge = document.createElement('div');
				permessoBadge.className = 'calendar-badge calendar-badge-permesso';
				permessoBadge.textContent = `${permessoRequests.size} in Permesso`;
				badgesContainer.appendChild(permessoBadge);
			}

			// Aggiungi il container dei badge solo se ci sono badge
			if (badgesContainer.children.length > 0) {
				dayCell.appendChild(badgesContainer);
			}
		}

		// Evidenzia oggi
		const today = new Date();
		if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
			dayCell.classList.add('today');
		}

		// Evidenzia range periodo selezionato
		if (selectedPeriodStart || selectedPeriodEnd) {
			const currentDate = new Date(year, month, day);
			currentDate.setHours(0, 0, 0, 0);

			if (selectedPeriodStart && selectedPeriodEnd) {
				// Range completo
				const startDate = new Date(selectedPeriodStart);
				startDate.setHours(0, 0, 0, 0);
				const endDate = new Date(selectedPeriodEnd);
				endDate.setHours(0, 0, 0, 0);

				if (currentDate.getTime() === startDate.getTime()) {
					dayCell.classList.add('period-start');
					if (currentDate.getTime() === endDate.getTime()) {
						dayCell.classList.add('period-end');
					}
				} else if (currentDate.getTime() === endDate.getTime()) {
					dayCell.classList.add('period-end');
				} else if (currentDate > startDate && currentDate < endDate) {
					dayCell.classList.add('period-range');
				}
			} else if (selectedPeriodStart) {
				// Solo inizio selezionato
				const startDate = new Date(selectedPeriodStart);
				startDate.setHours(0, 0, 0, 0);
				if (currentDate.getTime() === startDate.getTime()) {
					dayCell.classList.add('period-start');
				}
			}
		}

		// Aggiungi click handler al giorno (solo se non è una cella vuota)
		if (!dayCell.classList.contains('empty')) {
			dayCell.style.cursor = 'pointer';
			dayCell.addEventListener('click', function (event) {
				// Rimuovi evidenziazione selected-day (per compatibilità con selezione singola)
				const previousSelected = document.querySelectorAll('.calendar-day.selected-day');
				previousSelected.forEach(el => el.classList.remove('selected-day'));

				handleDayClick(year, month, day);
			});
		}

		calendarGrid.appendChild(dayCell);
	}

	monthContainer.appendChild(calendarGrid);

	return monthContainer;
}

/**
 * Gestisce il click su un giorno del calendario
 * Comportamento: 1 click = inizio, 2 click = fine (può essere stesso giorno), 3 click = reset e nuovo inizio
 * @param {number} year - Anno
 * @param {number} month - Mese (0-11)
 * @param {number} day - Giorno
 */
function handleDayClick(year, month, day) {
	// Crea oggetto Date per il giorno selezionato
	const selectedDate = new Date(year, month, day);
	selectedDate.setHours(0, 0, 0, 0);

	// Gestione selezione periodo (range) con comportamento a 3 click
	if (!selectedPeriodStart) {
		// 1° click: imposta inizio periodo
		selectedPeriodStart = new Date(selectedDate);
		selectedPeriodEnd = null;
		// Imposta window.selectedPeriod per una singola data (stesso giorno per inizio e fine)
		window.selectedPeriod = {
			startDate: selectedPeriodStart,
			endDate: new Date(selectedPeriodStart)
		};
	} else if (!selectedPeriodEnd) {
		// 2° click: imposta fine periodo (può essere lo stesso giorno)
		selectedPeriodEnd = new Date(selectedDate);
		// Se la data di fine è precedente alla data di inizio, scambia
		if (selectedPeriodEnd < selectedPeriodStart) {
			const temp = selectedPeriodStart;
			selectedPeriodStart = selectedPeriodEnd;
			selectedPeriodEnd = temp;
		}
		// Applica il filtro periodo
		applyPeriodFilter(selectedPeriodStart, selectedPeriodEnd);
	} else {
		// 3° click: resetta e imposta nuova data di inizio
		selectedPeriodStart = new Date(selectedDate);
		selectedPeriodEnd = null;
		// Rimuovi il filtro periodo
		clearPeriodSelection();
	}

	// Aggiorna il rendering del calendario per mostrare il range
	renderCalendar();

	// Se abbiamo un range completo, non chiamare loadAndDisplayDayData
	// Altrimenti, mantieni il comportamento originale per selezione singola
	if (!selectedPeriodEnd) {
		// Salva il giorno selezionato per compatibilità
		selectedDay = { year, month, day };

		// Rimuovi evidenziazione da giorno precedentemente selezionato
		const previousSelected = document.querySelectorAll('.calendar-day.selected-day');
		previousSelected.forEach(el => el.classList.remove('selected-day'));

		// Chiama funzione per caricare e mostrare i dati del giorno
		if (typeof window.loadAndDisplayDayData === 'function') {
			window.loadAndDisplayDayData(selectedDate);
		} else {
			console.warn('loadAndDisplayDayData non disponibile. Assicurati che filters.js sia caricato.');
		}
	}
}

/**
 * Applica il filtro periodo e sincronizza con i filtri
 * @param {Date} startDate - Data inizio periodo
 * @param {Date} endDate - Data fine periodo
 */
function applyPeriodFilter(startDate, endDate) {
	// Normalizza le date
	const normalizedStart = new Date(startDate);
	normalizedStart.setHours(0, 0, 0, 0);
	const normalizedEnd = new Date(endDate);
	normalizedEnd.setHours(23, 59, 59, 999);

	// Aggiorna le variabili globali
	selectedPeriodStart = normalizedStart;
	selectedPeriodEnd = normalizedEnd;

	// Aggiorna window.selectedPeriod per sincronizzazione con filtri
	window.selectedPeriod = {
		startDate: normalizedStart,
		endDate: normalizedEnd
	};

	// Ripristina allRequestsData con tutti i dati disponibili dal calendario
	// per assicurarsi che il filtro periodo abbia accesso a tutti i dati
	if (window.allCalendarData && Array.isArray(window.allCalendarData) && window.allCalendarData.length > 0) {
		window.allRequestsData = [...window.allCalendarData];
	}

	// Aggiorna il rendering del calendario PRIMA di applicare il filtro
	// per mostrare visivamente il periodo selezionato
	renderCalendar();

	// Nascondi lo spinner del filter-bar per assicurarsi che i filtri siano cliccabili
	if (typeof window.hideFilterSpinner === 'function') {
		window.hideFilterSpinner();
	}

	// Filtra le richieste per il periodo selezionato per generare le opzioni dei filtri
	// Le opzioni devono essere basate solo sulle richieste visibili nel periodo
	let periodFilteredData = [];
	if (window.allCalendarData && Array.isArray(window.allCalendarData) && window.allCalendarData.length > 0) {
		periodFilteredData = window.allCalendarData.filter(req => {
			// Controlla data_numerica (timestamp)
			if (req.data_numerica) {
				const reqDate = new Date(req.data_numerica);
				reqDate.setHours(0, 0, 0, 0);
				if (reqDate >= normalizedStart && reqDate <= normalizedEnd) {
					return true;
				}
			}

			// Controlla moorea_obj.leaves per range di date
			if (req.moorea_obj && req.moorea_obj.leaves && Array.isArray(req.moorea_obj.leaves)) {
				for (const leave of req.moorea_obj.leaves) {
					const leaveStartDate = leave.dataInizio ? new Date(leave.dataInizio + 'T00:00:00') : null;
					const leaveEndDate = leave.dataFine ? new Date(leave.dataFine + 'T00:00:00') : null;

					if (leaveStartDate && !isNaN(leaveStartDate.getTime())) {
						leaveStartDate.setHours(0, 0, 0, 0);
						// Se c'è solo dataInizio, controlla se cade nel periodo
						if (!leaveEndDate || isNaN(leaveEndDate.getTime())) {
							if (leaveStartDate >= normalizedStart && leaveStartDate <= normalizedEnd) {
								return true;
							}
						} else {
							// Se c'è un range, controlla se si sovrappone al periodo selezionato
							leaveEndDate.setHours(23, 59, 59, 999);
							// Sovrapposizione: inizio leave <= fine periodo E fine leave >= inizio periodo
							if (leaveStartDate <= normalizedEnd && leaveEndDate >= normalizedStart) {
								return true;
							}
						}
					}
				}
			}

			return false;
		});
	}

	// Aggiorna le opzioni dei filtri basandosi SOLO sulle richieste del periodo selezionato
	// IMPORTANTE: Chiamare dopo hideFilterSpinner per assicurarsi che i select siano accessibili
	if (typeof window.updateFilterOptions === 'function') {
		window.updateFilterOptions(periodFilteredData);
	}

	// Abilita i filtri solo se i dati sono stati caricati con successo
	// (periodFilteredData può essere vuoto ma i dati esistono in allCalendarData)
	if (typeof window.setFiltersEnabled === 'function') {
		// Abilita i filtri se ci sono dati disponibili (sia nel periodo che globalmente)
		const hasData = (periodFilteredData && periodFilteredData.length > 0) ||
			(window.allCalendarData && Array.isArray(window.allCalendarData) && window.allCalendarData.length > 0);
		window.setFiltersEnabled(hasData);
	}

	// Chiama handleFilterChange per applicare il filtro
	// Questo mostrerà le richieste che cadono nel periodo selezionato
	if (typeof window.handleFilterChange === 'function') {
		window.handleFilterChange();
	}
}

/**
 * Resetta la selezione del periodo
 */
function clearPeriodSelection() {
	selectedPeriodStart = null;
	selectedPeriodEnd = null;
	window.selectedPeriod = null;

	// Rimuovi evidenziazione visiva dal calendario
	const periodDays = document.querySelectorAll('.calendar-day.period-start, .calendar-day.period-end, .calendar-day.period-range');
	periodDays.forEach(el => {
		el.classList.remove('period-start', 'period-end', 'period-range');
	});

	// Rimuovi classe active dai preset buttons
	const presetButtons = document.querySelectorAll('.preset-btn');
	presetButtons.forEach(btn => btn.classList.remove('active'));

	// Nascondi lo spinner del filter-bar per assicurarsi che i filtri siano cliccabili
	if (typeof window.hideFilterSpinner === 'function') {
		window.hideFilterSpinner();
	}

	// Disabilita i filtri quando il periodo viene rimosso
	if (typeof window.setFiltersEnabled === 'function') {
		window.setFiltersEnabled(false);
	}

	// Chiama handleFilterChange per rimuovere il filtro
	if (typeof window.handleFilterChange === 'function') {
		window.handleFilterChange();
	}

	// Aggiorna il rendering del calendario
	renderCalendar();
}

/**
 * Applica un preset al periodo
 * @param {string} preset - Tipo di preset ('next-week', 'next-15-days', 'next-month')
 */
function applyPeriodoPreset(preset) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let startDate, endDate;

	switch (preset) {
		case 'next-week':
			// Prossima settimana (dal lunedì prossimo alla domenica)
			const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
			startDate = new Date(today);
			startDate.setDate(today.getDate() + daysUntilMonday);
			endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + 6);
			break;
		case 'next-15-days':
			// Prossimi 15 giorni (da oggi)
			startDate = new Date(today);
			endDate = new Date(today);
			endDate.setDate(today.getDate() + 14);
			break;
		case 'next-month':
			// Prossimo mese (dal primo all'ultimo giorno del prossimo mese)
			startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
			endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
			break;
		default:
			return;
	}

	// Normalizza le date
	startDate.setHours(0, 0, 0, 0);
	endDate.setHours(23, 59, 59, 999);

	// Applica il filtro periodo
	applyPeriodFilter(startDate, endDate);

	// Scrolla il calendario alla data di inizio se necessario
	setTimeout(() => {
		scrollToDate(startDate);
	}, 100);
}

/**
 * Scrolla il calendario alla data specificata
 * @param {Date} date - Data a cui scrollare
 */
function scrollToDate(date) {
	const calendarContainer = document.getElementById('calendarContainer');
	if (!calendarContainer) return;

	const year = date.getFullYear();
	const month = date.getMonth();

	// Trova il mese corrispondente nel calendario
	const monthCalendars = calendarContainer.querySelectorAll('.month-calendar');
	monthCalendars.forEach(monthCalendar => {
		const monthHeader = monthCalendar.querySelector('.month-header');
		if (monthHeader) {
			const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
				'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
			const headerText = `${monthNames[month]} ${year}`;
			if (monthHeader.textContent === headerText) {
				monthCalendar.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	});
}

/**
 * Setup event listeners per i preset buttons
 */
function setupPresetButtons() {
	const presetContainer = document.getElementById('periodoPresetsContainer');
	if (!presetContainer) return;

	const presetButtons = presetContainer.querySelectorAll('.preset-btn');
	presetButtons.forEach(btn => {
		btn.addEventListener('click', function (e) {
			e.stopPropagation();
			// Rimuovi classe active da tutti i preset
			presetButtons.forEach(b => b.classList.remove('active'));
			// Aggiungi classe active al preset cliccato
			this.classList.add('active');
			const preset = this.getAttribute('data-preset');
			applyPeriodoPreset(preset);
		});
	});
}

// Esponi funzioni globalmente per accesso da altri componenti
window.loadCalendarData = loadCalendarData;
window.clearPeriodSelection = clearPeriodSelection;

