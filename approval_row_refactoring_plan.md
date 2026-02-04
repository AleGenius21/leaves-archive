# Prompt Refactoring: Modulo Approval Row

Agisci come esperto di architettura software. Il tuo compito è isolare il modulo `approval-row` (attualmente in `js/main.js` e `components/approval-row/`) trasformandolo in un modulo indipendente.

## Obiettivo
Rendere il modulo `approval-row` completamente indipendente, portabile e configurabile tramite Dependency Injection.

## Direttive Tecniche
1.  **Entry Point**: Implementa una funzione `initApprovalRow(config)` come unico punto di attivazione.
2.  **Configurazione**: L'oggetto `config` deve fornire le dipendenze necessarie, principalmente lo `store` (o metodi equivalenti per accedere allo stato e alla root) ed eventuali utility condivise.
3.  **Zero Logica Esterna**: Il modulo non deve dipendere da variabili globali.
4.  **Nessun Cambiamento Funzionale**: La logica di generazione delle righe, formattazione date/ore e gestione click deve rimanere identica.

## Piano di Implementazione

### 1. Nuova Struttura File
-   Crea: `components/approval-row/approval-row.js`
-   Maniene: `components/approval-row/approval-row.css` (nessuna modifica necessaria se non verifica dei percorsi).

### 2. Implementazione `approval-row.js`
Sposta tutto il codice del modulo `approvalRow` (l'IIFE presente in `js/main.js` circa dalla riga 93 alla 671) dentro il nuovo file.

Trasforma l'IIFE in una funzione di inizializzazione:

```javascript
/* components/approval-row/approval-row.js */
const initApprovalRow = (config) => {
    // Estrai le dipendenze da config
    const { store } = config; 

    // --- Incolla qui le funzioni interne (formatDateDDMMYY, ..., createApprovalRow) ---

    // Adatta createApprovalRow se necessario per usare lo store iniettato
    // Nota: createApprovalRow attualmente prende (data, store) come argomenti. 
    // Puoi mantenere questa firma o currying, ma assicurati che le dipendenze interne 
    // (come parseColorToRgb che usa root) funzionino correttamente.
    
    // Esempio wrapper se necessario, altrimenti ritorna l'oggetto con le funzioni esposte
    return {
        createApprovalRow: createApprovalRow,
        formatDateItalian: formatDateItalian,
        // ... altre utility esposte ...
    };
};
```

### 3. Refactoring `js/main.js`
-   Rimuovi l'intero blocco `approvalRow` da `main.js`.
-   Assicurati di caricare `components/approval-row/approval-row.js` (tag script in HTML).
-   Inizializza il modulo subito dopo la creazione dello `store` o all'inizio di `initLeavesArchive`:

```javascript
// In initLeavesArchive, dopo aver inizializzato lo store
const approvalRow = initApprovalRow({
    store: store
});

// Assicurati che il resto del codice in main.js che usava `approvalRow` continui a funzionare.
// Se `approvalRow` era usata globalmente nella closure di initLeavesArchive, l'assegnazione qui sopra risolve il problema.
```

### 4. Verifica
-   Le righe delle richieste (lista approvazioni) devono apparire correttamente.
-   Le icone stato, avatar e badge devono visualizzarsi come prima.
-   Il click sulla riga deve aprire il dettaglio (funzionalità che dipende da `store.getState('openDetailPanel')` richiamato dentro `createApprovalRow`).

## File Impattati
-   `js/main.js` (Rimozione codice)
-   `components/approval-row/approval-row.js` (Nuovo file)
