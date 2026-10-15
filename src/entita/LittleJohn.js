// =============================================================
// LITTLE JOHN
// Il fedele compagno di Robin (presente già nelle ballate più
// antiche). Una volta liberato segue Robin e, se le guardie
// attaccano, le stende con il suo bastone (non le uccide).
// =============================================================

class LittleJohn extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, liberoSubito) {
    super(scene, x, y, 'john', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(1.2);
    this.body.setSize(8, 6);
    this.body.setOffset(4, 9);
    this.segue = !!liberoSubito;
    this.ricarica = 0;
    this.strada = null;
    this.tempoRicalcolo = 0;
  }

  libera() {
    this.segue = true;
  }

  aggiorna(dt, robin) {
    this.setDepth(100 + this.y);
    if (!this.segue) {
      this.setVelocity(0, 0);
      return;
    }
    this.ricarica -= dt;

    // 1. C'è una guardia ostile vicina? La colpisce col bastone.
    const nemico = this.scene.guardie.find((g) =>
      (g.stato === 'inseguimento' || g.stato === 'ricerca') && !g.eSceriffo &&
      Phaser.Math.Distance.Between(this.x, this.y, g.x, g.y) < 60);
    if (nemico) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, nemico.x, nemico.y);
      if (d < 16) {
        this.setVelocity(0, 0);
        if (this.ricarica <= 0) {
          this.ricarica = 1.2;
          Suoni.suona('colpo');
          this.scene.tweens.add({ targets: this, angle: 20, duration: 90, yoyo: true });
          nemico.stordisci(25);
        }
      } else {
        this.muoviVerso(nemico.x, nemico.y, 85, dt);
      }
      this.animazione();
      return;
    }

    // 2. Altrimenti segue Robin
    const d = Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y);
    if (d > 180 && !robin.suTetto) {
      // Robin è lontanissimo: John lo raggiunge "fuori scena"
      this.setPosition(robin.x - 10, robin.y + 6);
    } else if (d > 24 && !robin.suTetto) {
      this.muoviVerso(robin.x, robin.y, d > 60 ? 110 : 70, dt);
    } else {
      this.setVelocity(0, 0);
    }
    this.animazione();
  }

  muoviVerso(tx, ty, velocita, dt) {
    const griglia = this.scene.griglia;
    let meta = { x: tx, y: ty };
    if (!griglia.lineaLibera(this.x, this.y, tx, ty, 'passo')) {
      this.tempoRicalcolo -= dt;
      if (!this.strada || this.tempoRicalcolo <= 0) {
        this.strada = griglia.percorso(this.x, this.y, tx, ty);
        this.tempoRicalcolo = 0.6;
      }
      if (!this.strada || this.strada.length === 0) {
        this.setVelocity(0, 0);
        return;
      }
      meta = this.strada[0];
      if (Phaser.Math.Distance.Between(this.x, this.y, meta.x, meta.y) < 4) this.strada.shift();
    }
    const a = Math.atan2(meta.y - this.y, meta.x - this.x);
    this.setVelocity(Math.cos(a) * velocita, Math.sin(a) * velocita);
    this.setFlipX(Math.cos(a) < 0);
  }

  animazione() {
    if (this.body.velocity.lengthSq() > 4) this.anims.play('john_cammina', true);
    else {
      this.anims.stop();
      this.setFrame(0);
    }
  }
}
