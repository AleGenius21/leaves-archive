/**
 * Filter Bar Component - Logica di filtraggio e ordinamento
 */

// Configurazione API
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINT = '/api/requests';
const API_TIMEOUT = 30000; // 30 secondi

// Riferimenti globali
let allRequestsData = [];
let filteredRequestsData = [];
let filterBarLoaded = false; // Flag per verificare se il componente è stato caricato
// Variabile globale per il periodo selezionato dal calendario
window.selectedPeriod = null;
// Variabile globale per debounce ricerca
let searchDebounceTimer = null;

// Esponi variabili globalmente per accesso da altri componenti
window.allRequestsData = allRequestsData;
window.filteredRequestsData = filteredRequestsData;

/**
 * Carica dinamicamente il contenuto HTML del componente filter bar
 * @returns {Promise} Promise che si risolve quando il contenuto è stato caricato
 */
async function loadFilterBarHTML() {
    // Se il componente è già presente nel DOM, non ricaricarlo
    const existingContainer = document.querySelector('.filter-bar-container');
    if (existingContainer && filterBarLoaded) {
        return Promise.resolve();
    }

    const container = document.getElementById('filterBarContainer');
    if (!container) {
        console.error('FilterBarContainer non trovato nel DOM');
        return Promise.reject('FilterBarContainer non trovato');
    }

    try {
        const response = await fetch('components/filters/filters.html');
        if (!response.ok) {
            throw new Error(`Errore nel caricamento: ${response.status}`);
        }
        const html = await response.text();
        container.innerHTML = html;
        filterBarLoaded = true;
        return Promise.resolve();
    } catch (error) {
        console.error('Errore nel caricamento del componente filter bar:', error);
        return Promise.reject(error);
    }
}

/**
 * Costruisce i parametri API dai filtri UI
 * @returns {Object} Oggetto con i parametri per la chiamata API
 */
function buildApiParams() {
    const params = {
        status: [1, 2] // Archivio: approvate (1) e rifiutate (2)
    };

    // Ricerca testuale (nome)
    const searchInput = document.getElementById('filterSearch');
    if (searchInput && searchInput.value.trim()) {
        params.nome = searchInput.value.trim();
    }

    // Tipo (type_id) - estrae da attributo data-type-id
    const typeSelect = document.getElementById('filterType');
    if (typeSelect && typeSelect.value) {
        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        const typeId = selectedOption.getAttribute('data-type-id');
        if (typeId) {
            params.type_id = parseInt(typeId, 10);
        }
    }

    // Reparto (department_id) - estrae da attributo data-department-id
    const repartoSelect = document.getElementById('filterReparto');
    if (repartoSelect && repartoSelect.value) {
        const selectedOption = repartoSelect.options[repartoSelect.selectedIndex];
        const departmentId = selectedOption.getAttribute('data-department-id');
        if (departmentId) {
            params.department_id = parseInt(departmentId, 10);
        }
    }

    // Mansione (task_id) - estrae da attributo data-task-id
    const mansioneSelect = document.getElementById('filterMansione');
    if (mansioneSelect && mansioneSelect.value) {
        const selectedOption = mansioneSelect.options[mansioneSelect.selectedIndex];
        const taskId = selectedOption.getAttribute('data-task-id');
        if (taskId) {
            params.task_id = parseInt(taskId, 10);
        }
    }

    // Periodo (data_inizio e data_fine) - da window.selectedPeriod
    if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
        const startDate = new Date(window.selectedPeriod.startDate);
        const endDate = new Date(window.selectedPeriod.endDate);
        
        // Formatta in YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        params.data_inizio = formatDate(startDate);
        params.data_fine = formatDate(endDate);
    }

    // Ordinamento gestito dal backend - non inviare sort_by e sort_order

    return params;
}

/**
 * Esegue chiamata API per ottenere richieste filtrate
 * @param {Object} params - Parametri per la chiamata API
 * @returns {Promise<Array>} Promise che si risolve con array di richieste
 */
async function fetchLeavesRequestsWithFilters(params) {
    try {
        // Costruisce query string con URLSearchParams
        const queryParams = new URLSearchParams();
        
        // Gestisce status come array (status=1&status=2)
        if (Array.isArray(params.status)) {
            params.status.forEach(s => queryParams.append('status', s.toString()));
        } else if (params.status !== undefined) {
            queryParams.append('status', params.status.toString());
        }
        
        // Aggiunge altri parametri
        if (params.nome) {
            queryParams.append('nome', params.nome);
        }
        if (params.type_id !== undefined) {
            queryParams.append('type_id', params.type_id.toString());
        }
        if (params.department_id !== undefined) {
            queryParams.append('department_id', params.department_id.toString());
        }
        if (params.task_id !== undefined) {
            queryParams.append('task_id', params.task_id.toString());
        }
        if (params.data_inizio) {
            queryParams.append('data_inizio', params.data_inizio);
        }
        if (params.data_fine) {
            queryParams.append('data_fine', params.data_fine);
        }
        // Ordinamento gestito dal backend - non inviare sort_by, sort_order, reference_date
        
        // Costruisce URL completo
        const url = `${API_BASE_URL}${API_ENDPOINT}?${queryParams.toString()}`;
        
        // Log URL chiamato
        console.log('🔵 API Request URL:', url);
        console.log('🔵 API Request Params:', Object.fromEntries(queryParams));
        
        // Esegue fetch con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Errore API: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Log risposta API
        console.log('🟢 API Response:', result);


        
        // Gestisce risposte { success, data } o array diretto
        let finalData = [];
        if (result && typeof result === 'object') {
            if (result.success !== undefined && result.data) {
                finalData = Array.isArray(result.data) ? result.data : [];
            } else if (Array.isArray(result)) {
                finalData = result;
            } else {
                throw new Error('Formato risposta API non riconosciuto');
            }
        }

        
        return finalData;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Timeout: la richiesta ha impiegato troppo tempo');
        }
        console.error('Errore nella chiamata API:', error);
        throw error;
    }
}

/**
 * Inizializza il componente Filter Bar
 * @param {Array} requestsData - Array completo dei dati delle richieste (deprecato - non più utilizzato)
 */
