// =============================================================
// DATI DELLE MISSIONI
// Per ogni missione: titolo, descrizione, scena da avviare,
// ricompense di reputazione, tempo "record" e obiettivi extra.
// =============================================================

const MISSIONI = {
  convoglio: {
    id: 'convoglio',
    titolo: 'Il convoglio delle tasse',
    scena: 'MissioneConvoglio',
    mappa: 'convoglio',
    descrizione:
      'Un carro con le tasse raccolte per il riscatto del re passa per Sherwood, con la scorta. ' +
      'Ruba almeno 3 sacchi d\'oro e scappa dall\'uscita a sud.',
    modi: [
      'Di nascosto: avvicinati al retro del carro e ruba i sacchi (tasto E).',
      'Combattendo: metti fuori gioco la scorta con l\'arco.',
      'Con l\'astuzia: abbatti l\'albero secco sulla strada o spaventa i cavalli con il fumo.'
    ],
    reputazione: 5,       // reputazione guadagnata completandola
    tempoRecord: 240,     // secondi per l'obiettivo "tempo record"
    obiettivoSpeciale: { id: 'tuttoBottino', nome: 'Tutto il bottino', descrizione: 'Prendi tutti i sacchi del carro' }
  },

  prigione: {
    id: 'prigione',
    titolo: 'Le prigioni di Nottingham',
    scena: 'MissionePrigione',
    mappa: 'prigione',
    descrizione:
      'Little John è chiuso in una cella del castello. ' +
      'Prendi la chiave al carceriere (vestito di nero), apri la cella e porta John fuori dalla città.',
    modi: [
      'Con l\'astuzia: al mercato ci sono degli stracci per travestirti da mendicante.',
      'Di nascosto: con le frecce con corda sali sui tetti e sulle mura.',
      'Combattendo: entra dal portone e affronta le guardie.'
    ],
    reputazione: 10,
    tempoRecord: 300,
    obiettivoSpeciale: { id: 'borseggio', nome: 'Mani leggere', descrizione: 'Ruba la chiave al carceriere senza colpirlo' }
  },

  torneo: {
    id: 'torneo',
    titolo: 'Il torneo di tiro con l\'arco',
    scena: 'MissioneTorneo',
    mappa: null,
    descrizione:
      'Lo Sceriffo organizza una gara di tiro con l\'arco. Partecipa travestito e batti Guy di Gisborne: ' +
      'chi vince viene invitato al castello e può scoprirne i segreti.',
    modi: [
      'Tre manche da 4 frecce: bersaglio fermo, mobile e lontano.',
      'Il vento sposta le frecce: mira un po\' dalla parte opposta.',
      'Tieni premuto SHIFT per trattenere il respiro e fermare il mirino.'
    ],
    reputazione: 10,
    tempoRecord: 0,
    obiettivoSpeciale: { id: 'centroPerfetto', nome: 'Centro perfetto', descrizione: 'Fai 10 punti con una freccia' }
  },

  finale: {
    id: 'finale',
    titolo: 'Lo scontro con lo Sceriffo',
    scena: 'MissioneFinale',
    mappa: 'finale',
    descrizione:
      'Entra nel castello di Nottingham e sconfiggi lo Sceriffo nella sala grande.',
    modi: [
      'Se hai vinto il torneo puoi usare il passaggio segreto a ovest.',
      'Se hai liberato Little John, combatte insieme a te.',
      'Con una reputazione alta ci saranno meno guardie.'
    ],
    reputazione: 0,
    tempoRecord: 360,
    obiettivoSpeciale: { id: 'senzaFerite', nome: 'Intoccabile', descrizione: 'Sconfiggi lo Sceriffo perdendo al massimo 2 punti salute' }
  }
};

// Obiettivi extra comuni a tutte le missioni d'azione
const OBIETTIVI_COMUNI = [
  { id: 'maiVisto', nome: 'Mai visto', descrizione: 'Non far scattare l\'allarme' },
  { id: 'nessunaVittima', nome: 'Nessuna vittima', descrizione: 'Non uccidere nessuno' },
  { id: 'tempoRecord', nome: 'Tempo record', descrizione: 'Completa la missione in fretta' }
];

// Quante missioni (tra le prime tre) servono per sbloccare il finale
const MISSIONI_PER_FINALE = 2;

// =============================================================
// I FINALI POSSIBILI
// Quale finale si ottiene lo decide Punteggio.determinaFinale()
// =============================================================
const FINALI = {
  eroe: {
    titolo: 'Eroe del popolo',
    colore: '#8fd16a',
    bonus: 3000,
    testo:
      'Lo Sceriffo è sconfitto e l\'oro torna ai villaggi. Nel 1194 re Riccardo rientra in Inghilterra. ' +
      'Secondo alcune ballate il re perdona Robin e lo prende al suo servizio. Nessun documento lo conferma: ' +
      'è la leggenda.'
  },
  leggenda: {
    titolo: 'La leggenda continua',
    colore: '#f2c14e',
    bonus: 1500,
    testo:
      'Lo Sceriffo è sconfitto, ma la gente dei villaggi non si fida ancora del tutto di te. ' +
      'Torni nella foresta con i tuoi compagni e continui a vivere da fuorilegge.'
  },
  ricco: {
    titolo: 'Bandito ricco ma odiato',
    colore: '#c8b48a',
    bonus: 800,
    testo:
      'Lo Sceriffo è sconfitto e hai molto oro, ma lo hai tenuto quasi tutto per te. ' +
      'Per la gente dei villaggi sei solo un altro prepotente, che vive nel bosco invece che in un castello.'
  },
  catturato: {
    titolo: 'Catturato',
    colore: '#ff6b5a',
    bonus: 0,
    testo:
      'Le guardie ti circondano e finisci nelle prigioni del castello. ' +
      'Nelle ballate Robin riesce sempre a scappare, ma questa volta la storia finisce qui.'
  }
};
