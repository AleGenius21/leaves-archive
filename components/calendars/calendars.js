/* components/calendars/calendars.js */
const initCalendars = (config) => {
    const { store, root, selectors } = config;

    function loadPanelContent(store) {
        return new Promise((resolve, reject) => {
            const detailPanelElement = store.getState('detailPanelElement');
            const root = store.getState('root');

            if (!detailPanelElement) {
                reject('Detail panel element not found');
                return;
            }

            const calendarContainer = detailPanelElement.querySelector('#calendarContainer');
            if (!calendarContainer) {
                reject('Detail panel content not found (expected from store template)');
                return;
            }
            const closeBtn = root.querySelector('#btnClosePanel');
            if (closeBtn) {
                closeBtn.onclick = function () {
                    closeDetailPanel(store);
                };
            }
            setupPresetButtons(store);
            resolve();
        });
    }

    function openDetailPanel(store, requestData) {
        const detailPanelElement = store.getState('detailPanelElement');
        const listSectionElement = store.getState('listSectionElement');
        const root = store.getState('root');

        if (!detailPanelElement || !listSectionElement) {
            console.error('Detail panel: elementi non trovati');
            return;
        }

        store.setState('currentRequestData', requestData);

        const filteredRequestsData = store.getState('filteredRequestsData');
        const allRequestsData = store.getState('allRequestsData');
        const allRequestsForCalendar = filteredRequestsData && filteredRequestsData.length > 0
            ? [...filteredRequestsData]
            : (allRequestsData && allRequestsData.length > 0 ? [...allRequestsData] : []);

        detailPanelElement.classList.add('panel-open');
        listSectionElement.classList.add('panel-open');

        renderCalendar(store);
    }

    function closeDetailPanel(store) {
        const detailPanelElement = store.getState('detailPanelElement');
        const listSectionElement = store.getState('listSectionElement');
        const root = store.getState('root');

        if (!detailPanelElement || !listSectionElement) {
            return;
        }

        store.setState('currentRequestData', null);
        store.setState('selectedDay', null);

        const selectedDayElements = root ? root.querySelectorAll('.calendar-day.selected-day') : [];
        selectedDayElements.forEach(el => el.classList.remove('selected-day'));
    }

    function loadCalendarData(store, data) {
        if (!Array.isArray(data)) {
            console.error('loadCalendarData: data deve essere un array');
            return;
        }

        const archiveData = data.filter(req =>
            req.stato === 'Approvato' || req.stato === 'Rifiutato'
        );

        store.setState('allCalendarData', [...archiveData]);
        renderCalendar(store);
    }

    function renderCalendar(store, data = null) {
        const root = store.getState('root');
        if (!root) return;

        const calendarContainer = root.querySelector('#calendarContainer');
        if (!calendarContainer) {
            console.warn('renderCalendar: calendarContainer non trovato nel DOM');
            return;
        }

        calendarContainer.innerHTML = '';

        const allCalendarData = store.getState('allCalendarData');
        const allRequestsData = store.getState('allRequestsData');
        const requestsToUse = data || allCalendarData || allRequestsData || [];

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
                const month = date.getMonth();
                const monthKey = `${year}-${month}`;

                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        year: year,
                        month: month,
                        requests: []
                    });
                }

                const monthData = monthsMap.get(monthKey);
                if (!monthData.requests.find(r => r.id === request.id)) {
                    monthData.requests.push(request);
                }
            });
        });

        // Anni da mostrare: due anni se periodo a cavallo (displayedCalendarYearEnd), altrimenti uno
        const displayedYear = store.getState('displayedCalendarYear');
        const displayedYearEnd = store.getState('displayedCalendarYearEnd');
        const yearsToDisplay = displayedYearEnd != null
            ? [Math.min(displayedYear, displayedYearEnd), Math.max(displayedYear, displayedYearEnd)]
            : [displayedYear];

        // Popola monthsMap con i 12 mesi per ogni anno da mostrare
        yearsToDisplay.forEach(year => {
            for (let month = 0; month < 12; month++) {
                const monthKey = `${year}-${month}`;
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        year: year,
                        month: month,
                        requests: []
                    });
                }
            }
        });

        // Se c'è un periodo selezionato, assicurati che i suoi mesi negli anni visualizzati siano inclusi
        const selectedPeriod = store.getState('selectedPeriod');
        if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
            const startDate = new Date(selectedPeriod.startDate);
            const endDate = new Date(selectedPeriod.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                if (!yearsToDisplay.includes(year)) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    currentDate.setDate(1);
                    continue;
                }
                const monthKey = `${year}-${month}`;
                if (!monthsMap.has(monthKey)) {
                    monthsMap.set(monthKey, {
                        year: year,
                        month: month,
                        requests: []
                    });
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentDate.setDate(1);
            }
        }

        // Mesi degli anni visualizzati, ordinati cronologicamente (12 o 24 mesi)
        const sortedMonths = Array.from(monthsMap.values())
            .filter(m => yearsToDisplay.includes(m.year))
            .sort((a, b) => {
                if (a.year !== b.year) {
                    return a.year - b.year;
                }
                return a.month - b.month;
            });

        const currentRequestData = store.getState('currentRequestData');
        sortedMonths.forEach(monthData => {
            const monthCalendar = generateMonthCalendar(store, monthData.year, monthData.month, monthData.requests, currentRequestData);
            calendarContainer.appendChild(monthCalendar);
        });

        // Scrolla automaticamente al mese corrente (solo al primo rendering, se l'anno corrente è tra quelli visualizzati)
        const today = new Date();
        if (!store.getState('calendarScrollInitialized') && yearsToDisplay.includes(today.getFullYear())) {
            store.setState('calendarScrollInitialized', true);
            setTimeout(() => {
                scrollToDate(store, today, true);
            }, 100);
        }

        updateCalendarYearInput(store);
    }

    function generateMonthCalendar(store, year, month, requests, selectedRequest) {
        const root = store.getState('root');
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-calendar';

        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        monthHeader.textContent = `${monthNames[month]} ${year}`;
        monthContainer.appendChild(monthHeader);

        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

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

        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }

        const selectedPeriodStart = store.getState('selectedPeriodStart');
        const selectedPeriodEnd = store.getState('selectedPeriodEnd');

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.setAttribute('data-year', year);
            dayCell.setAttribute('data-month', month);
            dayCell.setAttribute('data-day', day);

            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;

            const dayOfWeek = new Date(year, month, day).getDay();
            if (dayOfWeek === 0) {
                dayNumber.classList.add('sunday');
            }

            dayCell.appendChild(dayNumber);

            const dateKey = `${year}-${month}-${day}`;
            const dayRequests = dateRequestsMap.get(dateKey) || [];

            const ferieRequests = new Set();
            const permessoRequests = new Set();
            let hasSelectedRequest = false;
            let hasApproved = false;
            let hasRejected = false;

            if (dayRequests.length > 0) {
                dayCell.classList.add('has-requests');

                dayRequests.forEach(({ request, leave }) => {
                    const isFerie = request.type === 1 || request.type_name === 'FERIE';
                    const isPermesso = request.type === 2 || request.type_name === 'PERMESSO';
                    const status = request.status;

                    if (isFerie) {
                        ferieRequests.add(request.id);
                    } else if (isPermesso) {
                        permessoRequests.add(request.id);
                    }

                    if (status === 1) {
                        hasApproved = true;
                    } else if (status === 2) {
                        hasRejected = true;
                    }

                    if (selectedRequest && request.id === selectedRequest.id) {
                        hasSelectedRequest = true;
                    }
                });

                if (hasApproved) {
                    dayCell.classList.add('stato-approvato');
                }
                if (hasRejected) {
                    dayCell.classList.add('stato-rifiutato');
                }
                if (hasSelectedRequest) {
                    dayCell.classList.add('selected-request');
                }

                const badgesContainer = document.createElement('div');
                badgesContainer.className = 'calendar-day-badges';

                if (ferieRequests.size > 0) {
                    const ferieBadge = document.createElement('div');
                    ferieBadge.className = 'calendar-badge calendar-badge-ferie';
                    ferieBadge.textContent = `${ferieRequests.size} in Ferie`;
                    badgesContainer.appendChild(ferieBadge);
                }

                if (permessoRequests.size > 0) {
                    const permessoBadge = document.createElement('div');
                    permessoBadge.className = 'calendar-badge calendar-badge-permesso';
                    permessoBadge.textContent = `${permessoRequests.size} in Permesso`;
                    badgesContainer.appendChild(permessoBadge);
                }

                if (badgesContainer.children.length > 0) {
                    dayCell.appendChild(badgesContainer);
                }
            }

            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            if (selectedPeriodStart || selectedPeriodEnd) {
                const currentDate = new Date(year, month, day);
                currentDate.setHours(0, 0, 0, 0);

                if (selectedPeriodStart && selectedPeriodEnd) {
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
                    const startDate = new Date(selectedPeriodStart);
                    startDate.setHours(0, 0, 0, 0);
                    if (currentDate.getTime() === startDate.getTime()) {
                        dayCell.classList.add('period-start');
                    }
                }
            }

            if (!dayCell.classList.contains('empty')) {
                dayCell.style.cursor = 'pointer';
                dayCell.onclick = function (event) {
                    const previousSelected = root.querySelectorAll('.calendar-day.selected-day');
                    previousSelected.forEach(el => el.classList.remove('selected-day'));
                    handleDayClick(store, year, month, day);
                };
            }

            calendarGrid.appendChild(dayCell);
        }

        monthContainer.appendChild(calendarGrid);
        return monthContainer;
    }

    async function handleDayClick(store, year, month, day) {
        clearPresetActiveState(store);

        const root = store.getState('root');
        const previousSelected = root ? root.querySelectorAll('.calendar-day.selected-day') : [];
        previousSelected.forEach(e => e.classList.remove('selected-day'));

        const selectedDate = new Date(year, month, day);
        selectedDate.setHours(0, 0, 0, 0);

        let period = store.getState('selectedPeriod');
        if (store.getState('periodJustReset')) {
            store.setState('periodJustReset', false);
            period = null;
        }
        const periodStart = period?.startDate;
        const periodEnd = period?.endDate;

        // Distingue "solo inizio" (start === end, 1 giorno) da "range già scelto" (start !== end)
        const isRangeAlreadySet = periodStart && periodEnd &&
            new Date(periodStart).getTime() !== new Date(periodEnd).getTime();

        if (!periodStart) {
            // 1° click: imposta inizio periodo (e fine = inizio per coerenza store)
            const start = new Date(selectedDate);
            store.setState('selectedPeriod', {
                startDate: start,
                endDate: new Date(start)
            });
            store.setState('selectedPeriodStart', new Date(start));
            store.setState('selectedPeriodEnd', null);
        } else if (!isRangeAlreadySet) {
            // 2° click: imposta fine periodo (può essere stesso giorno)
            let startDate = new Date(periodStart);
            let endDate = new Date(selectedDate);
            if (endDate < startDate) {
                [startDate, endDate] = [endDate, startDate];
            }
            await applyPeriodFilter(store, startDate, endDate);
        } else {
            // 3° click: reset e nuovo inizio
            const start = new Date(selectedDate);
            store.setState('selectedPeriod', {
                startDate: start,
                endDate: new Date(start)
            });
            store.setState('selectedPeriodStart', new Date(start));
            store.setState('selectedPeriodEnd', null);
            store.setState('displayedCalendarYear', selectedDate.getFullYear());
            store.setState('displayedCalendarYearEnd', null);
        }

        renderCalendar(store);

        // Chiama loadAndDisplayDayData solo per selezione singola (stesso giorno inizio/fine), non per range
        const periodAfter = store.getState('selectedPeriod');
        const isSingleDay = periodAfter?.startDate && periodAfter?.endDate &&
            new Date(periodAfter.startDate).getTime() === new Date(periodAfter.endDate).getTime();

        if (isSingleDay) {
            store.setState('selectedDay', { year, month, day });
            const previousSelected2 = root ? root.querySelectorAll('.calendar-day.selected-day') : [];
            previousSelected2.forEach(e => e.classList.remove('selected-day'));

            const loadAndDisplayDayData = store.getState('loadAndDisplayDayData');
            if (loadAndDisplayDayData) {
                loadAndDisplayDayData(store, selectedDate);
            }
        }
    }

    async function applyPeriodFilter(store, startDate, endDate) {
        const normalizedStart = new Date(startDate);
        normalizedStart.setHours(0, 0, 0, 0);
        const normalizedEnd = new Date(endDate);
        normalizedEnd.setHours(23, 59, 59, 999);

        const startYear = normalizedStart.getFullYear();
        const endYear = normalizedEnd.getFullYear();

        if (startYear !== endYear) {
            store.setState('displayedCalendarYear', startYear);
            store.setState('displayedCalendarYearEnd', endYear);
        } else {
            store.setState('displayedCalendarYear', startYear);
            store.setState('displayedCalendarYearEnd', null);
        }

        store.setState('selectedPeriodStart', normalizedStart);
        store.setState('selectedPeriodEnd', normalizedEnd);
        store.setState('selectedPeriod', {
            startDate: normalizedStart,
            endDate: normalizedEnd
        });

        const allCalendarData = store.getState('allCalendarData');
        if (allCalendarData && Array.isArray(allCalendarData) && allCalendarData.length > 0) {
            store.setState('allRequestsData', [...allCalendarData]);
        }

        renderCalendar(store);
        updateCalendarYearInput(store);

        let periodFilteredData = [];
        const currentAllCalendarData = store.getState('allCalendarData');
        if (currentAllCalendarData && Array.isArray(currentAllCalendarData) && currentAllCalendarData.length > 0) {
            periodFilteredData = currentAllCalendarData.filter(req => {
                if (req.data_numerica) {
                    const reqDate = new Date(req.data_numerica);
                    reqDate.setHours(0, 0, 0, 0);
                    if (reqDate >= normalizedStart && reqDate <= normalizedEnd) {
                        return true;
                    }
                }

                if (req.moorea_obj && req.moorea_obj.leaves && Array.isArray(req.moorea_obj.leaves)) {
                    for (const leave of req.moorea_obj.leaves) {
                        const leaveStartDate = leave.dataInizio ? new Date(leave.dataInizio + 'T00:00:00') : null;
                        const leaveEndDate = leave.dataFine ? new Date(leave.dataFine + 'T00:00:00') : null;

                        if (leaveStartDate && !isNaN(leaveStartDate.getTime())) {
                            leaveStartDate.setHours(0, 0, 0, 0);
                            if (!leaveEndDate || isNaN(leaveEndDate.getTime())) {
                                if (leaveStartDate >= normalizedStart && leaveStartDate <= normalizedEnd) {
                                    return true;
                                }
                            } else {
                                leaveEndDate.setHours(23, 59, 59, 999);
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

        const filterConfigData = store.getState('filterConfigData');
        const buildFiltersFromConfig = store.getState('buildFiltersFromConfig');
        const buildStatusFilter = store.getState('buildStatusFilter');

        if (filterConfigData && typeof filterConfigData === 'object' && buildFiltersFromConfig) {
            buildFiltersFromConfig(store, filterConfigData);
        } else if (buildStatusFilter) {
            buildStatusFilter(store);
        }

        const setFiltersEnabled = store.getState('setFiltersEnabled');
        const currentAllCalendarData2 = store.getState('allCalendarData');
        if (setFiltersEnabled) {
            const hasData = (periodFilteredData && periodFilteredData.length > 0) ||
                (currentAllCalendarData2 && Array.isArray(currentAllCalendarData2) && currentAllCalendarData2.length > 0);
            setFiltersEnabled(store, hasData);
        }

        const handleFilterChange = store.getState('handleFilterChange');
        if (handleFilterChange) {
            handleFilterChange(store);
        }
    }

    function clearPresetActiveState(store) {
        const root = store.getState('root');
        if (root) {
            root.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        }
    }

    function applyDefaultTodaySelection(store) {
        if (store.getState('defaultDateApplied')) return;
        store.setState('defaultDateApplied', true);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        applyPeriodFilter(store, today, today);
    }

    async function applyTodaySelection(store) {
        clearPresetActiveState(store);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await applyPeriodFilter(store, today, today);
    }

    function clearPeriodSelection(store) {
        store.setState('periodJustReset', true);
        store.setState('selectedPeriodStart', null);
        store.setState('selectedPeriodEnd', null);
        store.setState('selectedPeriod', null);
        store.setState('displayedCalendarYearEnd', null);
        store.setState('displayedCalendarYear', new Date().getFullYear());

        const root = store.getState('root');
        const periodDays = root ? root.querySelectorAll('.calendar-day.period-start, .calendar-day.period-end, .calendar-day.period-range') : [];
        periodDays.forEach(el => {
            el.classList.remove('period-start', 'period-end', 'period-range');
        });

        const presetButtons = root ? root.querySelectorAll('.preset-btn') : [];
        presetButtons.forEach(btn => btn.classList.remove('active'));

        const setFiltersEnabled = store.getState('setFiltersEnabled');
        if (setFiltersEnabled) {
            setFiltersEnabled(store, false);
        }

        const handleFilterChange = store.getState('handleFilterChange');
        if (handleFilterChange) {
            handleFilterChange(store);
        }

        updateCalendarYearInput(store);
        renderCalendar(store);
    }

    async function applyPeriodoPreset(store, preset) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate, endDate;

        switch (preset) {
            case 'last-month':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;

            case 'last-six-month':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 6);
                endDate = new Date(today);
                break;

            case 'last-year':
                const lastYear = today.getFullYear() - 1;
                startDate = new Date(lastYear, 0, 1);
                endDate = new Date(lastYear, 11, 31);
                break;

            case 'next-week':
                const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
                startDate = new Date(today);
                startDate.setDate(today.getDate() + daysUntilMonday);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;

            case 'next-15-days':
                startDate = new Date(today);
                endDate = new Date(today);
                endDate.setDate(today.getDate() + 14);
                break;

            case 'next-month':
                startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                break;

            default:
                return;
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Mostra uno o due anni nel calendario a seconda che il periodo sia a cavallo
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        if (startYear !== endYear) {
            store.setState('displayedCalendarYear', startYear);
            store.setState('displayedCalendarYearEnd', endYear);
        } else {
            store.setState('displayedCalendarYear', startYear);
            store.setState('displayedCalendarYearEnd', null);
        }
        updateCalendarYearInput(store);

        await applyPeriodFilter(store, startDate, endDate);

        setTimeout(() => {
            scrollToDate(store, startDate);
        }, 100);
    }

    function scrollToDate(store, date, instant = false) {
        const root = store.getState('root');
        if (!root) return;

        const calendarContainer = root.querySelector('#calendarContainer');
        if (!calendarContainer) return;

        const year = date.getFullYear();
        const month = date.getMonth();

        const monthCalendars = calendarContainer.querySelectorAll('.month-calendar');
        monthCalendars.forEach(monthCalendar => {
            const monthHeader = monthCalendar.querySelector('.month-header');
            if (monthHeader) {
                const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                const headerText = `${monthNames[month]} ${year}`;
                if (monthHeader.textContent === headerText) {
                    monthCalendar.scrollIntoView({
                        behavior: instant ? 'auto' : 'smooth',
                        block: 'center'
                    });
                }
            }
        });
    }

    function setupPresetButtons(store) {
        const root = store.getState('root');
        if (!root) return;

        const presetContainers = root.querySelectorAll('.periodo-presets-container');

        presetContainers.forEach(container => {
            const presetButtons = container.querySelectorAll('.preset-btn');

            presetButtons.forEach(btn => {
                btn.onclick = function (e) {
                    e.stopPropagation();

                    presetButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    const preset = this.getAttribute('data-preset');
                    applyPeriodoPreset(store, preset);
                };
            });
        });
    }

    const YEAR_PICKER_MIN = 2024;
    const YEAR_PICKER_WINDOW_SIZE = 12;

    function getYearPickerMax() {
        return new Date().getFullYear() + 1;
    }

    function updateCalendarYearInput(store) {
        const root = store.getState('root');
        if (!root) return;

        const input = root.querySelector('#calendarYearInput');
        const suffix = root.querySelector('#calendarYearRangeSuffix');
        if (!input) return;

        const displayedYear = store.getState('displayedCalendarYear');
        const displayedYearEnd = store.getState('displayedCalendarYearEnd');

        if (displayedYearEnd != null) {
            input.value = displayedYear + ' - ' + displayedYearEnd;
        } else {
            input.value = String(displayedYear);
        }

        if (suffix) {
            suffix.textContent = '';
            suffix.style.display = 'none';
        }
    }

    function closeYearPicker(store) {
        const root = store.getState('root');
        if (!root) return;

        const yearPicker = root.querySelector('#yearPicker');
        const wrapper = root.querySelector('.calendar-year-input-wrapper');

        if (yearPicker) yearPicker.hidden = true;
        if (wrapper) wrapper.setAttribute('aria-expanded', 'false');
    }

    function populateYearPicker(store) {
        const root = store.getState('root');
        if (!root) return;

        const yearPicker = root.querySelector('#yearPicker');
        if (!yearPicker) return;

        const maxStartYear = Math.max(YEAR_PICKER_MIN, getYearPickerMax() - YEAR_PICKER_WINDOW_SIZE + 1);
        let windowStart = store.getState('yearPickerWindowStart');
        const displayedYear = store.getState('displayedCalendarYear');

        if (windowStart == null) {
            windowStart = Math.max(YEAR_PICKER_MIN, displayedYear - 5);
            windowStart = Math.min(windowStart, maxStartYear);
            store.setState('yearPickerWindowStart', windowStart);
        }

        const startYear = windowStart;
        const endYear = Math.min(startYear + YEAR_PICKER_WINDOW_SIZE - 1, getYearPickerMax());

        yearPicker.innerHTML = '';

        // Header: prev, label range, next
        const header = document.createElement('div');
        header.className = 'year-picker-header';

        const btnPrev = document.createElement('button');
        btnPrev.type = 'button';
        btnPrev.className = 'year-picker-nav-btn';
        btnPrev.setAttribute('aria-label', 'Anni precedenti');
        btnPrev.textContent = '\u2039';

        const labelCenter = document.createElement('span');
        labelCenter.className = 'year-picker-header-label';
        labelCenter.textContent = startYear === endYear ? String(startYear) : startYear + ' – ' + endYear;

        const btnNext = document.createElement('button');
        btnNext.type = 'button';
        btnNext.className = 'year-picker-nav-btn';
        btnNext.setAttribute('aria-label', 'Anni successivi');
        btnNext.textContent = '\u203A';

        btnPrev.onclick = function (e) {
            e.stopPropagation();
            store.setState('yearPickerWindowStart', Math.max(YEAR_PICKER_MIN, startYear - YEAR_PICKER_WINDOW_SIZE));
            populateYearPicker(store);
        };

        btnNext.onclick = function (e) {
            e.stopPropagation();
            store.setState('yearPickerWindowStart', Math.min(startYear + YEAR_PICKER_WINDOW_SIZE, maxStartYear));
            populateYearPicker(store);
        };

        header.appendChild(btnPrev);
        header.appendChild(labelCenter);
        header.appendChild(btnNext);
        yearPicker.appendChild(header);

        // Griglia 4x3
        const grid = document.createElement('div');
        grid.className = 'year-picker-grid';

        for (let y = startYear; y <= endYear; y++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSelected = y === displayedYear;
            btn.className = 'year-picker-btn' + (isSelected ? ' selected' : '');
            btn.textContent = y;
            btn.setAttribute('data-year', y);
            if (isSelected) btn.setAttribute('aria-pressed', 'true');

            btn.onclick = function (e) {
                e.stopPropagation();
                const year = parseInt(this.getAttribute('data-year'), 10);
                store.setState('displayedCalendarYear', year);
                store.setState('displayedCalendarYearEnd', null);
                closeYearPicker(store);
                updateCalendarYearInput(store);
                renderCalendar(store);
                setTimeout(() => {
                    scrollToDate(store, new Date(year, 0, 1), true);
                }, 50);
            };

            grid.appendChild(btn);
        }

        yearPicker.appendChild(grid);
    }

    function setupYearPicker(store) {
        const root = store.getState('root');
        if (!root) return;

        const yearInput = root.querySelector('#calendarYearInput');
        const yearPicker = root.querySelector('#yearPicker');
        const wrapper = root.querySelector('.calendar-year-input-wrapper');

        if (!yearInput || !yearPicker) return;

        populateYearPicker(store);

        function openPicker() {
            store.setState('yearPickerWindowStart', null);
            populateYearPicker(store);
            yearPicker.hidden = false;
            if (wrapper) wrapper.setAttribute('aria-expanded', 'true');
        }

        yearInput.onfocus = function (e) {
            e.stopPropagation();
            openPicker();
        };

        yearInput.onclick = function (e) {
            e.stopPropagation();
            if (yearPicker.hidden) openPicker();
        };

        function parseYearInputValue(str) {
            const s = String(str).trim();
            const single = /^\s*(\d{4})\s*$/;
            const range = /^\s*(\d{4})\s*-\s*(\d{4})\s*$/;
            let m = s.match(range);

            if (m) {
                const a = parseInt(m[1], 10);
                const b = parseInt(m[2], 10);
                const max = getYearPickerMax();
                if (a >= YEAR_PICKER_MIN && a <= max && b >= YEAR_PICKER_MIN && b <= max)
                    return { single: false, start: Math.min(a, b), end: Math.max(a, b) };
            }

            m = s.match(single);
            if (m) {
                const val = parseInt(m[1], 10);
                if (val >= YEAR_PICKER_MIN && val <= getYearPickerMax())
                    return { single: true, start: val, end: null };
            }

            return null;
        }

        yearInput.onchange = function () {
            const parsed = parseYearInputValue(yearInput.value);
            if (parsed) {
                store.setState('displayedCalendarYear', parsed.start);
                store.setState('displayedCalendarYearEnd', parsed.single ? null : parsed.end);
                updateCalendarYearInput(store);
                renderCalendar(store);
                const year = store.getState('displayedCalendarYear');
                setTimeout(() => scrollToDate(store, new Date(year, 0, 1), true), 50);
            } else {
                updateCalendarYearInput(store);
            }
        };

        yearInput.onblur = function () {
            const parsed = parseYearInputValue(yearInput.value);
            if (!parsed) {
                updateCalendarYearInput(store);
            }
        };

        // Click outside handler - usa setTimeout per evitare conflitti con altri handler
        setTimeout(function () {
            document.addEventListener('click', function closeOnOutsideClick(e) {
                if (yearPicker.hidden) return;
                if (!yearPicker.contains(e.target) && e.target !== yearInput && (!wrapper || !wrapper.contains(e.target))) {
                    closeYearPicker(store);
                }
            });
        }, 0);

        updateCalendarYearInput(store);
    }

    // Auto-initialization logic
    const api = {
        open: openDetailPanel,
        close: closeDetailPanel,
        loadCalendarData: loadCalendarData,
        renderCalendar: renderCalendar,
        clearPeriodSelection: clearPeriodSelection
    };

    // Store api reference
    store.setState('calendars', api);

    async function autoInit() {
        if (!root) {
            console.error('Detail panel: root è obbligatorio');
            return;
        }

        const detailPanelElement = root.querySelector('#detail-panel');
        const listSectionElement = root.querySelector('#listSection');

        if (!detailPanelElement || !listSectionElement) {
            console.error('Detail panel: elementi non trovati');
            return;
        }

        store.setState('detailPanelElement', detailPanelElement);
        store.setState('listSectionElement', listSectionElement);
        store.setState('clearPeriodSelection', clearPeriodSelection);
        store.setState('loadCalendarData', loadCalendarData);
        store.setState('openDetailPanel', openDetailPanel);
        store.setState('applyTodaySelection', applyTodaySelection);

        try {
            await loadPanelContent(store);
            detailPanelElement.classList.add('panel-open');
            listSectionElement.classList.add('panel-open');

            setupYearPicker(store);
            renderCalendar(store);
            applyDefaultTodaySelection(store);
        } catch (err) {
            console.error('Detail panel init:', err);
        }
    }

    // Execute auto-initialization
    autoInit();

    return api;
};
