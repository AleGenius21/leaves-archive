# ✅ Modulo Approval Row

Il modulo **Approval Row** gestisce la creazione e la formattazione delle righe della lista richieste (ferie/permessi), incluse:

- Avatar dipendente
- Badge reparto e mansione (con colori e contrasto automatico)
- Tipo richiesta (Ferie/Permessi)
- Quantità (giorni/ore) e formattazione data/orario
- Icona stato (approvato/rifiutato)
- Click sulla riga (apertura dettaglio tramite modulo Calendars se presente)

## 🚀 Importazione

Il file `components/approval-row/approval-row.js` definisce la funzione globale `initApprovalRow(config)`.

Ordine minimo consigliato:

```html
<script src="js/store.js"></script>
<script src="components/approval-row/approval-row.js"></script>
```

Per lo stile, includi anche il CSS:

```html
<link rel="stylesheet" href="components/approval-row/approval-row.css" />
```

## ⚙️ Concetto chiave: `initApprovalRow` ritorna un'istanza

`initApprovalRow(config)` **non** modifica automaticamente lo store: ritorna un oggetto con funzioni.

Quasi sempre devi fare:

1. `const approvalRow = initApprovalRow({ store })`
2. `store.setState('approvalRow', approvalRow)` (così altri moduli possono usarlo)

## ⚙️ Inizializzazione (coerente con `dev.html`)

```js
const store = initLeavesArchive(containerElement);

const approvalRow = initApprovalRow({
  store
});

store.setState('approvalRow', approvalRow);
```

## 🧱 Oggetto di configurazione (`config`)

### Struttura

```ts
type ApprovalRowConfig = {
  store: {
    getState: (key: string) => any;
    setState: (key: string, value: any) => void;
  };
}
```

### Campi obbligatori

- **`store`**
  - Deve contenere almeno `getState(key)` e `setState(key, value)`.
  - Deve avere `root` valorizzato (`store.setState('root', HTMLElement)`), perché alcune logiche (es. parsing colori) usano il DOM del `root`.

## 🧩 Requisiti DOM

Il modulo crea nodi DOM in modo programmatico e non richiede markup pre-esistente specifico, ma:

- Si aspetta che `store.getState('root')` sia un `HTMLElement` valido.
- Le classi CSS usate (es. `.approval-row`, `.employee-avatar`, `.badge-reparto`, ecc.) sono definite in `components/approval-row/approval-row.css`.

## 🧩 API pubblica (istanza ritornata)

L'oggetto ritornato da `initApprovalRow(config)` espone:

- `createApprovalRow(requestData, store)`
- Utility:
  - `formatDateDDMMYY(dateString)`
  - `formatDayDDMMYY(dateString)`
  - `formatTimeToHHMM(timeString)`
  - `formatDateItalian(dateString)`
  - `normalizeQuantity(value, unit)`
  - `extractQuantityFromMoorea(data)`
  - `extractDateInfoFromMoorea(data)`
  - `parseColorToRgb(color, root)`
  - `getRelativeLuminance(color, root)`
  - `applyDepartmentBadgeStyle(badgeElement, departmentColor, root)`
  - `applyTaskBadgeStyle(badgeElement, taskColor, root)`

### `createApprovalRow(requestData, store)`

Crea e ritorna un `HTMLElement` (la riga) pronto per essere appeso in lista.

Nota: la funzione riceve anche `store` come secondo parametro per compatibilità con l'uso attuale (es. in `Filters`).

## 🔌 Integrazione con Filters

Il modulo Filters, durante il rendering lista, fa tipicamente:

- `const approvalRow = store.getState('approvalRow')`
- `list.appendChild(approvalRow.createApprovalRow(requestData, store))`

Quindi è importante che tu faccia `store.setState('approvalRow', approvalRow)` dopo l'inizializzazione.

## 🤝 Integrazione con Calendars (click sulla riga)

Il click sulla riga prova a recuperare:

- `const calendars = store.getState('calendars')`

Se presente e con metodo `open(store, data)`, viene chiamato per aprire il dettaglio.

Per abilitare questa funzionalità:

```js
const calendars = initCalendars({ store, root: store.getState('root') });
calendars.init(store);
store.setState('calendars', calendars);
```

## 🧪 Troubleshooting

- **La lista mostra righe “semplici” (fallback JSON) e non quelle complete**
  - Filters non trova `store.getState('approvalRow')` oppure manca `createApprovalRow`.
  - Verifica di aver fatto `store.setState('approvalRow', initApprovalRow({ store }))`.

- **Badge reparto/mansione senza colori o con colori errati**
  - Verifica che `requestData.department_color` / `requestData.task_color` siano valorizzati.
  - Verifica che `store.getState('root')` sia un elemento valido (necessario per la risoluzione di alcuni colori).
