// =============================================================
// CONTENUTI STORICI
// Le pagine del "Diario di Robin" e le curiosità mostrate
// durante i caricamenti.
// Ogni pagina ha: titolo, periodo e testo.
// =============================================================

const DIARIO = [
  {
    titolo: 'Robin Hood: storia o leggenda?',
    periodo: 'XIII - XVI secolo',
    testo:
      'Robin Hood è un personaggio leggendario: non ci sono prove che sia esistito davvero. ' +
      'Nei registri dei tribunali inglesi del Duecento compare più volte il soprannome "Robehod", ' +
      'usato forse per indicare un fuorilegge qualsiasi. Gli storici hanno proposto diversi "Robin veri", ' +
      'ma nessuna ipotesi è sicura. Tutto quello che sappiamo di lui viene da ballate e racconti, ' +
      'cioè da opere letterarie e non da documenti.'
  },
  {
    titolo: 'Le prime ballate',
    periodo: 'XIV - XV secolo',
    testo:
      'La prima citazione sicura si trova nel poema "Piers Plowman" di William Langland (circa 1377), ' +
      'dove un personaggio dice di conoscere le "rime di Robin Hood". Le ballate più antiche arrivate fino a noi, ' +
      'come "Robin Hood and the Monk" (circa 1450) e la "Gest of Robyn Hode" (stampata intorno al 1500), ' +
      'sono del XV secolo. In queste ballate Robin non è un nobile ma uno "yeoman", un uomo libero ' +
      'di condizione modesta, e vive tra Sherwood e Barnsdale.'
  },
  {
    titolo: 'Riccardo Cuor di Leone e la Terza Crociata',
    periodo: '1189 - 1192',
    testo:
      'Riccardo I diventò re d\'Inghilterra nel 1189 e partì quasi subito per la Terza Crociata, ' +
      'insieme al re di Francia Filippo II, per riconquistare Gerusalemme dal sultano Saladino. ' +
      'Riccardo vinse ad Acri (1191) e ad Arsuf, ma non riuscì a prendere Gerusalemme. Nel 1192 firmò con ' +
      'Saladino la tregua di Giaffa, che permetteva ai pellegrini cristiani di visitare la città. ' +
      'In dieci anni di regno rimase in Inghilterra solo pochi mesi.'
  },
  {
    titolo: 'Il re prigioniero e il riscatto',
    periodo: '1192 - 1194',
    testo:
      'Mentre tornava dalla crociata, nel dicembre 1192, Riccardo fu catturato vicino a Vienna dal duca ' +
      'Leopoldo V d\'Austria, che lo consegnò all\'imperatore Enrico VI. Il riscatto era enorme: ' +
      '150.000 marchi d\'argento, più del doppio delle entrate di un anno della Corona. ' +
      'Per pagarlo fu imposta una tassa di un quarto dei redditi e dei beni mobili, e alle chiese ' +
      'furono presi calici e oggetti preziosi. Riccardo tornò libero nel febbraio 1194.'
  },
  {
    titolo: 'Giovanni Senzaterra',
    periodo: '1166 - 1216',
    testo:
      'Giovanni era il fratello minore di Riccardo. Il soprannome "Senzaterra" viene dal fatto che, ' +
      'essendo l\'ultimo figlio, all\'inizio non aveva ricevuto terre. Nelle storie di Robin è il "reggente" ' +
      'cattivo, ma in realtà durante l\'assenza di Riccardo il regno era governato da funzionari chiamati ' +
      'giustizieri. Giovanni si alleò con il re di Francia e provò a prendere il potere, senza riuscirci. ' +
      'Riccardo lo perdonò e Giovanni diventò re nel 1199, quando il fratello morì.'
  },
  {
    titolo: 'Lo Sceriffo di Nottingham',
    periodo: 'XII - XIII secolo',
    testo:
      'Lo sceriffo (dall\'inglese antico "shire-reeve", amministratore della contea) era il funzionario ' +
      'del re in ogni contea. Riscuoteva le tasse, comandava i castelli reali, teneva le prigioni e faceva ' +
      'rispettare la legge. Nottinghamshire e Derbyshire avevano uno sceriffo in comune. ' +
      'Molti sceriffi erano odiati perché si arricchivano con le multe. Filippo Marc, sceriffo dal 1209, ' +
      'è nominato anche nella Magna Carta, che chiedeva di allontanarlo dall\'incarico.'
  },
  {
    titolo: 'Le leggi forestali normanne',
    periodo: 'dal 1066',
    testo:
      'Dopo la conquista normanna (1066) Guglielmo il Conquistatore dichiarò "foresta reale" vasti territori, ' +
      'come la New Forest. Lì era vietato cacciare cervi e cinghiali e tagliare alberi o raccogliere legna ' +
      'senza il permesso del re. Le pene andavano da multe pesanti fino alla mutilazione. ' +
      'Sotto Enrico II le foreste reali coprivano forse un terzo dell\'Inghilterra, compresa Sherwood. ' +
      'La Carta della Foresta del 1217 abolì la pena di morte e le mutilazioni per questi reati.'
  },
  {
    titolo: 'La Magna Carta',
    periodo: '15 giugno 1215',
    testo:
      'Nel 1215 i baroni, stanchi delle tasse e delle sconfitte di Giovanni in Francia, si ribellarono. ' +
      'A Runnymede, vicino a Windsor, il re fu costretto ad accettare la Magna Carta. La clausola 39 diceva ' +
      'che nessun uomo libero poteva essere arrestato o punito senza un giudizio legale. ' +
      'Il papa la annullò dopo pochi mesi, ma fu ripubblicata nel 1216, nel 1217 e nel 1225. ' +
      'Proteggeva soprattutto nobili e uomini liberi, non i servi, ma è diventata un simbolo dei limiti al potere del re.'
  },
  {
    titolo: 'Come nasce il Robin che conosciamo',
    periodo: 'XVI secolo - oggi',
    testo:
      'Molti elementi famosi della storia sono arrivati dopo le prime ballate. Lady Marian e Fra Tuck vengono ' +
      'dalle feste di maggio e dal teatro popolare. Fu lo storico scozzese John Major, nel 1521, a mettere ' +
      'Robin ai tempi di Riccardo Cuor di Leone. Alla fine del Cinquecento le commedie di Anthony Munday ' +
      'lo fecero diventare un nobile, il conte di Huntingdon. L\'idea del ladro che ruba ai ricchi ' +
      'per dare ai poveri si è rafforzata nei secoli, fino ai film e ai cartoni animati.'
  },
  {
    titolo: 'La vita dei contadini',
    periodo: 'XII secolo',
    testo:
      'Nell\'Inghilterra del XII secolo la maggior parte delle persone era contadina. Molti erano "villani", ' +
      'cioè servi legati alla terra del signore: dovevano lavorare gratis nei suoi campi alcuni giorni ' +
      'alla settimana e non potevano andarsene senza permesso. Pagavano la decima alla Chiesa e i tributi ' +
      'al signore. Negli anni di carestia o di tasse straordinarie, come per il riscatto di Riccardo, ' +
      'molte famiglie rischiavano la fame.'
  }
];

