'use strict';

// ============================================================================
// CONFIG - Configurazione tecnica del server
// ============================================================================

/**
 * Configurazione tecnica globale del server.
 * Contiene solo i parametri tecnici di connessione che valgono per l'intero progetto.
 */

export const SERVER_CONFIG = {
	// URL base del server API
	baseUrl: 'https://my-genius.it/wp-json/genius/v1',

	// Token di autenticazione Bearer
	bearerToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Njg5MDc0MjMsImV4cCI6MTc3MDYzNTQyMywidWlkIjoyNjg1LCJ1c2VybmFtZSI6IkdOR01aTzA0RTEzWjM1NEUifQ.3AV7DDRUf1AgRJyPh_cvDd3u9_Gf7-YOSEX-KfUIAEg',

	// Timeout per le richieste HTTP (in millisecondi)
	timeout: 30000
};
