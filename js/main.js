'use strict';

function initLeavesArchive(containerElement, options) {
    if (!containerElement) {
        console.error('initLeavesArchive: containerElement è obbligatorio');
        return;
    }

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



    const store = hrStore();

    // Crea il DOM dal template literal (come in BuyInCloud)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = store.template.trim();
    const rootElement = tempDiv.firstElementChild;
    
    // Inserisce il root nel container
    containerElement.appendChild(rootElement);
    
    store.setState('root', rootElement);
    
    return store;
}
