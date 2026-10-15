// =============================================================
// LIVELLI DI DIFFICOLTÀ
// Ogni livello cambia alcuni parametri del gioco.
// Il gioco legge DIFFICOLTA[livelloScelto].nomeParametro
// =============================================================

const DIFFICOLTA = {
  facile: {
    nome: 'Facile',
    descrizione: 'Guardie meno attente, più salute e più oro.',
    saluteRobin: 8,         // punti salute (mezzi cuori)
    oroIniziale: 100,
    frecceIniziali: 20,
    distanzaVista: 95,      // quanto lontano vedono le guardie (pixel)
    ampiezzaCono: 50,       // ampiezza del cono visivo (gradi)
    velocitaSospetto: 0.9,  // quanto in fretta si riempie il "?"
    saluteGuardia: 2,
    dannoGuardia: 1,
    rinforzi: 2,            // guardie in più quando scatta l'allarme
    prezzi: 0.8,            // moltiplicatore dei prezzi del negozio
    moltiplicatorePunti: 0.8,
    saluteSceriffo: 18,
    ventoMassimo: 1         // vento massimo nel torneo
  },

  normale: {
    nome: 'Normale',
    descrizione: 'La difficoltà consigliata.',
    saluteRobin: 6,
    oroIniziale: 60,
    frecceIniziali: 15,
    distanzaVista: 115,
    ampiezzaCono: 60,
    velocitaSospetto: 1.3,
    saluteGuardia: 2,
    dannoGuardia: 1,
    rinforzi: 3,
    prezzi: 1,
    moltiplicatorePunti: 1,
    saluteSceriffo: 26,
    ventoMassimo: 2
  },

  difficile: {
    nome: 'Difficile',
    descrizione: 'Guardie attente, poca salute e poche frecce.',
    saluteRobin: 4,
    oroIniziale: 30,
    frecceIniziali: 10,
    distanzaVista: 135,
    ampiezzaCono: 70,
    velocitaSospetto: 1.8,
    saluteGuardia: 3,
    dannoGuardia: 2,
    rinforzi: 5,
    prezzi: 1.25,
    moltiplicatorePunti: 1.5,
    saluteSceriffo: 34,
    ventoMassimo: 3
  }
};
