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
        id: 3,
        cf: "VRSGPP75A01L219X",
        created_at: "2026-01-10T09:00:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-01-20",
        dataFine: "2026-01-20",
        giornataIntera: 1,
        oraInizio: "09:00:00",
        oraFine: "18:00:00",
        quantitaOre: 480,
        note: "",
        status: 1,
        type: 1,
        type_name: "FERIE",
        tipo_richiesta: "FERIE",
        nominativo: "Giuseppe Verdi",
        department_id: 28101,
        department_name: "Cantiere Torino",
        department_color: "#f6b73c",
        task_id: 101,
        task_name: "Capocantiere",
        task_color: "#3498db",
        profile_pic: "https://i.pravatar.cc/43?img=3",
        moorea_obj: {
            meta: {
                leave_details_txt: "8 ore di FERIE",
                days: 1,
                hours: 8
            },
            leaves: [
                {
                    nome: "FERIE",
                    voce: "FERIE",
                    causaleId: 16443,
                    personaId: 4,
                    deltaData: 0,
                    assunzioneId: 34044,
                    dataInizio: "2026-01-20",
                    dataFine: "2026-01-20",
                    interaGiornata: 1,
                    quantitaOre: 8,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 4,
        cf: "FRRNNA80A41F205Z",
        created_at: "2026-01-11T14:20:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-02-05",
        dataFine: "2026-02-05",
        giornataIntera: 0,
        oraInizio: "10:00:00",
        oraFine: "12:00:00",
        quantitaOre: 120,
        note: "",
        status: 1,
        type: 2,
        type_name: "PERMESSO",
        tipo_richiesta: "PERMESSO",
        nominativo: "Anna Ferrari",
        department_id: 28102,
        department_name: "Cantiere Milano",
        department_color: "#f6b73c",
        task_id: 102,
        task_name: "Segretaria",
        task_color: "#e74c3c",
        profile_pic: "https://i.pravatar.cc/43?img=4",
        moorea_obj: {
            meta: {
                leave_details_txt: "2 ore di PERMESSO RETRIBUITO",
                days: 1,
                hours: 2
            },
            leaves: [
                {
                    nome: "PERMESSO RETRIBUITO",
                    voce: "PERM",
                    causaleId: 16537,
                    personaId: 5,
                    deltaData: 0,
                    assunzioneId: 34045,
                    dataInizio: "2026-02-05",
                    dataFine: "2026-02-05",
                    interaGiornata: 0,
                    quantitaOre: 2,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 5,
        cf: "EPSMRC85M01H501U",
        created_at: "2026-01-12T08:30:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-02-15",
        dataFine: "2026-02-15",
        giornataIntera: 1,
        oraInizio: "08:00:00",
        oraFine: "17:00:00",
        quantitaOre: 480,
        note: "Rifiutato per carico lavoro",
        status: 2,
        type: 1,
        type_name: "FERIE",
        tipo_richiesta: "FERIE",
        nominativo: "Marco Esposito",
        department_id: 28103,
        department_name: "Cantiere Roma",
        department_color: "#f6b73c",
        task_id: 103,
        task_name: "Operaio",
        task_color: "#2ecc71",
        profile_pic: "https://i.pravatar.cc/43?img=5",
        moorea_obj: {
            meta: {
                leave_details_txt: "8 ore di FERIE",
                days: 1,
                hours: 8
            },
            leaves: [
                {
                    nome: "FERIE",
                    voce: "FERIE",
                    causaleId: 16443,
                    personaId: 6,
                    deltaData: 0,
                    assunzioneId: 34046,
                    dataInizio: "2026-02-15",
                    dataFine: "2026-02-15",
                    interaGiornata: 1,
                    quantitaOre: 8,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 7,
        cf: "CLMLCU90T15F205R",
        created_at: "2026-01-13T10:00:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-03-01",
        dataFine: "2026-03-01",
        giornataIntera: 0,
        oraInizio: "13:00:00",
        oraFine: "17:00:00",
        quantitaOre: 240,
        note: "",
        status: 1,
        type: 2,
        type_name: "PERMESSO",
        tipo_richiesta: "PERMESSO",
        nominativo: "Luca Colombo",
        department_id: 28102,
        department_name: "Cantiere Milano",
        department_color: "#f6b73c",
        task_id: 104,
        task_name: "Caposquadra",
        task_color: "#9b59b6",
        profile_pic: "https://i.pravatar.cc/43?img=7",
        moorea_obj: {
            meta: {
                leave_details_txt: "4 ore di PERMESSO RETRIBUITO",
                days: 1,
                hours: 4
            },
            leaves: [
                {
                    nome: "PERMESSO RETRIBUITO",
                    voce: "PERM",
                    causaleId: 16537,
                    personaId: 8,
                    deltaData: 0,
                    assunzioneId: 34048,
                    dataInizio: "2026-03-01",
                    dataFine: "2026-03-01",
                    interaGiornata: 0,
                    quantitaOre: 4,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 9,
        cf: "MRNLSN88S10L219W",
        created_at: "2026-01-14T08:15:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-03-15",
        dataFine: "2026-03-15",
        giornataIntera: 0,
        oraInizio: "09:00:00",
        oraFine: "12:00:00",
        quantitaOre: 180,
        note: "URGENTE",
        status: 2,
        type: 2,
        type_name: "PERMESSO",
        tipo_richiesta: "PERMESSO",
        nominativo: "Alessandro Marino",
        department_id: 28101,
        department_name: "Cantiere Torino",
        department_color: "#f6b73c",
        task_id: 103,
        task_name: "Operaio",
        task_color: "#2ecc71",
        profile_pic: "https://i.pravatar.cc/43?img=9",
        moorea_obj: {
            meta: {
                leave_details_txt: "3 ore di PERMESSO RETRIBUITO",
                days: 1,
                hours: 3
            },
            leaves: [
                {
                    nome: "PERMESSO RETRIBUITO",
                    voce: "PERM",
                    causaleId: 16537,
                    personaId: 10,
                    deltaData: 0,
                    assunzioneId: 34050,
                    dataInizio: "2026-03-15",
                    dataFine: "2026-03-15",
                    interaGiornata: 0,
                    quantitaOre: 3,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 11,
        cf: "BRNRBT72M12H501K",
        created_at: "2026-01-14T09:00:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-04-10",
        dataFine: "2026-04-10",
        giornataIntera: 1,
        oraInizio: "08:30:00",
        oraFine: "17:30:00",
        quantitaOre: 480,
        note: "",
        status: 1,
        type: 1,
        type_name: "FERIE",
        tipo_richiesta: "FERIE",
        nominativo: "Roberto Bruno",
        department_id: 28103,
        department_name: "Cantiere Roma",
        department_color: "#f6b73c",
        task_id: 101,
        task_name: "Capocantiere",
        task_color: "#3498db",
        profile_pic: "https://i.pravatar.cc/43?img=11",
        moorea_obj: {
            meta: {
                leave_details_txt: "8 ore di FERIE",
                days: 1,
                hours: 8
            },
            leaves: [
                {
                    nome: "FERIE",
                    voce: "FERIE",
                    causaleId: 16443,
                    personaId: 12,
                    deltaData: 0,
                    assunzioneId: 34052,
                    dataInizio: "2026-04-10",
                    dataFine: "2026-04-10",
                    interaGiornata: 1,
                    quantitaOre: 8,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 13,
        cf: "NRIPLA92B04F205S",
        created_at: "2026-01-14T11:00:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-05-15",
        dataFine: "2026-05-15",
        giornataIntera: 1,
        oraInizio: "08:00:00",
        oraFine: "17:00:00",
        quantitaOre: 480,
        note: "",
        status: 1,
        type: 1,
        type_name: "FERIE",
        tipo_richiesta: "FERIE",
        nominativo: "Paolo Neri",
        department_id: 28102,
        department_name: "Cantiere Milano",
        department_color: "#f6b73c",
        task_id: 105,
        task_name: "Magazziniere",
        task_color: "#f1c40f",
        profile_pic: "https://i.pravatar.cc/43?img=13",
        moorea_obj: {
            meta: {
                leave_details_txt: "8 ore di FERIE",
                days: 1,
                hours: 8
            },
            leaves: [
                {
                    nome: "FERIE",
                    voce: "FERIE",
                    causaleId: 16443,
                    personaId: 14,
                    deltaData: 0,
                    assunzioneId: 34054,
                    dataInizio: "2026-05-15",
                    dataFine: "2026-05-15",
                    interaGiornata: 1,
                    quantitaOre: 8,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 20,
        cf: "RZZLNE89C50H501O",
        created_at: "2026-01-14T12:00:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-08-10",
        dataFine: "2026-08-10",
        giornataIntera: 0,
        oraInizio: "08:00:00",
        oraFine: "12:00:00",
        quantitaOre: 240,
        note: "URGENTE",
        status: 1,
        type: 2,
        type_name: "PERMESSO",
        tipo_richiesta: "PERMESSO",
        nominativo: "Elena Rizzo",
        department_id: 28103,
        department_name: "Cantiere Roma",
        department_color: "#f6b73c",
        task_id: 106,
        task_name: "Amministrativa",
        task_color: "#1abc9c",
        profile_pic: "https://i.pravatar.cc/43?img=20",
        moorea_obj: {
            meta: {
                leave_details_txt: "4 ore di PERMESSO RETRIBUITO",
                days: 1,
                hours: 4
            },
            leaves: [
                {
                    nome: "PERMESSO RETRIBUITO",
                    voce: "PERM",
                    causaleId: 16537,
                    personaId: 21,
                    deltaData: 0,
                    assunzioneId: 34061,
                    dataInizio: "2026-08-10",
                    dataFine: "2026-08-10",
                    interaGiornata: 0,
                    quantitaOre: 4,
                    note: ""
                }
            ]
        },
        moorea_id: null
    },
    {
        id: 25,
        cf: "RCCMTT95R12L219Q",
        created_at: "2026-01-14T13:00:00.000Z",
        updated_at: "2026-01-14T10:00:55.000Z",
        dataInizio: "2026-05-20",
        dataFine: "2026-05-20",
        giornataIntera: 0,
        oraInizio: "09:00:00",
        oraFine: "13:00:00",
        quantitaOre: 240,
        note: "URGENTE",
        status: 1,
        type: 2,
        type_name: "PERMESSO",
        tipo_richiesta: "PERMESSO",
        nominativo: "Matteo Ricci",
        department_id: 28101,
        department_name: "Cantiere Torino",
        department_color: "#f6b73c",
        task_id: 104,
        task_name: "Caposquadra",
        task_color: "#9b59b6",
        profile_pic: "https://i.pravatar.cc/43?img=25",
        moorea_obj: {
            meta: {
                leave_details_txt: "4 ore di PERMESSO RETRIBUITO",
                days: 1,
                hours: 4
            },
            leaves: [
                {
                    nome: "PERMESSO RETRIBUITO",
                    voce: "PERM",
                    causaleId: 16537,
                    personaId: 26,
                    deltaData: 0,
                    assunzioneId: 34066,
                    dataInizio: "2026-05-20",
                    dataFine: "2026-05-20",
                    interaGiornata: 0,
                    quantitaOre: 4,
                    note: ""
                }
            ]
        },
        moorea_id: null
    }
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

