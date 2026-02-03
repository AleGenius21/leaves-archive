(function() {
    'use strict';

    // ============================================================================
    // 1. UTILS MODULE - Funzioni helper
    // ============================================================================
    const utils = {
        timestampToDateString: function(timestamp) {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        createMooreaObj: function(tipo_richiesta, ore, data_numerica, orario_inizio, orario_fine, assunzione_id, persona_id) {
            const causaleId = tipo_richiesta === 'FERIE' ? 16443 : 16444;
            const dateStr = this.timestampToDateString(data_numerica);
            const hoursPerDay = 8;
            const days = Math.ceil(ore / hoursPerDay);
            
            const leaves = [];
            for (let i = 0; i < days; i++) {
                const leaveDate = new Date(data_numerica);
                leaveDate.setDate(leaveDate.getDate() + i);
                const leaveDateStr = this.timestampToDateString(leaveDate.getTime());
                const hoursForThisDay = (i === days - 1) ? (ore - (i * hoursPerDay)) : hoursPerDay;
                
                const leave = {
                    nome: tipo_richiesta,
                    voce: tipo_richiesta,
                    causaleId: causaleId,
                    personaId: persona_id,
                    deltaData: 0,
                    assunzioneId: assunzione_id,
                    dataInizio: leaveDateStr,
                    dataFine: leaveDateStr,
                    interaGiornata: 1,
                    quantitaOre: hoursForThisDay,
                    note: ""
                };
                
                if (orario_inizio && orario_fine && tipo_richiesta === 'PERMESSO' && i === 0) {
                    leave.orarioInizio = orario_inizio;
                    leave.orarioFine = orario_fine;
                    leave.interaGiornata = 0;
                }
                
                leaves.push(leave);
            }
            
            const meta = {
                hours: ore,
                days: days,
                leave_details_txt: `${ore} ore di ${tipo_richiesta}`
            };
            
            return {
                meta: meta,
                leaves: leaves
            };
        },

        formatDateString: function(date) {
            const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
            const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
            const dayName = days[date.getDay()];
            const day = date.getDate();
            const month = months[date.getMonth()];
            return `${dayName} ${day} ${month}`;
        },

        generateDateInRange: function(daysOffset) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysOffset);
            return targetDate;
        }
    };

    // ============================================================================
    // 3. APPROVAL ROW MODULE
    // ============================================================================
    const approvalRow = (function() {
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
                const openDetailPanel = store.getState('openDetailPanel');
                if (openDetailPanel) {
                    openDetailPanel(store, data);
                }
            };

            return row;
        }

        return {
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
            applyTaskBadgeStyle: applyTaskBadgeStyle,
            createApprovalRow: createApprovalRow
        };
    })();

    // ============================================================================
    // 4. DETAIL PANEL MODULE
    // ============================================================================
    const detailPanel = (function() {
        function loadPanelContent(store) {
            return new Promise((resolve, reject) => {
                const detailPanelElement = store.getState('detailPanelElement');
                const root = store.getState('root');
                
                if (!detailPanelElement) {
                    reject('Detail panel element not found');
                    return;
                }

                const calendarContainer = detailPanelElement.querySelector('#calendarContainer');
                if (calendarContainer) {
                    const closeBtn = root.querySelector('#btnClosePanel');
                    if (closeBtn) {
                        closeBtn.onclick = function() {
                            closeDetailPanel(store);
                        };
                    }
                    setupPresetButtons(store);
                    resolve();
                    return;
                }

                fetch('components/detail-panel/detail-panel.html')
                    .then(response => response.text())
                    .then(html => {
                        detailPanelElement.innerHTML = html;
                        const closeBtn = root.querySelector('#btnClosePanel');
                        if (closeBtn) {
                            closeBtn.onclick = function() {
                                closeDetailPanel(store);
                            };
                        }
                        setupPresetButtons(store);
                        resolve();
                    })
                    .catch(error => {
                        console.error('Errore nel caricamento del detail panel:', error);
                        detailPanelElement.innerHTML = `<button class="btn-close-panel" id="btnClosePanel" aria-label="Chiudi" type="button"><i class="bi bi-x-lg"></i></button><div class="panel-content"><div class="periodo-presets-container" id="past_periodoPresetsContainer"><button type="button" class="preset-btn" data-preset="last-month">Mese scorso</button><button type="button" class="preset-btn" data-preset="last-six-month">Ultimi 6 mesi</button><button type="button" class="preset-btn" data-preset="last-year">Anno scorso</button></div><div class="periodo-presets-container" id="future_periodoPresetsContainer"><button type="button" class="preset-btn" data-preset="next-week">Prossima settimana</button><button type="button" class="preset-btn" data-preset="next-15-days">Prossimi 15 giorni</button><button type="button" class="preset-btn" data-preset="next-month">Prossimo mese</button></div><div class="calendar-container" id="calendarContainer"></div></div></div>`;
                        const cb = root.querySelector('#btnClosePanel');
                        if (cb) {
                            cb.onclick = function() {
                                closeDetailPanel(store);
                            };
                        }
                        setupPresetButtons(store);
                        resolve();
                    });
            });
        }

        function openDetailPanel(store, requestData) {
            const detailPanelElement = store.getState('detailPanelElement');
            const listSectionElement = store.getState('listSectionElement');
            const root = store.getState('root');
            
            if (!detailPanelElement || !listSectionElement) {
                console.error('Detail panel: elementi non trovati');
                return;
            }

            store.setState('currentRequestData', requestData);

            const filteredRequestsData = store.getState('filteredRequestsData');
            const allRequestsData = store.getState('allRequestsData');
            const allRequestsForCalendar = filteredRequestsData && filteredRequestsData.length > 0 
                ? [...filteredRequestsData] 
                : (allRequestsData && allRequestsData.length > 0 ? [...allRequestsData] : []);

            detailPanelElement.classList.add('panel-open');
            listSectionElement.classList.add('panel-open');

            renderCalendar(store);
        }

        function closeDetailPanel(store) {
            const detailPanelElement = store.getState('detailPanelElement');
            const listSectionElement = store.getState('listSectionElement');
            const root = store.getState('root');
            
            if (!detailPanelElement || !listSectionElement) {
                return;
            }

            store.setState('currentRequestData', null);
            store.setState('selectedDay', null);

            const selectedDayElements = root ? root.querySelectorAll('.calendar-day.selected-day') : [];
            selectedDayElements.forEach(el => el.classList.remove('selected-day'));
        }

        function loadCalendarData(store, data) {
            if (!Array.isArray(data)) {
                console.error('loadCalendarData: data deve essere un array');
                return;
            }

            const archiveData = data.filter(req =>
                req.stato === 'Approvato' || req.stato === 'Rifiutato'
            );

            store.setState('allCalendarData', [...archiveData]);
            renderCalendar(store);
        }

        function renderCalendar(store, data = null) {
            const root = store.getState('root');
            if (!root) return;
            
            const calendarContainer = root.querySelector('#calendarContainer');
            if (!calendarContainer) {
                console.warn('renderCalendar: calendarContainer non trovato nel DOM');
                return;
            }

            calendarContainer.innerHTML = '';

            const allCalendarData = store.getState('allCalendarData');
            const allRequestsData = store.getState('allRequestsData');
            const requestsToUse = data || allCalendarData || allRequestsData || [];

            const monthsMap = new Map();

            requestsToUse.forEach(request => {
                if (!request.moorea_obj || !request.moorea_obj.leaves || !Array.isArray(request.moorea_obj.leaves)) {
                    return;
                }

                request.moorea_obj.leaves.forEach(leave => {
                    const dateStr = leave.dataInizio || leave.dataFine;
                    if (!dateStr) return;

                    const date = new Date(dateStr + 'T00:00:00');
                    if (isNaN(date.getTime())) return;

                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const monthKey = `${year}-${month}`;

                    if (!monthsMap.has(monthKey)) {
                        monthsMap.set(monthKey, {
                            year: year,
                            month: month,
                            requests: []
                        });
                    }

                    const monthData = monthsMap.get(monthKey);
                    if (!monthData.requests.find(r => r.id === request.id)) {
                        monthData.requests.push(request);
                    }
                });
            });

            // Anni da mostrare: due anni se periodo a cavallo (displayedCalendarYearEnd), altrimenti uno
            const displayedYear = store.getState('displayedCalendarYear');
            const displayedYearEnd = store.getState('displayedCalendarYearEnd');
            const yearsToDisplay = displayedYearEnd != null
                ? [Math.min(displayedYear, displayedYearEnd), Math.max(displayedYear, displayedYearEnd)]
                : [displayedYear];

            // Popola monthsMap con i 12 mesi per ogni anno da mostrare
            yearsToDisplay.forEach(year => {
                for (let month = 0; month < 12; month++) {
                    const monthKey = `${year}-${month}`;
                    if (!monthsMap.has(monthKey)) {
                        monthsMap.set(monthKey, {
                            year: year,
                            month: month,
                            requests: []
                        });
                    }
                }
            });

            // Se c'è un periodo selezionato, assicurati che i suoi mesi negli anni visualizzati siano inclusi
            const selectedPeriod = store.getState('selectedPeriod');
            if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
                const startDate = new Date(selectedPeriod.startDate);
                const endDate = new Date(selectedPeriod.endDate);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);

                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    if (!yearsToDisplay.includes(year)) {
                        currentDate.setMonth(currentDate.getMonth() + 1);
                        currentDate.setDate(1);
                        continue;
                    }
                    const monthKey = `${year}-${month}`;
                    if (!monthsMap.has(monthKey)) {
                        monthsMap.set(monthKey, {
                            year: year,
                            month: month,
                            requests: []
                        });
                    }
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    currentDate.setDate(1);
                }
            }

            // Mesi degli anni visualizzati, ordinati cronologicamente (12 o 24 mesi)
            const sortedMonths = Array.from(monthsMap.values())
                .filter(m => yearsToDisplay.includes(m.year))
                .sort((a, b) => {
                    if (a.year !== b.year) {
                        return a.year - b.year;
                    }
                    return a.month - b.month;
                });

            const currentRequestData = store.getState('currentRequestData');
            sortedMonths.forEach(monthData => {
                const monthCalendar = generateMonthCalendar(store, monthData.year, monthData.month, monthData.requests, currentRequestData);
                calendarContainer.appendChild(monthCalendar);
            });

            // Scrolla automaticamente al mese corrente (solo al primo rendering, se l'anno corrente è tra quelli visualizzati)
            const today = new Date();
            if (!store.getState('calendarScrollInitialized') && yearsToDisplay.includes(today.getFullYear())) {
                store.setState('calendarScrollInitialized', true);
                setTimeout(() => {
                    scrollToDate(store, today, true);
                }, 100);
            }

            updateCalendarYearInput(store);
        }

        function generateMonthCalendar(store, year, month, requests, selectedRequest) {
            const root = store.getState('root');
            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-calendar';

            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
            monthHeader.textContent = `${monthNames[month]} ${year}`;
            monthContainer.appendChild(monthHeader);

            const calendarGrid = document.createElement('div');
            calendarGrid.className = 'calendar-grid';

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            const dateRequestsMap = new Map();

            requests.forEach(request => {
                if (!request.moorea_obj || !request.moorea_obj.leaves) return;

                request.moorea_obj.leaves.forEach(leave => {
                    const dateStr = leave.dataInizio || leave.dataFine;
                    if (!dateStr) return;

                    const date = new Date(dateStr + 'T00:00:00');
                    if (isNaN(date.getTime())) return;

                    if (date.getFullYear() === year && date.getMonth() === month) {
                        const day = date.getDate();
                        const dateKey = `${year}-${month}-${day}`;

                        if (!dateRequestsMap.has(dateKey)) {
                            dateRequestsMap.set(dateKey, []);
                        }

                        dateRequestsMap.get(dateKey).push({
                            request: request,
                            leave: leave
                        });
                    }
                });
            });

            for (let i = 0; i < startingDayOfWeek; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day empty';
                calendarGrid.appendChild(emptyCell);
            }

            const selectedPeriodStart = store.getState('selectedPeriodStart');
            const selectedPeriodEnd = store.getState('selectedPeriodEnd');

            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.setAttribute('data-year', year);
                dayCell.setAttribute('data-month', month);
                dayCell.setAttribute('data-day', day);

                const dayNumber = document.createElement('div');
                dayNumber.className = 'calendar-day-number';
                dayNumber.textContent = day;

                const dayOfWeek = new Date(year, month, day).getDay();
                if (dayOfWeek === 0) {
                    dayNumber.classList.add('sunday');
                }

                dayCell.appendChild(dayNumber);

                const dateKey = `${year}-${month}-${day}`;
                const dayRequests = dateRequestsMap.get(dateKey) || [];

                const ferieRequests = new Set();
                const permessoRequests = new Set();
                let hasSelectedRequest = false;
                let hasApproved = false;
                let hasRejected = false;

                if (dayRequests.length > 0) {
                    dayCell.classList.add('has-requests');

                    dayRequests.forEach(({ request, leave }) => {
                        const isFerie = request.type === 1 || request.type_name === 'FERIE';
                        const isPermesso = request.type === 2 || request.type_name === 'PERMESSO';
                        const status = request.status;

                        if (isFerie) {
                            ferieRequests.add(request.id);
                        } else if (isPermesso) {
                            permessoRequests.add(request.id);
                        }

                        if (status === 1) {
                            hasApproved = true;
                        } else if (status === 2) {
                            hasRejected = true;
                        }

                        if (selectedRequest && request.id === selectedRequest.id) {
                            hasSelectedRequest = true;
                        }
                    });

                    if (hasApproved) {
                        dayCell.classList.add('stato-approvato');
                    }
                    if (hasRejected) {
                        dayCell.classList.add('stato-rifiutato');
                    }
                    if (hasSelectedRequest) {
                        dayCell.classList.add('selected-request');
                    }

                    const badgesContainer = document.createElement('div');
                    badgesContainer.className = 'calendar-day-badges';

                    if (ferieRequests.size > 0) {
                        const ferieBadge = document.createElement('div');
                        ferieBadge.className = 'calendar-badge calendar-badge-ferie';
                        ferieBadge.textContent = `${ferieRequests.size} in Ferie`;
                        badgesContainer.appendChild(ferieBadge);
                    }

                    if (permessoRequests.size > 0) {
                        const permessoBadge = document.createElement('div');
                        permessoBadge.className = 'calendar-badge calendar-badge-permesso';
                        permessoBadge.textContent = `${permessoRequests.size} in Permesso`;
                        badgesContainer.appendChild(permessoBadge);
                    }

                    if (badgesContainer.children.length > 0) {
                        dayCell.appendChild(badgesContainer);
                    }
                }

                const today = new Date();
                if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                    dayCell.classList.add('today');
                }

                if (selectedPeriodStart || selectedPeriodEnd) {
                    const currentDate = new Date(year, month, day);
                    currentDate.setHours(0, 0, 0, 0);

                    if (selectedPeriodStart && selectedPeriodEnd) {
                        const startDate = new Date(selectedPeriodStart);
                        startDate.setHours(0, 0, 0, 0);
                        const endDate = new Date(selectedPeriodEnd);
                        endDate.setHours(0, 0, 0, 0);

                        if (currentDate.getTime() === startDate.getTime()) {
                            dayCell.classList.add('period-start');
                            if (currentDate.getTime() === endDate.getTime()) {
                                dayCell.classList.add('period-end');
                            }
                        } else if (currentDate.getTime() === endDate.getTime()) {
                            dayCell.classList.add('period-end');
                        } else if (currentDate > startDate && currentDate < endDate) {
                            dayCell.classList.add('period-range');
                        }
                    } else if (selectedPeriodStart) {
                        const startDate = new Date(selectedPeriodStart);
                        startDate.setHours(0, 0, 0, 0);
                        if (currentDate.getTime() === startDate.getTime()) {
                            dayCell.classList.add('period-start');
                        }
                    }
                }

                if (!dayCell.classList.contains('empty')) {
                    dayCell.style.cursor = 'pointer';
                    dayCell.onclick = function(event) {
                        const previousSelected = root.querySelectorAll('.calendar-day.selected-day');
                        previousSelected.forEach(el => el.classList.remove('selected-day'));
                        handleDayClick(store, year, month, day);
                    };
                }

                calendarGrid.appendChild(dayCell);
            }

            monthContainer.appendChild(calendarGrid);
            return monthContainer;
        }

        async function handleDayClick(store, year, month, day) {
            clearPresetActiveState(store);

            const root = store.getState('root');
            const previousSelected = root ? root.querySelectorAll('.calendar-day.selected-day') : [];
            previousSelected.forEach(e => e.classList.remove('selected-day'));

            const selectedDate = new Date(year, month, day);
            selectedDate.setHours(0, 0, 0, 0);

            const period = store.getState('selectedPeriod');
            const periodStart = period?.startDate;
            const periodEnd = period?.endDate;
            
            // Distingue "solo inizio" (start === end, 1 giorno) da "range già scelto" (start !== end)
            const isRangeAlreadySet = periodStart && periodEnd &&
                new Date(periodStart).getTime() !== new Date(periodEnd).getTime();

            if (!periodStart) {
                // 1° click: imposta inizio periodo (e fine = inizio per coerenza store)
                const start = new Date(selectedDate);
                store.setState('selectedPeriod', {
                    startDate: start,
                    endDate: new Date(start)
                });
                store.setState('selectedPeriodStart', new Date(start));
                store.setState('selectedPeriodEnd', null);
            } else if (!isRangeAlreadySet) {
                // 2° click: imposta fine periodo (può essere stesso giorno)
                let startDate = new Date(periodStart);
                let endDate = new Date(selectedDate);
                if (endDate < startDate) {
                    [startDate, endDate] = [endDate, startDate];
                }
                await applyPeriodFilter(store, startDate, endDate);
            } else {
                // 3° click: reset e nuovo inizio
                const start = new Date(selectedDate);
                store.setState('selectedPeriod', {
                    startDate: start,
                    endDate: new Date(start)
                });
                store.setState('selectedPeriodStart', new Date(start));
                store.setState('selectedPeriodEnd', null);
                store.setState('displayedCalendarYear', selectedDate.getFullYear());
                store.setState('displayedCalendarYearEnd', null);
            }

            renderCalendar(store);

            // Chiama loadAndDisplayDayData solo per selezione singola (stesso giorno inizio/fine), non per range
            const periodAfter = store.getState('selectedPeriod');
            const isSingleDay = periodAfter?.startDate && periodAfter?.endDate &&
                new Date(periodAfter.startDate).getTime() === new Date(periodAfter.endDate).getTime();
            
            if (isSingleDay) {
                store.setState('selectedDay', { year, month, day });
                const previousSelected2 = root ? root.querySelectorAll('.calendar-day.selected-day') : [];
                previousSelected2.forEach(e => e.classList.remove('selected-day'));

                const loadAndDisplayDayData = store.getState('loadAndDisplayDayData');
                if (loadAndDisplayDayData) {
                    loadAndDisplayDayData(store, selectedDate);
                }
            }
        }

        async function applyPeriodFilter(store, startDate, endDate) {
            const normalizedStart = new Date(startDate);
            normalizedStart.setHours(0, 0, 0, 0);
            const normalizedEnd = new Date(endDate);
            normalizedEnd.setHours(23, 59, 59, 999);

            const startYear = normalizedStart.getFullYear();
            const endYear = normalizedEnd.getFullYear();
            
            if (startYear !== endYear) {
                store.setState('displayedCalendarYear', startYear);
                store.setState('displayedCalendarYearEnd', endYear);
            } else {
                store.setState('displayedCalendarYear', startYear);
                store.setState('displayedCalendarYearEnd', null);
            }

            store.setState('selectedPeriodStart', normalizedStart);
            store.setState('selectedPeriodEnd', normalizedEnd);
            store.setState('selectedPeriod', {
                startDate: normalizedStart,
                endDate: normalizedEnd
            });

            const allCalendarData = store.getState('allCalendarData');
            if (allCalendarData && Array.isArray(allCalendarData) && allCalendarData.length > 0) {
                store.setState('allRequestsData', [...allCalendarData]);
            }

            renderCalendar(store);
            updateCalendarYearInput(store);

            const hideFilterSpinner = store.getState('hideFilterSpinner');
            if (hideFilterSpinner) {
                hideFilterSpinner(store);
            }

            let periodFilteredData = [];
            const currentAllCalendarData = store.getState('allCalendarData');
            if (currentAllCalendarData && Array.isArray(currentAllCalendarData) && currentAllCalendarData.length > 0) {
                periodFilteredData = currentAllCalendarData.filter(req => {
                    if (req.data_numerica) {
                        const reqDate = new Date(req.data_numerica);
                        reqDate.setHours(0, 0, 0, 0);
                        if (reqDate >= normalizedStart && reqDate <= normalizedEnd) {
                            return true;
                        }
                    }

                    if (req.moorea_obj && req.moorea_obj.leaves && Array.isArray(req.moorea_obj.leaves)) {
                        for (const leave of req.moorea_obj.leaves) {
                            const leaveStartDate = leave.dataInizio ? new Date(leave.dataInizio + 'T00:00:00') : null;
                            const leaveEndDate = leave.dataFine ? new Date(leave.dataFine + 'T00:00:00') : null;

                            if (leaveStartDate && !isNaN(leaveStartDate.getTime())) {
                                leaveStartDate.setHours(0, 0, 0, 0);
                                if (!leaveEndDate || isNaN(leaveEndDate.getTime())) {
                                    if (leaveStartDate >= normalizedStart && leaveStartDate <= normalizedEnd) {
                                        return true;
                                    }
                                } else {
                                    leaveEndDate.setHours(23, 59, 59, 999);
                                    if (leaveStartDate <= normalizedEnd && leaveEndDate >= normalizedStart) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }

                    return false;
                });
            }

            const fetchLeaveAdminScreenConfig = store.getState('fetchLeaveAdminScreenConfig');
            const buildFiltersFromConfig = store.getState('buildFiltersFromConfig');
            const buildStatusFilter = store.getState('buildStatusFilter');

            if (fetchLeaveAdminScreenConfig && buildFiltersFromConfig) {
                try {
                    const configData = await fetchLeaveAdminScreenConfig(store);
                    if (configData && typeof configData === 'object') {
                        buildFiltersFromConfig(store, configData);
                    } else if (buildStatusFilter) {
                        buildStatusFilter(store);
                    }
                } catch (error) {
                    console.warn('[DETAIL-PANEL] Errore nel ripristino filtri da config:', error);
                    if (buildStatusFilter) {
                        buildStatusFilter(store);
                    }
                }
            } else if (buildStatusFilter) {
                buildStatusFilter(store);
            }

            const setFiltersEnabled = store.getState('setFiltersEnabled');
            const currentAllCalendarData2 = store.getState('allCalendarData');
            if (setFiltersEnabled) {
                const hasData = (periodFilteredData && periodFilteredData.length > 0) ||
                    (currentAllCalendarData2 && Array.isArray(currentAllCalendarData2) && currentAllCalendarData2.length > 0);
                setFiltersEnabled(store, hasData);
            }

            const handleFilterChange = store.getState('handleFilterChange');
            if (handleFilterChange) {
                handleFilterChange(store);
            }
        }

        function clearPresetActiveState(store) {
            const root = store.getState('root');
            if (root) {
                root.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            }
        }

        function applyDefaultTodaySelection(store) {
            if (store.getState('defaultDateApplied')) return;
            store.setState('defaultDateApplied', true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            applyPeriodFilter(store, today, today);
        }

        function clearPeriodSelection(store) {
            store.setState('selectedPeriodStart', null);
            store.setState('selectedPeriodEnd', null);
            store.setState('selectedPeriod', null);
            store.setState('displayedCalendarYearEnd', null);
            store.setState('displayedCalendarYear', new Date().getFullYear());

            const root = store.getState('root');
            const periodDays = root ? root.querySelectorAll('.calendar-day.period-start, .calendar-day.period-end, .calendar-day.period-range') : [];
            periodDays.forEach(el => {
                el.classList.remove('period-start', 'period-end', 'period-range');
            });

            const presetButtons = root ? root.querySelectorAll('.preset-btn') : [];
            presetButtons.forEach(btn => btn.classList.remove('active'));

            const hideFilterSpinner = store.getState('hideFilterSpinner');
            if (hideFilterSpinner) {
                hideFilterSpinner(store);
            }

            const setFiltersEnabled = store.getState('setFiltersEnabled');
            if (setFiltersEnabled) {
                setFiltersEnabled(store, false);
            }

            const handleFilterChange = store.getState('handleFilterChange');
            if (handleFilterChange) {
                handleFilterChange(store);
            }

            updateCalendarYearInput(store);
            renderCalendar(store);
        }

        async function applyPeriodoPreset(store, preset) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let startDate, endDate;

            switch (preset) {
                case 'last-month':
                    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;

                case 'last-six-month':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 6);
                    endDate = new Date(today);
                    break;

                case 'last-year':
                    const lastYear = today.getFullYear() - 1;
                    startDate = new Date(lastYear, 0, 1);
                    endDate = new Date(lastYear, 11, 31);
                    break;

                case 'next-week':
                    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() + daysUntilMonday);
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    break;

                case 'next-15-days':
                    startDate = new Date(today);
                    endDate = new Date(today);
                    endDate.setDate(today.getDate() + 14);
                    break;

                case 'next-month':
                    startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                    break;

                default:
                    return;
            }

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            // Mostra uno o due anni nel calendario a seconda che il periodo sia a cavallo
            const startYear = startDate.getFullYear();
            const endYear = endDate.getFullYear();
            if (startYear !== endYear) {
                store.setState('displayedCalendarYear', startYear);
                store.setState('displayedCalendarYearEnd', endYear);
            } else {
                store.setState('displayedCalendarYear', startYear);
                store.setState('displayedCalendarYearEnd', null);
            }
            updateCalendarYearInput(store);

            await applyPeriodFilter(store, startDate, endDate);

            setTimeout(() => {
                scrollToDate(store, startDate);
            }, 100);
        }

        function scrollToDate(store, date, instant = false) {
            const root = store.getState('root');
            if (!root) return;
            
            const calendarContainer = root.querySelector('#calendarContainer');
            if (!calendarContainer) return;

            const year = date.getFullYear();
            const month = date.getMonth();

            const monthCalendars = calendarContainer.querySelectorAll('.month-calendar');
            monthCalendars.forEach(monthCalendar => {
                const monthHeader = monthCalendar.querySelector('.month-header');
                if (monthHeader) {
                    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                    const headerText = `${monthNames[month]} ${year}`;
                    if (monthHeader.textContent === headerText) {
                        monthCalendar.scrollIntoView({ 
                            behavior: instant ? 'auto' : 'smooth', 
                            block: 'center' 
                        });
                    }
                }
            });
        }

        function setupPresetButtons(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const presetContainers = root.querySelectorAll('.periodo-presets-container');
            
            presetContainers.forEach(container => {
                const presetButtons = container.querySelectorAll('.preset-btn');

                presetButtons.forEach(btn => {
                    btn.onclick = function(e) {
                        e.stopPropagation();

                        presetButtons.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');

                        const preset = this.getAttribute('data-preset');
                        applyPeriodoPreset(store, preset);
                    };
                });
            });
        }

        const YEAR_PICKER_MIN = 2024;
        const YEAR_PICKER_WINDOW_SIZE = 12;

        function getYearPickerMax() {
            return new Date().getFullYear() + 1;
        }

        function updateCalendarYearInput(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const input = root.querySelector('#calendarYearInput');
            const suffix = root.querySelector('#calendarYearRangeSuffix');
            if (!input) return;
            
            const displayedYear = store.getState('displayedCalendarYear');
            const displayedYearEnd = store.getState('displayedCalendarYearEnd');
            
            if (displayedYearEnd != null) {
                input.value = displayedYear + ' - ' + displayedYearEnd;
            } else {
                input.value = String(displayedYear);
            }
            
            if (suffix) {
                suffix.textContent = '';
                suffix.style.display = 'none';
            }
        }

        function closeYearPicker(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const yearPicker = root.querySelector('#yearPicker');
            const wrapper = root.querySelector('.calendar-year-input-wrapper');
            
            if (yearPicker) yearPicker.hidden = true;
            if (wrapper) wrapper.setAttribute('aria-expanded', 'false');
        }

        function populateYearPicker(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const yearPicker = root.querySelector('#yearPicker');
            if (!yearPicker) return;

            const maxStartYear = Math.max(YEAR_PICKER_MIN, getYearPickerMax() - YEAR_PICKER_WINDOW_SIZE + 1);
            let windowStart = store.getState('yearPickerWindowStart');
            const displayedYear = store.getState('displayedCalendarYear');
            
            if (windowStart == null) {
                windowStart = Math.max(YEAR_PICKER_MIN, displayedYear - 5);
                windowStart = Math.min(windowStart, maxStartYear);
                store.setState('yearPickerWindowStart', windowStart);
            }
            
            const startYear = windowStart;
            const endYear = Math.min(startYear + YEAR_PICKER_WINDOW_SIZE - 1, getYearPickerMax());

            yearPicker.innerHTML = '';

            // Header: prev, label range, next
            const header = document.createElement('div');
            header.className = 'year-picker-header';
            
            const btnPrev = document.createElement('button');
            btnPrev.type = 'button';
            btnPrev.className = 'year-picker-nav-btn';
            btnPrev.setAttribute('aria-label', 'Anni precedenti');
            btnPrev.textContent = '\u2039';
            
            const labelCenter = document.createElement('span');
            labelCenter.className = 'year-picker-header-label';
            labelCenter.textContent = startYear === endYear ? String(startYear) : startYear + ' – ' + endYear;
            
            const btnNext = document.createElement('button');
            btnNext.type = 'button';
            btnNext.className = 'year-picker-nav-btn';
            btnNext.setAttribute('aria-label', 'Anni successivi');
            btnNext.textContent = '\u203A';

            btnPrev.onclick = function(e) {
                e.stopPropagation();
                store.setState('yearPickerWindowStart', Math.max(YEAR_PICKER_MIN, startYear - YEAR_PICKER_WINDOW_SIZE));
                populateYearPicker(store);
            };
            
            btnNext.onclick = function(e) {
                e.stopPropagation();
                store.setState('yearPickerWindowStart', Math.min(startYear + YEAR_PICKER_WINDOW_SIZE, maxStartYear));
                populateYearPicker(store);
            };

            header.appendChild(btnPrev);
            header.appendChild(labelCenter);
            header.appendChild(btnNext);
            yearPicker.appendChild(header);

            // Griglia 4x3
            const grid = document.createElement('div');
            grid.className = 'year-picker-grid';
            
            for (let y = startYear; y <= endYear; y++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                const isSelected = y === displayedYear;
                btn.className = 'year-picker-btn' + (isSelected ? ' selected' : '');
                btn.textContent = y;
                btn.setAttribute('data-year', y);
                if (isSelected) btn.setAttribute('aria-pressed', 'true');
                
                btn.onclick = function(e) {
                    e.stopPropagation();
                    const year = parseInt(this.getAttribute('data-year'), 10);
                    store.setState('displayedCalendarYear', year);
                    store.setState('displayedCalendarYearEnd', null);
                    closeYearPicker(store);
                    updateCalendarYearInput(store);
                    renderCalendar(store);
                    setTimeout(() => {
                        scrollToDate(store, new Date(year, 0, 1), true);
                    }, 50);
                };
                
                grid.appendChild(btn);
            }
            
            yearPicker.appendChild(grid);
        }

        function setupYearPicker(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const yearInput = root.querySelector('#calendarYearInput');
            const yearPicker = root.querySelector('#yearPicker');
            const wrapper = root.querySelector('.calendar-year-input-wrapper');
            
            if (!yearInput || !yearPicker) return;

            populateYearPicker(store);

            function openPicker() {
                store.setState('yearPickerWindowStart', null);
                populateYearPicker(store);
                yearPicker.hidden = false;
                if (wrapper) wrapper.setAttribute('aria-expanded', 'true');
            }

            yearInput.onfocus = function(e) {
                e.stopPropagation();
                openPicker();
            };
            
            yearInput.onclick = function(e) {
                e.stopPropagation();
                if (yearPicker.hidden) openPicker();
            };

            function parseYearInputValue(str) {
                const s = String(str).trim();
                const single = /^\s*(\d{4})\s*$/;
                const range = /^\s*(\d{4})\s*-\s*(\d{4})\s*$/;
                let m = s.match(range);
                
                if (m) {
                    const a = parseInt(m[1], 10);
                    const b = parseInt(m[2], 10);
                    const max = getYearPickerMax();
                    if (a >= YEAR_PICKER_MIN && a <= max && b >= YEAR_PICKER_MIN && b <= max)
                        return { single: false, start: Math.min(a, b), end: Math.max(a, b) };
                }
                
                m = s.match(single);
                if (m) {
                    const val = parseInt(m[1], 10);
                    if (val >= YEAR_PICKER_MIN && val <= getYearPickerMax())
                        return { single: true, start: val, end: null };
                }
                
                return null;
            }

            yearInput.onchange = function() {
                const parsed = parseYearInputValue(yearInput.value);
                if (parsed) {
                    store.setState('displayedCalendarYear', parsed.start);
                    store.setState('displayedCalendarYearEnd', parsed.single ? null : parsed.end);
                    updateCalendarYearInput(store);
                    renderCalendar(store);
                    const year = store.getState('displayedCalendarYear');
                    setTimeout(() => scrollToDate(store, new Date(year, 0, 1), true), 50);
                } else {
                    updateCalendarYearInput(store);
                }
            };
            
            yearInput.onblur = function() {
                const parsed = parseYearInputValue(yearInput.value);
                if (!parsed) {
                    updateCalendarYearInput(store);
                }
            };

            // Click outside handler - usa setTimeout per evitare conflitti con altri handler
            setTimeout(function() {
                document.addEventListener('click', function closeOnOutsideClick(e) {
                    if (yearPicker.hidden) return;
                    if (!yearPicker.contains(e.target) && e.target !== yearInput && (!wrapper || !wrapper.contains(e.target))) {
                        closeYearPicker(store);
                    }
                });
            }, 0);

            updateCalendarYearInput(store);
        }

        async function init(store) {
            const root = store.getState('root');
            if (!root) {
                console.error('Detail panel: root è obbligatorio');
                return;
            }

            const detailPanelElement = root.querySelector('#detail-panel');
            const listSectionElement = root.querySelector('#listSection');

            if (!detailPanelElement || !listSectionElement) {
                console.error('Detail panel: elementi non trovati');
                return;
            }

            store.setState('detailPanelElement', detailPanelElement);
            store.setState('listSectionElement', listSectionElement);
            store.setState('clearPeriodSelection', clearPeriodSelection);
            store.setState('loadCalendarData', loadCalendarData);
            store.setState('openDetailPanel', openDetailPanel);

            loadPanelContent(store).then(() => {
                detailPanelElement.classList.add('panel-open');
                listSectionElement.classList.add('panel-open');

                // Setup year picker
                setupYearPicker(store);

                // Renderizza il calendario 
                renderCalendar(store);
                
                // Applica selezione "oggi" di default al primo caricamento
                applyDefaultTodaySelection(store);
            });
        }

        return {
            init: init,
            open: openDetailPanel,
            close: closeDetailPanel,
            loadCalendarData: loadCalendarData,
            renderCalendar: renderCalendar,
            clearPeriodSelection: clearPeriodSelection
        };
    })();

    // ============================================================================
    // 5. FILTERS MODULE
    // ============================================================================
    const filters = (function() {
        // Config API dentro IIFE
        const API_CONFIG = {
            BASE_URL: 'https://my-genius.it/wp-json/genius/v1',
            ENDPOINT: '/get_leaves',
            TIMEOUT: 30000,
            BEARER_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3Njg5MDc0MjMsImV4cCI6MTc3MDYzNTQyMywidWlkIjoyNjg1LCJ1c2VybmFtZSI6IkdOR01aTzA0RTEzWjM1NEUifQ.3AV7DDRUf1AgRJyPh_cvDd3u9_Gf7-YOSEX-KfUIAEg'
        };

        async function fetchLeaveAdminScreenConfig(store) {
            try {
                const url = `${API_CONFIG.BASE_URL}/leave_admin_screen_config`;
                console.log('[FILTERS] Chiamata a /leave_admin_screen_config:', url);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.BEARER_TOKEN}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Errore HTTP: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();

                if (!result || typeof result !== 'object') {
                    throw new Error('Risposta API non valida: formato non riconosciuto');
                }

                console.log('[FILTERS] Configurazione ricevuta:', result);
                return result;
            } catch (error) {
                console.error('[FILTERS] Errore nel recupero della configurazione:', error);
                throw error;
            }
        }

        function verifyFilterBarStructure(store) {
            const root = store.getState('root');
            if (!root) {
                console.error('Root non inizializzato');
                return false;
            }
            const container = root.querySelector('#filterBarContainer');
            if (!container) {
                console.error('FilterBarContainer non trovato nel DOM');
                return false;
            }
            const existingContainer = container.querySelector('.filter-bar-container');
            if (existingContainer) {
                store.setState('filterBarLoaded', true);
                return true;
            }
            console.error('FilterBarContainer non contiene .filter-bar-container');
            return false;
        }

        function buildApiParams(store) {
            const root = store.getState('root');
            if (!root) return { status: [1, 2] };
            
            const params = {
                status: [1, 2]
            };

            const searchInput = root.querySelector('#filterSearch');
            if (searchInput && searchInput.value.trim()) {
                params.nome = searchInput.value.trim();
            }

            const typeSelect = root.querySelector('#filterType');
            if (typeSelect && typeSelect.value) {
                const typeOption = typeSelect.selectedOptions[0];
                if (typeOption) {
                    const typeIdAttr = typeOption.getAttribute('data-type-id');
                    if (typeIdAttr) {
                        params.type_id = parseInt(typeIdAttr, 10);
                    } else {
                        const typeName = typeSelect.value;
                        const typeMap = {
                            'Ferie': 1,
                            'FERIE': 1,
                            'Permessi': 2,
                            'Permesso': 2,
                            'PERMESSO': 2,
                            'PERMESSI': 2
                        };
                        const mappedId = typeMap[typeName];
                        if (mappedId) {
                            params.type_id = mappedId;
                        }
                    }
                }
            }

            const repartoSelect = root.querySelector('#filterReparto');
            if (repartoSelect && repartoSelect.value) {
                const repartoOption = repartoSelect.selectedOptions[0];
                if (repartoOption) {
                    const deptId = repartoOption.getAttribute('data-department-id');
                    if (deptId) {
                        params.department_id = parseInt(deptId, 10);
                    } else {
                        const repartoName = repartoSelect.value;
                        const allRequestsData = store.getState('allRequestsData');
                        const repartoItem = (allRequestsData || []).find(req => 
                            (req.department_name || req.reparto) === repartoName
                        );
                        if (repartoItem && repartoItem.department_id) {
                            params.department_id = repartoItem.department_id;
                        }
                    }
                }
            }

            const mansioneSelect = root.querySelector('#filterMansione');
            if (mansioneSelect && mansioneSelect.value) {
                const mansioneOption = mansioneSelect.selectedOptions[0];
                if (mansioneOption) {
                    const taskId = mansioneOption.getAttribute('data-task-id');
                    if (taskId) {
                        params.task_id = parseInt(taskId, 10);
                    } else {
                        const mansioneName = mansioneSelect.value;
                        const allRequestsData = store.getState('allRequestsData');
                        const mansioneItem = (allRequestsData || []).find(req => 
                            (req.task_name || req.mansione) === mansioneName
                        );
                        if (mansioneItem && mansioneItem.task_id) {
                            params.task_id = mansioneItem.task_id;
                        }
                    }
                }
            }

            const statoSelect = root.querySelector('#filterStato');
            if (statoSelect && statoSelect.value) {
                const statoOption = statoSelect.selectedOptions[0];
                if (statoOption) {
                    const statusIdAttr = statoOption.getAttribute('data-status-id');
                    if (statusIdAttr) {
                        params.status = [parseInt(statusIdAttr, 10)];
                    } else {
                        const statusValue = parseInt(statoSelect.value, 10);
                        if (!isNaN(statusValue)) {
                            params.status = [statusValue];
                        }
                    }
                }
            }

            const selectedPeriod = store.getState('selectedPeriod');
            if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
                const startDate = new Date(selectedPeriod.startDate);
                const endDate = new Date(selectedPeriod.endDate);
                
                const formatDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };
                
                params.data_inizio = formatDate(startDate);
                params.data_fine = formatDate(endDate);
            }

            const sortSelect = root.querySelector('#filterSort');
            if (sortSelect && sortSelect.value) {
                const sortValue = sortSelect.value;
                if (sortValue === 'data-recente') {
                    params.sort_by = 'dataInizio';
                    params.sort_order = 'desc';
                } else if (sortValue === 'urgenza-decrescente') {
                    params.sort_by = 'dataInizio';
                    params.sort_order = 'asc';
                }
            }

            return params;
        }

        async function fetchLeavesRequestsWithFilters(store, params) {
            try {
                const queryParams = new URLSearchParams();
                
                if (Array.isArray(params.status)) {
                    queryParams.append('status', params.status.join(','));
                } else if (params.status !== undefined) {
                    queryParams.append('status', params.status.toString());
                }
                
                if (params.nome) {
                    queryParams.append('nome', params.nome);
                }
                if (params.type_id !== undefined) {
                    queryParams.append('type_id', params.type_id.toString());
                }
                if (params.department_id !== undefined) {
                    queryParams.append('department_id', params.department_id.toString());
                }
                if (params.task_id !== undefined) {
                    queryParams.append('task_id', params.task_id.toString());
                }
                if (params.data_inizio) {
                    queryParams.append('data_inizio', params.data_inizio);
                }
                if (params.data_fine) {
                    queryParams.append('data_fine', params.data_fine);
                }
                if (params.sort_by) {
                    queryParams.append('sort_by', params.sort_by);
                }
                if (params.sort_order) {
                    queryParams.append('sort_order', params.sort_order);
                }
                
                const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}?${queryParams.toString()}`;
                
                console.log('🔵 API Request URL:', url);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_CONFIG.BEARER_TOKEN}`
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Errore API: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                
                console.log('🟢 API Response:', result);

                let finalData = [];
                if (result && typeof result === 'object') {
                    if (result.items && Array.isArray(result.items)) {
                        finalData = result.items;
                    }
                    else if (result.success !== undefined && result.data) {
                        finalData = Array.isArray(result.data) ? result.data : [];
                    } else if (Array.isArray(result)) {
                        finalData = result;
                    } else {
                        throw new Error('Formato risposta API non riconosciuto');
                    }
                }

                return finalData;
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error('Timeout: la richiesta ha impiegato troppo tempo');
                }
                console.error('Errore nella chiamata API:', error);
                throw error;
            }
        }

        function getUniqueValues(data, key) {
            if (!Array.isArray(data) || data.length === 0) {
                return [];
            }

            const values = data
                .map(item => item[key])
                .filter(value => value !== null && value !== undefined && value !== '')
                .map(value => String(value).trim())
                .filter(value => value !== '');

            const uniqueValues = [...new Set(values)].sort((a, b) => {
                return a.localeCompare(b, 'it', { sensitivity: 'base' });
            });

            return uniqueValues;
        }

        function getUniqueValuesWithIds(data, nameKey, idKey, fallbackNameKey = null) {
            if (!Array.isArray(data) || data.length === 0) {
                return [];
            }

            const nameToIdMap = new Map();

            data.forEach(item => {
                const name = item[nameKey] || (fallbackNameKey ? item[fallbackNameKey] : null);
                const id = item[idKey] || null;

                if (name !== null && name !== undefined && name !== '') {
                    const nameStr = String(name).trim();
                    if (nameStr !== '') {
                        if (!nameToIdMap.has(nameStr)) {
                            nameToIdMap.set(nameStr, id);
                        } else {
                            const existingId = nameToIdMap.get(nameStr);
                            if ((existingId === null || existingId === undefined) && id !== null && id !== undefined) {
                                nameToIdMap.set(nameStr, id);
                            }
                        }
                    }
                }
            });

            const result = Array.from(nameToIdMap.entries())
                .map(([name, id]) => ({ name, id }))
                .sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }));

            return result;
        }

        function countUniqueReparti(requestsData) {
            if (!Array.isArray(requestsData) || requestsData.length === 0) {
                return 0;
            }
            const repartiSet = new Set();
            requestsData.forEach(item => {
                const reparto = item.department_name || item.reparto;
                if (reparto && String(reparto).trim() !== '') {
                    repartiSet.add(String(reparto).trim());
                }
            });
            return repartiSet.size;
        }

        function countUniqueMansioni(requestsData) {
            if (!Array.isArray(requestsData) || requestsData.length === 0) {
                return 0;
            }
            const mansioniSet = new Set();
            requestsData.forEach(item => {
                const mansione = item.task_name || item.mansione;
                if (mansione && String(mansione).trim() !== '') {
                    mansioniSet.add(String(mansione).trim());
                }
            });
            return mansioniSet.size;
        }

        function getStatusString(status) {
            if (status === 1) return 'Approvato';
            if (status === 2) return 'Rifiutato';
            if (status === 0) return 'In Attesa';
            return 'Sconosciuto';
        }

        function buildStatusFilter(store) {
            const root = store.getState('root');
            if (!root) return false;
            
            const statoSelect = root.querySelector('#filterStato');
            if (!statoSelect) {
                console.warn('[FILTERS] buildStatusFilter: filterStato non trovato nel DOM');
                return false;
            }

            const currentValue = statoSelect.value;

            statoSelect.innerHTML = '';
            const newDefaultOption = document.createElement('option');
            newDefaultOption.value = '';
            newDefaultOption.textContent = 'Tutti';
            statoSelect.appendChild(newDefaultOption);

            const approvatoOption = document.createElement('option');
            approvatoOption.value = '1';
            approvatoOption.textContent = 'Approvato';
            approvatoOption.setAttribute('data-status-id', '1');
            statoSelect.appendChild(approvatoOption);

            const rifiutatoOption = document.createElement('option');
            rifiutatoOption.value = '2';
            rifiutatoOption.textContent = 'Rifiutato';
            rifiutatoOption.setAttribute('data-status-id', '2');
            statoSelect.appendChild(rifiutatoOption);

            if (currentValue) {
                const optionExists = Array.from(statoSelect.options).some(
                    opt => opt.value === currentValue
                );
                if (optionExists) {
                    statoSelect.value = currentValue;
                } else {
                    statoSelect.value = '';
                }
            } else {
                statoSelect.value = '';
            }

            console.log('[FILTERS] Filtro Stato popolato con valori hardcodati');
            return true;
        }

        function buildFiltersFromConfig(store, configData) {
            const root = store.getState('root');
            if (!root || !configData || typeof configData !== 'object') {
                console.warn('[FILTERS] buildFiltersFromConfig: configData non valido');
                return false;
            }

            let success = false;

            const tipoSelect = root.querySelector('#filterType');
            if (tipoSelect && Array.isArray(configData.types) && configData.types.length > 0) {
                const currentValue = tipoSelect.value;
                tipoSelect.innerHTML = '';
                const newDefaultOption = document.createElement('option');
                newDefaultOption.value = '';
                newDefaultOption.textContent = 'Tutti';
                tipoSelect.appendChild(newDefaultOption);

                configData.types.forEach(function(type) {
                    if (type && type.type_id !== undefined && type.type_name) {
                        const option = document.createElement('option');
                        option.value = type.type_name;
                        option.textContent = type.type_name;
                        option.setAttribute('data-type-id', type.type_id.toString());
                        tipoSelect.appendChild(option);
                    }
                });

                if (currentValue && Array.from(tipoSelect.options).some(opt => opt.value === currentValue)) {
                    tipoSelect.value = currentValue;
                } else {
                    tipoSelect.value = '';
                }
                success = true;
            }

            const repartoSelect = root.querySelector('#filterReparto');
            if (repartoSelect && Array.isArray(configData.blocks) && configData.blocks.length > 0) {
                const currentValue = repartoSelect.value;
                repartoSelect.innerHTML = '';
                const newDefaultOption = document.createElement('option');
                newDefaultOption.value = '';
                newDefaultOption.textContent = 'Tutti';
                repartoSelect.appendChild(newDefaultOption);

                configData.blocks.forEach(function(block) {
                    if (block && block.code !== undefined && block.pretty_name) {
                        const option = document.createElement('option');
                        option.value = block.pretty_name;
                        option.textContent = block.pretty_name;
                        option.setAttribute('data-department-id', block.code.toString());
                        if (block.color) option.setAttribute('data-color', block.color);
                        repartoSelect.appendChild(option);
                    }
                });

                if (currentValue && Array.from(repartoSelect.options).some(opt => opt.value === currentValue)) {
                    repartoSelect.value = currentValue;
                } else {
                    repartoSelect.value = '';
                }
                success = true;
            }

            const mansioneSelect = root.querySelector('#filterMansione');
            if (mansioneSelect && Array.isArray(configData.tasks) && configData.tasks.length > 0) {
                const currentValue = mansioneSelect.value;
                mansioneSelect.innerHTML = '';
                const newDefaultOption = document.createElement('option');
                newDefaultOption.value = '';
                newDefaultOption.textContent = 'Tutti';
                mansioneSelect.appendChild(newDefaultOption);

                configData.tasks.forEach(function(task) {
                    if (task) {
                        const taskId = task.task_id !== undefined ? task.task_id : (task.id !== undefined ? task.id : null);
                        const taskName = task.task_name || task.name || task.pretty_name || null;
                        
                        if (taskName) {
                            const option = document.createElement('option');
                            option.value = taskName;
                            option.textContent = taskName;
                            if (taskId !== null) option.setAttribute('data-task-id', taskId.toString());
                            if (task.color) option.setAttribute('data-color', task.color);
                            mansioneSelect.appendChild(option);
                        }
                    }
                });

                if (currentValue && Array.from(mansioneSelect.options).some(opt => opt.value === currentValue)) {
                    mansioneSelect.value = currentValue;
                } else {
                    mansioneSelect.value = '';
                }
                success = true;
            }

            buildStatusFilter(store);

            const repartoSelectFromConfig = root.querySelector('#filterReparto');
            if (repartoSelectFromConfig) {
                const repartoFilterGroup = repartoSelectFromConfig.closest('.filter-group');
                if (repartoFilterGroup) {
                    const repartiCount = Array.isArray(configData.blocks) ? configData.blocks.length : 0;
                    if (repartiCount < 2) {
                        repartoFilterGroup.classList.add('hidden');
                        repartoSelectFromConfig.value = '';
                    } else {
                        repartoFilterGroup.classList.remove('hidden');
                    }
                }
            }

            const mansioneSelectFromConfig = root.querySelector('#filterMansione');
            if (mansioneSelectFromConfig) {
                const mansioneFilterGroup = mansioneSelectFromConfig.closest('.filter-group');
                if (mansioneFilterGroup) {
                    const mansioniCount = Array.isArray(configData.tasks) ? configData.tasks.length : 0;
                    if (mansioniCount < 2) {
                        mansioneFilterGroup.classList.add('hidden');
                        mansioneSelectFromConfig.value = '';
                    } else {
                        mansioneFilterGroup.classList.remove('hidden');
                    }
                }
            }

            return success;
        }

        function updateFilterOptions(store, requests) {
            const root = store.getState('root');
            if (!root || !Array.isArray(requests)) return;

            const filterConfigs = [
                {
                    id: 'filterReparto',
                    nameKey: 'department_name',
                    idKey: 'department_id',
                    dataAttribute: 'data-department-id'
                },
                {
                    id: 'filterMansione',
                    nameKey: 'task_name',
                    idKey: 'task_id',
                    dataAttribute: 'data-task-id'
                },
                {
                    id: 'filterType',
                    nameKey: 'type_name',
                    idKey: 'type',
                    dataAttribute: 'data-type-id'
                }
            ];

            filterConfigs.forEach(config => {
                const select = root.querySelector('#' + config.id);
                if(!select) return;
                
                const currentVal = select.value;
                select.innerHTML = '<option value="">Tutti</option>';
                
                const uniqueItems = new Map();
                requests.forEach(r => {
                    const name = r[config.nameKey];
                    const id = r[config.idKey];
                    if(name) uniqueItems.set(name, id);
                });

                Array.from(uniqueItems.keys()).sort().forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    option.setAttribute(config.dataAttribute, uniqueItems.get(name));
                    select.appendChild(option);
                });

                if(currentVal) select.value = currentVal;
            });

            const statusSelect = root.querySelector('#filterStato');
            if(statusSelect) {
                const currentVal = statusSelect.value;
                statusSelect.innerHTML = '<option value="">Tutti</option>';
                
                const uniqueStatuses = new Set(requests.map(r => getStatusString(r.status)));
                uniqueStatuses.forEach(statusStr => {
                    const option = document.createElement('option');
                    option.value = statusStr;
                    option.textContent = statusStr;
                    statusSelect.appendChild(option);
                });
                if(currentVal) statusSelect.value = currentVal;
            }

            const repartoCount = countUniqueReparti(requests);
            const repartoSelect = root.querySelector('#filterReparto');
            if (repartoSelect) {
                const repartoFilterGroup = repartoSelect.closest('.filter-group');
                if (repartoFilterGroup) {
                    if (repartoCount < 2) {
                        repartoFilterGroup.classList.add('hidden');
                        repartoSelect.value = '';
                    } else {
                        repartoFilterGroup.classList.remove('hidden');
                    }
                }
            }

            const mansioneCount = countUniqueMansioni(requests);
            const mansioneSelect = root.querySelector('#filterMansione');
            if (mansioneSelect) {
                const mansioneFilterGroup = mansioneSelect.closest('.filter-group');
                if (mansioneFilterGroup) {
                    if (mansioneCount < 2) {
                        mansioneFilterGroup.classList.add('hidden');
                        mansioneSelect.value = '';
                    } else {
                        mansioneFilterGroup.classList.remove('hidden');
                    }
                }
            }
        }

        function setFiltersEnabled(store, enabled) {
            const root = store.getState('root');
            const filterElements = [
                'filterSearch',
                'filterType',
                'filterStato',
                'filterReparto',
                'filterMansione',
                'filterSort',
                'filterReset'
            ];
            
            filterElements.forEach(elementId => {
                const element = root.querySelector('#' + elementId);
                if (element) {
                    element.disabled = !enabled;
                }
            });
            
            const filterBarContainer = root.querySelector('.filter-bar-container');
            if (filterBarContainer) {
                if (enabled) {
                    filterBarContainer.classList.remove('filters-disabled');
                } else {
                    filterBarContainer.classList.add('filters-disabled');
                }
            }
        }

        function showFilterSpinner(store) {
            const root = store.getState('root');
            const filterBarContainer = root.querySelector('.filter-bar-container');
            if (!filterBarContainer) return;

            const existingSpinner = filterBarContainer.querySelector('.filter-spinner-container');
            if (existingSpinner) {
                existingSpinner.remove();
            }

            const spinnerContainer = document.createElement('div');
            spinnerContainer.className = 'filter-spinner-container';
            spinnerContainer.innerHTML = `
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Caricamento...</span>
                </div>
            `;
            
            filterBarContainer.appendChild(spinnerContainer);
        }

        function hideFilterSpinner(store) {
            const root = store.getState('root');
            const filterBarContainer = root.querySelector('.filter-bar-container');
            if (!filterBarContainer) return;

            const spinnerContainer = filterBarContainer.querySelector('.filter-spinner-container');
            if (spinnerContainer) {
                spinnerContainer.remove();
            }
        }

        function showListSpinner(store) {
            const root = store.getState('root');
            const approvalList = root.querySelector('#approvalList');
            if (!approvalList) return;

            approvalList.innerHTML = '';
            
            const spinnerContainer = document.createElement('div');
            spinnerContainer.className = 'list-spinner-container';
            spinnerContainer.innerHTML = `
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Caricamento...</span>
                </div>
            `;
            
            approvalList.appendChild(spinnerContainer);
        }

        function hideListSpinner(store) {
            const root = store.getState('root');
            const approvalList = root.querySelector('#approvalList');
            if (!approvalList) return;

            const spinnerContainer = approvalList.querySelector('.list-spinner-container');
            if (spinnerContainer) {
                spinnerContainer.remove();
            }
        }

        function showPeriodSelectionMessage(store) {
            const root = store.getState('root');
            const approvalList = root.querySelector('#approvalList');
            if (!approvalList) return;

            approvalList.innerHTML = '';
            
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center py-4 text-muted';
            emptyMessage.style.fontSize = '0.917rem';
            emptyMessage.style.padding = '52.8px';
            emptyMessage.style.color = '#666666';
            emptyMessage.textContent = 'Seleziona un periodo dal calendario per visualizzare i giustificativi.';
            approvalList.appendChild(emptyMessage);
        }

        function showEmptyStateMessage(store) {
            const root = store.getState('root');
            const approvalList = root.querySelector('#approvalList');
            if (!approvalList) return;

            approvalList.innerHTML = '';
            
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center py-4 text-muted';
            emptyMessage.style.fontSize = '0.917rem';
            emptyMessage.style.padding = '52.8px';
            emptyMessage.style.color = '#666666';
            emptyMessage.textContent = 'Seleziona un periodo dal calendario per visualizzare i giustificativi.';
            approvalList.appendChild(emptyMessage);
        }

        function renderList(store, data) {
            const root = store.getState('root');
            if (!root) return;
            
            const list = root.querySelector('#approvalList');
            if (!list) return;
            list.innerHTML = '';

            if (data.length === 0) {
                list.innerHTML = '<div class="empty-state-container"><img src="assets/image/desert.png" alt="Nessuna richiesta trovata" class="empty-state-image"></div>';
                return;
            }

            const searchVal = root.querySelector('#filterSearch')?.value.toLowerCase();
            const typeVal = root.querySelector('#filterType')?.value;
            const statoVal = root.querySelector('#filterStato')?.value;
            const repVal = root.querySelector('#filterReparto')?.value;
            
            const filtered = data.filter(item => {
                if(searchVal && !((item.nominativo || item.nome).toLowerCase().includes(searchVal))) return false;
                if(typeVal && (item.type_name || item.tipo_richiesta) !== typeVal) return false;
                if(statoVal && getStatusString(item.status) !== statoVal) return false;
                if(repVal && (item.department_name || item.reparto) !== repVal) return false;
                return true;
            });

            const repartiCount = countUniqueReparti(data);

            if (repartiCount < 2) {
                filtered.forEach(function(requestData) {
                    const row = approvalRow.createApprovalRow(requestData, store);
                    list.appendChild(row);
                });
            } else {
                const groups = {};
                filtered.forEach(req => {
                    const rep = req.department_name || req.reparto || 'Nessun reparto';
                    if (!groups[rep]) groups[rep] = [];
                    groups[rep].push(req);
                });

                Object.keys(groups).sort().forEach(rep => {
                    const label = document.createElement('div');
                    label.className = 'reparto-section-label pt-4';
                    label.textContent = rep.toUpperCase();
                    list.appendChild(label);

                    groups[rep].forEach(req => {
                        list.appendChild(approvalRow.createApprovalRow(req, store));
                    });
                });
            }
            
            initHeaderShadows(store);
        }

        function initHeaderShadows(store) {
            const root = store.getState('root');
            const approvalList = root.querySelector('#approvalList');
            if (!approvalList) return;

            const headers = approvalList.querySelectorAll('.reparto-section-label');
            
            headers.forEach(function(header) {
                let firstRow = header.nextElementSibling;
                while (firstRow && !firstRow.classList.contains('approval-row')) {
                    firstRow = firstRow.nextElementSibling;
                }

                if (!firstRow) {
                    return;
                }

                const updateShadowState = function() {
                    const headerRect = header.getBoundingClientRect();
                    const rowRect = firstRow.getBoundingClientRect();
                    
                    if (rowRect.top < headerRect.bottom) {
                        header.classList.add('has-shadow');
                    } else {
                        header.classList.remove('has-shadow');
                    }
                };

                const handleScroll = function() {
                    updateShadowState();
                };

                approvalList.onscroll = handleScroll;
                
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        updateShadowState();
                    });
                }, {
                    root: approvalList,
                    threshold: [0, 0.1, 0.5, 1]
                });

                observer.observe(firstRow);
                updateShadowState();
            });
        }

        function updateResetButtonState(store) {
            const root = store.getState('root');
            const resetButton = root.querySelector('#filterReset');
            if (!resetButton) return;

            const hasActiveFilters = hasAnyActiveFilters(store);
            resetButton.disabled = !hasActiveFilters;
        }

        function hasAnyActiveFilters(store) {
            const root = store.getState('root');
            const searchValue = root.querySelector('#filterSearch')?.value.trim() || '';
            if (searchValue) return true;

            const typeValue = root.querySelector('#filterType')?.value || '';
            if (typeValue) return true;

            const statoValue = root.querySelector('#filterStato')?.value || '';
            if (statoValue) return true;

            const repartoSelect = root.querySelector('#filterReparto');
            const repartoFilterGroup = repartoSelect?.closest('.filter-group');
            if (repartoSelect && repartoFilterGroup && !repartoFilterGroup.classList.contains('hidden')) {
                const repartoValue = repartoSelect.value || '';
                if (repartoValue) return true;
            }

            const mansioneSelect = root.querySelector('#filterMansione');
            const mansioneFilterGroup = mansioneSelect?.closest('.filter-group');
            if (mansioneSelect && mansioneFilterGroup && !mansioneFilterGroup.classList.contains('hidden')) {
                const mansioneValue = mansioneSelect.value || '';
                if (mansioneValue) return true;
            }

            const selectedPeriod = store.getState('selectedPeriod');
            if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
                return true;
            }

            const sortValue = root.querySelector('#filterSort')?.value || 'data-recente';
            if (sortValue !== 'data-recente') return true;

            return false;
        }

        function updateActiveFiltersChips(store) {
            const root = store.getState('root');
            const container = root.querySelector('#activeFiltersContainer');
            if (!container) return;

            container.innerHTML = '';

            const activeFilters = [];

            const searchValue = root.querySelector('#filterSearch')?.value.trim() || '';
            if (searchValue) {
                activeFilters.push({
                    key: 'search',
                    label: 'Ricerca',
                    value: searchValue,
                    remove: function() {
                        root.querySelector('#filterSearch').value = '';
                        handleFilterChange(store);
                    }
                });
            }

            const typeValue = root.querySelector('#filterType')?.value || '';
            if (typeValue) {
                activeFilters.push({
                    key: 'type',
                    label: 'Tipologia',
                    value: typeValue === 'FERIE' ? 'Ferie' : 'Permessi',
                    remove: function() {
                        root.querySelector('#filterType').value = '';
                        handleFilterChange(store);
                    }
                });
            }

            const statoValue = root.querySelector('#filterStato')?.value || '';
            if (statoValue) {
                activeFilters.push({
                    key: 'stato',
                    label: 'Stato',
                    value: statoValue,
                    remove: function() {
                        root.querySelector('#filterStato').value = '';
                        handleFilterChange(store);
                    }
                });
            }

            const repartoSelect = root.querySelector('#filterReparto');
            const repartoFilterGroup = repartoSelect?.closest('.filter-group');
            if (repartoSelect && repartoFilterGroup && !repartoFilterGroup.classList.contains('hidden')) {
                const repartoValue = repartoSelect.value || '';
                if (repartoValue) {
                    activeFilters.push({
                        key: 'reparto',
                        label: 'Reparto',
                        value: repartoValue,
                        remove: function() {
                            repartoSelect.value = '';
                            handleFilterChange(store);
                        }
                    });
                }
            }

            const mansioneSelect = root.querySelector('#filterMansione');
            const mansioneFilterGroup = mansioneSelect?.closest('.filter-group');
            if (mansioneSelect && mansioneFilterGroup && !mansioneFilterGroup.classList.contains('hidden')) {
                const mansioneValue = mansioneSelect.value || '';
                if (mansioneValue) {
                    activeFilters.push({
                        key: 'mansione',
                        label: 'Mansione',
                        value: mansioneValue,
                        remove: function() {
                            mansioneSelect.value = '';
                            handleFilterChange(store);
                        }
                    });
                }
            }

            const selectedPeriod = store.getState('selectedPeriod');
            if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
                const startDate = new Date(selectedPeriod.startDate);
                const endDate = new Date(selectedPeriod.endDate);
                const formatDate = (date) => {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                };
                activeFilters.push({
                    key: 'periodo',
                    label: 'Periodo',
                    value: `${formatDate(startDate)} al ${formatDate(endDate)}`,
                    remove: function() {
                        const clearPeriodSelection = store.getState('clearPeriodSelection');
                        if (clearPeriodSelection) {
                            clearPeriodSelection(store);
                        }
                        handleFilterChange(store);
                    }
                });
            }

            const sortValue = root.querySelector('#filterSort')?.value || 'data-recente';
            if (sortValue !== 'data-recente') {
                activeFilters.push({
                    key: 'sort',
                    label: 'Ordinamento',
                    value: sortValue === 'urgenza-decrescente' ? 'Richiesta meno recente' : sortValue,
                    remove: function() {
                        root.querySelector('#filterSort').value = 'data-recente';
                        handleFilterChange(store);
                    }
                });
            }

            activeFilters.forEach(filter => {
                const chip = document.createElement('div');
                chip.className = 'filter-chip';
                
                const label = document.createElement('span');
                label.className = 'filter-chip-label';
                label.textContent = filter.label + ': ';
                
                const value = document.createElement('span');
                value.className = 'filter-chip-value';
                value.textContent = filter.value;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'filter-chip-remove';
                removeBtn.setAttribute('aria-label', 'Rimuovi filtro ' + filter.label);
                removeBtn.setAttribute('type', 'button');
                const icon = document.createElement('i');
                icon.className = 'bi bi-x';
                removeBtn.appendChild(icon);
                removeBtn.onclick = filter.remove;
                
                chip.appendChild(label);
                chip.appendChild(value);
                chip.appendChild(removeBtn);
                
                container.appendChild(chip);
            });
        }

        async function loadDayData(store, selectedDate) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const normalizedDate = new Date(selectedDate);
                    normalizedDate.setHours(0, 0, 0, 0);
                    
                    const allData = store.getState('allCalendarData') || [];
                    
                    const dayRequests = allData.filter(request => {
                        if (request.data_numerica) {
                            const requestDate = new Date(request.data_numerica);
                            requestDate.setHours(0, 0, 0, 0);
                            if (requestDate.getTime() === normalizedDate.getTime()) {
                                return true;
                            }
                        }
                        
                        if (request.moorea_obj && request.moorea_obj.leaves && Array.isArray(request.moorea_obj.leaves)) {
                            for (const leave of request.moorea_obj.leaves) {
                                const leaveStartDate = leave.dataInizio ? new Date(leave.dataInizio + 'T00:00:00') : null;
                                const leaveEndDate = leave.dataFine ? new Date(leave.dataFine + 'T00:00:00') : null;
                                
                                if (leaveStartDate && !isNaN(leaveStartDate.getTime())) {
                                    leaveStartDate.setHours(0, 0, 0, 0);
                                    if (leaveStartDate.getTime() === normalizedDate.getTime()) {
                                        return true;
                                    }
                                }
                                
                                if (leaveStartDate && leaveEndDate && !isNaN(leaveStartDate.getTime()) && !isNaN(leaveEndDate.getTime())) {
                                    leaveStartDate.setHours(0, 0, 0, 0);
                                    leaveEndDate.setHours(23, 59, 59, 999);
                                    if (normalizedDate >= leaveStartDate && normalizedDate <= leaveEndDate) {
                                        return true;
                                    }
                                }
                            }
                        }
                        
                        return false;
                    });
                    
                    resolve(dayRequests);
                }, 2000);
            });
        }

        async function loadAndDisplayDayData(store, selectedDate) {
            const selectedPeriod = store.getState('selectedPeriod');
            if (selectedPeriod && selectedPeriod.startDate && selectedPeriod.endDate) {
                return;
            }
            
            showFilterSpinner(store);
            showListSpinner(store);

            try {
                const dayRequests = await loadDayData(store, selectedDate);

                const currentSelectedPeriod = store.getState('selectedPeriod');
                if (currentSelectedPeriod && currentSelectedPeriod.startDate && currentSelectedPeriod.endDate) {
                    return;
                }

                store.setState('allRequestsData', [...dayRequests]);
                store.setState('filteredRequestsData', [...dayRequests]);

                const filterOptionsData = store.getState('filterOptionsData');
                if (!filterOptionsData || filterOptionsData.length === 0) {
                    store.setState('filterOptionsData', [...dayRequests]);
                    updateFilterOptions(store, dayRequests);
                }

                if (dayRequests && dayRequests.length > 0) {
                    setFiltersEnabled(store, true);
                } else {
                    setFiltersEnabled(store, false);
                }

                renderList(store, store.getState('filteredRequestsData'));

                updateActiveFiltersChips(store);
                updateResetButtonState(store);

            } catch (error) {
                console.error('Errore nel caricamento dati del giorno:', error);
                setFiltersEnabled(store, false);
                
                const root = store.getState('root');
                const approvalList = root.querySelector('#approvalList');
                if (approvalList) {
                    approvalList.innerHTML = '';
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'text-center py-4 text-danger';
                    errorMessage.style.fontSize = '0.917rem';
                    errorMessage.style.padding = '52.8px';
                    errorMessage.textContent = 'Errore nel caricamento dei dati. Riprova.';
                    approvalList.appendChild(errorMessage);
                }
            } finally {
                hideFilterSpinner(store);
                hideListSpinner(store);
            }
        }

        async function handleFilterChange(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const selectedPeriod = store.getState('selectedPeriod');
            if (!selectedPeriod || !selectedPeriod.startDate || !selectedPeriod.endDate) {
                setFiltersEnabled(store, false);
                showPeriodSelectionMessage(store);
                updateActiveFiltersChips(store);
                updateResetButtonState(store);
                return;
            }
            
            showFilterSpinner(store);
            showListSpinner(store);
            
            try {
                const params = buildApiParams(store);
                const apiData = await fetchLeavesRequestsWithFilters(store, params);
                
                store.setState('allRequestsData', [...apiData]);
                store.setState('filteredRequestsData', [...apiData]);
                
                renderList(store, store.getState('filteredRequestsData'));
                
                updateActiveFiltersChips(store);
                updateResetButtonState(store);
                
                setFiltersEnabled(store, true);
                
            } catch (error) {
                console.error('Errore nel caricamento dati:', error);
                setFiltersEnabled(store, false);
                
                const approvalList = root.querySelector('#approvalList');
                if (approvalList) {
                    approvalList.innerHTML = '';
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'text-center py-4 text-danger';
                    errorMessage.style.padding = '52.8px';
                    errorMessage.textContent = `Errore nel caricamento: ${error.message}`;
                    approvalList.appendChild(errorMessage);
                }
            } finally {
                hideFilterSpinner(store);
                hideListSpinner(store);
            }
        }

        function handleSearchChange(store) {
            const debounceTimer = store.getState('searchDebounceTimer');
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            const newTimer = setTimeout(function() {
                handleFilterChange(store);
            }, 2000);
            
            store.setState('searchDebounceTimer', newTimer);
        }

        async function clearAllFilters(store) {
            const root = store.getState('root');
            const searchInput = root.querySelector('#filterSearch');
            if (searchInput) searchInput.value = '';

            const typeSelect = root.querySelector('#filterType');
            if (typeSelect) typeSelect.value = '';

            const statoSelect = root.querySelector('#filterStato');
            if (statoSelect) statoSelect.value = '';
            buildStatusFilter(store);

            const repartoSelect = root.querySelector('#filterReparto');
            if (repartoSelect) repartoSelect.value = '';

            const mansioneSelect = root.querySelector('#filterMansione');
            if (mansioneSelect) mansioneSelect.value = '';

            store.setState('selectedPeriod', null);
            const clearPeriodSelection = store.getState('clearPeriodSelection');
            if (clearPeriodSelection) {
                clearPeriodSelection(store);
            }

            const sortSelect = root.querySelector('#filterSort');
            if (sortSelect) sortSelect.value = 'data-recente';

            try {
                const configData = await fetchLeaveAdminScreenConfig(store);
                if (configData && typeof configData === 'object') {
                    buildFiltersFromConfig(store, configData);
                } else {
                    const filterOptionsData = store.getState('filterOptionsData');
                    if (filterOptionsData && filterOptionsData.length > 0) {
                        updateFilterOptions(store, filterOptionsData);
                        buildStatusFilter(store);
                    }
                }
            } catch (error) {
                console.error('[FILTERS] Reset filtri: errore nel caricamento config, uso fallback:', error);
                const filterOptionsData = store.getState('filterOptionsData');
                if (filterOptionsData && filterOptionsData.length > 0) {
                    updateFilterOptions(store, filterOptionsData);
                    buildStatusFilter(store);
                }
            }

            handleFilterChange(store);
        }

        function setupFilterListeners(store) {
            const root = store.getState('root');
            if (!root) return;
            
            const searchInput = root.querySelector('#filterSearch');
            if (searchInput) {
                searchInput.oninput = function() {
                    handleSearchChange(store);
                };
            }

            const typeSelect = root.querySelector('#filterType');
            if (typeSelect) {
                typeSelect.onchange = function() {
                    handleFilterChange(store);
                };
            }

            const statoSelect = root.querySelector('#filterStato');
            if (statoSelect) {
                statoSelect.onchange = function() {
                    handleFilterChange(store);
                };
            }

            const repartoSelect = root.querySelector('#filterReparto');
            if (repartoSelect) {
                repartoSelect.onchange = function() {
                    handleFilterChange(store);
                };
            }

            const mansioneSelect = root.querySelector('#filterMansione');
            if (mansioneSelect) {
                mansioneSelect.onchange = function() {
                    handleFilterChange(store);
                };
            }

            const sortSelect = root.querySelector('#filterSort');
            if (sortSelect) {
                sortSelect.onchange = function() {
                    handleFilterChange(store);
                };
            }

            const resetButton = root.querySelector('#filterReset');
            if (resetButton) {
                resetButton.onclick = function() {
                    clearAllFilters(store);
                };
            }
        }

        async function init(store, requestsData = []) {
            const root = store.getState('root');
            if (!root) {
                console.error('initFilterBar: root è obbligatorio');
                return;
            }

            if (!verifyFilterBarStructure(store)) {
                console.error('Struttura filter bar non trovata nel DOM');
                return;
            }

            store.setState('handleFilterChange', handleFilterChange);
            store.setState('setFiltersEnabled', setFiltersEnabled);
            store.setState('hideFilterSpinner', hideFilterSpinner);
            store.setState('fetchLeaveAdminScreenConfig', fetchLeaveAdminScreenConfig);
            store.setState('buildFiltersFromConfig', buildFiltersFromConfig);
            store.setState('buildStatusFilter', buildStatusFilter);
            store.setState('loadAndDisplayDayData', loadAndDisplayDayData);

            buildStatusFilter(store);
            setupFilterListeners(store);
            setFiltersEnabled(store, false);

            let configData = null;
            try {
                showFilterSpinner(store);
                configData = await fetchLeaveAdminScreenConfig(store);
                
                if (configData && typeof configData === 'object') {
                    buildFiltersFromConfig(store, configData);
                } else {
                    const allRequestsData = store.getState('allRequestsData');
                    if (allRequestsData && allRequestsData.length > 0) {
                        updateFilterOptions(store, allRequestsData);
                        buildStatusFilter(store);
                    }
                }
            } catch (error) {
                console.warn('Errore config, uso fallback:', error);
                const allRequestsData = store.getState('allRequestsData');
                if (allRequestsData && allRequestsData.length > 0) {
                    updateFilterOptions(store, allRequestsData);
                    buildStatusFilter(store);
                }
            } finally {
                hideFilterSpinner(store);
                
                const selectedPeriod = store.getState('selectedPeriod');
                if (!selectedPeriod || !selectedPeriod.startDate) {
                    setFiltersEnabled(store, false); 
                    showPeriodSelectionMessage(store);
                    return;
                }
            }

            try {
                handleFilterChange(store);
            } catch (error) {
                console.error('Errore init:', error);
                showEmptyStateMessage(store);
            }
        }

        return {
            init: init,
            handleFilterChange: handleFilterChange,
            setFiltersEnabled: setFiltersEnabled,
            hideFilterSpinner: hideFilterSpinner,
            fetchLeaveAdminScreenConfig: fetchLeaveAdminScreenConfig,
            buildFiltersFromConfig: buildFiltersFromConfig,
            buildStatusFilter: buildStatusFilter,
            loadAndDisplayDayData: loadAndDisplayDayData,
            renderList: renderList
        };
    })();

    // ============================================================================
    // 6. API PUBBLICA - Inizializzazione
    // ============================================================================
    window.initLeavesArchive = function(containerElement) {
        if (!containerElement) {
            console.error('initLeavesArchive: containerElement è obbligatorio');
            return;
        }

        const store = LeavesArchiveStore();
        
        // Crea il DOM dal template literal (come in BuyInCloud)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = store.template.trim();
        const rootElement = tempDiv.firstElementChild;
        
        // Inserisce il root nel container
        containerElement.appendChild(rootElement);
        
        store.setState('root', rootElement);

        detailPanel.init(store);
        filters.init(store);
    };

})();
