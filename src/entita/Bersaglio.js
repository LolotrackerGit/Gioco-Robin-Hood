// =============================================================
// BERSAGLIO DEL TORNEO
// Un bersaglio rotondo con 5 anelli. Può stare fermo, muoversi
// avanti e indietro (orizzontale) o oscillare come un pendolo.
// =============================================================

class Bersaglio {
  constructor(scene, x, y, scala, movimento) {
    this.scene = scene;
    this.xBase = x;
    this.yBase = y;
    this.x = x;
    this.y = y;
    this.scala = scala;
    this.raggio = 16 * scala;  // raggio in pixel sullo schermo
    this.movimento = movimento || { tipo: 'fermo' };
    this.fase = Math.random() * Math.PI * 2;
    this.sprite = scene.add.image(x, y, 'bersaglio').setScale(scala).setDepth(10);
    this.palo = scene.add.rectangle(x, y + this.raggio + 10, 4 * scala, 20, 0x5b3a1e).setDepth(9);
  }

  aggiorna(tempo) {
    const m = this.movimento;
    if (m.tipo === 'orizzontale') {
      this.x = this.xBase + Math.sin(tempo * m.velocita + this.fase) * m.ampiezza;
    } else if (m.tipo === 'pendolo') {
      this.x = this.xBase + Math.sin(tempo * m.velocita + this.fase) * m.ampiezza;
      this.y = this.yBase + Math.abs(Math.cos(tempo * m.velocita + this.fase)) * -m.ampiezza * 0.3;
    }
    this.sprite.setPosition(this.x, this.y);
    this.palo.setPosition(this.x, this.y + this.raggio + 10);
  }

  // Punti per una freccia arrivata in (px, py): 10, 8, 6, 4, 2 oppure 0
  punteggio(px, py) {
    const d = Phaser.Math.Distance.Between(px, py, this.x, this.y) / this.raggio;
    if (d <= 0.28) return 10;
    if (d <= 0.47) return 8;
    if (d <= 0.66) return 6;
    if (d <= 0.84) return 4;
    if (d <= 1.0) return 2;
    return 0;
  }

  distruggi() {
    this.sprite.destroy();
    this.palo.destroy();
  }
}
