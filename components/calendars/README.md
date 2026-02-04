# 📅 Modulo Calendars

Il modulo **Calendars** gestisce la visualizzazione del calendario interattivo per la selezione dei periodi e la visualizzazione delle richieste sul calendario.

## 🚀 Importazione

Il file `components/calendars/calendars.js` definisce la funzione globale `initCalendars(config)`.

Ordine minimo consigliato:

```html
<script src="js/api.js"></script>
<script src="js/store.js"></script>
<script src="components/calendars/calendars.js"></script>
```

Se stai usando anche i filtri, carica anche `components/filters/filters.js`.

## ⚙️ Concetto chiave: `initCalendars` ritorna un'istanza

`initCalendars(config)` **non** inizializza automaticamente tutto: ritorna un oggetto con metodi.

Quasi sempre devi fare:

1. `const calendars = initCalendars({ store, ... })`
2. `calendars.init(store)`

## ⚙️ Inizializzazione (coerente con `dev.html`)

```js
const store = initLeavesArchive(containerElement);

const calendars = initCalendars({
  store,
  root: store.getState('root'),
  selectors: {
    container: '#calendarContainer'
  }
});

calendars.init(store);

// Consigliato: salva l'istanza nel tuo store per permettere ad altri componenti di usarla
store.setState('calendars', calendars);
```

### Metodi disponibili sull'istanza

L'oggetto ritornato espone:

- `init(store)`
- `open(store, requestData)`
- `close(store)`
- `loadCalendarData(store, data)`
- `renderCalendar(store, data?)`
- `clearPeriodSelection(store)`

## 🧱 Oggetto di configurazione (`config`)

### Struttura

```ts
type CalendarsConfig = {
  store: {
    getState: (key: string) => any;
    setState: (key: string, value: any) => void;
  };
  root?: HTMLElement;
  selectors?: Record<string, string>;
}
```

Note:

- `root` e `selectors` attualmente sono poco usati: il modulo recupera comunque `root` da `store.getState('root')`.

## 🧩 Requisiti DOM (dentro `store.getState('root')`)

Il modulo si aspetta che nel template siano presenti:

- `#detail-panel` (pannello laterale)
- `#btnClosePanel` (bottone chiusura)
- `#listSection` (sezione lista, per layout “panel-open”)
- `#calendarContainer` (contenitore mesi)
- `#calendarYearInput` + `#yearPicker` + `.calendar-year-input-wrapper` (year picker)
- `.preset-btn` dentro uno o più contenitori `.periodo-presets-container`

Se usi il template di progetto (`js/store.js`), questi elementi sono già presenti.

## � Flusso di funzionamento

### 1) `calendars.init(store)`

- Registra nello `store` varie funzioni usate da altri moduli:
  - `clearPeriodSelection`
  - `loadCalendarData`
  - `openDetailPanel`
  - `applyTodaySelection`
- Inizializza il pannello (close button e preset buttons).
- Inizializza il year picker.
- Esegue un rendering iniziale.
- Applica una selezione di default: **oggi** (`applyDefaultTodaySelection`).

### 2) Selezione periodo

Click su un giorno nel calendario:

- **1° click**: imposta inizio periodo (`selectedPeriod.startDate`) e mette `selectedPeriodEnd` a `null`.
- **2° click**: imposta fine periodo e chiama `applyPeriodFilter(store, start, end)`.
- **3° click**: reset e riparte con un nuovo inizio.

Per periodi che attraversano due anni, il calendario mostra **due anni**:

- `displayedCalendarYear`
- `displayedCalendarYearEnd`

### 3) Preset periodo

I bottoni `.preset-btn` usano `data-preset` con valori:

- `last-month`
- `last-six-month`
- `last-year`
- `next-week`
- `next-15-days`
- `next-month`

Il preset calcola `startDate`/`endDate`, aggiorna gli anni visualizzati e chiama `applyPeriodFilter`.

### 4) Integrazione con Filters

Il modulo Calendars **non chiama direttamente** l'API: aggiorna il periodo nello `store` e poi prova a chiamare `store.getState('handleFilterChange')` (se esiste), che è esposto da `Filters`.

In pratica:

- Calendars imposta `selectedPeriod`.
- Filters (quando `handleFilterChange` viene invocato) chiama `api.getLeavesData` usando quel periodo.

## 🔌 Chiavi `store` usate / esposte

### Letto dallo store

- `root`
- `allCalendarData`
- `allRequestsData`
- `filteredRequestsData`
- `selectedPeriod`, `selectedPeriodStart`, `selectedPeriodEnd`
- `handleFilterChange` (se presente)
- `loadAndDisplayDayData` (se presente: usato per click singolo giorno)

### Scritto nello store

- `detailPanelElement`
- `listSectionElement`
- `clearPeriodSelection`
- `loadCalendarData`
- `openDetailPanel`
- `applyTodaySelection`
- `selectedPeriod`, `selectedPeriodStart`, `selectedPeriodEnd`
- `displayedCalendarYear`, `displayedCalendarYearEnd`
- `yearPickerWindowStart`
- `calendarScrollInitialized`, `defaultDateApplied`, `periodJustReset`

## 🧪 Troubleshooting

- **Il calendario non si vede / `calendarContainer` non trovato**
  - Verifica che nel `root` esista `#calendarContainer`.
- **I filtri rimangono disabilitati**
  - Filters richiede `selectedPeriod` con `startDate` e `endDate`. `calendars.init(store)` applica di default “oggi”; se non lo stai chiamando, il periodo rimane `null`.
- **I preset non fanno nulla**
  - Assicurati che i bottoni abbiano classe `.preset-btn` e attributo `data-preset` tra quelli supportati.
- **Il year picker non si apre**
  - Devono esistere `#calendarYearInput` e `#yearPicker` nel DOM del `root`.
- **Il cambio periodo non aggiorna la lista**
  - Calendars chiama `store.getState('handleFilterChange')` *solo se presente*. Quindi:
    - chiama `initFilters(...)` oppure
    - imposta manualmente nello store una tua funzione `handleFilterChange`.