async function initFilterBar(requestsData = []) {
    // Carica il contenuto HTML del componente se non è già presente
    try {
        await loadFilterBarHTML();
    } catch (error) {
        console.error('Impossibile caricare il componente filter bar:', error);
        // Se il caricamento fallisce, prova a continuare se il markup esiste già nel DOM
        const existingContainer = document.querySelector('.filter-bar-container');
        if (!existingContainer) {
            console.error('Il componente filter bar non è disponibile');
            return;
        }
    }

    // Setup event listeners
    setupFilterListeners();

    // Disabilita i filtri all'avvio (verranno abilitati solo quando viene selezionato un periodo)
    setFiltersEnabled(false);

    // Se non c'è un periodo selezionato, mostra messaggio informativo
    if (!window.selectedPeriod || !window.selectedPeriod.startDate || !window.selectedPeriod.endDate) {
        showPeriodSelectionMessage();
        return;
    }

    // Caricamento iniziale con status [1, 2] (archivio: approvate e rifiutate)
    try {
        showFilterSpinner();
        showListSpinner();
        
        const initialParams = { status: [1, 2] };
        const initialData = await fetchLeavesRequestsWithFilters(initialParams);
        
        allRequestsData = [...initialData];
        window.allRequestsData = allRequestsData;
        filteredRequestsData = [...initialData];
        window.filteredRequestsData = filteredRequestsData;
        
        // Popola dinamicamente tutti i filtri con valori dai dati
        updateFilterOptions(allRequestsData);
        
        // Renderizza la lista
        renderList(filteredRequestsData);
        
    } catch (error) {
        console.error('Errore nel caricamento iniziale:', error);
        showEmptyStateMessage();
    } finally {
        hideFilterSpinner();
        hideListSpinner();
    }
}

/**
 * Estrae valori univoci da un array di oggetti per una chiave specificata
 * @param {Array} data - Array di oggetti da analizzare
 * @param {string} key - Chiave dell'oggetto da cui estrarre i valori
 * @returns {Array} Array di valori univoci ordinati alfabeticamente
 */
function getUniqueValues(data, key) {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    // Estrae tutti i valori per la chiave specificata
    const values = data
        .map(item => item[key])
        .filter(value => value !== null && value !== undefined && value !== '') // Filtra null, undefined e stringhe vuote
        .map(value => String(value).trim()) // Converte in stringa e rimuove spazi
        .filter(value => value !== ''); // Filtra stringhe vuote dopo il trim

    // Rimuove duplicati usando Set e ordina alfabeticamente
    const uniqueValues = [...new Set(values)].sort((a, b) => {
        return a.localeCompare(b, 'it', { sensitivity: 'base' });
    });

    return uniqueValues;
}

/**
 * Aggiorna i dati delle richieste e ricarica i filtri dinamici
 * @param {Array} requestsData - Array completo dei dati delle richieste aggiornati
 */
function updateFilterBarData(requestsData) {
    if (!Array.isArray(requestsData)) {
        console.error('updateFilterBarData: requestsData deve essere un array');
        return;
    }
    
    // Filtra solo richieste con stato "Approvato" o "Rifiutato"
    const archiveData = requestsData.filter(req => 
        req.stato === 'Approvato' || req.stato === 'Rifiutato'
    );
    
    allRequestsData = [...archiveData];
    window.allRequestsData = allRequestsData; // Aggiorna anche la variabile globale
    updateFilterOptions(allRequestsData);
    handleFilterChange();
}

/**
 * Popola dinamicamente tutte le opzioni dei filtri basandosi sui dati delle richieste
 * @param {Array} requests - Array completo dei dati delle richieste
 */
function updateFilterOptions(requests) {
    if (!Array.isArray(requests)) {
        console.error('updateFilterOptions: requests deve essere un array');
        return;
    }

    const isEmpty = requests.length === 0;

    // Configurazione dei filtri da popolare
    const filterConfigs = [
        {
            id: 'filterReparto',
            key: 'reparto',
            label: 'Reparto'
        },
        {
            id: 'filterMansione',
            key: 'mansione',
            label: 'Mansione'
        },
        {
            id: 'filterType',
            key: 'tipo_richiesta',
            label: 'Tipo'
        },
        {
            id: 'filterStato',
            key: 'stato',
            label: 'Stato'
        }
    ];

    // Popola ogni filtro
    filterConfigs.forEach(config => {
        const selectElement = document.getElementById(config.id);
        if (!selectElement) {
            console.warn(`updateFilterOptions: elemento ${config.id} non trovato`);
            return;
        }

        // Salva il valore corrente selezionato
        const currentValue = selectElement.value;

        // Svuota le opzioni mantenendo solo "Tutti"
        const defaultOption = selectElement.querySelector('option[value=""]');
        selectElement.innerHTML = '';
        
        if (defaultOption) {
            // Ricrea l'opzione "Tutti" con lo stesso contenuto
            const newDefaultOption = document.createElement('option');
            newDefaultOption.value = '';
            newDefaultOption.textContent = defaultOption.textContent || 'Tutti';
            selectElement.appendChild(newDefaultOption);
        } else {
            // Se non esiste, crea l'opzione "Tutti"
            const newDefaultOption = document.createElement('option');
            newDefaultOption.value = '';
            newDefaultOption.textContent = 'Tutti';
            selectElement.appendChild(newDefaultOption);
        }

        // Se non è empty state, estrai e aggiungi i valori univoci
        if (!isEmpty) {
            const uniqueValues = getUniqueValues(requests, config.key);
            
            uniqueValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                selectElement.appendChild(option);
            });
        }

        // Ripristina la selezione precedente se ancora valida
        if (currentValue && !isEmpty) {
            const optionExists = Array.from(selectElement.options).some(
                opt => opt.value === currentValue
            );
            if (optionExists) {
                selectElement.value = currentValue;
            } else {
                // Se il valore precedente non esiste più, resetta a "Tutti"
                selectElement.value = '';
            }
        } else {
            // Se empty state o valore non valido, resetta a "Tutti"
            selectElement.value = '';
        }

        // Gestisci empty state: disabilita il filtro se non ci sono dati
        // IMPORTANTE: Non disabilitare i select se ci sono dati disponibili globalmente
        // anche se l'array passato è vuoto (potrebbe essere filtrato)
        const hasGlobalData = window.allRequestsData && Array.isArray(window.allRequestsData) && window.allRequestsData.length > 0;
        selectElement.disabled = isEmpty && !hasGlobalData;
    });
}

