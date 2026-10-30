// =============================================================
// FINALE
// Decide quale finale ha ottenuto il giocatore (in base a
// vittoria, reputazione e oro tenuto), mostra il punteggio e
// lo salva come record se è il migliore.
// =============================================================

class FinaleScene extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  init(dati) {
    this.vinto = !!dati.vinto;
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);
    const s = Partita.stato;
    this.tipo = Punteggio.determinaFinale(this.vinto);
    const finale = FINALI[this.tipo];
    const d = Punteggio.totale(this.tipo);

    Interfaccia.sfondoForesta(this, 0.82);
    Interfaccia.titolo(this, 480, 40, finale.titolo, 40).setColor(finale.colore);

    this.illustrazione();
    Interfaccia.testo(this, 350, 80, finale.testo, 18, COSTANTI.CSS.pergamena, { larghezza: 570, interlinea: 6 });
    Interfaccia.leggi(finale.titolo + '. ' + finale.testo);

    // Cosa successe davvero
    Interfaccia.pannello(this, 40, 214, 880, 76, 'pergamena');
    Interfaccia.testo(this, 58, 226,
      'Nella storia vera: Riccardo tornò libero nel 1194 e morì in Francia nel 1199. Giovanni diventò re e nel 1215 ' +
      'dovette concedere la Magna Carta. Robin Hood invece esiste solo nelle ballate.',
      16, COSTANTI.CSS.inchiostro, { senzaBordo: true, larghezza: 850, interlinea: 4 });

    // Statistiche della partita
    const st = s.statistiche;
    const sinistra = [
      'Difficoltà: ' + Partita.diff().nome,
      'Missioni completate: ' + Partita.missioniCompletate() + '/3',
      'Reputazione finale: ' + s.reputazione,
      'Oro donato ai villaggi: ' + st.oroDonato,
      'Oro tenuto: ' + st.oroTenuto,
      'Guardie uccise / stordite: ' + st.uccisioni + ' / ' + st.storditi,
      'Obiettivi extra: ' + s.obiettiviOttenuti.length,
      'Tempo di gioco: ' + Punteggio.formattaTempo(st.tempoTotale)
    ];
    sinistra.forEach((r, i) => Interfaccia.testo(this, 60, 306 + i * 22, r, 16, COSTANTI.CSS.pergamena));

    const destra = [
      ['Missioni', d.missioni],
      ['Reputazione', d.reputazione],
      ['Oro donato', d.donazioni],
      ['Bonus finale', d.finale]
    ];
    destra.forEach(([nome, valore], i) => {
      Interfaccia.testo(this, 540, 306 + i * 24, nome, 16, COSTANTI.CSS.grigio);
      Interfaccia.testo(this, 880, 306 + i * 24, String(valore), 16, COSTANTI.CSS.bianco).setOrigin(1, 0);
    });
    Interfaccia.testo(this, 540, 410, 'TOTALE', 24, COSTANTI.CSS.oro, {});
    Interfaccia.testo(this, 880, 408, String(d.totale), 28, COSTANTI.CSS.oro, {}).setOrigin(1, 0);

    // Record salvato su questo computer
    const vecchio = Salvataggio.leggiRecord();
    const nuovoRecord = Salvataggio.aggiornaRecord({
      punteggio: d.totale,
      finale: this.tipo,
      difficolta: s.difficolta,
      data: new Date().toLocaleDateString('it-IT')
    });
    let testoRecord = 'Nuovo record!';
    if (!nuovoRecord) testoRecord = 'Record da battere: ' + vecchio.punteggio;
    Interfaccia.testo(this, 540, 446, testoRecord, 18, nuovoRecord ? COSTANTI.CSS.verdeChiaro : COSTANTI.CSS.grigio);

    // La partita è finita: il salvataggio non serve più
    Partita.cancellaSalvataggio();

    const p = Interfaccia.pulsante(this, 480, 506, 'Torna al menu', () => this.scene.start('Menu'), { larghezza: 220, altezza: 36 });
    Interfaccia.menuTastiera(this, [p]);
  }

  // Disegno a sinistra, diverso per ogni finale
  illustrazione() {
    const x = 170;
    const y = 128;
    if (this.tipo === 'catturato') {
      this.add.sprite(x, y, 'robin', 0).setScale(5).setTint(0x999999);
      const g = this.add.graphics();
      g.fillStyle(0x2a2a2e, 1);
      for (let i = -50; i <= 50; i += 16) g.fillRect(x + i, y - 55, 6, 110);
      g.fillRect(x - 56, y - 10, 118, 6);
      return;
    }
    this.add.sprite(x, y, 'robin', 0).setScale(5);
    if (this.tipo === 'ricco') {
      this.add.image(x + 70, y + 30, 'forziere').setScale(3);
      this.add.image(x - 60, y + 40, 'sacco').setScale(3);
      return;
    }
    if (Partita.stato.littleJohnLibero) this.add.sprite(x - 75, y + 5, 'john', 0).setScale(5.5);
    this.add.sprite(x + 75, y + 5, 'marian', 0).setScale(5).setFlipX(true);
    if (this.tipo === 'eroe') {
      for (let i = 0; i < 4; i++) {
        const p = this.add.sprite(x - 90 + i * 60, y + 58, 'popolano', 0).setScale(3);
        this.tweens.add({ targets: p, y: y + 52, duration: 300, yoyo: true, repeat: -1, delay: i * 120 });
      }
    }
  }
}
