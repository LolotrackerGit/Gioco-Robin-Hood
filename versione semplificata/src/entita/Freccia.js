// =============================================================
// FRECCIA (unica arma del gioco, frecce infinite)
// Per rendere il gioco accessibile la freccia "insegue" il bersaglio
// scelto con il clic: se Robin è abbastanza vicino, colpisce sempre.
// =============================================================

class Freccia {
  constructor(scene, x, y, bersaglio) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.bersaglio = bersaglio;
    this.attiva = true;
    this.sprite = scene.add.image(x, y, 'freccia_normale').setScale(2).setDepth(900);
  }

  aggiorna(dt) {
    if (!this.attiva) return;
    const b = this.bersaglio;
    const a = Math.atan2(b.y - this.y, b.x - this.x);
    const passo = COSTANTI.VEL_FRECCIA * dt;
    this.x += Math.cos(a) * passo;
    this.y += Math.sin(a) * passo;
    this.sprite.setPosition(this.x, this.y).setRotation(a);
    if (Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y) < 8) {
      Suoni.suona('colpo');
      b.colpisci();
      this.distruggi();
    }
  }

  distruggi() {
    this.attiva = false;
    this.sprite.destroy();
  }
}
