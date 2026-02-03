(function() {
    'use strict';

    // ============================================================================
    // TEMPLATE HTML - Template literal come in BuyInCloud
    // ============================================================================
    const leavesArchiveTemplate = `
        <div id="leaves-archive-root">
            <div class="container-fluid pt-3 pb-0 px-0">
                <!-- Barra filtri - struttura statica -->
                <div id="filterBarContainer">
                    <div class="filter-bar-container">
                        <div class="filter-bar">
                            <div class="filter-group">
                                <label class="filter-label" for="filterSearch">Ricerca:</label>
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text bg-white border-end-0">
                                        <i class="bi bi-search"></i>
                                    </span>
                                    <input type="text" class="form-control border-start-0" id="filterSearch" placeholder="Cerca dipendente..." aria-label="Cerca dipendente" />
                                </div>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label" for="filterType">Tipo:</label>
                                <select class="form-select form-select-sm" id="filterType" aria-label="Filtra per tipologia">
                                    <option value="">Tutti</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label" for="filterStato">Stato:</label>
                                <select class="form-select form-select-sm" id="filterStato" aria-label="Filtra per stato">
                                    <option value="">Tutti</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label" for="filterReparto">Reparto:</label>
                                <select class="form-select form-select-sm" id="filterReparto" aria-label="Filtra per reparto">
                                    <option value="">Tutti</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label" for="filterMansione">Mansione:</label>
                                <select class="form-select form-select-sm" id="filterMansione" aria-label="Filtra per mansione">
                                    <option value="">Tutti</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label" for="filterSort">Ordina:</label>
                                <select class="form-select form-select-sm" id="filterSort" aria-label="Ordina per">
                                    <option value="data-recente">Richiesta più recente</option>
                                    <option value="urgenza-decrescente">Richiesta meno recente</option>
                                </select>
                            </div>
                            <div class="filter-group filter-group-reset">
                                <button type="button" class="btn-reset-filters" id="filterReset" aria-label="Reset filtri" disabled>
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                    <span>Resetta filtri</span>
                                </button>
                            </div>
                        </div>
                        <div class="active-filters-container" id="activeFiltersContainer"></div>
                    </div>
                </div>

                <div class="main-container">
                    <!-- Lista richieste - struttura statica -->
                    <div class="list-section" id="listSection">
                        <div class="approval-list px-3 pt-3" id="approvalList"></div>
                    </div>

                    <!-- Pannello calendario laterale - struttura statica -->
                    <div id="detail-panel" class="detail-panel">
                        <button class="btn-close-panel" id="btnClosePanel" aria-label="Chiudi" type="button">
                            <i class="bi bi-x-lg"></i>
                        </button>
                        <div class="panel-content">
                            <div class="periodo-presets-container" id="past_periodoPresetsContainer">
                                <button type="button" class="preset-btn" data-preset="last-month">Mese scorso</button>
                                <button type="button" class="preset-btn" data-preset="last-six-month">Ultimi 6 mesi</button>
                                <button type="button" class="preset-btn" data-preset="last-year">Anno scorso</button>
                            </div>
                            <div class="periodo-presets-container" id="future_periodoPresetsContainer">
                                <button type="button" class="preset-btn" data-preset="next-week">Prossima settimana</button>
                                <button type="button" class="preset-btn" data-preset="next-15-days">Prossimi 15 giorni</button>
                                <button type="button" class="preset-btn" data-preset="next-month">Prossimo mese</button>
                            </div>
                            <div class="calendar-year-header-wrapper">
                                <div class="calendar-year-input-wrapper" aria-expanded="false">
                                    <input type="text" id="calendarYearInput" class="calendar-year-input" inputmode="numeric" pattern="[0-9\\s\\-]*" aria-label="Anno" aria-haspopup="dialog" aria-controls="yearPicker" />
                                    <span class="calendar-year-range-suffix" id="calendarYearRangeSuffix" aria-hidden="true"></span>
                                </div>
                                <div class="year-picker" id="yearPicker" role="dialog" aria-label="Scegli anno" hidden>
                                    <!-- Header e griglia anni generati da JS -->
                                </div>
                            </div>
                            <div class="calendar-container" id="calendarContainer"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // ============================================================================
    // STORE CENTRALE con Closure
    // ============================================================================
    function LeavesArchiveStore() {
        // Stato privato in closure
        const state = {
            selectedPeriod: null,
            allRequestsData: [],
            filteredRequestsData: [],
            allCalendarData: [],
            calendarInitialized: false,
            root: null,
            detailPanelElement: null,
            listSectionElement: null,
            currentRequestData: null,
            selectedDay: null,
            selectedPeriodStart: null,
            selectedPeriodEnd: null,
            filterOptionsData: [],
            filterBarLoaded: false,
            searchDebounceTimer: null,
            isInitialized: false,
            displayedCalendarYear: new Date().getFullYear(),
            displayedCalendarYearEnd: null,
            yearPickerWindowStart: null,
            calendarScrollInitialized: false,
            defaultDateApplied: false
        };

        return {
            getState: function(key) {
                return state[key];
            },
            getAllState: function() {
                return Object.assign({}, state);
            },
            setState: function(key, value) {
                state[key] = value;
            },
            setStateBatch: function(updates) {
                Object.keys(updates).forEach(key => {
                    state[key] = updates[key];
                });
            },
            resetState: function() {
                Object.keys(state).forEach(key => {
                    if (key === 'root') {
                        state[key] = null;
                    } else if (Array.isArray(state[key])) {
                        state[key] = [];
                    } else if (typeof state[key] === 'boolean') {
                        state[key] = false;
                    } else {
                        state[key] = null;
                    }
                });
            },
            template: leavesArchiveTemplate
        };
    }

    // Esporta globalmente per compatibilità con il pattern esistente
    window.LeavesArchiveStore = LeavesArchiveStore;

})();
