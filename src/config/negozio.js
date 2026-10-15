// =============================================================
// NEGOZIO DI FRA TUCK
// Cose che si possono comprare all'accampamento.
// "tipo" indica cosa succede quando compri:
//   - 'frecce': aggiunge frecce di un certo tipo
//   - 'potenziamento': sblocca un miglioramento (si compra una volta)
// I prezzi vengono moltiplicati per il valore "prezzi" della difficoltà.
// =============================================================

const NEGOZIO = [
  { id: 'normale', nome: 'Frecce comuni x5', tipo: 'frecce', freccia: 'normale', quantita: 5, prezzo: 15,
    descrizione: 'Si possono raccogliere da terra dopo il tiro.' },
  { id: 'stordente', nome: 'Frecce stordenti x3', tipo: 'frecce', freccia: 'stordente', quantita: 3, prezzo: 30,
    descrizione: 'Stordiscono una guardia senza ucciderla.' },
  { id: 'fumogena', nome: 'Frecce fumogene x2', tipo: 'frecce', freccia: 'fumogena', quantita: 2, prezzo: 35,
    descrizione: 'Fanno una nube di fumo: per 8 secondi le guardie non vedono.' },
  { id: 'corda', nome: 'Frecce con corda x2', tipo: 'frecce', freccia: 'corda', quantita: 2, prezzo: 30,
    descrizione: 'Si agganciano agli anelli gialli per salire su tetti e mura.' },

  { id: 'faretra', nome: 'Faretra grande', tipo: 'potenziamento', prezzo: 80,
    descrizione: 'Puoi portare 10 frecce comuni in più.' },
  { id: 'mantello', nome: 'Mantello verde', tipo: 'potenziamento', prezzo: 120,
    descrizione: 'Le guardie ti notano il 25% più lentamente.' },
  { id: 'stivali', nome: 'Stivali di pelle morbida', tipo: 'potenziamento', prezzo: 90,
    descrizione: 'Quando corri fai la metà del rumore.' },
  { id: 'erbe', nome: 'Erbe medicinali', tipo: 'potenziamento', prezzo: 100,
    descrizione: 'Salute massima +2 (un cuore in più).' }
];

// Massimo di frecce trasportabili per tipo (senza potenziamenti)
const MAX_FRECCE = {
  normale: 20,
  stordente: 6,
  fumogena: 4,
  corda: 4
};

// Nomi e colori dei tipi di freccia (per HUD e menu)
const TIPI_FRECCIA = [
  { id: 'normale', nome: 'Comune', colore: 0xd9c8a0 },
  { id: 'stordente', nome: 'Stordente', colore: 0x6fa8dc },
  { id: 'fumogena', nome: 'Fumogena', colore: 0xbbbbbb },
  { id: 'corda', nome: 'Corda', colore: 0xf2c14e }
];
