// =============================================================
// SCHERMATA DI CARICAMENTO
// Compare prima di ogni missione: mostra il titolo, una curiosità
// storica (o un testo di introduzione) e aspetta che il giocatore
// sia pronto. Poi avvia la scena di destinazione.
// =============================================================

class CaricamentoScene extends Phaser.Scene {
  constructor() {
    super('Caricamento');
  }

  init(dati) {
    this.destinazione = dati.destinazione;
    this.datiDestinazione = dati.dati || {};
    this.titoloTesto = dati.titolo || '';
    this.testoPersonale = dati.testo || null;
    this.suggerimenti = dati.suggerimenti || null;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    Interfaccia.sfondoForesta(this, 0.82);
    Interfaccia.titolo(this, 480, 64, this.titoloTesto, 40);

    if (this.testoPersonale) {
      Interfaccia.testo(this, 480, 230, this.testoPersonale, 20, COSTANTI.CSS.pergamena,
        { align: 'center', larghezza: 720, interlinea: 8 }).setOrigin(0.5);
    } else {
      // Curiosità storica scelta a caso
      Interfaccia.pannello(this, 140, 112, 680, 150, 'pergamena');
      Interfaccia.testo(this, 480, 140, 'Curiosità storica', 18, '#8a3b2a', { senzaBordo: true, align: 'center' }).setOrigin(0.5);
      const curiosita = Phaser.Utils.Array.GetRandom(CURIOSITA);
      Interfaccia.testo(this, 480, 200, curiosita, 20, COSTANTI.CSS.inchiostro, { senzaBordo: true, align: 'center', larghezza: 620 }).setOrigin(0.5);
    }

    // Suggerimenti sulla missione (i diversi modi per completarla)
    if (this.suggerimenti) {
      this.suggerimenti.forEach((s, i) => {
        Interfaccia.testo(this, 150, 292 + i * 30, '- ' + s, 17, COSTANTI.CSS.verdeChiaro, { larghezza: 680 });
      });
    }

    // Barra di caricamento: dà il tempo di leggere
    const barraSfondo = this.add.rectangle(480, 440, 400, 12, 0x1b120a);
    const barra = this.add.rectangle(282, 440, 0, 8, 0xf2c14e).setOrigin(0, 0.5);
    this.pronto = false;
    this.tweens.add({
      targets: barra,
      width: 396,
      duration: 1400,
      onComplete: () => {
        this.pronto = true;
        barraSfondo.setVisible(false);
        barra.setVisible(false);
        const invito = Interfaccia.testo(this, 480, 440, 'Premi un tasto o clicca per continuare', 18, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5);
        this.tweens.add({ targets: invito, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      }
    });

    const continua = () => {
      if (!this.pronto) return;
      this.pronto = false;
      Suoni.suona('click');
      Interfaccia.vaiA(this, this.destinazione, this.datiDestinazione);
    };
    this.input.keyboard.on('keydown', continua);
    this.input.on('pointerdown', continua);
  }
}
