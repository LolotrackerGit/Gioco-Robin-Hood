// =============================================================
// SCHEDA DEI PERSONAGGI
// Ogni personaggio è una "carta" cliccabile: cliccandola la voce
// spiega chi è (e il testo compare sotto). Pulsante GIOCA gigante.
// =============================================================

class PersonaggiScene extends Phaser.Scene {
  constructor() {
    super('Personaggi');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    Interfaccia.sfondoForesta(this, 0.75);
    Interfaccia.titolo(this, 480, 40, 'I personaggi', 40);

    // riquadro dove compare la descrizione
    Interfaccia.pannello(this, 60, 318, 840, 104, 'pergamena');
    this.descrizione = Interfaccia.testo(this, 480, 370, FRASI.sceltaPersonaggi, 22, COSTANTI.CSS.inchiostro,
      { senzaBordo: true, align: 'center', larghezza: 790 }).setOrigin(0.5);

    // le carte
    this.carte = [];
    const larghezza = 146;
    PERSONAGGI.forEach((p, i) => {
      const x = 480 + (i - (PERSONAGGI.length - 1) / 2) * (larghezza + 8);
      const y = 180;
      const cornice = this.add.graphics();
      const sprite = this.add.sprite(x, y - 14, p.sprite, 0).setScale(p.sprite === 'john' ? 6 : 5);
      const nome = Interfaccia.testo(this, x, y + 86, p.nome, 18, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);
      const zona = this.add.zone(x, y, larghezza, 230).setInteractive({ useHandCursor: true });
      const carta = { p, x, y, cornice, sprite, nome, larghezza };
      this.disegnaCarta(carta, false);
      zona.on('pointerover', () => this.disegnaCarta(carta, true));
      zona.on('pointerout', () => this.disegnaCarta(carta, carta === this.scelta));
      zona.on('pointerdown', () => this.scegli(carta));
      this.carte.push(carta);
    });

    Interfaccia.pulsante(this, 480, 482, 'GIOCA', () => {
      Voce.ferma();
      this.scene.start('Cutscene', { quadri: CUTSCENE_INIZIALE, poi: 'Livello' });
    }, { larghezza: 360, altezza: 88, dimensione: 44, frase: 'Gioca' });
    Interfaccia.pulsante(this, 100, 482, 'Indietro', () => this.scene.start('Titolo'), { larghezza: 150, altezza: 56, dimensione: 20 });

    Voce.parla('I personaggi. ' + FRASI.sceltaPersonaggi);
  }

  disegnaCarta(carta, evidenziata) {
    const g = carta.cornice;
    g.clear();
    const x0 = carta.x - carta.larghezza / 2;
    const y0 = carta.y - 115;
    Interfaccia.rettangoloPixel(g, x0, y0, carta.larghezza, 230, 0x1b120a, 4);
    Interfaccia.rettangoloPixel(g, x0 + 3, y0 + 3, carta.larghezza - 6, 224, evidenziata ? 0xf2c14e : 0x5b3a1e, 4);
    Interfaccia.rettangoloPixel(g, x0 + 8, y0 + 8, carta.larghezza - 16, 214, 0x2a1b0f, 2);
    carta.sprite.setScale((carta.p.sprite === 'john' ? 6 : 5) * (evidenziata ? 1.1 : 1));
  }

  scegli(carta) {
    const vecchia = this.scelta;
    this.scelta = carta;
    if (vecchia) this.disegnaCarta(vecchia, false);
    this.disegnaCarta(carta, true);
    Suoni.suona('click');
    this.descrizione.setText(carta.p.descrizione);
    Voce.parla(carta.p.nome + '. ' + carta.p.descrizione);
    // piccolo saltello del personaggio scelto
    this.tweens.add({ targets: carta.sprite, y: carta.y - 26, duration: 150, yoyo: true });
  }
}
