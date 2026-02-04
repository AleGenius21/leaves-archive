/* components/approval-row/approval-row.js */
const initApprovalRow = (config) => {
    // Estrai le dipendenze da config
    const { store } = config; 

    function formatDateDDMMYY(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    }

    function formatDayDDMMYY(dateString) {
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

    function formatTimeToHHMM(timeString) {
        if (!timeString || typeof timeString !== 'string') return timeString || '';
        return timeString.length >= 5 ? timeString.substring(0, 5) : timeString;
    }

    function formatDateItalian(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return dateString;
        
        const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        
        return `${giorniSettimana[date.getDay()]} ${date.getDate()} ${mesi[date.getMonth()]}`;
    }

    function normalizeQuantity(value, unit) {
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

    function extractQuantityFromMoorea(data) {
        if (data.moorea_obj && data.moorea_obj.meta) {
            const meta = data.moorea_obj.meta;
            const typeValue = data.type !== undefined ? data.type : (data.type_id !== undefined ? data.type_id : null);
            const isPermesso = typeValue === 2 || data.type_name === 'Permessi' || data.type_name === 'PERMESSO';

            if (isPermesso && typeof meta.hours === 'number') {
                const normalizedHours = normalizeQuantity(meta.hours, 'hours');
                return normalizedHours + 'h';
            } else if (!isPermesso && typeof meta.days === 'number') {
                const normalizedDays = normalizeQuantity(meta.days, 'days');
                return normalizedDays + 'g';
            }
        }
        if (typeof data.ore === 'number' && data.ore > 0) {
            const normalizedHours = normalizeQuantity(data.ore, 'hours');
            return normalizedHours + 'h';
        }
        return '';
    }

    function extractDateInfoFromMoorea(data) {
        const typeValue = data.type !== undefined ? data.type : (data.type_id !== undefined ? data.type_id : null);
        const isPermesso = typeValue === 2 || data.type_name === 'Permessi' || data.type_name === 'PERMESSO';

        if (data.dataInizio) {
            let dateText = '';
            let timeText = null;

            if (isPermesso) {
                dateText = formatDateItalian(data.dataInizio);
                const giornataIntera = data.giornataIntera === 1 || data.giornataIntera === true;

                if (!giornataIntera) {
                    if (data.oraInizio && data.oraFine) {
                        if (typeof data.oraInizio === 'string' && typeof data.oraFine === 'string') {
                            timeText = `${formatTimeToHHMM(data.oraInizio)} - ${formatTimeToHHMM(data.oraFine)}`;
                        } else if (typeof data.oraInizio === 'number' && typeof data.oraFine === 'number') {
                            const hoursInizio = Math.floor(data.oraInizio / 60);
                            const minsInizio = data.oraInizio % 60;
                            const hoursFine = Math.floor(data.oraFine / 60);
                            const minsFine = data.oraFine % 60;
                            const orarioInizio = String(hoursInizio).padStart(2, '0') + ':' + String(minsInizio).padStart(2, '0');
                            const orarioFine = String(hoursFine).padStart(2, '0') + ':' + String(minsFine).padStart(2, '0');
                            timeText = `${orarioInizio} - ${orarioFine}`;
                        }
                    }
                }
            } else {
                if (data.dataFine && data.dataFine !== data.dataInizio) {
                    dateText = 'Da ' + formatDateItalian(data.dataInizio) + ' a ' + formatDateItalian(data.dataFine);
                } else {
                    dateText = formatDateItalian(data.dataInizio);
                }
            }

            return { dateText, timeText };
        }

        if (data.moorea_obj && data.moorea_obj.leaves && Array.isArray(data.moorea_obj.leaves) && data.moorea_obj.leaves.length > 0) {
            const leaves = data.moorea_obj.leaves;
            const sortedLeaves = [...leaves].sort((a, b) => {
                const dateA = new Date(a.dataInizio || a.dataFine || '');
                const dateB = new Date(b.dataInizio || b.dataFine || '');
                return dateA - dateB;
            });

            const firstLeave = sortedLeaves[0];
            const lastLeave = sortedLeaves[sortedLeaves.length - 1];
            const firstDate = firstLeave.dataInizio || firstLeave.dataFine || '';
            const lastDate = lastLeave.dataFine || lastLeave.dataInizio || '';

            let dateText = '';
            let timeText = null;

            if (isPermesso) {
                dateText = formatDateItalian(firstDate);
                const giornataIntera = (firstLeave.interaGiornata === 1) || (data.giornataIntera === 1 || data.giornataIntera === true);

                if (!giornataIntera) {
                    const orarioInizio = firstLeave.orarioInizio || firstLeave.timeInizio || firstLeave.orario_inizio;
                    const orarioFine = firstLeave.orarioFine || firstLeave.timeFine || firstLeave.orario_fine;

                    if (orarioInizio && orarioFine) {
                        timeText = `${formatTimeToHHMM(orarioInizio)} - ${formatTimeToHHMM(orarioFine)}`;
                    }
                }
            } else {
                if (firstDate === lastDate || sortedLeaves.length === 1) {
                    dateText = formatDateItalian(firstDate);
                } else {
                    dateText = 'Da ' + formatDateItalian(firstDate) + ' a ' + formatDateItalian(lastDate);
                }
            }

            return { dateText, timeText };
        }

        let dateText = data.data || '';
        let timeText = null;

        if (isPermesso && data.orario_inizio && data.orario_fine) {
            timeText = `${formatTimeToHHMM(data.orario_inizio)} - ${formatTimeToHHMM(data.orario_fine)}`;
        }

        return { dateText, timeText };
    }

    function parseColorToRgb(color, root) {
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
            if (h < 1/6) {
                r = c; g = x; b = 0;
            } else if (h < 2/6) {
                r = x; g = c; b = 0;
            } else if (h < 3/6) {
                r = 0; g = c; b = x;
            } else if (h < 4/6) {
                r = 0; g = x; b = c;
            } else if (h < 5/6) {
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
        
        try {
            const tempEl = document.createElement('div');
            tempEl.style.cssText = 'position:absolute;left:-9999px;';
            tempEl.style.color = trimmedColor;
            const appendTarget = (typeof root !== 'undefined' && root && root.appendChild) ? root : null;
            if (!appendTarget) return null;
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
            // Ignora errori
        }
        
        return null;
    }

    function getRelativeLuminance(color, root) {
        const rgb = parseColorToRgb(color, root);
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
        
        const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
        
        return luminance;
    }

    function applyDepartmentBadgeStyle(badgeElement, departmentColor, root) {
        if (!badgeElement || !departmentColor) {
            return;
        }

        badgeElement.style.backgroundColor = departmentColor;
        const luminance = getRelativeLuminance(departmentColor, root);
        const textColor = luminance > 0.45 ? '#000000' : '#ffffff';
        badgeElement.style.color = textColor;
    }

    function applyTaskBadgeStyle(badgeElement, taskColor, root) {
        if (!badgeElement || !taskColor) {
            return;
        }
        
        badgeElement.style.backgroundColor = taskColor;
        const luminance = getRelativeLuminance(taskColor, root);
        const textColor = luminance > 0.45 ? '#000000' : '#ffffff';
        badgeElement.style.color = textColor;
    }

    function createApprovalRow(data, store) {
        const root = store.getState('root');
        const row = document.createElement('div');
        row.className = 'approval-row ms-1 me-3 mt-1';
        row.setAttribute('data-request-id', data.id || Math.random().toString(36).substr(2, 9));

        const employeeProfile = document.createElement('div');
        employeeProfile.className = 'employee-profile';

        const avatar = document.createElement('img');
        avatar.className = 'employee-avatar';

        function generateAvatarUrl(data) {
            if (data.profile_pic) return data.profile_pic;
            if (data.immagine) return data.immagine;

            let seed = data.id || 0;
            const nome = data.nominativo || data.nome || '';
            if (!seed && nome) {
                let hash = 0;
                for (let i = 0; i < nome.length; i++) {
                    hash = ((hash << 5) - hash) + nome.charCodeAt(i);
                    hash = hash & hash;
                }
                seed = Math.abs(hash % 70) + 1;
            }
            return `https://i.pravatar.cc/43?img=${seed || Math.floor(Math.random() * 70) + 1}`;
        }

        avatar.src = generateAvatarUrl(data);
        const nome = data.nominativo || data.nome || '';
        avatar.alt = nome;
        avatar.onerror = function () {
            this.src = `https://i.pravatar.cc/43?img=${Math.floor(Math.random() * 70) + 1}`;
        };

        const employeeInfo = document.createElement('div');
        employeeInfo.className = 'employee-info';

        const employeeName = document.createElement('p');
        employeeName.className = 'employee-name';
        employeeName.textContent = nome;

        const employeeBadges = document.createElement('div');
        employeeBadges.className = 'employee-badges';

        const taskName = data.task_name || data.mansione;
        if (taskName) {
            const badgeMansione = document.createElement('span');
            badgeMansione.className = 'badge-mansione';
            badgeMansione.textContent = taskName;
            if (data.task_color) {
                applyTaskBadgeStyle(badgeMansione, data.task_color, root);
            }
            employeeBadges.appendChild(badgeMansione);
        }

        const badgeReparto = document.createElement('span');
        badgeReparto.className = 'badge-reparto';
        const deptName = data.department_name || data.reparto;
        const deptId = data.department_id;
        const deptColor = data.department_color;

        if (!deptId || !deptName || !deptColor) {
            badgeReparto.textContent = 'Nessun reparto';
            badgeReparto.style.backgroundColor = '#E1E5E9';
            badgeReparto.style.color = '#666666';
        } else {
            badgeReparto.textContent = deptName;
            applyDepartmentBadgeStyle(badgeReparto, deptColor, root);
        }

        employeeBadges.appendChild(badgeReparto);
        employeeInfo.appendChild(employeeName);
        employeeInfo.appendChild(employeeBadges);
        employeeProfile.appendChild(avatar);
        employeeProfile.appendChild(employeeInfo);

        const requestDetails = document.createElement('div');
        requestDetails.className = 'request-details';

        const typeValue = data.type !== undefined ? data.type : (data.type_id !== undefined ? data.type_id : null);

        const typeWrapper = document.createElement('div');
        typeWrapper.className = 'rd-wrapper-type';

        const typeBadge = document.createElement('span');
        typeBadge.className = 'request-type-badge';

        const tipoRichiesta = data.type_name || '';

        if (tipoRichiesta === 'Ferie' || typeValue === 1) {
            typeBadge.classList.add('badge-ferie');
        } else if (tipoRichiesta === 'Permessi' || typeValue === 2) {
            typeBadge.classList.add('badge-permessi');
        }
        typeBadge.textContent = tipoRichiesta || '';

        typeWrapper.appendChild(typeBadge);

        const quantityWrapper = document.createElement('div');
        quantityWrapper.className = 'rd-wrapper-quantity mb-2';

        const quantitySpan = document.createElement('span');
        quantitySpan.className = 'request-quantity px-2';

        const quantityText = extractQuantityFromMoorea(data);

        if (quantityText && quantityText.length > 0) {
            const unitChar = quantityText.slice(-1).toLowerCase();
            const numberVal = quantityText.slice(0, -1);
            const numericValue = parseFloat(numberVal);

            let label = '';
            if (unitChar === 'g') {
                label = (numberVal === '1') ? 'giorno' : 'giorni';
                quantitySpan.innerHTML = `
                    <span class="qty-number">${numberVal}</span>
                    <span class="qty-label pt-1">${label}</span>
                `;
            } else if (unitChar === 'h') {
                label = (numberVal === '1') ? 'ora' : 'ore';
                
                const isInteger = Number.isInteger(numericValue);
                
                if (isInteger) {
                    quantitySpan.innerHTML = `
                        <span class="qty-number">${numberVal}</span>
                        <span class="qty-label pt-1">${label}</span>
                    `;
                } else {
                    const hoursInt = Math.floor(numericValue);
                    quantitySpan.innerHTML = `
                        <span class="qty-columns-wrapper">
                            <span class="qty-row-top">
                                <span class="qty-number">${hoursInt}</span>
                                <span class="qty-hours-h pe-1">h</span>
                                <span class="qty-minutes-number">30</span>
                                <span class="qty-minutes-label">min</span>
                            </span>
                            <span class="qty-row-bottom">
                                <span class="qty-label pt-1">ORE</span>
                            </span>
                        </span>
                    `;
                }
            } else {
                quantitySpan.textContent = quantityText;
            }
        } else {
            quantitySpan.textContent = '';
        }

        quantityWrapper.appendChild(quantitySpan);

        const datetimeWrapper = document.createElement('div');
        datetimeWrapper.className = 'rd-wrapper-datetime';

        const dateInfo = extractDateInfoFromMoorea(data);
        const isPermesso = typeValue === 2 || data.type_name === 'Permessi';
        
        const textContainer = document.createElement('div');
        textContainer.style.display = 'flex';
        textContainer.style.flexDirection = 'column';
        textContainer.style.alignItems = 'flex-start';

        if (!isPermesso) {
            let start = '', end = '';
            if (data.dataInizio) {
                start = formatDateDDMMYY(data.dataInizio);
                end = data.dataFine ? formatDateDDMMYY(data.dataFine) : start;
            } 
            else if (data.moorea_obj && data.moorea_obj.leaves && data.moorea_obj.leaves.length > 0) {
                const leaves = data.moorea_obj.leaves;
                const sortedLeaves = [...leaves].sort((a, b) => new Date(a.dataInizio) - new Date(b.dataInizio));
                start = formatDateDDMMYY(sortedLeaves[0].dataInizio);
                end = formatDateDDMMYY(sortedLeaves[sortedLeaves.length - 1].dataFine || sortedLeaves[sortedLeaves.length - 1].dataInizio);
            }

            if (start) {
                let htmlText;
                if (start === end) {
                    htmlText = `Il ${start}`;
                } else {
                    htmlText = `<span class="date-preposition">Da</span> ${start} <span class="date-preposition">a</span> ${end}`;
                }
                
                const simpleSpan = document.createElement('span');
                simpleSpan.className = 'date-range-normal';
                simpleSpan.innerHTML = htmlText;
                textContainer.appendChild(simpleSpan);
            }

        } else {
            let formattedDate = '';
            if (data.dataInizio) {
                formattedDate = formatDayDDMMYY(data.dataInizio);
            } else if (data.moorea_obj && data.moorea_obj.leaves && data.moorea_obj.leaves.length > 0) {
                formattedDate = formatDayDDMMYY(data.moorea_obj.leaves[0].dataInizio);
            } else {
                formattedDate = dateInfo.dateText; 
            }

            const span = document.createElement('span');
            span.className = 'request-datetime';

            if (dateInfo.timeText) {
                span.innerHTML = `${formattedDate} <span class="datetime-separator">|</span> <span class="datetime-time">${dateInfo.timeText}</span>`;
            } else {
                span.textContent = formattedDate;
            }
            textContainer.appendChild(span);
        }

        datetimeWrapper.appendChild(textContainer);

        requestDetails.appendChild(typeWrapper);
        requestDetails.appendChild(quantityWrapper);
        requestDetails.appendChild(datetimeWrapper);

        const statusIcon = document.createElement('div');
        statusIcon.className = 'approval-row-status-icon';
        
        if (data.status === 1) {
            statusIcon.innerHTML = '<i class="bi bi-check-lg"></i>';
            statusIcon.classList.add('status-approved');
        } else if (data.status === 2) {
            statusIcon.innerHTML = '<i class="bi bi-x-lg"></i>';
            statusIcon.classList.add('status-rejected');
        }

        row.appendChild(employeeProfile);
        row.appendChild(requestDetails);
        row.appendChild(statusIcon);

        row.onclick = function() {
            const calendars = store.getState('calendars');
            if (calendars && calendars.open) {
                calendars.open(store, data);
            }
        };

        return row;
    }

    return {
        createApprovalRow: createApprovalRow,
        formatDateDDMMYY: formatDateDDMMYY,
        formatDayDDMMYY: formatDayDDMMYY,
        formatTimeToHHMM: formatTimeToHHMM,
        formatDateItalian: formatDateItalian,
        normalizeQuantity: normalizeQuantity,
        extractQuantityFromMoorea: extractQuantityFromMoorea,
        extractDateInfoFromMoorea: extractDateInfoFromMoorea,
        parseColorToRgb: parseColorToRgb,
        getRelativeLuminance: getRelativeLuminance,
        applyDepartmentBadgeStyle: applyDepartmentBadgeStyle,
        applyTaskBadgeStyle: applyTaskBadgeStyle
    };
};
