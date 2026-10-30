// =============================================================
// INTERFACCIA
// Funzioni di aiuto per creare testi, riquadri e pulsanti con
// lo stesso stile "pixel art" in tutte le schermate.
// Tutto è disegnato con rettangoli pieni, senza sfumature, così
// l'interfaccia è coerente con la grafica del gioco.
// =============================================================

const Interfaccia = {
  // Colori dell'interfaccia (legno scuro e pergamena)
  STILE: {
    bordoScuro: 0x1b120a,
    legno: 0x5b3a1e,
    legnoChiaro: 0x7a5232,
    legnoOmbra: 0x3a2412,
    fondoScuro: 0x2a1b0f,
    pergamena: 0xe8d5a6,
    pergamenaBordo: 0xb08a55
  },

  // Rettangolo con gli angoli "a scalino" (tipico della pixel art)
  rettangoloPixel(g, x, y, w, h, colore, scalino) {
    const s = scalino || 2;
    g.fillStyle(colore, 1);
    g.fillRect(x + s, y, w - 2 * s, h);
    g.fillRect(x, y + s, w, h - 2 * s);
  },

  // Testo normale. Un'ombra nera di 2 pixel lo rende leggibile su ogni sfondo.
  testo(scene, x, y, contenuto, dimensione, colore, opzioni) {
    opzioni = opzioni || {};
    const stile = {
      fontFamily: COSTANTI.FONT,
      fontSize: (dimensione || 16) + 'px',
      color: colore || COSTANTI.CSS.bianco,
      align: opzioni.align || 'left',
      lineSpacing: opzioni.interlinea || 4
    };
    if (opzioni.larghezza) stile.wordWrap = { width: opzioni.larghezza, useAdvancedWrap: true };
    const t = scene.add.text(x, y, contenuto, stile);
    if (!opzioni.senzaBordo) t.setShadow(2, 2, '#000000', 0, false, true);
    return t;
  },

  // Titolo grande al centro
  titolo(scene, x, y, contenuto, dimensione) {
    const t = this.testo(scene, x, y, contenuto, dimensione || 40, COSTANTI.CSS.oro, { align: 'center' });
    t.setOrigin(0.5);
    t.setShadow(3, 3, '#1b120a', 0, false, true);
    return t;
  },

  // Riquadro con cornice. stile: 'legno' (scuro) oppure 'pergamena' (chiaro)
  pannello(scene, x, y, w, h, stile) {
    const S = this.STILE;
    const g = scene.add.graphics();
    if (stile === 'pergamena') {
      this.rettangoloPixel(g, x, y, w, h, S.bordoScuro, 4);
      this.rettangoloPixel(g, x + 2, y + 2, w - 4, h - 4, S.pergamenaBordo, 4);
      this.rettangoloPixel(g, x + 6, y + 6, w - 12, h - 12, S.pergamena, 2);
    } else {
      this.rettangoloPixel(g, x, y, w, h, S.bordoScuro, 4);
      this.rettangoloPixel(g, x + 2, y + 2, w - 4, h - 4, S.legno, 4);
      g.fillStyle(S.legnoChiaro, 1);
      g.fillRect(x + 6, y + 4, w - 12, 2);
      this.rettangoloPixel(g, x + 6, y + 8, w - 12, h - 14, S.fondoScuro, 2);
    }
    return g;
  },

  // Pulsante cliccabile. Restituisce un oggetto con:
  //   .evidenzia(true/false), .esegui(), .abilitato, .oggetti (per nasconderli/distruggerli)
  pulsante(scene, x, y, etichetta, azione, opzioni) {
    opzioni = opzioni || {};
    const w = opzioni.larghezza || 260;
    const h = opzioni.altezza || 40;
    const S = this.STILE;
    const grafica = scene.add.graphics();
    const testo = this.testo(scene, x, y, etichetta, opzioni.dimensione || 20, '#f0e2c0', { align: 'center' }).setOrigin(0.5);
    const zona = scene.add.zone(x, y, w, h);

    const disegna = (stato) => {
      const x0 = x - w / 2;
      const y0 = y - h / 2;
      grafica.clear();
      this.rettangoloPixel(grafica, x0, y0, w, h, S.bordoScuro, 2);
      let fondo = S.legno;
      let luce = S.legnoChiaro;
      if (stato === 'sopra') { fondo = S.legnoChiaro; luce = 0x9c6c40; }
      if (stato === 'spento') { fondo = 0x3a3430; luce = 0x4a4440; }
      grafica.fillStyle(fondo, 1);
      grafica.fillRect(x0 + 2, y0 + 2, w - 4, h - 4);
      grafica.fillStyle(luce, 1);
      grafica.fillRect(x0 + 2, y0 + 2, w - 4, 2);
      grafica.fillStyle(S.legnoOmbra, 1);
      grafica.fillRect(x0 + 2, y0 + h - 4, w - 4, 2);
      testo.setY(stato === 'sopra' ? y - 1 : y);
    };

    const pulsante = {
      oggetti: [grafica, testo, zona],
      abilitato: !opzioni.disabilitato,
      evidenzia(attivo) {
        if (!this.abilitato) return;
        disegna(attivo ? 'sopra' : 'normale');
        testo.setColor(attivo ? '#fff6dc' : '#f0e2c0');
      },
      esegui() {
        if (!this.abilitato) return;
        Suoni.suona('click');
        azione();
      },
      distruggi() {
        this.oggetti.forEach((o) => o.destroy());
      }
    };

    disegna(pulsante.abilitato ? 'normale' : 'spento');
    if (!pulsante.abilitato) testo.setColor('#77706a');

    zona.setInteractive({ useHandCursor: pulsante.abilitato });
    zona.on('pointerover', () => {
      pulsante.evidenzia(true);
      // accessibilità: la voce legge il nome del pulsante
      if (Impostazioni.valori.leggiPulsanti && pulsante.abilitato) Voce.parla(opzioni.frase || etichetta);
    });
    zona.on('pointerout', () => pulsante.evidenzia(false));
    zona.on('pointerdown', () => pulsante.esegui());
    return pulsante;
  },

  // Permette di scegliere i pulsanti anche con la tastiera:
  // frecce SU/GIÙ (o W/S) per spostarsi, INVIO o SPAZIO per confermare.
  menuTastiera(scene, pulsanti) {
    let indice = -1;
    const sposta = (verso) => {
      if (indice >= 0) pulsanti[indice].evidenzia(false);
      // salta i pulsanti disabilitati
      for (let i = 0; i < pulsanti.length; i++) {
        indice = (indice + verso + pulsanti.length) % pulsanti.length;
        if (pulsanti[indice].abilitato) break;
      }
      pulsanti[indice].evidenzia(true);
      Suoni.suona('click');
    };
    const tastiera = scene.input.keyboard;
    tastiera.on('keydown-UP', () => sposta(-1));
    tastiera.on('keydown-W', () => sposta(-1));
    tastiera.on('keydown-DOWN', () => sposta(1));
    tastiera.on('keydown-S', () => sposta(1));
    const conferma = () => {
      if (indice >= 0) pulsanti[indice].esegui();
    };
    tastiera.on('keydown-ENTER', conferma);
    tastiera.on('keydown-SPACE', conferma);
  },

  // Sfondo dei menu: un pezzo di foresta fatto con le stesse caselle
  // del gioco (ingrandite 3 volte) e scurito, così tutto ha lo stesso stile.
  sfondoForesta(scene, scurisci) {
    const scala = 3;
    const lato = 16 * scala;
    const colonne = Math.ceil(COSTANTI.LARGHEZZA / lato);
    const righe = Math.ceil(COSTANTI.ALTEZZA / lato);
    const contenitore = scene.add.container(0, 0);
    let seme = 11;
    const rnd = () => {
      seme = (seme * 9301 + 49297) % 233280;
      return seme / 233280;
    };
    for (let r = 0; r < righe; r++) {
      for (let c = 0; c < colonne; c++) {
        // alberi fitti ai bordi, radura al centro con un sentiero
        const bordo = Math.min(c, colonne - 1 - c, r, righe - 1 - r);
        let tile = rnd() < 0.15 ? TILE.ERBA2 : TILE.ERBA;
        if (rnd() < 0.06) tile = TILE.FIORI;
        if (c === Math.floor(colonne / 2) || c === Math.floor(colonne / 2) - 1) tile = TILE.STRADA;
        if (bordo === 0 || (bordo === 1 && rnd() < 0.6)) tile = TILE.ALBERO;
        else if (rnd() < 0.05) tile = TILE.CESPUGLIO;
        contenitore.add(scene.add.image(c * lato, r * lato, 'tileset', tile).setOrigin(0).setScale(scala));
      }
    }
    contenitore.add(scene.add.rectangle(0, 0, COSTANTI.LARGHEZZA, COSTANTI.ALTEZZA, 0x0b130d, scurisci === undefined ? 0.55 : scurisci).setOrigin(0));
    return contenitore;
  },

  // Fa leggere un testo alla sintesi vocale (se è attiva nelle impostazioni).
  // inCoda = true: aspetta che finisca la frase in corso invece di interromperla.
  leggi(testo, inCoda) {
    if (Impostazioni.valori.sintesiVocale) Voce.parla(testo, { nonInterrompere: !!inCoda });
  },

  // Piccola dissolvenza e cambio scena
  vaiA(scene, chiave, dati) {
    scene.cameras.main.fadeOut(250, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(chiave, dati));
  }
};

// Il font pixel-art unisce alcune coppie di lettere (es. "fi") in un solo
// simbolo, che si legge male. Inseriamo un carattere invisibile (U+200C)
// dopo ogni "f" seguita da i, l, t o f: così le lettere restano separate.
// Lo facciamo una volta sola, per tutti i testi del gioco.
const setTextOriginale = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (valore) {
  if (typeof valore === 'string') valore = valore.replace(/f(?=[iltf])/g, 'f‌');
  return setTextOriginale.call(this, valore);
};
