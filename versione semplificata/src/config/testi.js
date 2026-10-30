// =============================================================
// TESTI DEL GIOCO
// Tutte le frasi sono qui, così è facile cambiarle.
// Ogni frase che compare sullo schermo viene anche letta dalla voce.
// Frasi brevi e semplici: si capiscono meglio, sia lette che ascoltate.
// =============================================================

// Scheda dei personaggi
const PERSONAGGI = [
  {
    nome: 'Robin Hood',
    sprite: 'robin',
    descrizione: 'Robin Hood sei tu. Vivi nella foresta di Sherwood. Sei bravissimo con l\'arco e aiuti la gente povera.'
  },
  {
    nome: 'Little John',
    sprite: 'john',
    descrizione: 'Little John è il migliore amico di Robin. È molto alto e forte. Ti aspetta all\'accampamento e ti dice cosa fare.'
  },
  {
    nome: 'Will Scarlet',
    sprite: 'will',
    descrizione: 'Will Scarlet fa parte della banda di Robin, come Much e Alan-a-Dale. Sono nascosti nella foresta e sanno dove passa il carro.'
  },
  {
    nome: 'Lo Sceriffo',
    sprite: 'sceriffo',
    descrizione: 'Lo Sceriffo di Nottingham è il cattivo della storia. Prende i soldi delle tasse alla gente povera.'
  },
  {
    nome: 'Le guardie',
    sprite: 'guardia',
    descrizione: 'Le guardie lavorano per lo Sceriffo. Hanno l\'elmo grigio e il vestito rosso. Se ti vedono, vengono verso di te.'
  },
  {
    nome: 'Marian',
    sprite: 'marian',
    descrizione: 'Marian vive nel villaggio oltre il fiume. Aiuta le famiglie povere. Ti dirà a chi dare l\'oro.'
  }
];

// Cutscene iniziale: ogni quadro ha un testo e una scenografia
// (la scenografia è disegnata in CutsceneScene.js)
const CUTSCENE_INIZIALE = [
  { scena: 'castello', testo: 'Inghilterra, anno 1193. Il re Riccardo Cuor di Leone è prigioniero, molto lontano da casa.' },
  { scena: 'tasse', testo: 'Per liberarlo servono tanti soldi. Lo Sceriffo di Nottingham prende le tasse alla gente povera.' },
  { scena: 'foresta', testo: 'Nella foresta di Sherwood vive Robin Hood, con il suo amico Little John.' },
  { scena: 'carro', testo: 'Oggi un carro pieno di oro delle tasse passa nel bosco. Robin vuole riportare l\'oro al villaggio.' }
];

// Cutscene finale
const CUTSCENE_FINALE = [
  { scena: 'villaggio', testo: 'Robin ha portato l\'oro alle famiglie. Ora possono comprare il pane e pagare il riscatto del re.' },
  { scena: 'festa', testo: 'All\'accampamento la banda fa festa. Lo Sceriffo è arrabbiato, ma oggi ha perso.' },
  { scena: 'storia', testo: 'Robin Hood è un personaggio delle leggende. Le sue storie si raccontano da più di seicento anni.' }
];

// I passi della storia, in ordine.
//   obiettivo: cosa fare adesso (in alto sullo schermo)
//   fatto:     cosa hai appena fatto (nel riquadro di fine passo)
const PASSI = [
  { id: 'john', obiettivo: 'Vai da Little John e cliccalo.', fatto: 'Hai parlato con Little John.' },
  { id: 'arco', obiettivo: 'Prendi il tuo arco davanti alla tua tenda.', fatto: 'Hai preso il tuo arco.' },
  { id: 'bersagli', obiettivo: 'Allenati: vai al campo di tiro e clicca sui 3 bersagli di paglia.', fatto: 'Hai colpito tutti i bersagli. Sei pronto!' },
  { id: 'tuck', obiettivo: 'Fra Tuck ti cerca. Vai da lui all\'accampamento.', fatto: 'Hai parlato con Fra Tuck.' },
  { id: 'erbe', obiettivo: 'Raccogli le 4 erbe medicinali nel bosco. Hanno i fiori viola.', fatto: 'Hai raccolto tutte le erbe per Fra Tuck.' },
  { id: 'banda', obiettivo: 'Trova i 3 compagni della banda nascosti nella foresta. Segui la freccia.', fatto: 'Hai trovato tutta la banda. Ora sai dov\'è il carro.' },
  { id: 'ponte', obiettivo: 'Vai al ponte sul fiume, dove si è fermato il carro.', fatto: 'Sei arrivato al ponte. Ecco il carro delle tasse!' },
  { id: 'guardie', obiettivo: 'Ferma le due guardie. Clicca su una guardia per tirare una freccia.', fatto: 'Hai fermato le guardie. Ora dormono!' },
  { id: 'contadino', obiettivo: 'Libera il contadino legato vicino al carro. Vai da lui.', fatto: 'Hai liberato il contadino.' },
  { id: 'oro', obiettivo: 'Prendi i tre sacchi d\'oro vicino al carro.', fatto: 'Hai preso tutti i sacchi d\'oro.' },
  { id: 'marian', obiettivo: 'Attraversa il ponte e porta l\'oro a Marian, nel villaggio.', fatto: 'Hai parlato con Marian.' },
  { id: 'famiglie', obiettivo: 'Porta un sacco d\'oro a ognuna delle 3 famiglie. Segui la freccia.', fatto: 'Hai aiutato tutte e tre le famiglie.' },
  { id: 'guardiaVillaggio', obiettivo: 'Una guardia è arrivata al villaggio per riprendersi l\'oro. Fermala!', fatto: 'Hai fermato la guardia. Il villaggio è al sicuro.' },
  { id: 'festa', obiettivo: 'Torna all\'accampamento da Little John.', fatto: 'Sei tornato all\'accampamento. Missione completata!' }
];