/**
 * Rimuove dinamicamente qualsiasi colore azzurro/blu dal calendario e forza nero
 */
function removeBlueColors(flatpickrInstance) {
    if (!flatpickrInstance || !flatpickrInstance.calendarContainer) return;
    
    // Rimuove qualsiasi colore azzurro/blu da tutti gli elementi del calendario
    const allElements = flatpickrInstance.calendarContainer.querySelectorAll('*');
    allElements.forEach(element => {
        const computed = window.getComputedStyle(element);
        const bgColor = computed.backgroundColor;
        
        // Controlla se il colore è azzurro/blu (RGB contiene valori blu alti)
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
            // Converte il colore in RGB per verificare se è azzurro/blu
            const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                // Se il blu è dominante rispetto al rosso e verde, è probabilmente azzurro/blu
                if (b > r && b > g && b > 100) {
                    // Rimuove lo stile inline se presente
                    if (element.hasAttribute('style')) {
                        const style = element.getAttribute('style');
                        const newStyle = style.replace(/background[^;]*/gi, '').replace(/;;+/g, ';').replace(/^;|;$/g, '');
                        if (newStyle) {
                            element.setAttribute('style', newStyle);
                        } else {
                            element.removeAttribute('style');
                        }
                    }
                }
            }
        }
    });
    
    // Forza nero per le date selezionate
    const startRange = flatpickrInstance.calendarContainer.querySelector('.flatpickr-day.startRange');
    const endRange = flatpickrInstance.calendarContainer.querySelector('.flatpickr-day.endRange');
    
    if (startRange) {
        startRange.style.backgroundColor = '#000000';
        startRange.style.borderColor = '#000000';
        startRange.style.color = '#ffffff';
    }
    
    if (endRange) {
        endRange.style.backgroundColor = '#000000';
        endRange.style.borderColor = '#000000';
        endRange.style.color = '#ffffff';
    }
    
    // Rimuove qualsiasi background azzurro/blu dai container
    const daysContainer = flatpickrInstance.calendarContainer.querySelector('.flatpickr-days');
    const dayContainer = flatpickrInstance.calendarContainer.querySelector('.flatpickr-dayContainer');
    
    if (daysContainer) {
        daysContainer.style.backgroundColor = 'transparent';
        daysContainer.style.backgroundImage = 'none';
    }
    
    if (dayContainer) {
        dayContainer.style.backgroundColor = 'transparent';
        dayContainer.style.backgroundImage = 'none';
    }
    
    // Rimuove qualsiasi elemento wrapper o pseudo-elemento che potrebbe creare la barra azzurra
    const startRangeDays = flatpickrInstance.calendarContainer.querySelectorAll('.flatpickr-day.startRange');
    const endRangeDays = flatpickrInstance.calendarContainer.querySelectorAll('.flatpickr-day.endRange');
    
    startRangeDays.forEach(day => {
        // Rimuove qualsiasi pseudo-elemento
        const before = window.getComputedStyle(day, '::before');
        const after = window.getComputedStyle(day, '::after');
        if (before.content && before.content !== 'none') {
            day.style.setProperty('--before-content', 'none');
        }
        if (after.content && after.content !== 'none') {
            day.style.setProperty('--after-content', 'none');
        }
    });
    
    endRangeDays.forEach(day => {
        // Rimuove qualsiasi pseudo-elemento
        const before = window.getComputedStyle(day, '::before');
        const after = window.getComputedStyle(day, '::after');
        if (before.content && before.content !== 'none') {
            day.style.setProperty('--before-content', 'none');
        }
        if (after.content && after.content !== 'none') {
            day.style.setProperty('--after-content', 'none');
        }
    });
    
    // Se startRange e endRange sono consecutivi, rimuove qualsiasi elemento tra di essi
    if (startRange && endRange) {
        const startRect = startRange.getBoundingClientRect();
        const endRect = endRange.getBoundingClientRect();
        const areConsecutive = Math.abs(startRect.right - endRect.left) < 50;
        
        if (areConsecutive) {
            // Rimuove qualsiasi elemento tra startRange e endRange
            let current = startRange.nextElementSibling;
            while (current && current !== endRange) {
                if (current.classList.contains('flatpickr-day')) {
                    const computed = window.getComputedStyle(current);
                    const bgColor = computed.backgroundColor;
                    const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (rgbMatch) {
                        const r = parseInt(rgbMatch[1]);
                        const g = parseInt(rgbMatch[2]);
                        const b = parseInt(rgbMatch[3]);
                        if (b > r && b > g && b > 100) {
                            current.style.backgroundColor = 'transparent';
                            current.style.backgroundImage = 'none';
                        }
                    }
                }
                current = current.nextElementSibling;
            }
        }
    }
}

/**
 * Setup observer per monitorare cambiamenti dinamici e rimuovere colori azzurri
 */
function setupColorObserver(flatpickrInstance) {
    if (!flatpickrInstance || !flatpickrInstance.calendarContainer) return;
    
    const observer = new MutationObserver(function(mutations) {
        let shouldRemoveBlue = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const element = mutation.target;
                const computed = window.getComputedStyle(element);
                const bgColor = computed.backgroundColor;
                
                // Controlla se il colore è azzurro/blu
                if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                    const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (rgbMatch) {
                        const r = parseInt(rgbMatch[1]);
                        const g = parseInt(rgbMatch[2]);
                        const b = parseInt(rgbMatch[3]);
                        if (b > r && b > g && b > 100) {
                            shouldRemoveBlue = true;
                        }
                    }
                }
            }
            
            if (mutation.type === 'childList') {
                shouldRemoveBlue = true;
            }
        });
        
        if (shouldRemoveBlue) {
            setTimeout(() => {
                removeBlueColors(flatpickrInstance);
            }, 10);
        }
    });
    
    // Osserva cambiamenti nel container del calendario
    observer.observe(flatpickrInstance.calendarContainer, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: true
    });
}