// Frasi brevi mostrate durante le schermate di caricamento
const CURIOSITA = [
  'Robin Hood è citato per la prima volta nel poema "Piers Plowman" (circa 1377).',
  'Nelle ballate più antiche Robin non è un nobile, ma uno "yeoman", un uomo libero di condizione modesta.',
  'Il riscatto di Riccardo Cuor di Leone fu di 150.000 marchi d\'argento.',
  'Per pagare il riscatto del re fu tassato un quarto dei redditi e dei beni mobili.',
  'Riccardo Cuor di Leone parlava soprattutto francese e visse poco in Inghilterra.',
  'Giovanni era detto "Senzaterra" perché, da ultimo figlio di Enrico II, all\'inizio non aveva terre.',
  'Nelle foreste reali era vietato cacciare il cervo: era riservato al re.',
  'Nel Medioevo "foresta" indicava un territorio con leggi speciali, non per forza un bosco.',
  'La Magna Carta fu concessa a Runnymede il 15 giugno 1215.',
  'La clausola 39 della Magna Carta vietava di imprigionare un uomo libero senza un giudizio legale.',
  'La Carta della Foresta (1217) abolì la pena di morte per chi cacciava nelle foreste reali.',
  'Lady Marian e Fra Tuck non compaiono nelle ballate più antiche: sono stati aggiunti dopo.',
  'Fu John Major, nel 1521, il primo ad ambientare Robin Hood ai tempi di Riccardo I.',
  'Nella "Gest of Robyn Hode" lo Sceriffo organizza una gara di tiro con una freccia d\'oro in premio.',
  'La parola "sceriffo" viene da "shire-reeve", cioè amministratore della contea.',
  'Riccardo fu catturato nel 1192 dal duca Leopoldo V d\'Austria, con cui aveva litigato durante la crociata.'
];
