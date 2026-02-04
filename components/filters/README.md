# 📁 Modulo Filters

Il modulo **Filters** gestisce la barra dei filtri per la ricerca e l'ordinamento delle richieste (ferie, permessi, ecc.). È progettato per essere isolato e configurabile.

## Obiettivo del modulo

`Filters`:

- Costruisce i parametri di ricerca (nome, tipologia, reparto, mansione, stato, periodo, ordinamento).
- Chiama l'API per recuperare le richieste (`api.getLeavesData`).
- Aggiorna lo `store` con i risultati (`allRequestsData`, `filteredRequestsData`).
- Renderizza la lista nel DOM (`#approvalList`) e gestisce lo stato UI (spinner, empty state, disabilitazione filtri).
- Espone alcune funzioni “di integrazione” salvandole nello `store` (es. `handleFilterChange`, `loadAndDisplayDayData`).

Nota importante: il modulo **dipende dal periodo selezionato** nello `store` (`selectedPeriod`). Se non è presente un periodo valido, i filtri vengono disabilitati e viene mostrato un messaggio che invita a selezionare un periodo dal calendario.

## 🚀 Importazione

### Uso con `<script>` (attuale)

Il file `components/filters/filters.js` definisce la funzione globale `initFilters(mainConfig)`.

Ordine minimo consigliato:

```html
<script src="js/api.js"></script>
<script src="js/store.js"></script>
<script src="components/filters/filters.js"></script>
```

Se stai usando anche il calendario, carica anche `components/calendars/calendars.js`.

### Uso con bundler (Vite/Webpack/Rollup)

Il file non esporta ESM/CommonJS. Se vuoi importarlo in un progetto bundlato hai due opzioni:

- Includerlo comunque come asset “global” (es. `index.html`).
- Wrappare manualmente il file per esportare `initFilters` (richiede modifiche al codice sorgente).

## ⚙️ Inizializzazione

### Quick start (integrazione con lo store del widget)

Esempio completo coerente con `dev.html`:

```js
const store = initLeavesArchive(containerElement);

// (opzionale ma consigliato) init Calendars prima, così esiste clearPeriodSelection ecc.
const calendars = initCalendars({ store, root: store.getState('root') });
calendars.init(store);
store.setState('calendars', calendars);

initFilters({
  store,
  api: store.getState('api'),
  settings: {
    endpoint: '/leave_admin_screen_config',
    type: 'ferie_permessi'
  }
});
```

### Firma

`initFilters(mainConfig)`

Non ritorna un valore: inizializza listener e UI e salva funzioni/handler nello `store`.

## 🧱 Oggetto di configurazione (`mainConfig`)

### Struttura

```ts
type FiltersConfig = {
  store: {
    getState: (key: string) => any;
    setState: (key: string, value: any) => void;
  };
  api: {
    getFilterConfig: (endpoint?: string) => Promise<any>;
    getLeavesData: (params: Record<string, any>, endpoint?: string) => Promise<any[]>;
  };
  settings?: {
    endpoint?: string;
    type?: 'ferie_permessi' | 'archivio' | 'assenze' | 'certificati' | 'malattie';
  };
}
```

### Campi obbligatori

- **`store`**
  - Deve contenere almeno `getState(key)` e `setState(key, value)`.
  - Deve avere `root` valorizzato (`store.setState('root', HTMLElement)`), perché il modulo fa query DOM dentro `root`.
- **`api`**
  - Deve esporre `getFilterConfig(endpoint)` e `getLeavesData(params)`.

### `settings` (opzionale)

Il modulo valida la configurazione e applica default:

- **`settings.endpoint`**
  - Default: `'/leave_admin_screen_config'`
  - Usato da `api.getFilterConfig(endpoint)` per popolare le opzioni (tipi/reparti/mansioni).
- **`settings.type`**
  - Default: `'ferie_permessi'`
  - Tipi supportati: `'ferie_permessi'`, `'archivio'`, `'assenze'`, `'certificati'`, `'malattie'`.

Differenze operative per `type`:

- `ferie_permessi`
  - Il filtro **stato** viene nascosto e non costruito (`buildStatusFilter: false`).
- Gli altri tipi usano la configurazione di default (incluso filtro stato).

