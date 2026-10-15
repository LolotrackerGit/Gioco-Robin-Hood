// =============================================================
// GRAFICA PIXEL ART GENERATA DA CODICE
// Ogni sprite è disegnato come una "griglia di caratteri":
// ogni lettera è un pixel di un certo colore, il punto (.) è
// trasparente. Questa griglia viene trasformata in un'immagine
// (texture) che Phaser può usare come uno sprite normale.
// In questo modo non servono file di immagini esterni.
// =============================================================

const GraficaPixel = {
  // Tavolozza comune: lettera -> colore
  PALETTE: {
    k: '#1a1410', // nero (occhi, contorni)
    s: '#e0a878', // pelle
    S: '#b87a50', // pelle in ombra
    g: '#3f8f3a', // verde
    G: '#2a5e28', // verde scuro
    l: '#7cc25a', // verde chiaro
    b: '#6b4423', // marrone
    B: '#4a2c14', // marrone scuro
    y: '#f2c14e', // oro
    Y: '#b8892a', // oro scuro
    r: '#b83a2e', // rosso
    R: '#7a2018', // rosso scuro
    w: '#f4f0e0', // bianco sporco
    a: '#9aa0a8', // grigio (ferro)
    A: '#5e646c', // grigio scuro
    n: '#2b3a67', // blu notte
    N: '#1b2440', // blu scurissimo
    c: '#c8b48a', // tela chiara
    C: '#8f7c58', // tela scura
    p: '#6a3b7a'  // viola
  },

  // Disegna una griglia di caratteri su un "contesto" canvas 2D
  disegna(ctx, righe, palette, ox, oy) {
    for (let y = 0; y < righe.length; y++) {
      for (let x = 0; x < righe[y].length; x++) {
        const colore = palette[righe[y][x]];
        if (colore) {
          ctx.fillStyle = colore;
          ctx.fillRect(ox + x, oy + y, 1, 1);
        }
      }
    }
  },

  // Crea una texture con più fotogrammi messi uno accanto all'altro.
  // I fotogrammi si chiamano '0', '1', '2'...
  creaFoglio(scene, chiave, fotogrammi, palette) {
    const h = fotogrammi[0].length;
    const w = fotogrammi[0][0].length;
    const tex = scene.textures.createCanvas(chiave, w * fotogrammi.length, h);
    const ctx = tex.getContext();
    fotogrammi.forEach((righe, i) => {
      this.disegna(ctx, righe, palette, i * w, 0);
      tex.add(String(i), 0, i * w, 0, w, h);
    });
    tex.refresh();
  },

  // Crea una texture con un solo disegno
  creaTexture(scene, chiave, righe, palette) {
    this.creaFoglio(scene, chiave, [righe], palette || this.PALETTE);
  },

  // Crea una texture disegnata con una funzione (per forme rotonde ecc.)
  creaConFunzione(scene, chiave, w, h, funzioneDisegno) {
    const tex = scene.textures.createCanvas(chiave, w, h);
    funzioneDisegno(tex.getContext(), w, h);
    tex.refresh();
  },

  // Cerchio "pixelato" (senza sfumature)
  cerchio(ctx, cx, cy, r, colore) {
    ctx.fillStyle = colore;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r * 0.6) ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
  },

  // ---------------------------------------------------------
  // PERSONAGGI
  // Tutti i personaggi usano lo stesso "modello" di corpo.
  // Cambiano solo i colori: H cappello/capelli, X dettaglio,
  // s pelle, k occhi, T tunica, t ombra tunica, K cintura,
  // L gambe, F piedi.
  // ---------------------------------------------------------
  MODELLO_FERMO: [
    '................',
    '......HHHH......',
    '.....HHHHHHX....',
    '....HHHHHHHHX...',
    '.....ssssss.....',
    '.....skssks.....',
    '......ssss......',
    '....TTTTTTTT....',
    '...TTTTKKTTTT...',
    '...sTTTTTTTTs...',
    '...stTTTTTTts...',
    '....TTTTTTTT....',
    '.....LLLLLL.....',
    '.....LL..LL.....',
    '.....FF..FF.....',
    '................'
  ],

  // Per camminare cambiamo solo le gambe
  gambe(modello, riga13, riga14) {
    const copia = modello.slice();
    copia[13] = riga13;
    copia[14] = riga14;
    return copia;
  },

  creaPersonaggio(scene, chiave, colori) {
    const p = this.PALETTE;
    const palette = {
      H: colori.H, X: colori.X, s: colori.s || p.s, k: colori.k || p.k,
      T: colori.T, t: colori.t, K: colori.K, L: colori.L, F: colori.F || p.B
    };
    const fermo = this.MODELLO_FERMO;
    const passo1 = this.gambe(fermo, '....LL...LL.....', '....FF....FF....');
    const passo2 = this.gambe(fermo, '......LLLL......', '......FFFF......');
    this.creaFoglio(scene, chiave, [fermo, passo1, passo2], palette);
  },

  creaPersonaggi(scene) {
    const p = this.PALETTE;
    this.creaPersonaggio(scene, 'robin', { H: p.G, X: p.r, T: p.g, t: p.G, K: p.b, L: p.b, F: p.B });
    this.creaPersonaggio(scene, 'robin_mendicante', { H: p.C, X: p.C, T: p.C, t: p.b, K: p.B, L: p.B, F: p.B });
    this.creaPersonaggio(scene, 'guardia', { H: p.a, X: p.A, T: p.r, t: p.R, K: p.B, L: p.A, F: p.k });
    this.creaPersonaggio(scene, 'balestriere', { H: p.b, X: p.B, T: p.R, t: p.r, K: p.y, L: p.A, F: p.k });
    this.creaPersonaggio(scene, 'carceriere', { H: p.k, X: p.k, T: p.B, t: p.b, K: p.y, L: p.A, F: p.k });
    this.creaPersonaggio(scene, 'sceriffo', { H: p.k, X: p.y, T: p.N, t: p.n, K: p.y, L: p.k, F: p.k });
    this.creaPersonaggio(scene, 'john', { H: p.b, X: p.b, T: p.b, t: p.B, K: p.k, L: p.G, F: p.B });
    this.creaPersonaggio(scene, 'tuck', { H: p.S, X: p.s, T: p.b, t: p.B, K: p.w, L: p.b, F: p.B });
    this.creaPersonaggio(scene, 'gisborne', { H: p.k, X: p.k, T: p.B, t: p.k, K: p.a, L: p.k, F: p.k });
    this.creaPersonaggio(scene, 'popolano', { H: p.b, X: p.b, T: p.c, t: p.C, K: p.b, L: p.C, F: p.B });
    this.creaPersonaggio(scene, 'marian', { H: p.r, X: p.R, T: p.p, t: p.n, K: p.y, L: p.p, F: p.B });
  },

  // ---------------------------------------------------------
  // OGGETTI
  // ---------------------------------------------------------
  creaOggetti(scene) {
    const P = this.PALETTE;

    // Arco (punta verso destra: la corda è a sinistra, verso Robin)
    this.creaTexture(scene, 'arco', [
      '.BB....',
      'w.bB...',
      'w..bB..',
      'w...b..',
      'w...bB.',
      'w....b.',
      'w....b.',
      'w....b.',
      'w...bB.',
      'w...b..',
      'w..bB..',
      'w.bB...',
      '.BB....'
    ]);

    // Frecce: una per tipo (cambiano piume e punta)
    const frecce = {
      freccia_normale: { r: P.r, a: P.a },
      freccia_stordente: { r: P.n, a: '#6fa8dc' },
      freccia_fumogena: { r: P.a, a: P.A },
      freccia_corda: { r: P.y, a: P.Y }
    };
    Object.keys(frecce).forEach((chiave) => {
      const pal = { r: frecce[chiave].r, a: frecce[chiave].a, b: P.b };
      this.creaTexture(scene, chiave, [
        'r..........',
        'rrbbbbbbbaa',
        'r..........'
      ], pal);
    });

    // Dardo della balestra
    this.creaTexture(scene, 'dardo', [
      'BBBBBAa'
    ]);

    // Sacco d'oro
    this.creaTexture(scene, 'sacco', [
      '....BB....',
      '...BccB...',
      '....bb....',
      '..CccccC..',
      '.CccyycccC',
      '.Ccyyyycc.',
      '.CccyycccC',
      '.Cccccccc.',
      '..CCCCCC..'
    ]);

    // Moneta (icona HUD)
    this.creaTexture(scene, 'moneta', [
      '.yyyy.',
      'yyYYyy',
      'yYyyYy',
      'yYyyYy',
      'yyYYyy',
      '.yyyy.'
    ]);

    // Fascio di frecce a terra
    this.creaTexture(scene, 'frecce_terra', [
      'r.r.r.......',
      '.bbbbbbbbbaa',
      'r.r.r.......',
      '.bbbbbbbbbaa',
      'r.r.r.......',
      '.bbbbbbbbbaa'
    ]);

    // Chiave
    this.creaTexture(scene, 'chiave', [
      '.yy.......',
      'y..yyyyyyy',
      'y..y...y.y',
      '.yy.......'
    ]);

    // Stracci da mendicante
    this.creaTexture(scene, 'stracci', [
      '...CCCC.....',
      '..CccccC....',
      '.CccbccccC..',
      'CccccccbccC.',
      'CcbcccccccC.',
      '.CCCCCCCCC..'
    ]);

    // Forziere
    this.creaTexture(scene, 'forziere', [
      '..BBBBBBBBBB..',
      '.BbbbbbbbbbbB.',
      'BbbbbbbbbbbbbB',
      'BYYYYYYYYYYYYB',
      'BbbbbbyybbbbbB',
      'BbbbbbYYbbbbbB',
      'BbbbbbbbbbbbbB',
      'BbbbbbbbbbbbbB',
      'BYYYYYYYYYYYYB',
      '.BBBBBBBBBBBB.'
    ]);

    // Cartello delle missioni
    this.creaTexture(scene, 'cartello', [
      'BBBBBBBBBBBB',
      'BccccccccccB',
      'BcBBcBcBBccB',
      'BccccccccccB',
      'BcBcBBcBBcBB',
      'BccccccccccB',
      'BBBBBBBBBBBB',
      '.....bb.....',
      '.....bb.....',
      '.....bb.....',
      '.....bb.....',
      '....BbbB....'
    ]);

    // Diario (libro)
    this.creaTexture(scene, 'libro', [
      'RRRRRRRRRR',
      'RrrrrrrrwR',
      'RrryyrrrwR',
      'RryrrYrrwR',
      'RrryyrrrwR',
      'RrrrrrrrwR',
      'RRRRRRRRRR'
    ]);

    // Fuoco: due fotogrammi per l'animazione
    this.creaFoglio(scene, 'fuoco', [
      [
        '......r.....',
        '.....ryr....',
        '....ryyr.r..',
        '...ryywyrr..',
        '..rryywyyr..',
        '..ryywwyyr..',
        '...ryyyyr...',
        '..BbBbBbBb..'
      ],
      [
        '.....r......',
        '....ryr.r...',
        '..r.ryyrr...',
        '..rryywyr...',
        '..ryywwyyr..',
        '..ryywwyyr..',
        '...ryyyyr...',
        '..bBbBbBbB..'
      ]
    ], P);

    // Anello d'aggancio per la freccia-corda
    this.creaTexture(scene, 'anello', [
      '..yyyy..',
      '.yY..Yy.',
      'yY....Yy',
      'y......y',
      'y......y',
      'yY....Yy',
      '.yY..Yy.',
      '..yyyy..'
    ]);

    // Icone sopra la testa delle guardie
    this.creaTexture(scene, 'icona_sospetto', [
      '.yyy.',
      'y...y',
      '...y.',
      '..y..',
      '..y..',
      '.....',
      '..y..'
    ]);
    this.creaTexture(scene, 'icona_allarme', [
      '.rr.',
      '.rr.',
      '.rr.',
      '.rr.',
      '.rr.',
      '....',
      '.rr.'
    ]);
    this.creaTexture(scene, 'icona_zzz', [
      'wwww....',
      '..w.....',
      '.w..www.',
      'wwww.w..',
      '....www.'
    ]);

    // Cuori per la salute (pieno, mezzo, vuoto)
    const cuore = (sx, dx) => [
      '.' + sx + sx + '.' + dx + dx + '.',
      sx + sx + sx + sx + dx + dx + dx,
      sx + sx + sx + sx + dx + dx + dx,
      '.' + sx + sx + sx + dx + dx + '.',
      '..' + sx + sx + dx + '..',
      '...' + dx + '...'
    ];
    this.creaTexture(scene, 'cuore_pieno', cuore('r', 'r'));
    this.creaTexture(scene, 'cuore_mezzo', cuore('r', 'A'));
    this.creaTexture(scene, 'cuore_vuoto', cuore('A', 'A'));

    // Carro delle tasse visto dall'alto, con il cavallo davanti (verso destra)
    this.creaTexture(scene, 'carro', [
      '..BB......BB..................',
      '.BbbBBBBBBbbB.................',
      'BbbbbbbbbbbbbB..........bb....',
      'BbccyycccyyccbBBBB.....bbbbb..',
      'BbcyyyycyyyycbbbbbBBBbbbbbbbbb',
      'BbccyycccyyccbBBBB.....bbbbbkb',
      'BbbbbbbbbbbbbB.........bbbbb..',
      '.BbbBBBBBBbbB...........bb....',
      '..BB......BB..................'
    ]);

    // Albero caduto (dopo aver abbattuto l'albero secco)
    this.creaTexture(scene, 'tronco', [
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..',
      '.BbbbbbbBbbbbbbbbbBbbbbbbbbbbbB.',
      'BbbBbbbbbbbbbBbbbbbbbbbbBbbbbbbB',
      'BbbbbbbbbbbBbbbbbbbbbbbbbbbbBbbB',
      '.BbbbbBbbbbbbbbbbbbBbbbbbbbbbbB.',
      '..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..'
    ]);

    // Nuvola di fumo (cerchio grigio "puntinato")
    this.creaConFunzione(scene, 'fumo', 32, 32, (ctx) => {
      this.cerchio(ctx, 16, 16, 15, 'rgba(200,200,200,0.55)');
      this.cerchio(ctx, 12, 12, 8, 'rgba(235,235,235,0.6)');
      this.cerchio(ctx, 20, 19, 7, 'rgba(170,170,170,0.5)');
    });

    // Bersaglio del torneo (anelli colorati)
    this.creaConFunzione(scene, 'bersaglio', 33, 33, (ctx) => {
      const anelli = [['#f4f0e0', 16], ['#1a1410', 13], ['#2b6cb0', 10], ['#c0392b', 7], ['#f2c14e', 4]];
      anelli.forEach(([colore, r]) => this.cerchio(ctx, 16, 16, r, colore));
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(16, 16, 1, 1);
    });

    // Piccolo punto bianco (per particelle e mirino)
    this.creaConFunzione(scene, 'pixel', 2, 2, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 2, 2);
    });
  },

  // Crea tutte le texture del gioco (chiamata dalla scena di avvio)
  creaTutto(scene) {
    this.creaPersonaggi(scene);
    this.creaOggetti(scene);
    GraficaTile.creaTileset(scene);
  }
};