/**
 * Personalizza l'anno nella vista mensile - ingrandisce e migliora lo stile
 * @param {Object} flatpickrInstance - Istanza di Flatpickr
 */
function customizeYearInMonthView(flatpickrInstance) {
    if (!flatpickrInstance || !flatpickrInstance.calendarContainer) return;
    
    const calendarContainer = flatpickrInstance.calendarContainer;
    const currentMonth = calendarContainer.querySelector('.flatpickr-current-month');
    
    if (!currentMonth) return;
    
    // Cerca l'elemento anno - potrebbe essere un span con classe cur-year o parte del testo
    let yearElement = currentMonth.querySelector('.cur-year');
    
    // Se non trova .cur-year, cerca l'ultimo span o elemento numerico
    if (!yearElement) {
        const spans = currentMonth.querySelectorAll('span');
        if (spans.length > 0) {
            yearElement = spans[spans.length - 1];
        }
    }
    
    // Se ancora non trova, cerca nel testo e crea un wrapper
    if (!yearElement) {
        const text = currentMonth.textContent || '';
        // Cerca un anno a 4 cifre (es. 2025)
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            // Crea un wrapper per l'anno se non esiste
            const yearText = yearMatch[0];
            const parts = text.split(yearText);
            
            // Se l'anno è separato dal mese, wrappa solo l'anno
            if (parts.length === 2) {
                currentMonth.innerHTML = parts[0] + '<span class="year-display">' + yearText + '</span>' + parts[1];
                yearElement = currentMonth.querySelector('.year-display');
            }
        }
    }
    
    // Applica stili all'anno se trovato
    if (yearElement) {
        yearElement.style.fontSize = '18px';
        yearElement.style.fontWeight = '600';
        yearElement.style.color = '#000000';
        yearElement.style.lineHeight = '1.2';
        yearElement.classList.add('year-display');
    } else {
        // Fallback: applica stili direttamente al current-month e aumenta solo la parte numerica
        const text = currentMonth.textContent || '';
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            const parts = text.split(yearMatch[0]);
            if (parts.length === 2) {
                currentMonth.innerHTML = parts[0] + '<span class="year-display" style="font-size: 18px !important; font-weight: 600 !important; color: #000000 !important; line-height: 1.2 !important;">' + yearMatch[0] + '</span>' + parts[1];
            }
        }
    }
}

/**
 * Setup observer per monitorare quando cambia il mese/anno e riapplicare gli stili
 * @param {Object} flatpickrInstance - Istanza di Flatpickr
 */
function setupYearDisplayObserver(flatpickrInstance) {
    if (!flatpickrInstance || !flatpickrInstance.calendarContainer) return;
    
    const calendarContainer = flatpickrInstance.calendarContainer;
    
    // Observer per monitorare quando cambia il contenuto del current-month
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                // Riapplica gli stili all'anno quando cambia
                setTimeout(() => {
                    customizeYearInMonthView(flatpickrInstance);
                }, 50);
            }
        });
    });
    
    const currentMonth = calendarContainer.querySelector('.flatpickr-current-month');
    if (currentMonth) {
        observer.observe(currentMonth, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // Intercetta anche i click sulle frecce di navigazione mese
    const prevMonth = calendarContainer.querySelector('.flatpickr-prev-month');
    const nextMonth = calendarContainer.querySelector('.flatpickr-next-month');
    
    if (prevMonth) {
        prevMonth.addEventListener('click', function() {
            setTimeout(() => {
                customizeYearInMonthView(flatpickrInstance);
            }, 200);
        });
    }
    
    if (nextMonth) {
        nextMonth.addEventListener('click', function() {
            setTimeout(() => {
                customizeYearInMonthView(flatpickrInstance);
            }, 200);
        });
    }
}

/**
 * Setup event listeners per tutti i filtri
 */
function setupFilterListeners() {
    // Ricerca testuale (con debounce di 2 secondi)
    const searchInput = document.getElementById('filterSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchChange);
    }

    // Filtro tipologia
    const typeSelect = document.getElementById('filterType');
    if (typeSelect) {
        typeSelect.addEventListener('change', handleFilterChange);
    }

    // Filtro stato
    const statoSelect = document.getElementById('filterStato');
    if (statoSelect) {
        statoSelect.addEventListener('change', handleFilterChange);
    }

    // Filtro reparto
    const repartoSelect = document.getElementById('filterReparto');
    if (repartoSelect) {
        repartoSelect.addEventListener('change', handleFilterChange);
    }

    // Filtro mansione
    const mansioneSelect = document.getElementById('filterMansione');
    if (mansioneSelect) {
        mansioneSelect.addEventListener('change', handleFilterChange);
    }

    // Ordinamento
    const sortSelect = document.getElementById('filterSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleFilterChange);
    }

    // Reset button
    const resetButton = document.getElementById('filterReset');
    if (resetButton) {
        resetButton.addEventListener('click', clearAllFilters);
    }
}

/**
 * Abilita o disabilita tutti i filtri della barra filtri
 * @param {boolean} enabled - True per abilitare, false per disabilitare
 */
function setFiltersEnabled(enabled) {
    // Lista di tutti gli elementi da disabilitare/abilitare
    const filterElements = [
        'filterSearch',      // Input ricerca
        'filterType',        // Select tipo
        'filterStato',       // Select stato
        'filterReparto',     // Select reparto
        'filterMansione',    // Select mansione
        'filterSort',        // Select ordinamento
        'filterReset'        // Button reset
    ];
    
    // Gestisci lo stato disabled degli elementi
    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = !enabled;
        }
    });
    
    // Aggiungi/rimuovi classe CSS al container per feedback visivo
    const filterBarContainer = document.querySelector('.filter-bar-container');
    if (filterBarContainer) {
        if (enabled) {
            filterBarContainer.classList.remove('filters-disabled');
        } else {
            filterBarContainer.classList.add('filters-disabled');
        }
    }
}

