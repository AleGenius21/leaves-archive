'use strict';

// ============================================================================
// UTILS - Funzioni di utilità condivise
// ============================================================================

/**
 * Formatta una data stringa (YYYY-MM-DD) in DD/MM/YY
 */
export function formatDateDDMMYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

/**
 * Formatta una data in YYYY-MM-DD
 */
export function formatDateISO(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formatta una data in DD/MM/YYYY
 */
export function formatDateDDMMYYYY(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Formatta una data stringa in "Lun 10 Gen"
 */
export function formatDateItalian(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;

    const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    return `${giorniSettimana[date.getDay()]} ${date.getDate()} ${mesi[date.getMonth()]}`;
}

/**
 * Formatta una data stringa in "Lun 10/01/22" (con giorno settimana)
 */
export function formatDayDDMMYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;

    const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const giornoSettimana = giorniSettimana[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `<span class="day-name">${giornoSettimana}</span> ${day}/${month}/${year}`;
}

/**
 * Formatta un orario (es. "14:30:00") in HH:MM
 */
export function formatTimeToHHMM(timeString) {
    if (!timeString || typeof timeString !== 'string') return timeString || '';
    return timeString.length >= 5 ? timeString.substring(0, 5) : timeString;
}

/**
 * Normalizza quantità (es. 4.0 -> 4, 4.5 -> 4.5)
 */
export function normalizeQuantity(value, unit) {
    if (typeof value !== 'number' || isNaN(value)) {
        return value;
    }
    if (unit === 'hours') {
        const remainder = value % 1;
        if (remainder === 0 || remainder === 0.5) {
            return value;
        }
        if (remainder < 0.25) {
            return Math.floor(value);
        } else if (remainder < 0.75) {
            return Math.floor(value) + 0.5;
        } else {
            return Math.ceil(value);
        }
    } else if (unit === 'days') {
        return Math.round(value);
    }
    return value;
}

// --- Color Utilities ---

/**
 * Converte un colore (hex, rgb, hsl, name) in oggetto {r, g, b}
 */
export function parseColorToRgb(color, rootSource) {
    if (!color || typeof color !== 'string') return null;
    const trimmedColor = color.trim();

    if (trimmedColor.startsWith('#')) {
        const hex = trimmedColor.slice(1);
        if (hex.length === 6) {
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        }
    }

    const rgbMatch = trimmedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10)
        };
    }

    const hslMatch = trimmedColor.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/i);
    if (hslMatch) {
        const h = parseInt(hslMatch[1], 10) / 360;
        const s = parseInt(hslMatch[2], 10) / 100;
        const l = parseInt(hslMatch[3], 10) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;
        if (h < 1 / 6) {
            r = c; g = x; b = 0;
        } else if (h < 2 / 6) {
            r = x; g = c; b = 0;
        } else if (h < 3 / 6) {
            r = 0; g = c; b = x;
        } else if (h < 4 / 6) {
            r = 0; g = x; b = c;
        } else if (h < 5 / 6) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    const colorNames = {
        'black': { r: 0, g: 0, b: 0 },
        'white': { r: 255, g: 255, b: 255 },
        'red': { r: 255, g: 0, b: 0 },
        'green': { r: 0, g: 128, b: 0 },
        'blue': { r: 0, g: 0, b: 255 },
        'yellow': { r: 255, g: 255, b: 0 },
        'cyan': { r: 0, g: 255, b: 255 },
        'magenta': { r: 255, g: 0, b: 255 },
        'orange': { r: 255, g: 165, b: 0 },
        'firebrick': { r: 178, g: 34, b: 34 }
    };

    const lowerColor = trimmedColor.toLowerCase();
    if (colorNames[lowerColor]) {
        return colorNames[lowerColor];
    }

    // Fallback: use DOM (expensive, use sparingly)
    try {
        const tempEl = document.createElement('div');
        tempEl.style.cssText = 'position:absolute;left:-9999px;';
        tempEl.style.color = trimmedColor;
        // If a root element is provided, append there (for ShadowDOM etc), otherwise body
        const appendTarget = (rootSource && rootSource.appendChild) ? rootSource : document.body;
        appendTarget.appendChild(tempEl);
        const computedColor = window.getComputedStyle(tempEl).color;
        appendTarget.removeChild(tempEl);

        const rgbComputed = computedColor.match(/\d+/g);
        if (rgbComputed && rgbComputed.length >= 3) {
            return {
                r: parseInt(rgbComputed[0], 10),
                g: parseInt(rgbComputed[1], 10),
                b: parseInt(rgbComputed[2], 10)
            };
        }
    } catch (e) {
        // Ignore
    }

    return null;
}

/**
 * Calcola la luminanza relativa per determinare il contrasto (testo bianco o nero)
 */
export function getRelativeLuminance(color, rootSource) {
    const rgb = parseColorToRgb(color, rootSource);
    if (!rgb) return 0.5;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const linearize = (val) => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };

    const rLinear = linearize(r);
    const gLinear = linearize(g);
    const bLinear = linearize(b);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Ritorna colore testo ('#000000' o '#ffffff') basato sul colore di sfondo
 */
export function getTextColorForBackground(bgColor, rootSource) {
    const luminance = getRelativeLuminance(bgColor, rootSource);
    return luminance > 0.45 ? '#000000' : '#ffffff';
}

