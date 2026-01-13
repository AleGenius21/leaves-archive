// Funzione helper per convertire timestamp in YYYY-MM-DD
function timestampToDateString(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Funzione helper per creare moorea_obj da dati legacy
function createMooreaObj(tipo_richiesta, ore, data_numerica, orario_inizio, orario_fine, assunzione_id, persona_id) {
    const causaleId = tipo_richiesta === 'FERIE' ? 16443 : 16444;
    const dateStr = timestampToDateString(data_numerica);
    const hoursPerDay = 8; // Default 8 ore per giorno
    const days = Math.ceil(ore / hoursPerDay);
    
    // Crea array leaves
    const leaves = [];
    for (let i = 0; i < days; i++) {
        const leaveDate = new Date(data_numerica);
        leaveDate.setDate(leaveDate.getDate() + i);
        const leaveDateStr = timestampToDateString(leaveDate.getTime());
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
        
        // Se ci sono orari (solo per PERMESSO), aggiungili
        if (orario_inizio && orario_fine && tipo_richiesta === 'PERMESSO' && i === 0) {
            leave.orarioInizio = orario_inizio;
            leave.orarioFine = orario_fine;
            leave.interaGiornata = 0;
        }
        
        leaves.push(leave);
    }
    
    // Crea meta
    const meta = {
        hours: ore,
        days: days,
        leave_details_txt: `${ore} ore di ${tipo_richiesta}`
    };
    
    return {
        meta: meta,
        leaves: leaves
    };
}

// Funzione helper per formattare la data in formato leggibile (es. "Lun 22 Gen")
function formatDateString(date) {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${dayName} ${day} ${month}`;
}

// Funzione helper per generare date distribuite nel periodo tra oggi e +12 mesi
function generateDateInRange(daysOffset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysOffset);
    return targetDate;
}

// Dati di esempio per archivio (solo Approvato/Rifiutato, distribuiti tra oggi e +12 mesi)
const sampleData = [
    {
        id: "3",
        nome: "Giuseppe Verdi",
        immagine: "https://i.pravatar.cc/43?img=3",
        mansione: "Capocantiere",
        cantiere: "Cantiere Torino",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(5);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(5);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "20gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34044,
        persona_id: 4,
        moorea_obj: (() => {
            const date = generateDateInRange(5);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34044, 4);
        })(),
    },
    {
        id: "4",
        nome: "Anna Ferrari",
        immagine: "https://i.pravatar.cc/43?img=4",
        mansione: "Segretaria",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(15);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(15);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "10:00",
        orario_fine: "12:00",
        saldo_residuo: "15gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34045,
        persona_id: 5,
        moorea_obj: (() => {
            const date = generateDateInRange(15);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "10:00", "12:00", 34045, 5);
        })(),
    },
    {
        id: "5",
        nome: "Marco Esposito",
        immagine: "https://i.pravatar.cc/43?img=5",
        mansione: "Operaio",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(30);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(30);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "10gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34046,
        persona_id: 6,
        moorea_obj: (() => {
            const date = generateDateInRange(30);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34046, 6);
        })(),
    },
    {
        id: "7",
        nome: "Luca Colombo",
        immagine: "https://i.pravatar.cc/43?img=7",
        mansione: "Caposquadra",
        cantiere: "Cantiere Milano",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(45);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(45);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "13:00",
        orario_fine: "17:00",
        saldo_residuo: "22gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34048,
        persona_id: 8,
        moorea_obj: (() => {
            const date = generateDateInRange(45);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "13:00", "17:00", 34048, 8);
        })(),
    },
    {
        id: "9",
        nome: "Alessandro Marino",
        immagine: "https://i.pravatar.cc/43?img=9",
        mansione: "Operaio",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(60);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(60);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "09:00",
        orario_fine: "12:00",
        saldo_residuo: "9gg",
        stato: "Rifiutato",
        urgenza: true,
        assunzione_id: 34050,
        persona_id: 10,
        moorea_obj: (() => {
            const date = generateDateInRange(60);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "09:00", "12:00", 34050, 10);
        })(),
    },
    {
        id: "11",
        nome: "Roberto Bruno",
        immagine: "https://i.pravatar.cc/43?img=11",
        mansione: "Capocantiere",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(90);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(90);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "25gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34052,
        persona_id: 12,
        moorea_obj: (() => {
            const date = generateDateInRange(90);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34052, 12);
        })(),
    },
    // Aggiungiamo richieste per altri mesi per testare il calendario
    {
        id: "13",
        nome: "Paolo Neri",
        immagine: "https://i.pravatar.cc/43?img=13",
        mansione: "Magazziniere",
        cantiere: "Cantiere Milano",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(120);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(120);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "15gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34054,
        persona_id: 14,
        moorea_obj: (() => {
            const date = generateDateInRange(120);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34054, 14);
        })(),
    },
    {
        id: "14",
        nome: "Maria Bianchi",
        immagine: "https://i.pravatar.cc/43?img=14",
        mansione: "Segretaria",
        cantiere: "Cantiere Roma",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(150);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(150);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "14:00",
        orario_fine: "18:00",
        saldo_residuo: "12gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34055,
        persona_id: 15,
        moorea_obj: (() => {
            const date = generateDateInRange(150);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "14:00", "18:00", 34055, 15);
        })(),
    },
    {
        id: "15",
        nome: "Gianni Rossi",
        immagine: "https://i.pravatar.cc/43?img=15",
        mansione: "Operaio",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(180);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(180);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "18gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34056,
        persona_id: 16,
        moorea_obj: (() => {
            const date = generateDateInRange(180);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34056, 16);
        })(),
    },
    {
        id: "16",
        nome: "Laura Martini",
        immagine: "https://i.pravatar.cc/43?img=16",
        mansione: "Amministrativa",
        cantiere: "Cantiere Milano",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(240);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(240);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "10:00",
        orario_fine: "12:00",
        saldo_residuo: "20gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34057,
        persona_id: 17,
        moorea_obj: (() => {
            const date = generateDateInRange(240);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "10:00", "12:00", 34057, 17);
        })(),
    },
    {
        id: "17",
        nome: "Francesco Romano",
        immagine: "https://i.pravatar.cc/43?img=17",
        mansione: "Operaio",
        cantiere: "Cantiere Roma",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(10);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(10);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "14gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34058,
        persona_id: 18,
        moorea_obj: (() => {
            const date = generateDateInRange(10);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34058, 18);
        })(),
    },
    {
        id: "18",
        nome: "Sara Conti",
        immagine: "https://i.pravatar.cc/43?img=18",
        mansione: "Segretaria",
        cantiere: "Cantiere Milano",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(75);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(75);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "11:00",
        orario_fine: "14:00",
        saldo_residuo: "11gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34059,
        persona_id: 19,
        moorea_obj: (() => {
            const date = generateDateInRange(75);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "11:00", "14:00", 34059, 19);
        })(),
    },
    {
        id: "19",
        nome: "Davide Galli",
        immagine: "https://i.pravatar.cc/43?img=19",
        mansione: "Caposquadra",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(105);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(105);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "16gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34060,
        persona_id: 20,
        moorea_obj: (() => {
            const date = generateDateInRange(105);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34060, 20);
        })(),
    },
    {
        id: "20",
        nome: "Elena Rizzo",
        immagine: "https://i.pravatar.cc/43?img=20",
        mansione: "Amministrativa",
        cantiere: "Cantiere Roma",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(210);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(210);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "08:00",
        orario_fine: "12:00",
        saldo_residuo: "13gg",
        stato: "Approvato",
        urgenza: true,
        assunzione_id: 34061,
        persona_id: 21,
        moorea_obj: (() => {
            const date = generateDateInRange(210);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "08:00", "12:00", 34061, 21);
        })(),
    },
    {
        id: "21",
        nome: "Stefano Moretti",
        immagine: "https://i.pravatar.cc/43?img=21",
        mansione: "Magazziniere",
        cantiere: "Cantiere Milano",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(300);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(300);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "19gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34062,
        persona_id: 22,
        moorea_obj: (() => {
            const date = generateDateInRange(300);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34062, 22);
        })(),
    },
    {
        id: "22",
        nome: "Chiara Fontana",
        immagine: "https://i.pravatar.cc/43?img=22",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(20);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(20);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "17gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34063,
        persona_id: 23,
        moorea_obj: (() => {
            const date = generateDateInRange(20);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34063, 23);
        })(),
    },
    {
        id: "23",
        nome: "Andrea Santoro",
        immagine: "https://i.pravatar.cc/43?img=23",
        mansione: "Operaio",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(50);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(50);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "15:00",
        orario_fine: "17:00",
        saldo_residuo: "8gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34064,
        persona_id: 24,
        moorea_obj: (() => {
            const date = generateDateInRange(50);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "15:00", "17:00", 34064, 24);
        })(),
    },
    {
        id: "24",
        nome: "Valentina De Luca",
        immagine: "https://i.pravatar.cc/43?img=24",
        mansione: "Amministrativa",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(100);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(100);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "21gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34065,
        persona_id: 25,
        moorea_obj: (() => {
            const date = generateDateInRange(100);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34065, 25);
        })(),
    },
    {
        id: "25",
        nome: "Matteo Ricci",
        immagine: "https://i.pravatar.cc/43?img=25",
        mansione: "Caposquadra",
        cantiere: "Cantiere Torino",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(130);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(130);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "09:00",
        orario_fine: "13:00",
        saldo_residuo: "23gg",
        stato: "Approvato",
        urgenza: true,
        assunzione_id: 34066,
        persona_id: 26,
        moorea_obj: (() => {
            const date = generateDateInRange(130);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "09:00", "13:00", 34066, 26);
        })(),
    },
    {
        id: "26",
        nome: "Simona Greco",
        immagine: "https://i.pravatar.cc/43?img=26",
        mansione: "Magazziniere",
        cantiere: "Cantiere Milano",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(160);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(160);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "7gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34067,
        persona_id: 27,
        moorea_obj: (() => {
            const date = generateDateInRange(160);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34067, 27);
        })(),
    },
    {
        id: "27",
        nome: "Riccardo Lombardi",
        immagine: "https://i.pravatar.cc/43?img=27",
        mansione: "Operaio",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(190);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(190);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "12:00",
        orario_fine: "15:00",
        saldo_residuo: "6gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34068,
        persona_id: 28,
        moorea_obj: (() => {
            const date = generateDateInRange(190);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "12:00", "15:00", 34068, 28);
        })(),
    },
    {
        id: "28",
        nome: "Federica Caruso",
        immagine: "https://i.pravatar.cc/43?img=28",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(220);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(220);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "24gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34069,
        persona_id: 29,
        moorea_obj: (() => {
            const date = generateDateInRange(220);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34069, 29);
        })(),
    },
    {
        id: "29",
        nome: "Lorenzo Ferrara",
        immagine: "https://i.pravatar.cc/43?img=29",
        mansione: "Capocantiere",
        cantiere: "Cantiere Milano",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(250);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(250);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "11:00",
        orario_fine: "13:00",
        saldo_residuo: "26gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34070,
        persona_id: 30,
        moorea_obj: (() => {
            const date = generateDateInRange(250);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "11:00", "13:00", 34070, 30);
        })(),
    },
    {
        id: "30",
        nome: "Alessia Gentile",
        immagine: "https://i.pravatar.cc/43?img=30",
        mansione: "Amministrativa",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(270);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(270);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "5gg",
        stato: "Rifiutato",
        urgenza: true,
        assunzione_id: 34071,
        persona_id: 31,
        moorea_obj: (() => {
            const date = generateDateInRange(270);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34071, 31);
        })(),
    },
    {
        id: "31",
        nome: "Nicola Rinaldi",
        immagine: "https://i.pravatar.cc/43?img=31",
        mansione: "Operaio",
        cantiere: "Cantiere Torino",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(320);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(320);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "14:00",
        orario_fine: "18:00",
        saldo_residuo: "4gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34072,
        persona_id: 32,
        moorea_obj: (() => {
            const date = generateDateInRange(320);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "14:00", "18:00", 34072, 32);
        })(),
    },
    {
        id: "32",
        nome: "Martina Vitale",
        immagine: "https://i.pravatar.cc/43?img=32",
        mansione: "Magazziniere",
        cantiere: "Cantiere Milano",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(25);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(25);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "27gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34073,
        persona_id: 33,
        moorea_obj: (() => {
            const date = generateDateInRange(25);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34073, 33);
        })(),
    },
    {
        id: "33",
        nome: "Gabriele Serafini",
        immagine: "https://i.pravatar.cc/43?img=33",
        mansione: "Caposquadra",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(80);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(80);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "10:00",
        orario_fine: "13:00",
        saldo_residuo: "28gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34074,
        persona_id: 34,
        moorea_obj: (() => {
            const date = generateDateInRange(80);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "10:00", "13:00", 34074, 34);
        })(),
    },
    {
        id: "34",
        nome: "Elisa Mancini",
        immagine: "https://i.pravatar.cc/43?img=34",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(140);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(140);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "3gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34075,
        persona_id: 35,
        moorea_obj: (() => {
            const date = generateDateInRange(140);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34075, 35);
        })(),
    },
    // Record aggiuntivi per creare giorni con più richieste
    {
        id: "35",
        nome: "Marco Pellegrini",
        immagine: "https://i.pravatar.cc/43?img=35",
        mansione: "Operaio",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(5);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(5);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "08:00",
        orario_fine: "10:00",
        saldo_residuo: "29gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34076,
        persona_id: 36,
        moorea_obj: (() => {
            const date = generateDateInRange(5);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "08:00", "10:00", 34076, 36);
        })(),
    },
    {
        id: "36",
        nome: "Giulia Costantini",
        immagine: "https://i.pravatar.cc/43?img=36",
        mansione: "Amministrativa",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(5);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(5);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "30gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34077,
        persona_id: 37,
        moorea_obj: (() => {
            const date = generateDateInRange(5);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34077, 37);
        })(),
    },
    {
        id: "37",
        nome: "Fabio Marchetti",
        immagine: "https://i.pravatar.cc/43?img=37",
        mansione: "Caposquadra",
        cantiere: "Cantiere Torino",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(15);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(15);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "13:00",
        orario_fine: "16:00",
        saldo_residuo: "31gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34078,
        persona_id: 38,
        moorea_obj: (() => {
            const date = generateDateInRange(15);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "13:00", "16:00", 34078, 38);
        })(),
    },
    {
        id: "38",
        nome: "Silvia Barone",
        immagine: "https://i.pravatar.cc/43?img=38",
        mansione: "Segretaria",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(15);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(15);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "32gg",
        stato: "Rifiutato",
        urgenza: true,
        assunzione_id: 34079,
        persona_id: 39,
        moorea_obj: (() => {
            const date = generateDateInRange(15);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34079, 39);
        })(),
    },
    {
        id: "39",
        nome: "Daniele Leone",
        immagine: "https://i.pravatar.cc/43?img=39",
        mansione: "Operaio",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(30);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(30);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "10:00",
        orario_fine: "14:00",
        saldo_residuo: "33gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34080,
        persona_id: 40,
        moorea_obj: (() => {
            const date = generateDateInRange(30);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "10:00", "14:00", 34080, 40);
        })(),
    },
    {
        id: "40",
        nome: "Cristina Ferri",
        immagine: "https://i.pravatar.cc/43?img=40",
        mansione: "Magazziniere",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(30);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(30);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "34gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34081,
        persona_id: 41,
        moorea_obj: (() => {
            const date = generateDateInRange(30);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34081, 41);
        })(),
    },
    {
        id: "41",
        nome: "Alessandro Gatti",
        immagine: "https://i.pravatar.cc/43?img=41",
        mansione: "Capocantiere",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(45);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(45);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "16:00",
        orario_fine: "18:00",
        saldo_residuo: "35gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34082,
        persona_id: 42,
        moorea_obj: (() => {
            const date = generateDateInRange(45);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "16:00", "18:00", 34082, 42);
        })(),
    },
    {
        id: "42",
        nome: "Monica Longo",
        immagine: "https://i.pravatar.cc/43?img=42",
        mansione: "Segretaria",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(45);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(45);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "36gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34083,
        persona_id: 43,
        moorea_obj: (() => {
            const date = generateDateInRange(45);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34083, 43);
        })(),
    },
    {
        id: "43",
        nome: "Roberto Sala",
        immagine: "https://i.pravatar.cc/43?img=43",
        mansione: "Operaio",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(60);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(60);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "15:00",
        orario_fine: "18:00",
        saldo_residuo: "37gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34084,
        persona_id: 44,
        moorea_obj: (() => {
            const date = generateDateInRange(60);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "15:00", "18:00", 34084, 44);
        })(),
    },
    {
        id: "44",
        nome: "Teresa Fiore",
        immagine: "https://i.pravatar.cc/43?img=44",
        mansione: "Amministrativa",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(60);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(60);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "38gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34085,
        persona_id: 45,
        moorea_obj: (() => {
            const date = generateDateInRange(60);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34085, 45);
        })(),
    },
    {
        id: "45",
        nome: "Gianluca Monti",
        immagine: "https://i.pravatar.cc/43?img=45",
        mansione: "Caposquadra",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(90);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(90);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "09:00",
        orario_fine: "13:00",
        saldo_residuo: "39gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34086,
        persona_id: 46,
        moorea_obj: (() => {
            const date = generateDateInRange(90);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "09:00", "13:00", 34086, 46);
        })(),
    },
    {
        id: "46",
        nome: "Vanessa Rizzo",
        immagine: "https://i.pravatar.cc/43?img=46",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(90);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(90);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "40gg",
        stato: "Rifiutato",
        urgenza: true,
        assunzione_id: 34087,
        persona_id: 47,
        moorea_obj: (() => {
            const date = generateDateInRange(90);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34087, 47);
        })(),
    },
    {
        id: "47",
        nome: "Paolo Cattaneo",
        immagine: "https://i.pravatar.cc/43?img=47",
        mansione: "Operaio",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(120);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(120);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "12:00",
        orario_fine: "14:00",
        saldo_residuo: "41gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34088,
        persona_id: 48,
        moorea_obj: (() => {
            const date = generateDateInRange(120);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "12:00", "14:00", 34088, 48);
        })(),
    },
    {
        id: "48",
        nome: "Michela Villa",
        immagine: "https://i.pravatar.cc/43?img=48",
        mansione: "Magazziniere",
        cantiere: "Cantiere Roma",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(120);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(120);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "42gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34089,
        persona_id: 49,
        moorea_obj: (() => {
            const date = generateDateInRange(120);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34089, 49);
        })(),
    },
    {
        id: "49",
        nome: "Massimo De Angelis",
        immagine: "https://i.pravatar.cc/43?img=49",
        mansione: "Capocantiere",
        cantiere: "Cantiere Torino",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(150);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(150);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "11:00",
        orario_fine: "14:00",
        saldo_residuo: "43gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34090,
        persona_id: 50,
        moorea_obj: (() => {
            const date = generateDateInRange(150);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "11:00", "14:00", 34090, 50);
        })(),
    },
    {
        id: "50",
        nome: "Sabrina Palumbo",
        immagine: "https://i.pravatar.cc/43?img=50",
        mansione: "Amministrativa",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(150);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(150);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "44gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34091,
        persona_id: 51,
        moorea_obj: (() => {
            const date = generateDateInRange(150);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34091, 51);
        })(),
    },
    {
        id: "51",
        nome: "Enrico Basile",
        immagine: "https://i.pravatar.cc/43?img=51",
        mansione: "Operaio",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(180);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(180);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "08:00",
        orario_fine: "12:00",
        saldo_residuo: "45gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34092,
        persona_id: 52,
        moorea_obj: (() => {
            const date = generateDateInRange(180);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "08:00", "12:00", 34092, 52);
        })(),
    },
    {
        id: "52",
        nome: "Francesca Testa",
        immagine: "https://i.pravatar.cc/43?img=52",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(180);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(180);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "46gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34093,
        persona_id: 53,
        moorea_obj: (() => {
            const date = generateDateInRange(180);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34093, 53);
        })(),
    },
    {
        id: "53",
        nome: "Luca Sorrentino",
        immagine: "https://i.pravatar.cc/43?img=53",
        mansione: "Caposquadra",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(210);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(210);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "14:00",
        orario_fine: "16:00",
        saldo_residuo: "47gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34094,
        persona_id: 54,
        moorea_obj: (() => {
            const date = generateDateInRange(210);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "14:00", "16:00", 34094, 54);
        })(),
    },
    {
        id: "54",
        nome: "Roberta Messina",
        immagine: "https://i.pravatar.cc/43?img=54",
        mansione: "Magazziniere",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(210);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(210);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "48gg",
        stato: "Rifiutato",
        urgenza: true,
        assunzione_id: 34095,
        persona_id: 55,
        moorea_obj: (() => {
            const date = generateDateInRange(210);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34095, 55);
        })(),
    },
    {
        id: "55",
        nome: "Stefano Pagano",
        immagine: "https://i.pravatar.cc/43?img=55",
        mansione: "Operaio",
        cantiere: "Cantiere Torino",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(240);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(240);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "10:00",
        orario_fine: "13:00",
        saldo_residuo: "49gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34096,
        persona_id: 56,
        moorea_obj: (() => {
            const date = generateDateInRange(240);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "10:00", "13:00", 34096, 56);
        })(),
    },
    {
        id: "56",
        nome: "Alessandra Coppola",
        immagine: "https://i.pravatar.cc/43?img=56",
        mansione: "Amministrativa",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(240);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(240);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "50gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34097,
        persona_id: 57,
        moorea_obj: (() => {
            const date = generateDateInRange(240);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34097, 57);
        })(),
    },
    {
        id: "57",
        nome: "Michele D'Amico",
        immagine: "https://i.pravatar.cc/43?img=57",
        mansione: "Capocantiere",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(300);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(300);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "13:00",
        orario_fine: "17:00",
        saldo_residuo: "51gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34098,
        persona_id: 58,
        moorea_obj: (() => {
            const date = generateDateInRange(300);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "13:00", "17:00", 34098, 58);
        })(),
    },
    {
        id: "58",
        nome: "Cinzia Orlando",
        immagine: "https://i.pravatar.cc/43?img=58",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(300);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(300);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "52gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34099,
        persona_id: 59,
        moorea_obj: (() => {
            const date = generateDateInRange(300);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34099, 59);
        })(),
    },
    {
        id: "59",
        nome: "Antonio Pugliese",
        immagine: "https://i.pravatar.cc/43?img=59",
        mansione: "Operaio",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(20);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(20);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "09:00",
        orario_fine: "11:00",
        saldo_residuo: "53gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34100,
        persona_id: 60,
        moorea_obj: (() => {
            const date = generateDateInRange(20);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "09:00", "11:00", 34100, 60);
        })(),
    },
    {
        id: "60",
        nome: "Barbara Conte",
        immagine: "https://i.pravatar.cc/43?img=60",
        mansione: "Magazziniere",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(50);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(50);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "54gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34101,
        persona_id: 61,
        moorea_obj: (() => {
            const date = generateDateInRange(50);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34101, 61);
        })(),
    },
    {
        id: "61",
        nome: "Giorgio Martelli",
        immagine: "https://i.pravatar.cc/43?img=61",
        mansione: "Caposquadra",
        cantiere: "Cantiere Torino",
        reparto: "Carico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(75);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(75);
            return date.getTime();
        })(),
        ore: 3,
        orario_inizio: "15:00",
        orario_fine: "18:00",
        saldo_residuo: "55gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34102,
        persona_id: 62,
        moorea_obj: (() => {
            const date = generateDateInRange(75);
            return createMooreaObj("PERMESSO", 3, date.getTime(), "15:00", "18:00", 34102, 62);
        })(),
    },
    {
        id: "62",
        nome: "Daniela Sanna",
        immagine: "https://i.pravatar.cc/43?img=62",
        mansione: "Amministrativa",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(100);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(100);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "56gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34103,
        persona_id: 63,
        moorea_obj: (() => {
            const date = generateDateInRange(100);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34103, 63);
        })(),
    },
    {
        id: "63",
        nome: "Vincenzo Carbone",
        immagine: "https://i.pravatar.cc/43?img=63",
        mansione: "Operaio",
        cantiere: "Cantiere Roma",
        reparto: "Scarico",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(130);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(130);
            return date.getTime();
        })(),
        ore: 4,
        orario_inizio: "11:00",
        orario_fine: "15:00",
        saldo_residuo: "57gg",
        stato: "Rifiutato",
        urgenza: false,
        assunzione_id: 34104,
        persona_id: 64,
        moorea_obj: (() => {
            const date = generateDateInRange(130);
            return createMooreaObj("PERMESSO", 4, date.getTime(), "11:00", "15:00", 34104, 64);
        })(),
    },
    {
        id: "64",
        nome: "Patrizia Parisi",
        immagine: "https://i.pravatar.cc/43?img=64",
        mansione: "Segretaria",
        cantiere: "Cantiere Torino",
        reparto: "Carico",
        tipo_richiesta: "FERIE",
        data: (() => {
            const date = generateDateInRange(160);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(160);
            return date.getTime();
        })(),
        ore: 8,
        saldo_residuo: "58gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34105,
        persona_id: 65,
        moorea_obj: (() => {
            const date = generateDateInRange(160);
            return createMooreaObj("FERIE", 8, date.getTime(), null, null, 34105, 65);
        })(),
    },
    {
        id: "65",
        nome: "Salvatore Lombardo",
        immagine: "https://i.pravatar.cc/43?img=65",
        mansione: "Capocantiere",
        cantiere: "Cantiere Milano",
        reparto: "Etichettatura",
        tipo_richiesta: "PERMESSO",
        data: (() => {
            const date = generateDateInRange(220);
            return formatDateString(date);
        })(),
        data_numerica: (() => {
            const date = generateDateInRange(220);
            return date.getTime();
        })(),
        ore: 2,
        orario_inizio: "10:00",
        orario_fine: "12:00",
        saldo_residuo: "59gg",
        stato: "Approvato",
        urgenza: false,
        assunzione_id: 34106,
        persona_id: 66,
        moorea_obj: (() => {
            const date = generateDateInRange(220);
            return createMooreaObj("PERMESSO", 2, date.getTime(), "10:00", "12:00", 34106, 66);
        })(),
    },
];

// Inizializzazione quando il DOM è pronto
document.addEventListener("DOMContentLoaded", async function () {
    // Inizializza Filter Bar con array vuoto (lista inizialmente vuota)
    if (typeof initFilterBar === "function") {
        try {
            await initFilterBar([]);
        } catch (error) {
            console.error(
                "Errore nell'inizializzazione del Filter Bar:",
                error
            );
        }
    }

    // Inizializza Detail Panel e carica calendario con tutti i dati disponibili
    if (typeof initDetailPanel === "function") {
        // Passa i dati del calendario direttamente a initDetailPanel
        // che li caricherà dopo che il contenuto HTML è stato caricato
        initDetailPanel(sampleData);
    }
});