// Esponi setFiltersEnabled globalmente per accesso da altri componenti
window.setFiltersEnabled = setFiltersEnabled;

/**
 * Gestisce il cambiamento di qualsiasi filtro
 */
async function handleFilterChange() {
    // Se non c'è un periodo selezionato, mostra il messaggio e non renderizzare la lista
    if (!window.selectedPeriod || !window.selectedPeriod.startDate || !window.selectedPeriod.endDate) {
        // Assicurati che i filtri siano disabilitati quando non c'è periodo
        setFiltersEnabled(false);
        showPeriodSelectionMessage();
        updateActiveFiltersChips();
        updateResetButtonState();
        return;
    }
    
    // Mostra spinner durante il caricamento
    showFilterSpinner();
    showListSpinner();
    
    try {
        // Costruisce parametri API dai filtri UI
        const params = buildApiParams();
        
        // Esegue chiamata API
        const apiData = await fetchLeavesRequestsWithFilters(params);
        
        // Aggiorna dati globali con la risposta API
        allRequestsData = [...apiData];
        window.allRequestsData = allRequestsData;
        filteredRequestsData = [...apiData];
        window.filteredRequestsData = filteredRequestsData;
        
        // Aggiorna opzioni dei dropdown
        updateFilterOptions(allRequestsData);
        
        // Renderizza la lista (i dati arrivano già ordinati dal BE)
        renderList(filteredRequestsData);
        
        // Aggiorna chips filtri attivi
        updateActiveFiltersChips();
        updateResetButtonState();
        
    } catch (error) {
        console.error('Errore nel caricamento dati:', error);
        
        // Mostra messaggio di errore
        const approvalList = document.getElementById('approvalList');
        if (approvalList) {
            approvalList.innerHTML = '';
            const errorMessage = document.createElement('div');
            errorMessage.className = 'text-center py-4 text-danger';
            errorMessage.style.fontSize = '0.917rem';
            errorMessage.style.padding = '52.8px';
            errorMessage.textContent = `Errore nel caricamento dei dati: ${error.message || 'Errore sconosciuto'}`;
            approvalList.appendChild(errorMessage);
        }
    } finally {
        // Nascondi spinner
        hideFilterSpinner();
        hideListSpinner();
    }
}

/**
 * Gestisce il cambiamento del filtro ricerca con debounce
 */
function handleSearchChange() {
    // Cancella timer precedente
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
    
    // Imposta nuovo timer (2 secondi)
    searchDebounceTimer = setTimeout(() => {
        handleFilterChange();
    }, 2000);
}

// Esponi handleFilterChange globalmente per accesso da altri componenti
window.handleFilterChange = handleFilterChange;

/**
 * Applica tutti i filtri e restituisce l'array filtrato
 * @returns {Array} Array filtrato e ordinato
 * @deprecated Non più utilizzata - i filtri sono gestiti dal backend tramite API
 */
/*
function applyFilters() {
    // Sincronizza allRequestsData con window.allRequestsData se è stato aggiornato
    if (window.allRequestsData && Array.isArray(window.allRequestsData)) {
        allRequestsData = [...window.allRequestsData];
    }
    
    // Se c'è un filtro periodo attivo, usa tutti i dati disponibili dal calendario
    // altrimenti usa allRequestsData (che potrebbe contenere solo i dati del giorno selezionato)
    let sourceData = allRequestsData;
    if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
        // Usa tutti i dati disponibili dal calendario per il filtro periodo
        if (window.allCalendarData && Array.isArray(window.allCalendarData) && window.allCalendarData.length > 0) {
            sourceData = window.allCalendarData;
        }
    }
    
    let filtered = [...sourceData];

    // Filtro ricerca testuale (nome)
    const searchValue = document.getElementById('filterSearch')?.value.trim().toLowerCase() || '';
    if (searchValue) {
        filtered = filtered.filter(req => 
            req.nome.toLowerCase().includes(searchValue)
        );
    }

    // Filtro tipologia
    const typeValue = document.getElementById('filterType')?.value || '';
    if (typeValue) {
        filtered = filtered.filter(req => req.tipo_richiesta === typeValue);
    }

    // Filtro stato
    const statoValue = document.getElementById('filterStato')?.value || '';
    if (statoValue) {
        filtered = filtered.filter(req => req.stato === statoValue);
    }

    // Filtro reparto
    const repartoValue = document.getElementById('filterReparto')?.value || '';
    if (repartoValue) {
        filtered = filtered.filter(req => req.reparto === repartoValue);
    }

    // Filtro mansione
    const mansioneValue = document.getElementById('filterMansione')?.value || '';
    if (mansioneValue) {
        filtered = filtered.filter(req => req.mansione === mansioneValue);
    }

    // Filtro periodo (dal calendario di destra)
    if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
        const startDate = new Date(window.selectedPeriod.startDate);
        const endDate = new Date(window.selectedPeriod.endDate);
        // Imposta l'ora a fine giornata per includere tutto il giorno finale
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(req => {
            // Controlla data_numerica (timestamp)
            if (req.data_numerica) {
                const reqDate = new Date(req.data_numerica);
                reqDate.setHours(0, 0, 0, 0);
                if (reqDate >= startDate && reqDate <= endDate) {
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
                            if (leaveStartDate >= startDate && leaveStartDate <= endDate) {
                                return true;
                            }
                        } else {
                            // Se c'è un range, controlla se si sovrappone al periodo selezionato
                            leaveEndDate.setHours(23, 59, 59, 999);
                            // Sovrapposizione: inizio leave <= fine periodo E fine leave >= inizio periodo
                            if (leaveStartDate <= endDate && leaveEndDate >= startDate) {
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        });
    }

    // Ordinamento
    const sortValue = document.getElementById('filterSort')?.value || 'data-recente';
    filtered = sortRequests(filtered, sortValue);

    return filtered;
}
*/

/**
 * Ordina le richieste in base al criterio selezionato
 * @param {Array} requests - Array di richieste da ordinare
 * @param {string} sortType - Tipo di ordinamento ('data-recente' o 'urgenza-decrescente')
 * @returns {Array} Array ordinato
 * @deprecated Non più utilizzata - l'ordinamento è gestito dal backend tramite API
 */