// ---------- DIALOGHI ----------
const DIALOGO_JOHN = [
  'Ciao Robin! Oggi il carro dello Sceriffo passa nel bosco, pieno di oro delle tasse.',
  'Prima prendi il tuo arco: è davanti alla tua tenda.',
  'Poi allenati un po\' al campo di tiro, qui a nord.'
];

const DIALOGO_ARCO = [
  'Questo è il tuo arco. Ha frecce infinite.',
  'Per tirare, clicca su un bersaglio o su una guardia. La freccia va da sola.'
];

const DIALOGO_TUCK = [
  'Buongiorno Robin! Sono Fra Tuck. Mi serve il tuo aiuto.',
  'Nel bosco crescono delle erbe medicinali con i fiori viola. Servono per curare i malati del villaggio.',
  'Raccoglile tu: sono quattro, in posti diversi della foresta.'
];

// I tre compagni della banda: ognuno dà un indizio sul carro
const COMPAGNI = [
  {
    segnaposto: 'W', nome: 'Will Scarlet', sprite: 'will',
    frasi: ['Ciao Robin! Ho visto il carro dello Sceriffo questa mattina.', 'Va verso il fiume, sulla strada grande.']
  },
  {
    segnaposto: 'M', nome: 'Much', sprite: 'much',
    frasi: ['Robin! Sono Much, il figlio del mugnaio.', 'Il carro si è fermato vicino al ponte: si è rotta una ruota.']
  },
  {
    segnaposto: 'L', nome: 'Alan-a-Dale', sprite: 'alan',
    frasi: ['Salve Robin, sono Alan il musicista.', 'Attento: il carro è controllato da due guardie. E hanno legato un contadino.']
  }
];

const DIALOGO_CONTADINO = [
  'Grazie Robin! Le guardie mi hanno preso le tasse e mi hanno legato.',
  'Torno a casa, nel villaggio. Ci vediamo là!'
];

const DIALOGO_MARIAN = [
  'Robin! Hai riportato l\'oro delle tasse!',
  'Tre famiglie hanno bisogno di aiuto. Le loro case hanno la bandierina gialla sulla porta.',
  'Porta un sacco a ogni famiglia.'
];

const DIALOGO_FAMIGLIA = [
  'Grazie Robin! Con questo oro compreremo il pane per tutto l\'inverno.',
  'Grazie! Ora possiamo pagare le tasse senza vendere la nostra mucca.',
  'Grazie Robin Hood! I nostri bambini non avranno più fame.'
];

const DIALOGO_GUARDIA_VILLAGGIO = 'Attenzione! Una guardia dello Sceriffo è entrata nel villaggio. Vuole riprendersi l\'oro!';

const DIALOGO_FESTA = [
  'Robin, ce l\'hai fatta! Tutto il villaggio parla di te.',
  'Stasera facciamo festa intorno al fuoco, con tutta la banda!'
];

// ---------- ESPLORAZIONE (facoltativa) ----------
// Cartelli lungo i sentieri: cliccandoli si sente una curiosità storica
const CARTELLI = [
  'Questa è la foresta di Sherwood. Nel Medioevo era una foresta del re, con leggi speciali.',
  'Nelle foreste del re era vietato cacciare i cervi. Chi lo faceva veniva punito duramente.',
  'Il re Riccardo è stato liberato nel 1194, dopo che l\'Inghilterra ha pagato un enorme riscatto.',
  'Le prime storie di Robin Hood sono canzoni chiamate ballate. Sono state scritte più di seicento anni fa.',
  'Little John e Much compaiono già nelle ballate più antiche. Alan-a-Dale è arrivato più tardi.'
];

const FRASE_CERVO = 'È un cervo del re. Robin non lo caccia: nelle foreste del re era vietato dalla legge.';

// ---------- ALTRE FRASI ----------
const FRASI = {
  benvenuto: 'Robin Hood. Versione semplificata.',
  sceltaPersonaggi: 'Clicca su un personaggio per sapere chi è.',
  colpito: 'Ahi! Una guardia ti ha colpito.',
  riprova: 'Sei stato colpito troppe volte. Niente paura: ricominci da qui.',
  troppoLontano: 'È troppo lontano. Robin si avvicina.',
  senzaArco: 'Prima devi prendere il tuo arco.',
  nonAncora: 'Non ancora. Segui la freccia gialla.',
  sacco: 'Hai preso un sacco d\'oro.',
  erba: 'Hai raccolto un\'erba medicinale.',
  moneta: 'Hai trovato una moneta nascosta!',
  bersaglio: 'Bersaglio colpito!',
  guardiaFerma: 'Guardia addormentata!',
  fine: 'Fine. Hai aiutato il popolo di Sherwood.'
};
