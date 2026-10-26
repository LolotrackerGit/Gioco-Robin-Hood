// =============================================================
// BERSAGLIO DI PAGLIA (campo di tiro dell'accampamento)
// Serve per imparare a tirare: si clicca il bersaglio e Robin
// tira una freccia. Quando è colpito diventa grigio.
// =============================================================

class Bersaglio extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'paglia');
    scene.add.existing(this);
    this.setScale(2).setDepth(100 + y);
    this.colpito = false;
    this.setInteractive({ useHandCursor: true });
  }

  // chiamata dalla Freccia quando arriva
  colpisci() {
    if (this.colpito) return;
    this.colpito = true;
    this.setTint(0x888888);
    this.disableInteractive();
    this.scene.tweens.add({ targets: this, angle: 12, duration: 80, yoyo: true, repeat: 2 });
    Suoni.suona('bersaglio');
    this.scene.bersaglioColpito();
  }
}
