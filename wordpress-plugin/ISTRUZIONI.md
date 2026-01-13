# Istruzioni Integrazione WordPress

## Cosa serve

1. **leaves-archive.php** - File principale del plugin (va caricato sul server WordPress)
2. Tutti i file del progetto originale (css/, js/, components/)

---

## Installazione

### Step 1: Caricare il plugin

1. Accedi al server WordPress (FTP/cPanel)
2. Vai in `/wp-content/plugins/`
3. Crea cartella `leaves-archive`
4. Carica `leaves-archive.php` dentro questa cartella

### Step 2: Copiare i file assets

Dentro `/wp-content/plugins/leaves-archive/` crea la cartella `assets/` e copia:

```
assets/
├── css/
│   └── main.css
├── js/
│   └── main.js
└── components/
    ├── approval-row/
    │   ├── script.js
    │   └── style.css
    ├── filters/
    │   ├── filters.js
    │   ├── filters.css
    │   └── filters.html
    └── detail-panel/
        ├── detail-panel.js
        ├── detail-panel.css
        └── detail-panel.html
```

### Step 3: Modificare 2 file JS

**File 1**: `assets/components/filters/filters.js` (riga ~34)

Trova:
```javascript
const response = await fetch('components/filters/filters.html');
```

Sostituisci con:
```javascript
const response = await fetch(leavesArchive.componentsUrl + 'filters/filters.html');
```

**File 2**: `assets/components/detail-panel/detail-panel.js` (riga ~55)

Trova:
```javascript
fetch('components/detail-panel/detail-panel.html')
```

Sostituisci con:
```javascript
fetch(leavesArchive.componentsUrl + 'detail-panel/detail-panel.html')
```

### Step 4: Attivare plugin

1. WordPress Admin → Plugin
2. Trova "Leaves Archive" → Attiva

### Step 5: Usare lo shortcode

In qualsiasi pagina/post inserisci:
```
[leaves-archive]
```

---

## Struttura finale sul server

```
wp-content/plugins/leaves-archive/
├── leaves-archive.php
└── assets/
    ├── css/
    ├── js/
    └── components/
```

---

## Problemi comuni

- **Modulo non appare**: Verifica plugin attivo e shortcode corretto
- **Errori fetch**: Verifica che i file JS siano stati modificati (Step 3)
- **Conflitti CSS**: Se il modulo ha stili strani, contatta lo sviluppatore