/*
function sortRequests(requests, sortType) {
    const sorted = [...requests];

    if (sortType === 'urgenza-decrescente') {
        // Ordina per urgenza decrescente (true prima di false)
        sorted.sort((a, b) => {
            if (a.urgenza === b.urgenza) return 0;
            return a.urgenza ? -1 : 1;
        });
    } else {
        // Ordina per data più recente (default)
        sorted.sort((a, b) => {
            // Se c'è un campo data_numerica o timestamp, usalo
            if (a.data_numerica && b.data_numerica) {
                return b.data_numerica - a.data_numerica;
            }
            // Altrimenti mantieni l'ordine originale
            return 0;
        });
    }

    return sorted;
}
*/

/**
 * Renderizza la lista delle richieste filtrate raggruppate per reparto
 * @param {Array} data - Array di dati da renderizzare
 */
function renderList(data) {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    // Svuota il contenitore
    approvalList.innerHTML = '';

    // Se non ci sono risultati, mostra un messaggio
    if (data.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'text-center py-4 text-muted';
        noResults.style.fontSize = '10px';
        noResults.textContent = 'Nessuna richiesta trovata con i filtri selezionati.';
        approvalList.appendChild(noResults);
        return;
    }

    // Raggruppa le richieste per reparto
    const groupedByReparto = {};
    data.forEach(function(requestData) {
        const reparto = requestData.reparto || 'Altro';
        if (!groupedByReparto[reparto]) {
            groupedByReparto[reparto] = [];
        }
        groupedByReparto[reparto].push(requestData);
    });

    // Ordina i reparti alfabeticamente
    const sortedReparti = Object.keys(groupedByReparto).sort();

    // Renderizza ogni gruppo con la sua etichetta
    sortedReparti.forEach(function(reparto) {
        // Crea etichetta di sezione per il reparto
        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'reparto-section-label';
        sectionLabel.textContent = reparto.toUpperCase();
        approvalList.appendChild(sectionLabel);

        // Renderizza le richieste del reparto
        groupedByReparto[reparto].forEach(function(requestData) {
            const row = createApprovalRow(requestData);
            approvalList.appendChild(row);
        });
    });

    // Inizializza gli observer per le ombre dinamiche
    initHeaderShadows();
}

/**
 * Inizializza gli observer per le ombre dinamiche degli header dei reparti
 */
function initHeaderShadows() {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    // Trova tutti gli header
    const headers = approvalList.querySelectorAll('.reparto-section-label');
    
    headers.forEach(function(header) {
        // Trova il primo elemento approval-row dopo l'header
        let firstRow = header.nextElementSibling;
        while (firstRow && !firstRow.classList.contains('approval-row')) {
            firstRow = firstRow.nextElementSibling;
        }

        // Se non c'è una riga, non c'è contenuto da osservare
        if (!firstRow) {
            return;
        }

        // Funzione per aggiornare lo stato dell'ombra basato sulla posizione
        const updateShadowState = function() {
            const headerRect = header.getBoundingClientRect();
            const rowRect = firstRow.getBoundingClientRect();
            
            // Se la riga è sopra il bordo inferiore dell'header (scorre sotto), attiva l'ombra
            if (rowRect.top < headerRect.bottom) {
                header.classList.add('has-shadow');
            } else {
                header.classList.remove('has-shadow');
            }
        };

        // Gestisci lo scroll per aggiornare lo stato in tempo reale
        const handleScroll = function() {
            updateShadowState();
        };

        // Aggiungi listener per lo scroll
        approvalList.addEventListener('scroll', handleScroll, { passive: true });
        
        // Crea IntersectionObserver per monitorare quando la riga entra/esce dalla viewport
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                updateShadowState();
            });
        }, {
            root: approvalList,
            threshold: [0, 0.1, 0.5, 1]
        });

        // Osserva la prima riga del gruppo
        observer.observe(firstRow);
        
        // Esegui un controllo iniziale
        updateShadowState();
    });
}

/**
 * Aggiorna lo stato del bottone reset (disabilitato se non ci sono filtri attivi)
 */
function updateResetButtonState() {
    const resetButton = document.getElementById('filterReset');
    if (!resetButton) return;

    // Verifica se ci sono filtri attivi
    const hasActiveFilters = hasAnyActiveFilters();
    
    // Abilita/disabilita il bottone
    resetButton.disabled = !hasActiveFilters;
}

/**
 * Verifica se ci sono filtri attivi
 * @returns {boolean} True se ci sono filtri attivi, altrimenti false
 */
function hasAnyActiveFilters() {
    // Verifica ricerca testuale
    const searchValue = document.getElementById('filterSearch')?.value.trim() || '';
    if (searchValue) return true;

    // Verifica tipologia
    const typeValue = document.getElementById('filterType')?.value || '';
    if (typeValue) return true;

    // Verifica stato
    const statoValue = document.getElementById('filterStato')?.value || '';
    if (statoValue) return true;

    // Verifica reparto
    const repartoValue = document.getElementById('filterReparto')?.value || '';
    if (repartoValue) return true;

    // Verifica mansione
    const mansioneValue = document.getElementById('filterMansione')?.value || '';
    if (mansioneValue) return true;

    // Verifica periodo (dal calendario di destra)
    if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
        return true;
    }

    // Verifica ordinamento (solo se diverso dal default)
    const sortValue = document.getElementById('filterSort')?.value || 'data-recente';
    if (sortValue !== 'data-recente') return true;

    return false;
}

/**
 * Aggiorna le chips dei filtri attivi
 */
