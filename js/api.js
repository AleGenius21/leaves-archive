'use strict';

// ============================================================================
// API - Chiamate centralizzate
// ============================================================================
import { SERVER_CONFIG } from './config.js';

const BASE_URL = SERVER_CONFIG.baseUrl;
const TIMEOUT = SERVER_CONFIG.timeout;
const BEARER_TOKEN = SERVER_CONFIG.bearerToken;


export function getFilterConfig(endpoint) {
    const urlEndpoint = endpoint || '/leave_admin_screen_config';
    const url = BASE_URL + urlEndpoint;
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + BEARER_TOKEN
        }
    }).then(function (response) {
        if (!response.ok) {
            throw new Error('Errore HTTP: ' + response.status + ' ' + response.statusText);
        }
        return response.json();
    }).then(function (result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Risposta API non valida: formato non riconosciuto');
        }
        return result;
    }).catch(function (error) {
        console.error('[API] Errore getFilterConfig:', error);
        throw error;
    });
}

export function getLeavesData(params, endpoint) {

    const queryParams = new URLSearchParams();
    if (Array.isArray(params.status)) {
        queryParams.append('status', params.status.join(','));
    } else if (params.status !== undefined) {
        queryParams.append('status', params.status.toString());
    }
    if (params.nome) queryParams.append('nome', params.nome);
    if (params.type_id !== undefined) queryParams.append('type_id', params.type_id.toString());
    if (params.department_id !== undefined) queryParams.append('department_id', params.department_id.toString());
    if (params.task_id !== undefined) queryParams.append('task_id', params.task_id.toString());
    if (params.cantiere_id !== undefined) queryParams.append('cantiere_id', params.cantiere_id.toString());
    if (params.post_festivo !== undefined) queryParams.append('post_festivo', params.post_festivo.toString());
    if (params.data_inizio) queryParams.append('data_inizio', params.data_inizio);
    if (params.data_fine) queryParams.append('data_fine', params.data_fine);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const urlEndpoint = endpoint || '/get_leaves';
    const url = BASE_URL + urlEndpoint + '?' + queryParams.toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, TIMEOUT);

    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + BEARER_TOKEN
        },
        signal: controller.signal
    }).then(function (response) {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error('Errore API: ' + response.status + ' ' + response.statusText);
        }
        return response.json();
    }).then(function (result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Formato risposta API non riconosciuto');
        }
        if (result.items && Array.isArray(result.items)) {
            return result.items;
        }
        if (result.success !== undefined && result.data) {
            return Array.isArray(result.data) ? result.data : [];
        }
        if (Array.isArray(result)) {
            return result;
        }
        throw new Error('Formato risposta API non riconosciuto');
    }).catch(function (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Timeout: la richiesta ha impiegato troppo tempo');
        }
        throw error;
    });
}

