// =============================================================
// GRAFICA DELLE CASELLE (TILE)
// Disegna tutte le caselle della mappa in un'unica immagine
// chiamata "tileset". Ogni casella è 16x16 pixel.
//
// Trucco tecnico: tra una casella e l'altra lasciamo 2 pixel e
// "allunghiamo" i bordi (extrude). Così, con lo zoom, non si vedono
// righine strane tra una casella e l'altra.
// =============================================================

// Numero (indice) di ogni casella nel tileset
const TILE = {
  ERBA: 0, ERBA2: 1, ERBA3: 2, FIORI: 3,
  STRADA: 4, LASTRICATO: 5, INTERNO: 6,
  MURO: 7, ALBERO: 8, CESPUGLIO: 9, ACQUA: 10,
  TETTO: 11, CAMMINO: 12, CELLA: 13, CELLA_APERTA: 14,
  SEGRETO: 15, SEGRETO_APERTO: 16, ALBERO_SECCO: 17,
  CASSE: 18, TENDA: 19, PIETRE_FUOCO: 20,
  TETTO_ALTO: 21, FACCIATA: 22
};

const GraficaTile = {
  // Generatore di numeri "casuali" ripetibile: stesso seme = stesso disegno
  seme: 1,
  rnd() {
    this.seme = (this.seme * 16807) % 2147483647;
    return (this.seme - 1) / 2147483646;
  },

  // Riempie il quadrato con un colore e poi aggiunge "puntini" di altri colori
  base(ctx, colore, macchie, quantita) {
    ctx.fillStyle = colore;
    ctx.fillRect(0, 0, 16, 16);
    for (let i = 0; i < quantita; i++) {
      ctx.fillStyle = macchie[Math.floor(this.rnd() * macchie.length)];
      ctx.fillRect(Math.floor(this.rnd() * 16), Math.floor(this.rnd() * 16), 1, 1);
    }
  },

  px(ctx, colore, x, y, w, h) {
    ctx.fillStyle = colore;
    ctx.fillRect(x, y, w || 1, h || 1);
  },

  erba(ctx) {
    this.base(ctx, '#3f7a35', ['#4d8c3f', '#356a2d', '#47833a'], 40);
  },

  // Ogni funzione disegna una casella su un canvas 16x16
  DISEGNI: {
    [TILE.ERBA](g, ctx) { g.erba(ctx); },
    [TILE.ERBA2](g, ctx) {
      g.erba(ctx);
      g.px(ctx, '#5fa04a', 4, 5); g.px(ctx, '#5fa04a', 5, 4); g.px(ctx, '#5fa04a', 6, 5);
      g.px(ctx, '#5fa04a', 11, 11); g.px(ctx, '#5fa04a', 12, 10); g.px(ctx, '#5fa04a', 13, 11);
    },
    [TILE.ERBA3](g, ctx) {
      g.erba(ctx);
      g.px(ctx, '#2f5f28', 2, 12, 3, 1); g.px(ctx, '#5fa04a', 9, 3); g.px(ctx, '#5fa04a', 10, 2);
    },
    [TILE.FIORI](g, ctx) {
      g.erba(ctx);
      [[3, 4, '#f2c14e'], [11, 6, '#f4f0e0'], [6, 11, '#d0606a'], [13, 13, '#f2c14e']].forEach(([x, y, c]) => {
        g.px(ctx, c, x, y); g.px(ctx, c, x + 1, y); g.px(ctx, c, x, y + 1); g.px(ctx, c, x + 1, y + 1);
      });
    },
    [TILE.STRADA](g, ctx) {
      g.base(ctx, '#8a6a43', ['#7a5c38', '#9c7a50', '#6e5232'], 45);
    },
    [TILE.LASTRICATO](g, ctx) {
      g.base(ctx, '#7d7a72', ['#88857c', '#706d66'], 25);
      for (let y = 0; y < 16; y += 4) {
        g.px(ctx, '#5f5c56', 0, y, 16, 1);
        const sfasa = (y / 4) % 2 === 0 ? 0 : 4;
        for (let x = sfasa; x < 16; x += 8) g.px(ctx, '#5f5c56', x, y, 1, 4);
      }
    },
    [TILE.INTERNO](g, ctx) {
      // pavimento di legno del castello
      g.base(ctx, '#7a5a3a', ['#6c4f33', '#84633f'], 30);
      for (let y = 3; y < 16; y += 4) g.px(ctx, '#4f3822', 0, y, 16, 1);
      g.px(ctx, '#4f3822', 5, 0, 1, 3); g.px(ctx, '#4f3822', 12, 4, 1, 3);
      g.px(ctx, '#4f3822', 2, 8, 1, 3); g.px(ctx, '#4f3822', 9, 12, 1, 3);
    },
    [TILE.MURO](g, ctx) {
      g.base(ctx, '#8d8a84', ['#97938c', '#827f79'], 20);
      for (let y = 0; y < 16; y += 5) {
        g.px(ctx, '#5a5752', 0, y + 4, 16, 1);
        const sfasa = (y / 5) % 2 === 0 ? 3 : 10;
        g.px(ctx, '#5a5752', sfasa, y, 1, 4);
      }
      g.px(ctx, '#a8a49c', 0, 0, 16, 1);
    },
    [TILE.ALBERO](g, ctx) {
      g.erba(ctx);
      GraficaPixel.cerchio(ctx, 8, 8, 7, '#1f4a1c');
      GraficaPixel.cerchio(ctx, 7, 7, 6, '#2f6b2a');
      GraficaPixel.cerchio(ctx, 6, 5, 3, '#3f8a36');
      g.px(ctx, '#58a84a', 5, 4); g.px(ctx, '#58a84a', 9, 9);
    },
    [TILE.CESPUGLIO](g, ctx) {
      g.erba(ctx);
      GraficaPixel.cerchio(ctx, 8, 9, 6, '#2b6a26');
      GraficaPixel.cerchio(ctx, 7, 8, 5, '#4a9a3e');
      g.px(ctx, '#6fbf4a', 5, 6); g.px(ctx, '#6fbf4a', 9, 7);
      g.px(ctx, '#c0392b', 10, 10); g.px(ctx, '#c0392b', 5, 11);
    },
    [TILE.ACQUA](g, ctx) {
      g.base(ctx, '#2f5f9a', ['#2a568c', '#3568a6'], 20);
      g.px(ctx, '#5a8fd0', 2, 3, 4, 1); g.px(ctx, '#5a8fd0', 9, 8, 5, 1); g.px(ctx, '#5a8fd0', 4, 13, 3, 1);
    },
    [TILE.TETTO](g, ctx) {
      // tegole rosse delle case
      g.base(ctx, '#8a3b2a', ['#95442f', '#7d3424'], 20);
      for (let y = 3; y < 16; y += 4) {
        g.px(ctx, '#5e2419', 0, y, 16, 1);
        const sfasa = (y + 1) % 8 === 0 ? 2 : 6;
        for (let x = sfasa; x < 16; x += 8) g.px(ctx, '#5e2419', x, y - 3, 1, 3);
      }
    },
    [TILE.CAMMINO](g, ctx) {
      // cammino di ronda sopra le mura
      g.base(ctx, '#a39f96', ['#b0aca2', '#948f86'], 20);
      g.px(ctx, '#6d6a64', 0, 0, 16, 1); g.px(ctx, '#6d6a64', 0, 15, 16, 1);
      g.px(ctx, '#6d6a64', 7, 1, 1, 14);
    },
    [TILE.CELLA](g, ctx) {
      GraficaTile.DISEGNI[TILE.INTERNO](g, ctx);
      for (let x = 1; x < 16; x += 3) {
        g.px(ctx, '#2a2a2e', x, 0, 2, 16);
        g.px(ctx, '#6a6a72', x, 0, 1, 16);
      }
      g.px(ctx, '#2a2a2e', 0, 7, 16, 2);
    },
    [TILE.CELLA_APERTA](g, ctx) {
      GraficaTile.DISEGNI[TILE.INTERNO](g, ctx);
      g.px(ctx, '#2a2a2e', 0, 0, 2, 16);
      g.px(ctx, '#2a2a2e', 14, 0, 2, 16);
    },
    [TILE.SEGRETO](g, ctx) {
      GraficaTile.DISEGNI[TILE.MURO](g, ctx);
      // una crepa sottile: un indizio per chi osserva bene
      g.px(ctx, '#3a3834', 7, 3); g.px(ctx, '#3a3834', 8, 4); g.px(ctx, '#3a3834', 8, 5);
      g.px(ctx, '#3a3834', 7, 6); g.px(ctx, '#3a3834', 7, 7); g.px(ctx, '#3a3834', 8, 8);
    },
    [TILE.SEGRETO_APERTO](g, ctx) {
      g.base(ctx, '#2e2a26', ['#38332e', '#25211e'], 25);
    },
    [TILE.ALBERO_SECCO](g, ctx) {
      g.erba(ctx);
      g.px(ctx, '#5a4632', 7, 4, 3, 12);
      g.px(ctx, '#5a4632', 4, 2, 1, 4); g.px(ctx, '#5a4632', 5, 5, 2, 1);
      g.px(ctx, '#5a4632', 11, 1, 1, 5); g.px(ctx, '#5a4632', 10, 6, 1, 1);
      g.px(ctx, '#7a6650', 8, 4, 1, 12);
    },
    [TILE.CASSE](g, ctx) {
      g.base(ctx, '#7d7a72', ['#706d66'], 10);
      g.px(ctx, '#5b3a1e', 1, 1, 14, 14);
      g.px(ctx, '#9a6a3a', 2, 2, 12, 12);
      for (let i = 2; i < 14; i++) {
        g.px(ctx, '#5b3a1e', i, i); g.px(ctx, '#5b3a1e', 15 - i, i);
      }
    },
    [TILE.TENDA](g, ctx) {
      g.erba(ctx);
      for (let y = 1; y < 16; y++) {
        const meta = Math.floor(y / 2);
        g.px(ctx, '#d8c8a0', 8 - meta, y, meta, 1);
        g.px(ctx, '#b0a07a', 8, y, meta, 1);
      }
      g.px(ctx, '#3a2a18', 7, 10, 2, 6);
    },
    [TILE.TETTO_ALTO](g, ctx) {
      // fila più alta del tetto: il colmo, più chiaro
      GraficaTile.DISEGNI[TILE.TETTO](g, ctx);
      g.px(ctx, '#3e1610', 0, 0, 16, 1);
      g.px(ctx, '#b25a40', 0, 1, 16, 2);
    },
    [TILE.FACCIATA](g, ctx) {
      // muro della casa visto di fronte: intonaco, travi e una finestra
      g.base(ctx, '#d8c8a0', ['#cdbb90', '#e2d4b0'], 25);
      g.px(ctx, '#5e2419', 0, 0, 16, 3);       // gronda del tetto
      g.px(ctx, '#3e1610', 0, 3, 16, 1);
      g.px(ctx, '#5b3a1e', 0, 4, 2, 12);        // travi di legno
      g.px(ctx, '#5b3a1e', 14, 4, 2, 12);
      g.px(ctx, '#5b3a1e', 0, 9, 16, 1);
      g.px(ctx, '#2a1a10', 6, 6, 4, 5);         // finestra
      g.px(ctx, '#f2c14e', 7, 7, 2, 3);
    },
    [TILE.PIETRE_FUOCO](g, ctx) {
      GraficaTile.DISEGNI[TILE.STRADA](g, ctx);
      [[3, 3], [7, 2], [11, 3], [13, 7], [12, 11], [8, 13], [4, 12], [2, 8]].forEach(([x, y]) => {
        g.px(ctx, '#6d6a64', x, y, 2, 2);
        g.px(ctx, '#9a968e', x, y, 1, 1);
      });
      g.px(ctx, '#2a1a10', 5, 5, 6, 6);
    }
  },

  creaTileset(scene) {
    const numero = Object.keys(TILE).length;
    const passo = 18; // 16 pixel + 2 di spaziatura
    const tex = scene.textures.createCanvas('tileset', numero * passo, passo);
    const ctx = tex.getContext();

    // Canvas temporaneo dove disegniamo una casella alla volta
    const tmp = document.createElement('canvas');
    tmp.width = 16;
    tmp.height = 16;
    const tctx = tmp.getContext('2d');

    for (let i = 0; i < numero; i++) {
      this.seme = 1000 + i * 77; // seme diverso per ogni casella
      tctx.clearRect(0, 0, 16, 16);
      this.DISEGNI[i](this, tctx);
      const x = 1 + i * passo;
      const y = 1;
      ctx.drawImage(tmp, x, y);
      // "allunghiamo" i bordi di 1 pixel (extrude)
      ctx.drawImage(tmp, 0, 0, 1, 16, x - 1, y, 1, 16);
      ctx.drawImage(tmp, 15, 0, 1, 16, x + 16, y, 1, 16);
      ctx.drawImage(tmp, 0, 0, 16, 1, x, y - 1, 16, 1);
      ctx.drawImage(tmp, 0, 15, 16, 1, x, y + 16, 16, 1);
      // ogni casella diventa anche un "fotogramma" usabile come immagine (es. sfondi dei menu)
      tex.add(i, 0, x, y, 16, 16);
    }
    // Phaser usa il "primo fotogramma" come immagine intera del tileset:
    // deve restare quello di base, non la casella 0
    tex.firstFrame = '__BASE';
    tex.refresh();
  }
};