function updateActiveFiltersChips() {
    const container = document.getElementById('activeFiltersContainer');
    if (!container) return;

    // Pulisci container
    container.innerHTML = '';

    const activeFilters = [];

    // Ricerca testuale
    const searchValue = document.getElementById('filterSearch')?.value.trim() || '';
    if (searchValue) {
        activeFilters.push({
            key: 'search',
            label: 'Ricerca',
            value: searchValue,
            remove: () => {
                document.getElementById('filterSearch').value = '';
                handleFilterChange();
            }
        });
    }

    // Tipologia
    const typeValue = document.getElementById('filterType')?.value || '';
    if (typeValue) {
        activeFilters.push({
            key: 'type',
            label: 'Tipologia',
            value: typeValue === 'FERIE' ? 'Ferie' : 'Permessi',
            remove: () => {
                document.getElementById('filterType').value = '';
                handleFilterChange();
            }
        });
    }

    // Stato
    const statoValue = document.getElementById('filterStato')?.value || '';
    if (statoValue) {
        activeFilters.push({
            key: 'stato',
            label: 'Stato',
            value: statoValue,
            remove: () => {
                document.getElementById('filterStato').value = '';
                handleFilterChange();
            }
        });
    }

    // Reparto
    const repartoValue = document.getElementById('filterReparto')?.value || '';
    if (repartoValue) {
        activeFilters.push({
            key: 'reparto',
            label: 'Reparto',
            value: repartoValue,
            remove: () => {
                document.getElementById('filterReparto').value = '';
                handleFilterChange();
            }
        });
    }

    // Mansione
    const mansioneValue = document.getElementById('filterMansione')?.value || '';
    if (mansioneValue) {
        activeFilters.push({
            key: 'mansione',
            label: 'Mansione',
            value: mansioneValue,
            remove: () => {
                document.getElementById('filterMansione').value = '';
                handleFilterChange();
            }
        });
    }

    // Periodo (dal calendario di destra)
    if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
        const startDate = new Date(window.selectedPeriod.startDate);
        const endDate = new Date(window.selectedPeriod.endDate);
        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };
        activeFilters.push({
            key: 'periodo',
            label: 'Periodo',
            value: `${formatDate(startDate)} al ${formatDate(endDate)}`,
            remove: () => {
                // Chiama la funzione per resettare il periodo nel calendario
                if (typeof window.clearPeriodSelection === 'function') {
                    window.clearPeriodSelection();
                }
                handleFilterChange();
            }
        });
    }

    // Ordinamento (solo se diverso dal default)
    const sortValue = document.getElementById('filterSort')?.value || 'data-recente';
    if (sortValue !== 'data-recente') {
        activeFilters.push({
            key: 'sort',
            label: 'Ordinamento',
            value: sortValue === 'urgenza-decrescente' ? 'Urgenza decrescente' : sortValue,
            remove: () => {
                document.getElementById('filterSort').value = 'data-recente';
                handleFilterChange();
            }
        });
    }

    // Renderizza chips
    activeFilters.forEach(filter => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        
        const label = document.createElement('span');
        label.className = 'filter-chip-label';
        label.textContent = filter.label + ': ';
        
        const value = document.createElement('span');
        value.className = 'filter-chip-value';
        value.textContent = filter.value;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'filter-chip-remove';
        removeBtn.setAttribute('aria-label', 'Rimuovi filtro ' + filter.label);
        removeBtn.setAttribute('type', 'button');
        const icon = document.createElement('i');
        icon.className = 'bi bi-x';
        removeBtn.appendChild(icon);
        removeBtn.addEventListener('click', filter.remove);
        
        chip.appendChild(label);
        chip.appendChild(value);
        chip.appendChild(removeBtn);
        
        container.appendChild(chip);
    });
}

/**
 * Mostra spinner nella sezione filtri
 */
function showFilterSpinner() {
    const filterBarContainer = document.querySelector('.filter-bar-container');
    if (!filterBarContainer) return;

    // Rimuovi spinner esistente se presente
    const existingSpinner = filterBarContainer.querySelector('.filter-spinner-container');
    if (existingSpinner) {
        existingSpinner.remove();
    }

    // Crea nuovo spinner
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'filter-spinner-container';
    spinnerContainer.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    `;
    
    filterBarContainer.appendChild(spinnerContainer);
}

/**
 * Nasconde spinner nella sezione filtri
 */
function hideFilterSpinner() {
    const filterBarContainer = document.querySelector('.filter-bar-container');
    if (!filterBarContainer) return;

    const spinnerContainer = filterBarContainer.querySelector('.filter-spinner-container');
    if (spinnerContainer) {
        spinnerContainer.remove();
    }
}

// Esponi hideFilterSpinner globalmente per accesso da altri componenti
window.hideFilterSpinner = hideFilterSpinner;

// Esponi updateFilterOptions globalmente per accesso da altri componenti
window.updateFilterOptions = updateFilterOptions;

/**
 * Mostra spinner nella lista
 */
function showListSpinner() {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    // Svuota la lista e mostra spinner
    approvalList.innerHTML = '';
    
    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'list-spinner-container';
    spinnerContainer.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    `;
    
    approvalList.appendChild(spinnerContainer);
}

/**
 * Nasconde spinner nella lista
 */
function hideListSpinner() {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    const spinnerContainer = approvalList.querySelector('.list-spinner-container');
    if (spinnerContainer) {
        spinnerContainer.remove();
    }
}

/**
 * Mostra messaggio di stato vuoto nella lista
 */
function showEmptyStateMessage() {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    approvalList.innerHTML = '';
    
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'text-center py-4 text-muted';
    emptyMessage.style.fontSize = '0.917rem';
    emptyMessage.style.padding = '52.8px';
    emptyMessage.style.color = '#666666';
    emptyMessage.textContent = 'Seleziona un periodo dal calendario per visualizzare i giustificativi.';
    approvalList.appendChild(emptyMessage);
}

/**
 * Mostra messaggio per selezionare un periodo dal calendario
 */
function showPeriodSelectionMessage() {
    const approvalList = document.getElementById('approvalList');
    if (!approvalList) return;

    approvalList.innerHTML = '';
    
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'text-center py-4 text-muted';
    emptyMessage.style.fontSize = '0.917rem';
    emptyMessage.style.padding = '52.8px';
    emptyMessage.style.color = '#666666';
    emptyMessage.textContent = 'Seleziona un periodo dal calendario per visualizzare i giustificativi.';
    approvalList.appendChild(emptyMessage);
}

/**
 * Carica e mostra i dati per un giorno specifico
 * @param {Date} selectedDate - Data selezionata
 */
