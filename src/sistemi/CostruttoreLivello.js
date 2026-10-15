// =============================================================
// COSTRUTTORE DEI LIVELLI
// Prende una mappa di testo (da mappe.js) e:
//   1. trova i "segnaposto" (P, g, o, ...) e ricorda dove sono;
//   2. al loro posto mette il pavimento che c'è intorno;
//   3. crea la tilemap di Phaser (le caselle disegnate);
//   4. prepara la Griglia per l'intelligenza delle guardie.
// =============================================================

const CostruttoreLivello = {
  // Carattere della mappa -> casella del tileset
  TILE_DA_CARATTERE: {
    '.': TILE.ERBA, ',': TILE.STRADA, '_': TILE.LASTRICATO, ':': TILE.INTERNO,
    '#': TILE.MURO, 'T': TILE.ALBERO, 'b': TILE.CESPUGLIO, '~': TILE.ACQUA,
    '^': TILE.TETTO, 'A': TILE.TETTO, 'C': TILE.CELLA, 'S': TILE.SEGRETO,
    'Y': TILE.ALBERO_SECCO, 'x': TILE.CASSE, 'f': TILE.FIORI, 't': TILE.TENDA,
    'F': TILE.PIETRE_FUOCO
  },

  // Pavimenti che possono stare sotto un segnaposto
  PAVIMENTI: '.,_:',

  costruisci(scene, nomeMappa) {
    const righeOriginali = MAPPE[nomeMappa];
    const punti = {}; // es. punti['g'] = [{x, y, tx, ty}, ...]
    const righe = righeOriginali.map((r) => r.split(''));
    const altezza = righe.length;
    const larghezza = righe[0].length;

    // 1-2. Troviamo i segnaposto e li sostituiamo con il pavimento vicino
    for (let ty = 0; ty < altezza; ty++) {
      for (let tx = 0; tx < larghezza; tx++) {
        const c = righe[ty][tx];
        if (!punti[c]) punti[c] = [];
        punti[c].push({
          tx, ty,
          x: tx * COSTANTI.TILE + COSTANTI.TILE / 2,
          y: ty * COSTANTI.TILE + COSTANTI.TILE / 2
        });
        if (this.TILE_DA_CARATTERE[c] === undefined) {
          righe[ty][tx] = this.pavimentoVicino(righeOriginali, tx, ty);
        }
      }
    }

    const testo = righe.map((r) => r.join(''));
    const griglia = new Griglia(testo);

    // 3. Trasformiamo i caratteri in numeri di casella
    const dati = [];
    for (let ty = 0; ty < altezza; ty++) {
      const riga = [];
      for (let tx = 0; tx < larghezza; tx++) {
        riga.push(this.sceltaTile(griglia, tx, ty));
      }
      dati.push(riga);
    }

    const mappa = scene.make.tilemap({ data: dati, tileWidth: COSTANTI.TILE, tileHeight: COSTANTI.TILE });
    // margine 1 e spaziatura 2: vedi GraficaTile
    const tileset = mappa.addTilesetImage('tileset', 'tileset', 16, 16, 1, 2);
    const strato = mappa.createLayer(0, tileset, 0, 0);

    // Caselle su cui si sbatte camminando a terra
    strato.setCollision([
      TILE.MURO, TILE.ALBERO, TILE.ACQUA, TILE.TETTO, TILE.CAMMINO, TILE.CELLA,
      TILE.SEGRETO, TILE.ALBERO_SECCO, TILE.CASSE, TILE.TENDA, TILE.PIETRE_FUOCO,
      TILE.TETTO_ALTO, TILE.FACCIATA
    ]);

    // Secondo strato INVISIBILE con le stesse caselle: serve quando Robin
    // è sui tetti. Lassù si sbatte contro tutto TRANNE tetti e camminamenti.
    const stratoTetti = mappa.createBlankLayer('tetti', tileset, 0, 0);
    for (let ty = 0; ty < altezza; ty++) {
      for (let tx = 0; tx < larghezza; tx++) {
        stratoTetti.putTileAt(dati[ty][tx], tx, ty);
      }
    }
    stratoTetti.setVisible(false);
    stratoTetti.setCollisionByExclusion([TILE.TETTO, TILE.CAMMINO, TILE.TETTO_ALTO, TILE.FACCIATA]);

    return {
      mappa, strato, stratoTetti, griglia, punti,
      larghezzaPx: larghezza * COSTANTI.TILE,
      altezzaPx: altezza * COSTANTI.TILE
    };
  },

  // Sceglie la casella giusta per un carattere (con qualche variante)
  sceltaTile(griglia, tx, ty) {
    const c = griglia.carattere(tx, ty);
    if (c === '.') {
      // erba con piccole varianti, sempre uguali per la stessa casella
      const v = (tx * 7 + ty * 13) % 11;
      if (v === 0) return TILE.ERBA2;
      if (v === 5) return TILE.ERBA3;
      return TILE.ERBA;
    }
    if (c === '^' || c === 'A') {
      // un tetto attaccato a un muro è un cammino di ronda
      const vicinoMuro =
        griglia.carattere(tx + 1, ty) === '#' || griglia.carattere(tx - 1, ty) === '#' ||
        griglia.carattere(tx, ty + 1) === '#' || griglia.carattere(tx, ty - 1) === '#';
      if (vicinoMuro) return TILE.CAMMINO;
      // la fila in basso della casa mostra la facciata, quella in alto il colmo
      if (!griglia.eTetto(tx, ty + 1)) return TILE.FACCIATA;
      if (!griglia.eTetto(tx, ty - 1)) return TILE.TETTO_ALTO;
      return TILE.TETTO;
    }
    return this.TILE_DA_CARATTERE[c];
  },

  // Guarda le 4 caselle vicine e prende il primo pavimento che trova
  pavimentoVicino(righe, tx, ty) {
    const vicini = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-2, 0], [2, 0]];
    for (const [dx, dy] of vicini) {
      const riga = righe[ty + dy];
      if (!riga) continue;
      const c = riga[tx + dx];
      if (c && this.PAVIMENTI.indexOf(c) !== -1) return c;
    }
    return '.';
  },

  // Sceglie a caso "quanti" elementi da un elenco (senza ripetizioni).
  // È il cuore della rigiocabilità: ogni partita è un po' diversa.
  scegliACaso(elenco, quanti) {
    const copia = (elenco || []).slice();
    Phaser.Utils.Array.Shuffle(copia);
    return copia.slice(0, Math.min(quanti, copia.length));
  }
};
