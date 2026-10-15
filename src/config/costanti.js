// =============================================================
// COSTANTI DEL GIOCO
// Qui teniamo i "numeri magici" in un posto solo: se vogliamo
// cambiare la velocità di Robin o i colori, basta modificarli qui.
// =============================================================

const COSTANTI = {
  // Dimensioni della finestra di gioco (in pixel "logici")
  LARGHEZZA: 960,
  ALTEZZA: 540,

  // Ogni casella (tile) della mappa è un quadrato di 16x16 pixel
  TILE: 16,

  // Lo zoom della telecamera nelle missioni: 2 = tutto grande il doppio
  ZOOM: 2,

  // Movimento di Robin (pixel al secondo)
  VEL_CAMMINO: 70,
  VEL_CORSA: 115,
  VEL_MIRA: 40, // quando tende l'arco va più piano

  // Arco
  TEMPO_CARICA: 0.9, // secondi per arrivare alla carica massima
  TEMPO_TREMORE: 2.2, // dopo quanti secondi di arco teso il braccio inizia a tremare

  // Guardie
  VEL_GUARDIA: 38,
  VEL_GUARDIA_INSEGUE: 78,

  // Fumo delle frecce fumogene
  RAGGIO_FUMO: 42,
  DURATA_FUMO: 8, // secondi

  // Colori (formato esadecimale 0xRRGGBB per Phaser)
  COLORI: {
    verdeScuro: 0x0d1a10,
    verde: 0x2e5a2e,
    verdeChiaro: 0x6fbf4a,
    oro: 0xf2c14e,
    rosso: 0xc0392b,
    pergamena: 0xe8d5a6,
    marrone: 0x5b3a1e,
    nero: 0x000000,
    bianco: 0xffffff
  },

  // Gli stessi colori come testo CSS (servono per i testi)
  CSS: {
    oro: '#f2c14e',
    pergamena: '#e8d5a6',
    inchiostro: '#3b2410',
    verdeChiaro: '#8fd16a',
    rosso: '#ff6b5a',
    bianco: '#ffffff',
    grigio: '#a9b3a5'
  },

  // Carattere usato in tutti i testi: un font pixel-art (assets/font)
  FONT: 'Pixelify, monospace'
};
