'use strict';

import { getFilterConfig, getLeavesData } from './api.js';

export function hrStore() {
    const api = { getFilterConfig, getLeavesData };
    const state = {
        api: api,
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
        defaultDateApplied: false,
        periodJustReset: false
    };

    return {
        getState: function (key) {
            return state[key];
        },
        getAllState: function () {
            return Object.assign({}, state);
        },
        setState: function (key, value) {
            state[key] = value;
        },
        setStateBatch: function (updates) {
            Object.keys(updates).forEach(key => {
                state[key] = updates[key];
            });
        },
        resetState: function () {
            Object.keys(state).forEach(function (key) {
                if (key === 'api') { return; }
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

    };
}
