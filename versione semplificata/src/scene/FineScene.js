// =============================================================
// FINE DELLA STORIA
// Riassume tutto quello che il giocatore ha fatto, passo per passo,
// così è chiaro che la storia è finita e cosa si è ottenuto.
// =============================================================

class FineScene extends Phaser.Scene {
  constructor() {
    super('Fine');
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    Interfaccia.sfondoForesta(this, 0.75);
    Interfaccia.titolo(this, 480, 52, 'Fine', 56);
    Interfaccia.testo(this, 480, 104, FRASI.fine, 24, COSTANTI.CSS.verdeChiaro, { align: 'center' }).setOrigin(0.5);

    Interfaccia.pannello(this, 30, 126, 900, 290, 'pergamena');
    Interfaccia.testo(this, 56, 140, 'Cosa hai fatto:', 20, '#8a3b2a', { senzaBordo: true });
    // i passi su due colonne, così si leggono bene anche se sono tanti
    const perColonna = Math.ceil(PASSI.length / 2);
    PASSI.forEach((p, i) => {
      const colonna = i < perColonna ? 0 : 1;
      const riga = i % perColonna;
      Interfaccia.testo(this, 60 + colonna * 440, 176 + riga * 32, (i + 1) + '. ' + p.fatto, 15, COSTANTI.CSS.inchiostro,
        { senzaBordo: true, larghezza: 420 });
    });

    // cose trovate esplorando (facoltative)
    const e = this.registry.get('esplorazione') || { monete: 0, moneteTotali: 0, cartelli: 0, cartelliTotali: 0, minuti: 0 };
    const esplorazione = 'Monete trovate: ' + e.monete + ' su ' + e.moneteTotali +
      '.   Cartelli letti: ' + e.cartelli + ' su ' + e.cartelliTotali + '.';
    Interfaccia.testo(this, 480, 436, esplorazione, 18, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5);

    this.add.sprite(100, 494, 'robin', 0).setScale(4);
    this.add.sprite(860, 494, 'marian', 0).setScale(4).setFlipX(true);

    Interfaccia.pulsante(this, 340, 494, 'Gioca ancora', () => {
      Voce.ferma();
      this.scene.start('Cutscene', { quadri: CUTSCENE_INIZIALE, poi: 'Livello' });
    }, { larghezza: 300, altezza: 70, dimensione: 30 });
    Interfaccia.pulsante(this, 640, 494, 'Menu', () => {
      Voce.ferma();
      this.scene.start('Titolo');
    }, { larghezza: 240, altezza: 70, dimensione: 30 });

    Suoni.suona('vittoria');
    const riassunto = 'Fine. Hai aiutato il popolo di Sherwood. Ecco cosa hai fatto. ' +
      PASSI.map((p) => p.fatto).join(' ') + ' ' + esplorazione;
    this.time.delayedCall(800, () => Voce.parla(riassunto));
  }
}
