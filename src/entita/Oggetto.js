// =============================================================
// OGGETTI DA RACCOGLIERE
// Sacchi d'oro, frecce a terra, la chiave della cella...
// Galleggiano su e giù per farsi notare. Si raccolgono
// passandoci sopra (lo gestisce la scena della missione).
// =============================================================

class Oggetto {
  constructor(scene, tipo, x, y, dati) {
    this.scene = scene;
    this.tipo = tipo;          // 'sacco', 'frecce', 'chiave'
    this.x = x;
    this.y = y;
    this.dati = dati || {};
    this.raccolto = false;

    const texture = { sacco: 'sacco', frecce: 'frecce_terra', chiave: 'chiave' }[tipo];
    this.sprite = scene.add.image(x, y, texture).setDepth(40);
    scene.tweens.add({
      targets: this.sprite,
      y: y - 2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  distruggi() {
    this.raccolto = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
  }
}
