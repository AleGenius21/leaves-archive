'use strict';

/**
 * Filters Component - Modulo filtri isolato e configurabile
 * initFilters(mainConfig) con mainConfig: { store, api, settings: { endpoint, type } }
 */
function initFilters(mainConfig) {
    // Extract dependencies from config
    const store = mainConfig.store;
    const api = mainConfig.api;
    const config = mainConfig.settings;

    // Validate required dependencies
    if (!store) {
        console.error('initFilters: store è obbligatorio nella configurazione');
        return;
    }
    if (!api) {
        console.error('initFilters: api è obbligatorio nella configurazione');
        return;
    }
    const DEFAULT_TYPE_CONFIG = {
        filters: {
            search: { enabled: true, id: 'filterSearch', label: 'Ricerca' },
            type: { enabled: true, id: 'filterType', label: 'Tipo' },
            status: { enabled: true, id: 'filterStato', label: 'Stato' },
            department: { enabled: true, id: 'filterReparto', label: 'Reparto' },
            task: { enabled: true, id: 'filterMansione', label: 'Mansione' },
            sort: { enabled: true, id: 'filterSort', label: 'Ordina' },
            reset: { enabled: true, id: 'filterReset', label: 'Resetta filtri' }
        },
        configDataMapping: { types: 'types', blocks: 'blocks', tasks: 'tasks' },
        buildStatusFilter: true
    };

    const TYPE_CONFIGS = {
        'ferie_permessi': {
            filters: {
                search: { enabled: true, id: 'filterSearch', label: 'Ricerca' },
                type: { enabled: true, id: 'filterType', label: 'Tipo' },
                status: { enabled: false, id: 'filterStato', label: 'Stato' },  // ← CAMBIATO: false invece di true
                department: { enabled: true, id: 'filterReparto', label: 'Reparto' },
                task: { enabled: true, id: 'filterMansione', label: 'Mansione' },
                sort: { enabled: true, id: 'filterSort', label: 'Ordina' },
                reset: { enabled: true, id: 'filterReset', label: 'Resetta filtri' }
            },
            configDataMapping: { types: 'types', blocks: 'blocks', tasks: 'tasks' },
            buildStatusFilter: false  // ← CAMBIATO: false invece di true
        },
        'archivio': DEFAULT_TYPE_CONFIG,
        'assenze': DEFAULT_TYPE_CONFIG,
        'certificati': DEFAULT_TYPE_CONFIG,
        'malattie': DEFAULT_TYPE_CONFIG
    };

    const SUPPORTED_TYPES = ['ferie_permessi', 'archivio', 'assenze', 'certificati', 'malattie'];

    function validateConfig(config) {
        if (!config || typeof config !== 'object') {
            return { valid: false, type: 'ferie_permessi', endpoint: '/leave_admin_screen_config' };
        }
        const endpoint = (typeof config.endpoint === 'string' && config.endpoint.trim()) ? config.endpoint.trim() : '/leave_admin_screen_config';
        const type = (SUPPORTED_TYPES.indexOf(config.type) >= 0) ? config.type : 'ferie_permessi';
        return { valid: true, type: type, endpoint: endpoint };
    }

    const validated = validateConfig(config);
    const configEndpoint = validated.endpoint;
    const typeConfig = TYPE_CONFIGS[validated.type] || DEFAULT_TYPE_CONFIG;

    function verifyFilterBarStructure(store) {
        const root = store.getState('root');
        if (!root) {
            console.error('Root non inizializzato');
            return false;
        }
        const container = root.querySelector('#filterBarContainer');
        if (!container) {
            console.error('FilterBarContainer non trovato nel DOM');
            return false;
        }
        const existingContainer = container.querySelector('.filter-bar-container');
        if (existingContainer) {
            store.setState('filterBarLoaded', true);
            return true;
        }
        console.error('FilterBarContainer non contiene .filter-bar-container');
        return false;
    }

    function getSelectValue(selectId, root) {
        const select = root.querySelector(selectId);
        return select && select.value ? select.value : null;
    }

    function getSelectDataAttribute(selectId, attrName, root) {
        const select = root.querySelector(selectId);
        if (!select || !select.value) return null;
        const option = select.selectedOptions[0];
        return option ? option.getAttribute(attrName) : null;
    }

    function formatDate(date) {
        return LeavesUtils.formatDateISO(date);
    }

    function buildApiParams(store) {
        const root = store.getState('root');
        if (!root) return { status: [1, 2] };

        const params = { status: [1, 2] };

        const searchValue = getSelectValue('#filterSearch', root);
        if (searchValue && searchValue.trim()) {
            params.nome = searchValue.trim();
        }

        const typeSelect = root.querySelector('#filterType');
        if (typeSelect && typeSelect.value) {
            const typeId = getSelectDataAttribute('#filterType', 'data-type-id', root);
            if (typeId) {
                params.type_id = parseInt(typeId, 10);
            } else {
                const typeMap = { 'Ferie': 1, 'FERIE': 1, 'Permessi': 2, 'Permesso': 2, 'PERMESSO': 2, 'PERMESSI': 2 };
                const mappedId = typeMap[typeSelect.value];
                if (mappedId) params.type_id = mappedId;
            }
        }

        const repartoSelect = root.querySelector('#filterReparto');
        if (repartoSelect && repartoSelect.value) {
            const deptId = getSelectDataAttribute('#filterReparto', 'data-department-id', root);
            if (deptId) {
                params.department_id = parseInt(deptId, 10);
            } else {
                const allRequestsData = store.getState('allRequestsData');
                const repartoItem = (allRequestsData || []).find(req =>
                    (req.department_name || req.reparto) === repartoSelect.value
                );
                if (repartoItem && repartoItem.department_id) {
                    params.department_id = repartoItem.department_id;
                }
            }
        }

        const mansioneSelect = root.querySelector('#filterMansione');
        if (mansioneSelect && mansioneSelect.value) {
            const taskId = getSelectDataAttribute('#filterMansione', 'data-task-id', root);
            if (taskId) {
                params.task_id = parseInt(taskId, 10);
            } else {
                const allRequestsData = store.getState('allRequestsData');
                const mansioneItem = (allRequestsData || []).find(req =>
                    (req.task_name || req.mansione) === mansioneSelect.value
                );
                if (mansioneItem && mansioneItem.task_id) {
                    params.task_id = mansioneItem.task_id;
                }
            }
        }

        const statoSelect = root.querySelector('#filterStato');
        if (statoSelect && statoSelect.value) {
            const statusId = getSelectDataAttribute('#filterStato', 'data-status-id', root);
            if (statusId) {
                params.status = [parseInt(statusId, 10)];
            } else {
                const statusValue = parseInt(statoSelect.value, 10);
                if (!isNaN(statusValue)) params.status = [statusValue];
            }
        }

        const selectedPeriod = store.getState('selectedPeriod');
        if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
            params.data_inizio = formatDate(new Date(selectedPeriod.startDate));
            params.data_fine = formatDate(new Date(selectedPeriod.endDate));
        }

        const sortValue = getSelectValue('#filterSort', root);
        if (sortValue) {
            if (sortValue === 'data-recente') {
                params.sort_by = 'dataInizio';
                params.sort_order = 'desc';
            } else if (sortValue === 'urgenza-decrescente') {
                params.sort_by = 'dataInizio';
                params.sort_order = 'asc';
            }
        }

        return params;
    }

    function countUniqueValues(requestsData, key1, key2) {
        if (!Array.isArray(requestsData) || requestsData.length === 0) return 0;
        const valuesSet = new Set();
        requestsData.forEach(item => {
            const value = item[key1] || item[key2];
            if (value && String(value).trim() !== '') {
                valuesSet.add(String(value).trim());
            }
        });
        return valuesSet.size;
    }

    function countUniqueReparti(requestsData) {
        return countUniqueValues(requestsData, 'department_name', 'reparto');
    }

    function countUniqueMansioni(requestsData) {
        return countUniqueValues(requestsData, 'task_name', 'mansione');
    }

    function getStatusString(status) {
        if (status === 1) return 'Approvato';
        if (status === 2) return 'Rifiutato';
        if (status === 0) return 'In Attesa';
        return 'Sconosciuto';
    }

    function buildSelectOptions(select, options, currentValue) {
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Tutti';
        select.appendChild(defaultOption);
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            if (opt.dataAttr) option.setAttribute(opt.dataAttr.name, opt.dataAttr.value);
            if (opt.color) option.setAttribute('data-color', opt.color);
            select.appendChild(option);
        });
        const isValidValue = currentValue && Array.from(select.options).some(opt => opt.value === currentValue);
        select.value = isValidValue ? currentValue : '';
    }

    function buildStatusFilter(store) {
        const root = store.getState('root');
        if (!root) return false;

        const typeConfig = TYPE_CONFIGS[validated.type] || DEFAULT_TYPE_CONFIG;

        if (typeConfig.buildStatusFilter === false) {
            const statoSelect = root.querySelector('#filterStato');
            if (statoSelect) {
                const filterGroup = statoSelect.closest('.filter-group');
                if (filterGroup) {
                    filterGroup.classList.add('hidden');
                }
                statoSelect.value = '';
            }
            return false;
        }

        const statoSelect = root.querySelector('#filterStato');
        if (!statoSelect) return false;
        const currentValue = statoSelect.value;
        buildSelectOptions(statoSelect, [
            { value: '1', text: 'Approvato', dataAttr: { name: 'data-status-id', value: '1' } },
            { value: '2', text: 'Rifiutato', dataAttr: { name: 'data-status-id', value: '2' } }
        ], currentValue);
        return true;
    }

    function toggleFilterGroupVisibility(selectId, count, root) {
        const select = root.querySelector(selectId);
        if (!select) return;
        const filterGroup = select.closest('.filter-group');
        if (!filterGroup) return;
        if (count < 2) {
            filterGroup.classList.add('hidden');
            select.value = '';
        } else {
            filterGroup.classList.remove('hidden');
        }
    }

    function buildFiltersFromConfig(store, configData) {
        const root = store.getState('root');
        if (!root || !configData || typeof configData !== 'object') return false;

        let success = false;

        const tipoSelect = root.querySelector('#filterType');
        if (tipoSelect && Array.isArray(configData.types) && configData.types.length > 0) {
            const currentValue = tipoSelect.value;
            const options = configData.types
                .filter(type => type && type.type_id !== undefined && type.type_name)
                .map(type => ({
                    value: type.type_name,
                    text: type.type_name,
                    dataAttr: { name: 'data-type-id', value: type.type_id.toString() }
                }));
            buildSelectOptions(tipoSelect, options, currentValue);
            success = true;
        }

        const repartoSelect = root.querySelector('#filterReparto');
        if (repartoSelect && Array.isArray(configData.blocks) && configData.blocks.length > 0) {
            const currentValue = repartoSelect.value;
            const options = configData.blocks
                .filter(block => block && block.code !== undefined && block.pretty_name)
                .map(block => ({
                    value: block.pretty_name,
                    text: block.pretty_name,
                    dataAttr: { name: 'data-department-id', value: block.code.toString() },
                    color: block.color
                }));
            buildSelectOptions(repartoSelect, options, currentValue);
            success = true;
        }

        const mansioneSelect = root.querySelector('#filterMansione');
        if (mansioneSelect && Array.isArray(configData.tasks) && configData.tasks.length > 0) {
            const currentValue = mansioneSelect.value;
            const options = configData.tasks
                .filter(task => task && (task.task_name || task.name || task.pretty_name))
                .map(task => {
                    const taskId = task.task_id !== undefined ? task.task_id : (task.id !== undefined ? task.id : null);
                    const taskName = task.task_name || task.name || task.pretty_name;
                    return {
                        value: taskName,
                        text: taskName,
                        dataAttr: taskId !== null ? { name: 'data-task-id', value: taskId.toString() } : null,
                        color: task.color
                    };
                });
            buildSelectOptions(mansioneSelect, options, currentValue);
            success = true;
        }

        buildStatusFilter(store);
        toggleFilterGroupVisibility('#filterReparto', Array.isArray(configData.blocks) ? configData.blocks.length : 0, root);
        toggleFilterGroupVisibility('#filterMansione', Array.isArray(configData.tasks) ? configData.tasks.length : 0, root);

        return success;
    }

    function updateFilterOptions(store, requests) {
        const root = store.getState('root');
        if (!root || !Array.isArray(requests)) return;

        const filterConfigs = [
            { id: 'filterReparto', nameKey: 'department_name', idKey: 'department_id', dataAttribute: 'data-department-id' },
            { id: 'filterMansione', nameKey: 'task_name', idKey: 'task_id', dataAttribute: 'data-task-id' },
            { id: 'filterType', nameKey: 'type_name', idKey: 'type', dataAttribute: 'data-type-id' }
        ];

        filterConfigs.forEach(config => {
            const select = root.querySelector('#' + config.id);
            if (!select) return;
            const currentVal = select.value;
            const uniqueItems = new Map();
            requests.forEach(r => {
                const name = r[config.nameKey];
                const id = r[config.idKey];
                if (name) uniqueItems.set(name, id);
            });
            const options = Array.from(uniqueItems.keys()).sort().map(name => ({
                value: name,
                text: name,
                dataAttr: { name: config.dataAttribute, value: uniqueItems.get(name) }
            }));
            buildSelectOptions(select, options, currentVal);
        });

        const statusSelect = root.querySelector('#filterStato');
        if (statusSelect) {
            const currentVal = statusSelect.value;
            const uniqueStatuses = Array.from(new Set(requests.map(r => getStatusString(r.status))));
            const options = uniqueStatuses.map(statusStr => ({ value: statusStr, text: statusStr }));
            buildSelectOptions(statusSelect, options, currentVal);
        }

        toggleFilterGroupVisibility('#filterReparto', countUniqueReparti(requests), root);
        toggleFilterGroupVisibility('#filterMansione', countUniqueMansioni(requests), root);
    }

    function setFiltersEnabled(store, enabled) {
        const root = store.getState('root');
        const filterElements = ['filterSearch', 'filterType', 'filterStato', 'filterReparto', 'filterMansione', 'filterSort', 'filterReset'];
        filterElements.forEach(elementId => {
            const element = root.querySelector('#' + elementId);
            if (element) element.disabled = !enabled;
        });
        const filterBarContainer = root.querySelector('.filter-bar-container');
        if (filterBarContainer) {
            filterBarContainer.classList.toggle('filters-disabled', !enabled);
        }
    }

    function showListSpinner(store) {
        const root = store.getState('root');
        const approvalList = root.querySelector('#approvalList');
        if (!approvalList) return;
        approvalList.innerHTML = '';
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'list-spinner-container';
        spinnerContainer.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Caricamento...</span></div>';
        approvalList.appendChild(spinnerContainer);
    }

    function hideListSpinner(store) {
        const root = store.getState('root');
        const approvalList = root.querySelector('#approvalList');
        if (!approvalList) return;
        const spinnerContainer = approvalList.querySelector('.list-spinner-container');
        if (spinnerContainer) spinnerContainer.remove();
    }

    function showMessage(store, message, className = 'text-center py-4 text-muted', style = { fontSize: '0.917rem', padding: '52.8px', color: '#666666' }) {
        const root = store.getState('root');
        const approvalList = root.querySelector('#approvalList');
        if (!approvalList) return;
        approvalList.innerHTML = '';
        const messageEl = document.createElement('div');
        messageEl.className = className;
        Object.assign(messageEl.style, style);
        messageEl.textContent = message;
        approvalList.appendChild(messageEl);
    }

    function showPeriodSelectionMessage(store) {
        showMessage(store, 'Seleziona un periodo dal calendario per visualizzare i giustificativi.');
    }

    function showEmptyStateMessage(store) {
        showMessage(store, 'Seleziona un periodo dal calendario per visualizzare i giustificativi.');
    }

    function initHeaderShadows(store) {
        const root = store.getState('root');
        const approvalList = root.querySelector('#approvalList');
        if (!approvalList) return;
        const headers = approvalList.querySelectorAll('.reparto-section-label');
        headers.forEach(function (header) {
            let firstRow = header.nextElementSibling;
            while (firstRow && !firstRow.classList.contains('approval-row')) {
                firstRow = firstRow.nextElementSibling;
            }
            if (!firstRow) return;
            const updateShadowState = function () {
                const headerRect = header.getBoundingClientRect();
                const rowRect = firstRow.getBoundingClientRect();
                header.classList.toggle('has-shadow', rowRect.top < headerRect.bottom);
            };
            approvalList.onscroll = updateShadowState;
            const observer = new IntersectionObserver(function () { updateShadowState(); }, { root: approvalList, threshold: [0, 0.1, 0.5, 1] });
            observer.observe(firstRow);
            updateShadowState();
        });
    }

    function renderList(store, data) {
        const root = store.getState('root');
        if (!root) return;
        const list = root.querySelector('#approvalList');
        if (!list) return;
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state-container"><img src="assets/image/desert.png" alt="Nessuna richiesta trovata" class="empty-state-image"></div>';
            return;
        }

        const searchVal = root.querySelector('#filterSearch')?.value.toLowerCase();
        const typeVal = root.querySelector('#filterType')?.value;
        const statoVal = root.querySelector('#filterStato')?.value;
        const repVal = root.querySelector('#filterReparto')?.value;

        const filtered = data.filter(item => {
            if (searchVal && !((item.nominativo || item.nome || '').toLowerCase().includes(searchVal))) return false;
            if (typeVal && (item.type_name || item.tipo_richiesta) !== typeVal) return false;
            if (statoVal && getStatusString(item.status) !== statoVal) return false;
            if (repVal && (item.department_name || item.reparto) !== repVal) return false;
            return true;
        });

        const approvalRow = store.getState('approvalRow');
        const repartiCount = countUniqueReparti(data);

        if (!approvalRow || !approvalRow.createApprovalRow) {
            filtered.forEach(function (requestData) {
                const row = document.createElement('div');
                row.textContent = JSON.stringify(requestData);
                list.appendChild(row);
            });
        } else if (repartiCount < 2) {
            filtered.forEach(function (requestData) {
                list.appendChild(approvalRow.createApprovalRow(requestData, store));
            });
        } else {
            const groups = {};
            filtered.forEach(req => {
                const rep = req.department_name || req.reparto || 'Nessun reparto';
                if (!groups[rep]) groups[rep] = [];
                groups[rep].push(req);
            });
            Object.keys(groups).sort().forEach(rep => {
                const label = document.createElement('div');
                label.className = 'reparto-section-label pt-4';
                label.textContent = rep.toUpperCase();
                list.appendChild(label);
                groups[rep].forEach(req => {
                    list.appendChild(approvalRow.createApprovalRow(req, store));
                });
            });
        }
        initHeaderShadows(store);
    }

    function updateResetButtonState(store) {
        const root = store.getState('root');
        const resetButton = root.querySelector('#filterReset');
        if (!resetButton) return;
        resetButton.disabled = !hasAnyActiveFilters(store);
    }

    function hasAnyActiveFilters(store) {
        const root = store.getState('root');
        if (root.querySelector('#filterSearch')?.value.trim()) return true;
        if (root.querySelector('#filterType')?.value) return true;
        if (root.querySelector('#filterStato')?.value) return true;
        const repartoSelect = root.querySelector('#filterReparto');
        const repartoFilterGroup = repartoSelect?.closest('.filter-group');
        if (repartoSelect && repartoFilterGroup && !repartoFilterGroup.classList.contains('hidden') && repartoSelect.value) return true;
        const mansioneSelect = root.querySelector('#filterMansione');
        const mansioneFilterGroup = mansioneSelect?.closest('.filter-group');
        if (mansioneSelect && mansioneFilterGroup && !mansioneFilterGroup.classList.contains('hidden') && mansioneSelect.value) return true;
        const selectedPeriod = store.getState('selectedPeriod');
        if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) return true;
        if (root.querySelector('#filterSort')?.value !== 'data-recente') return true;
        return false;
    }

    function formatDateForDisplay(date) {
        return LeavesUtils.formatDateDDMMYYYY(date);
    }

    function isFilterGroupVisible(selectId, root) {
        const select = root.querySelector(selectId);
        if (!select) return false;
        const filterGroup = select.closest('.filter-group');
        return filterGroup && !filterGroup.classList.contains('hidden');
    }

    function createFilterChip(filter, container) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<span class="filter-chip-label">${filter.label}: </span><span class="filter-chip-value">${filter.value}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'filter-chip-remove';
        removeBtn.setAttribute('aria-label', 'Rimuovi filtro ' + filter.label);
        removeBtn.setAttribute('type', 'button');
        removeBtn.innerHTML = '<i class="bi bi-x"></i>';
        removeBtn.onclick = filter.remove;
        chip.appendChild(removeBtn);
        container.appendChild(chip);
    }

    function updateActiveFiltersChips(store, handleFilterChange) {
        const root = store.getState('root');
        const container = root.querySelector('#activeFiltersContainer');
        if (!container) return;
        container.innerHTML = '';

        const activeFilters = [];
        const searchValue = root.querySelector('#filterSearch')?.value.trim() || '';
        if (searchValue) {
            activeFilters.push({ label: 'Ricerca', value: searchValue, remove: () => { root.querySelector('#filterSearch').value = ''; handleFilterChange(store); } });
        }

        const typeValue = root.querySelector('#filterType')?.value || '';
        if (typeValue) {
            activeFilters.push({ label: 'Tipologia', value: typeValue === 'FERIE' ? 'Ferie' : 'Permessi', remove: () => { root.querySelector('#filterType').value = ''; handleFilterChange(store); } });
        }

        const statoValue = root.querySelector('#filterStato')?.value || '';
        if (statoValue) {
            activeFilters.push({ label: 'Stato', value: statoValue, remove: () => { root.querySelector('#filterStato').value = ''; handleFilterChange(store); } });
        }

        if (isFilterGroupVisible('#filterReparto', root)) {
            const repartoValue = root.querySelector('#filterReparto')?.value || '';
            if (repartoValue) {
                activeFilters.push({ label: 'Reparto', value: repartoValue, remove: () => { root.querySelector('#filterReparto').value = ''; handleFilterChange(store); } });
            }
        }

        if (isFilterGroupVisible('#filterMansione', root)) {
            const mansioneValue = root.querySelector('#filterMansione')?.value || '';
            if (mansioneValue) {
                activeFilters.push({ label: 'Mansione', value: mansioneValue, remove: () => { root.querySelector('#filterMansione').value = ''; handleFilterChange(store); } });
            }
        }

        const selectedPeriod = store.getState('selectedPeriod');
        if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
            activeFilters.push({
                label: 'Periodo',
                value: `${formatDateForDisplay(selectedPeriod.startDate)} al ${formatDateForDisplay(selectedPeriod.endDate)}`,
                remove: () => {
                    const clearPeriodSelection = store.getState('clearPeriodSelection');
                    if (clearPeriodSelection) clearPeriodSelection(store);
                    handleFilterChange(store);
                }
            });
        }

        const sortValue = root.querySelector('#filterSort')?.value || 'data-recente';
        if (sortValue !== 'data-recente') {
            activeFilters.push({
                label: 'Ordinamento',
                value: sortValue === 'urgenza-decrescente' ? 'Richiesta meno recente' : sortValue,
                remove: () => { root.querySelector('#filterSort').value = 'data-recente'; handleFilterChange(store); }
            });
        }

        activeFilters.forEach(filter => createFilterChip(filter, container));
    }

    async function loadDayData(store, selectedDate) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const normalizedDate = new Date(selectedDate);
                normalizedDate.setHours(0, 0, 0, 0);
                const allData = store.getState('allCalendarData') || [];
                const dayRequests = allData.filter(request => {
                    if (request.data_numerica) {
                        const requestDate = new Date(request.data_numerica);
                        requestDate.setHours(0, 0, 0, 0);
                        if (requestDate.getTime() === normalizedDate.getTime()) return true;
                    }
                    if (request.moorea_obj && request.moorea_obj.leaves && Array.isArray(request.moorea_obj.leaves)) {
                        for (const leave of request.moorea_obj.leaves) {
                            const leaveStartDate = leave.dataInizio ? new Date(leave.dataInizio + 'T00:00:00') : null;
                            const leaveEndDate = leave.dataFine ? new Date(leave.dataFine + 'T00:00:00') : null;
                            if (leaveStartDate && !isNaN(leaveStartDate.getTime())) {
                                leaveStartDate.setHours(0, 0, 0, 0);
                                if (leaveStartDate.getTime() === normalizedDate.getTime()) return true;
                            }
                            if (leaveStartDate && leaveEndDate && !isNaN(leaveStartDate.getTime()) && !isNaN(leaveEndDate.getTime())) {
                                leaveStartDate.setHours(0, 0, 0, 0);
                                leaveEndDate.setHours(23, 59, 59, 999);
                                if (normalizedDate >= leaveStartDate && normalizedDate <= leaveEndDate) return true;
                            }
                        }
                    }
                    return false;
                });
                resolve(dayRequests);
            }, 2000);
        });
    }

    async function loadAndDisplayDayData(store, selectedDate) {
        const selectedPeriod = store.getState('selectedPeriod');
        if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) return;

        setFiltersEnabled(store, false);
        showListSpinner(store);

        try {
            const dayRequests = await loadDayData(store, selectedDate);
            const currentSelectedPeriod = store.getState('selectedPeriod');
            if (currentSelectedPeriod && currentSelectedPeriod.startDate && currentSelectedPeriod.endDate) return;

            store.setState('allRequestsData', [...dayRequests]);
            store.setState('filteredRequestsData', [...dayRequests]);

            const filterOptionsData = store.getState('filterOptionsData');
            if (!filterOptionsData || filterOptionsData.length === 0) {
                store.setState('filterOptionsData', [...dayRequests]);
                updateFilterOptions(store, dayRequests);
            }

            setFiltersEnabled(store, dayRequests && dayRequests.length > 0);
            renderList(store, store.getState('filteredRequestsData'));
            updateActiveFiltersChips(store, handleFilterChange);
            updateResetButtonState(store);
        } catch (error) {
            console.error('Errore nel caricamento dati del giorno:', error);
            setFiltersEnabled(store, false);
            const root = store.getState('root');
            const approvalList = root.querySelector('#approvalList');
            if (approvalList) {
                approvalList.innerHTML = '';
                showMessage(store, 'Errore nel caricamento dei dati. Riprova.', 'text-center py-4 text-danger', { fontSize: '0.917rem', padding: '52.8px' });
            }
        } finally {
            hideListSpinner(store);
        }
    }

    async function handleFilterChange(store) {
        const root = store.getState('root');
        if (!root) return;

        const selectedPeriod = store.getState('selectedPeriod');
        if (!selectedPeriod || !selectedPeriod.startDate || !selectedPeriod.endDate) {
            setFiltersEnabled(store, false);
            showPeriodSelectionMessage(store);
            updateActiveFiltersChips(store, handleFilterChange);
            updateResetButtonState(store);
            return;
        }

        setFiltersEnabled(store, false);
        showListSpinner(store);

        try {
            const params = buildApiParams(store);
            const apiData = await api.getLeavesData(params);
            store.setState('allRequestsData', [...apiData]);
            store.setState('filteredRequestsData', [...apiData]);

            const archiveData = apiData.filter(req =>
                req.stato === 'Approvato' || req.stato === 'Rifiutato' || req.status === 1 || req.status === 2
            );
            store.setState('allCalendarData', [...archiveData]);

            const loadCalendarData = store.getState('loadCalendarData');
            if (loadCalendarData) {
                loadCalendarData(store, archiveData);
            }

            renderList(store, store.getState('filteredRequestsData'));
            updateActiveFiltersChips(store, handleFilterChange);
            updateResetButtonState(store);
            setFiltersEnabled(store, true);
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
            setFiltersEnabled(store, false);
            const approvalList = root.querySelector('#approvalList');
            if (approvalList) {
                approvalList.innerHTML = '';
                const errorMessage = document.createElement('div');
                errorMessage.className = 'text-center py-4 text-danger';
                errorMessage.style.padding = '52.8px';
                errorMessage.textContent = `Errore nel caricamento: ${error.message}`;
                approvalList.appendChild(errorMessage);
            }
        } finally {
            hideListSpinner(store);
        }
    }

    function handleSearchChange(store) {
        const debounceTimer = store.getState('searchDebounceTimer');
        if (debounceTimer) clearTimeout(debounceTimer);
        const newTimer = setTimeout(function () { handleFilterChange(store); }, 2000);
        store.setState('searchDebounceTimer', newTimer);
    }

    async function clearAllFilters(store, configEndpoint) {
        const root = store.getState('root');
        const searchInput = root.querySelector('#filterSearch');
        if (searchInput) searchInput.value = '';
        const typeSelect = root.querySelector('#filterType');
        if (typeSelect) typeSelect.value = '';
        const statoSelect = root.querySelector('#filterStato');
        if (statoSelect) statoSelect.value = '';
        buildStatusFilter(store);
        const repartoSelect = root.querySelector('#filterReparto');
        if (repartoSelect) repartoSelect.value = '';
        const mansioneSelect = root.querySelector('#filterMansione');
        if (mansioneSelect) mansioneSelect.value = '';

        const sortSelect = root.querySelector('#filterSort');
        if (sortSelect) sortSelect.value = 'data-recente';

        const filterConfigData = store.getState('filterConfigData');
        if (filterConfigData && typeof filterConfigData === 'object') {
            buildFiltersFromConfig(store, filterConfigData);
        } else {
            const filterOptionsData = store.getState('filterOptionsData');
            if (filterOptionsData && filterOptionsData.length > 0) {
                updateFilterOptions(store, filterOptionsData);
                buildStatusFilter(store);
            }
        }

        const applyTodaySelection = store.getState('applyTodaySelection');
        if (applyTodaySelection) {
            await applyTodaySelection(store);
        } else {
            handleFilterChange(store);
        }
    }

    function setupFilterListeners(store, configEndpoint) {
        const root = store.getState('root');
        if (!root) return;

        const listeners = [
            { id: '#filterSearch', event: 'oninput', handler: () => handleSearchChange(store) },
            { id: '#filterType', event: 'onchange', handler: () => handleFilterChange(store) },
            { id: '#filterStato', event: 'onchange', handler: () => handleFilterChange(store) },
            { id: '#filterReparto', event: 'onchange', handler: () => handleFilterChange(store) },
            { id: '#filterMansione', event: 'onchange', handler: () => handleFilterChange(store) },
            { id: '#filterSort', event: 'onchange', handler: () => handleFilterChange(store) },
            { id: '#filterReset', event: 'onclick', handler: () => clearAllFilters(store, configEndpoint) }
        ];

        listeners.forEach(({ id, event, handler }) => {
            const el = root.querySelector(id);
            if (el) el[event] = handler;
        });
    }

    const root = store.getState('root');
    if (!root) {
        console.error('initFilters: root è obbligatorio');
        return;
    }

    if (!verifyFilterBarStructure(store)) {
        console.error('Struttura filter bar non trovata nel DOM');
        return;
    }

    store.setState('handleFilterChange', handleFilterChange);
    store.setState('setFiltersEnabled', setFiltersEnabled);
    store.setState('fetchLeaveAdminScreenConfig', function () { return api.getFilterConfig(configEndpoint); });
    store.setState('buildFiltersFromConfig', buildFiltersFromConfig);
    store.setState('buildStatusFilter', buildStatusFilter);
    store.setState('loadAndDisplayDayData', loadAndDisplayDayData);
    store.setState('renderList', renderList);

    buildStatusFilter(store);
    setupFilterListeners(store, configEndpoint);
    setFiltersEnabled(store, false);

    function applyFilterOptions(store) {
        const allRequestsData = store.getState('allRequestsData');
        if (allRequestsData && allRequestsData.length > 0) {
            updateFilterOptions(store, allRequestsData);
            buildStatusFilter(store);
        }
    }

    api.getFilterConfig(configEndpoint)
        .then(function (configData) {
            if (configData && typeof configData === 'object') {
                store.setState('filterConfigData', configData);
                buildFiltersFromConfig(store, configData);
            } else {
                applyFilterOptions(store);
            }
        })
        .catch(function (error) {
            applyFilterOptions(store);
        })
        .finally(function () {
            const selectedPeriod = store.getState('selectedPeriod');
            if (!selectedPeriod || !selectedPeriod.startDate) {
                setFiltersEnabled(store, false);
                showPeriodSelectionMessage(store);
                return;
            }
            try {
                handleFilterChange(store);
            } catch (err) {
                showEmptyStateMessage(store);
            }
        });
}
