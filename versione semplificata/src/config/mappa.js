// =============================================================
// MAPPA DELL'UNICO LIVELLO: la foresta di Sherwood
// Ogni carattere è una casella da 16x16 pixel.
//   .  erba         ,  strada (sul fiume diventa il ponte)
//   _  piazza del villaggio           ~  fiume
//   T  albero       b  cespuglio      f  fiori
//   ^  tetto delle case    t  tenda   F  fuoco
// Segnaposto (al loro posto c'è il pavimento vicino):
//   P  partenza di Robin      J  Little John    A  arco nella tenda
//   N  Fra Tuck               e  erba medicinale da raccogliere
//   B  bersagli di paglia
//   W  Will Scarlet   M  Much   L  Alan-a-Dale  (i compagni nascosti)
//   S  ponte sul fiume        C  carro          K  sacchi d'oro
//   g  guardia                Q  contadino legato
//   V  Marian                 h  porta di una famiglia
//   G  guardia che arriva al villaggio          p  abitanti
//   c  cartello con una curiosità storica
//   o  moneta nascosta        d  cervo del re
// =============================================================

const MAPPA = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TT..b...T.T..........T..TT..........................~~.b......................TT',
  'TT...T........T...TTT..T.......T....................~~..........b.............TT',
  'TT.....T..T..T...TT.T.T..T...................W......~~........................TT',
  'TT..........................,,,,,,,,,,,,,,,,,,.TTT..~~..._____________________TT',
  'TT.....f.fB...........T.o.T.,,,,,,,,,,,,,,,,,,.T.TT.~~...___________________o_TT',
  'TT...B......b..B...T..T.....,,.................TTT..~~...___^^^^^___^^^^^_____TT',
  'TT.......................TT.,,.....obT.TTTT..TT.T....~~..___^^^^^___^^^^^_____TT',
  'TT...b.............T.e...T..,,...T......TT..d..T..T..~~..___^^^^^___^^^^^_____TT',
  'TT..........f........b...T..,,cT.TTT......T.....o....~~..___^^^^^___^^^^^_____TT',
  'TT............f....TTTT...b.,,.TTTT...Tb..........TT.~~..___^^^^^___^^^^^_____TT',
  'TT......f..........TTTdfTT..,,...T...T........T......~~.._____h_______h_______TT',
  'TT...................T......,,.T.....................~~.._____________________TT',
  'TTT..................T.TTTT.,,.T....,,,,,,,,,,,,.f...~~.._____________________TT',
  'TT..o.....,,............T...,,..TT..,,,c,,,,,,,,.T...~~.._____________________TT',
  'TT........,,................,,.Tb.T.,,...........T..~~...________p____________TT',
  'TT........,,................,,......,,.T.....T....o.~~...__^^^________________TT',
  'TT........,,................,,...TT.,,....TTTTT..T..~~...__^^^___________^^^__TT',
  'TT...t....t,................,,...TT.,,....T.........~~...__^^^___________^^^__TT',
  'TT........,,...t........T...,,...T..,,....gb.T.T.T..~~...__^^^___________^^^__TT',
  'TT........A,......bT...T..T.,,..TTT.,,.....T.CT.....~~...________________^^^__TT',
  'TT..b.....,,........T.T.T...,,.TT...,,..Q.T....K....~~...________________^^^__TT',
  'TT........,,........TT....T.,,..TT..,,..T.TK..b.....~~...________________^^^__TT',
  'TT........,,................,,......,,...............~~.._____________________TT',
  'TTb.......,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,S,,,,,,,___p_________________TT',
  'TT..........,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,_________V___________TT',
  'TTT......F...J..N...c.,,.............................~~.c_____________________TT',
  'TTT.......f.........T.,,.TTTTT.T..TTT.TT.TT..K..TTT..~~.._____________________TT',
  'TTT................T..,,.TTTTT..TT.T.T.T........gT...~~..______________p______TT',
  'TT....P......b........,,.TTTTT..TTT...........TTTTT..~~.._____________________TT',
  'TT...............o..T.,,.TT.TTT.Te...TTTTTT....TT....~~..__^^^^^______________TT',
  'TTb.....,,............,,.TTT.T.TT.T..TT.T..Tf.......~~...__^^^^^____^^^^^_____TT',
  'TT...TT.,,..T....T.TT.,,.T....o.T.....TT..T.T.......~~...__^^^^^____^^^^^_____TT',
  'TTT.....,,.T.TT...T.T.,,.T...T..T.bTT.dTTT.T...e..f.~~...__^^^^^____^^^^^_____TT',
  'TTT..fT.,,.T..T.T.....,,....T.T.........f...........~~...__^^^^^____^^^^^_____TT',
  'TT......,,..TTTTf...T.,,...T..T.T..T..T.............~~...____h______^^^^^_____TT',
  'TT....T.,,.TTTd.T.....,,......TTT...TT..T.T....T....~~..._____________________TT',
  'TT....T.,,.TTTT..T....,,.....T.TTTTTT.T....f.To.T...~~..._____________________TT',
  'TT......,,.TT.T..T..T.,,...T.TTTT....TT.............~~..._____________________TT',
  'TT..e...,,...To....TT.,,.cTT..TTT.TT....T....b..TT...~~.._________^^^^^___p___TT',
  'TT......,,..TTT.T..TT.,,...T...T.T..T.T.......T.TT...~~.._________^^^^^_______TT',
  'TTTTTf..,,...T.T.TTTT.,,.T...bT...TT.TT.........T....~~.._________^^^^^_______TT',
  'TT..T...,,..TTT..TTTT.,,.............................~~.._________^^^^^_______TT',
  'TT.TT...,,.f.TT.f.TTT.,,,,,,,,,,,,,,,,,,,,....T......~~.._o_____G_____________TT',
  'TT..TT..,L........T.T.,,,,,,,,,,,,,,,,,,,M.....fTT...~~.._____________________TT',
  'TT.TTTT......f...T.TT......................T..T..T...~~.......................TT',
  'TT.T...T.b.......TT.T......T...TTo.T.TT..f.......TT..~~....b..................TT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