## 🧩 Requisiti DOM (dentro `store.getState('root')`)

Il modulo verifica che esista `#filterBarContainer` e che contenga `.filter-bar-container`. Inoltre usa i seguenti elementi:

- `#filterSearch`
- `#filterType`
- `#filterStato`
- `#filterReparto`
- `#filterMansione`
- `#filterSort`
- `#filterReset`
- `#activeFiltersContainer`
- `#approvalList` (contenitore lista)

Se usi lo `store.template` fornito dal progetto (`js/store.js`), questi elementi sono già presenti.

## 🔁 Flusso di funzionamento

1. **Init**
   - Verifica `store`/`api`/`root` e struttura DOM.
   - Registra funzioni nello `store` (vedi sotto).
   - Aggancia listener ai controlli (`oninput`, `onchange`, `onclick`).
   - Scarica la configurazione filtri con `api.getFilterConfig(settings.endpoint)` e popola le select.

2. **Periodo non selezionato**
   - Se `store.getState('selectedPeriod')` è `null` o incompleto, i filtri vengono disabilitati e viene mostrato il messaggio:
     - “Seleziona un periodo dal calendario per visualizzare i giustificativi.”

3. **Cambio filtro / cambio periodo**
   - `handleFilterChange(store)`:
     - Costruisce `params` leggendo i controlli e `selectedPeriod`.
     - Chiama `api.getLeavesData(params)`.
     - Aggiorna `allRequestsData` e `filteredRequestsData`.
     - Deriva `allCalendarData` (solo approvati/rifiutati) e, se presente, chiama `store.getState('loadCalendarData')` (tipicamente fornita dal modulo Calendars).
     - Renderizza lista e chip filtri attivi.

4. **Click su un singolo giorno (solo se usi Calendars)**
   - `loadAndDisplayDayData(store, date)` carica (simulando) le richieste di quel giorno e aggiorna lista + opzioni.

## 🔌 Chiavi `store` usate / esposte

### Letto dallo store

- `root`
- `selectedPeriod`
- `allCalendarData`
- `allRequestsData`
- `clearPeriodSelection` (se presente, usato per rimuovere il chip “Periodo”)
- `loadCalendarData` (se presente, per sincronizzare il calendario)
- `approvalRow` (se presente, per renderizzare righe “ricche”)

### Scritto nello store (API di integrazione)

Durante `initFilters` vengono salvate queste funzioni:

- `handleFilterChange`
- `setFiltersEnabled`
- `fetchLeaveAdminScreenConfig` (wrapper che chiama `api.getFilterConfig(endpoint)`)
- `buildFiltersFromConfig`
- `buildStatusFilter`
- `loadAndDisplayDayData`
- `renderList`

Queste chiavi permettono al modulo Calendars (o ad altri moduli) di richiamare logiche di Filters senza import diretti.

## 🤝 Integrazione consigliata con Calendars

Per una UX completa (selezione periodo, preset, chip “Periodo” removibile, sincronizzazione calendario/lista):

- Inizializza anche Calendars e **chiama** `calendars.init(store)`.
- Salva l'istanza nel `store` con `store.setState('calendars', calendars)` se vuoi aprire il pannello calendario cliccando una riga (l'`approvalRow` usa `store.getState('calendars')`).

## 🧪 Troubleshooting

- **"initFilters: root è obbligatorio"**
  - Devi fare `store.setState('root', ...)` prima di chiamare `initFilters`.
- **"Struttura filter bar non trovata nel DOM"**
  - Dentro `root` deve esistere `#filterBarContainer` e deve contenere `.filter-bar-container`.
- **I filtri rimangono disabilitati**
  - Manca `selectedPeriod` oppure non ha `startDate`/`endDate`.
  - Se usi Calendars, verifica che `calendars.init(store)` sia stato eseguito (applica una selezione di default “oggi”).
- **Il calendario non si aggiorna quando filtrI la lista**
  - Il modulo Filters prova a chiamare `store.getState('loadCalendarData')`. Questa funzione viene impostata da Calendars durante `calendars.init(store)`.
- **Cliccando una riga non si apre il calendario**
  - L’`approvalRow` cerca `store.getState('calendars')`. Imposta `store.setState('calendars', calendars)` dopo l’inizializzazione.
