// =============================================================
// PAUSA
// Ferma la missione e mostra un piccolo menu sopra di essa.
// =============================================================

class PausaScene extends Phaser.Scene {
  constructor() {
    super('Pausa');
  }

  init(dati) {
    this.chiaveMissione = dati.missione;
  }

  create() {
    this.scene.bringToTop(); // la pausa va disegnata sopra la missione e l'HUD
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.65);
    Interfaccia.pannello(this, 300, 110, 360, 330, 'legno');
    Interfaccia.titolo(this, 480, 150, 'Pausa', 36);

    const pulsanti = [
      Interfaccia.pulsante(this, 480, 215, 'Riprendi', () => this.riprendi()),
      Interfaccia.pulsante(this, 480, 265, 'Diario di Robin', () => {
        this.scene.pause();
        this.scene.launch('Diario', { sopra: 'Pausa' });
      }),
      Interfaccia.pulsante(this, 480, 315, 'Ritirati all\'accampamento', () => this.esci('Accampamento')),
      Interfaccia.pulsante(this, 480, 365, 'Menu principale', () => this.esci('Menu'))
    ];
    Interfaccia.testo(this, 480, 412, 'Ritirarsi non fa perdere oro, ma la missione resta da fare.', 12, COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5);
    Interfaccia.menuTastiera(this, pulsanti);
    this.input.keyboard.on('keydown-ESC', () => this.riprendi());
    this.input.keyboard.on('keydown-P', () => this.riprendi());
  }

  riprendi() {
    this.scene.resume(this.chiaveMissione);
    if (this.scene.isPaused('HUD')) this.scene.resume('HUD'); // il torneo non ha l'HUD
    this.scene.stop();
  }

  esci(destinazione) {
    Suoni.fermaMusica();
    if (this.scene.isActive('HUD') || this.scene.isPaused('HUD')) this.scene.stop('HUD');
    this.scene.stop(this.chiaveMissione);
    this.scene.start(destinazione);
  }
}
