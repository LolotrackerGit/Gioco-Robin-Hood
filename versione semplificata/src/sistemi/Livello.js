// =============================================================
// COSTRUZIONE DEL LIVELLO
// Trasforma la mappa di testo (config/mappa.js) in una tilemap
// di Phaser e ricorda dove sono i segnaposto (P, J, C, g, ...).
// =============================================================

const Livello = {
  // carattere della mappa -> casella del tileset
  TILE_DA_CARATTERE: {
    '.': TILE.ERBA, ',': TILE.STRADA, '_': TILE.LASTRICATO,
    'T': TILE.ALBERO, 'b': TILE.CESPUGLIO, 'f': TILE.FIORI,
    '^': TILE.TETTO, 't': TILE.TENDA, 'F': TILE.PIETRE_FUOCO, '~': TILE.ACQUA
  },

  costruisci(scene) {
    const punti = {};
    const righe = MAPPA.map((r) => r.split(''));
    const altezza = righe.length;
    const larghezza = righe[0].length;

    // 1. segnaposto: ricordiamo dove sono e mettiamo il pavimento vicino
    for (let ty = 0; ty < altezza; ty++) {
      for (let tx = 0; tx < larghezza; tx++) {
        const c = righe[ty][tx];
        if (this.TILE_DA_CARATTERE[c] !== undefined) continue;
        if (!punti[c]) punti[c] = [];
        punti[c].push({ x: tx * 16 + 8, y: ty * 16 + 8 });
        righe[ty][tx] = this.pavimentoVicino(MAPPA, tx, ty);
      }
    }
    const griglia = new Griglia(righe.map((r) => r.join('')));

    // 2. numeri delle caselle (le case hanno il tetto in alto e la facciata in basso)
    const dati = [];
    for (let ty = 0; ty < altezza; ty++) {
      const riga = [];
      for (let tx = 0; tx < larghezza; tx++) {
        const c = griglia.carattere(tx, ty);
        let tile = this.TILE_DA_CARATTERE[c];
        if (c === '.' && (tx * 7 + ty * 13) % 11 === 0) tile = TILE.ERBA2;
        if (c === '^' && !griglia.eTetto(tx, ty + 1)) tile = TILE.FACCIATA;
        else if (c === '^' && !griglia.eTetto(tx, ty - 1)) tile = TILE.TETTO_ALTO;
        riga.push(tile);
      }
      dati.push(riga);
    }

    const mappa = scene.make.tilemap({ data: dati, tileWidth: 16, tileHeight: 16 });
    const tileset = mappa.addTilesetImage('tileset', 'tileset', 16, 16, 1, 2);
    const strato = mappa.createLayer(0, tileset, 0, 0);
    strato.setCollision([TILE.ALBERO, TILE.TETTO, TILE.TETTO_ALTO, TILE.FACCIATA, TILE.TENDA, TILE.PIETRE_FUOCO, TILE.ACQUA]);

    return { strato, griglia, punti, larghezzaPx: larghezza * 16, altezzaPx: altezza * 16 };
  },

  pavimentoVicino(righe, tx, ty) {
    const vicini = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of vicini) {
      const riga = righe[ty + dy];
      const c = riga && riga[tx + dx];
      if (c && '.,_'.indexOf(c) !== -1) return c;
    }
    return '.';
  }
};