async function loadAndDisplayDayData(selectedDate) {
    // Se c'è un filtro periodo attivo, non sovrascrivere i dati
    // perché il filtro periodo deve usare tutti i dati disponibili
    if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
        return;
    }
    
    // Mostra spinner (solo se non c'è un filtro periodo attivo)
    showFilterSpinner();
    showListSpinner();

    try {
        // Carica dati del giorno (simula chiamata API con delay)
        const dayRequests = await loadDayData(selectedDate);

        // Controlla di nuovo se nel frattempo è stato selezionato un periodo
        // (per evitare race condition)
        if (window.selectedPeriod && window.selectedPeriod.startDate && window.selectedPeriod.endDate) {
            return;
        }

        // Aggiorna allRequestsData e filteredRequestsData
        allRequestsData = [...dayRequests];
        window.allRequestsData = allRequestsData;
        filteredRequestsData = [...dayRequests];
        window.filteredRequestsData = filteredRequestsData;

        // Aggiorna opzioni dei filtri con i nuovi dati
        updateFilterOptions(allRequestsData);

        // Abilita i filtri solo se i dati sono stati caricati con successo
        if (dayRequests && dayRequests.length > 0) {
            setFiltersEnabled(true);
        } else {
            // Se non ci sono dati, mantieni i filtri disabilitati
            setFiltersEnabled(false);
        }

        // Renderizza la lista con i dati filtrati
        renderList(filteredRequestsData);

        // Aggiorna chips filtri attivi
        updateActiveFiltersChips();
        updateResetButtonState();

    } catch (error) {
        console.error('Errore nel caricamento dati del giorno:', error);
        
        // In caso di errore, mantieni i filtri disabilitati
        setFiltersEnabled(false);
        
        // Mostra messaggio di errore
        const approvalList = document.getElementById('approvalList');
        if (approvalList) {
            approvalList.innerHTML = '';
            const errorMessage = document.createElement('div');
            errorMessage.className = 'text-center py-4 text-danger';
            errorMessage.style.fontSize = '0.917rem';
            errorMessage.style.padding = '52.8px';
            errorMessage.textContent = 'Errore nel caricamento dei dati. Riprova.';
            approvalList.appendChild(errorMessage);
        }
    } finally {
        // Nascondi sempre lo spinner quando la funzione completa
        // (anche se è stata interrotta a causa di un filtro periodo)
        hideFilterSpinner();
        hideListSpinner();
    }
}

/**
 * Carica i dati per un giorno specifico
 * @param {Date} selectedDate - Data selezionata
 * @returns {Promise<Array>} Promise che si risolve con array di richieste per quel giorno
 */
async function loadDayData(selectedDate) {
    // Simula chiamata API con delay di 2 secondi
    return new Promise((resolve) => {
        setTimeout(() => {
            // Normalizza la data (solo giorno, mese, anno, senza ore)
            const normalizedDate = new Date(selectedDate);
            normalizedDate.setHours(0, 0, 0, 0);
            
            // Ottieni tutti i dati disponibili (da allCalendarData o da API futura)
            const allData = window.allCalendarData || [];
            
            // Filtra le richieste che includono la data selezionata
            const dayRequests = allData.filter(request => {
                // Controlla data_numerica (timestamp)
                if (request.data_numerica) {
                    const requestDate = new Date(request.data_numerica);
                    requestDate.setHours(0, 0, 0, 0);
                    if (requestDate.getTime() === normalizedDate.getTime()) {
                        return true;
                    }
                }
                
                // Controlla moorea_obj.leaves
                if (request.moorea_obj && request.moorea_obj.leaves && Array.isArray(request.moorea_obj.leaves)) {
                    for (const leave of request.moorea_obj.leaves) {
                        const leaveStartDate = leave.dataInizio ? new Date(leave.dataInizio + 'T00:00:00') : null;
                        const leaveEndDate = leave.dataFine ? new Date(leave.dataFine + 'T00:00:00') : null;
                        
                        if (leaveStartDate && !isNaN(leaveStartDate.getTime())) {
                            leaveStartDate.setHours(0, 0, 0, 0);
                            if (leaveStartDate.getTime() === normalizedDate.getTime()) {
                                return true;
                            }
                        }
                        
                        // Se c'è un range di date, controlla se la data selezionata è nel range
                        if (leaveStartDate && leaveEndDate && !isNaN(leaveStartDate.getTime()) && !isNaN(leaveEndDate.getTime())) {
                            leaveStartDate.setHours(0, 0, 0, 0);
                            leaveEndDate.setHours(23, 59, 59, 999);
                            if (normalizedDate >= leaveStartDate && normalizedDate <= leaveEndDate) {
                                return true;
                            }
                        }
                    }
                }
                
                return false;
            });
            
            resolve(dayRequests);
        }, 2000); // 2 secondi di delay per simulare chiamata API
    });
}

// Esponi loadAndDisplayDayData globalmente per accesso da detail-panel.js
window.loadAndDisplayDayData = loadAndDisplayDayData;

/**
 * Resetta tutti i filtri
 */
function clearAllFilters() {
    // Reset ricerca
    const searchInput = document.getElementById('filterSearch');
    if (searchInput) searchInput.value = '';

    // Reset tipologia
    const typeSelect = document.getElementById('filterType');
    if (typeSelect) typeSelect.value = '';

    // Reset stato
    const statoSelect = document.getElementById('filterStato');
    if (statoSelect) statoSelect.value = '';

    // Reset reparto
    const repartoSelect = document.getElementById('filterReparto');
    if (repartoSelect) repartoSelect.value = '';

    // Reset mansione
    const mansioneSelect = document.getElementById('filterMansione');
    if (mansioneSelect) mansioneSelect.value = '';

    // Reset periodo (dal calendario di destra)
    window.selectedPeriod = null;
    if (typeof window.clearPeriodSelection === 'function') {
        window.clearPeriodSelection();
    }

    // Reset ordinamento
    const sortSelect = document.getElementById('filterSort');
    if (sortSelect) sortSelect.value = 'data-recente';

    // Applica filtri resettati
    handleFilterChange();
}

