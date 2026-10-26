// =============================================================
// GUARDIA (versione semplificata)
// Comportamento semplice, a tre stati:
//   'calma'      sta al suo posto e cammina un pochino avanti e indietro
//   'insegue'    Robin è vicino: la guardia va verso di lui (lentamente)
//   'addormentata' è stata colpita 2 volte: si siede e dorme (non muore)
// Le guardie diventano "attive" solo quando la storia arriva al passo giusto.
// =============================================================

class Nemico extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'guardia', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(Accessibilita.valori.scalaPersonaggi);
    this.body.setSize(6, 4);
    this.body.setOffset(5, 6);

    this.casa = { x, y };     // posto di guardia
    this.stato = 'calma';
    this.attiva = false;
    this.colpiNecessari = 2;
    this.ricarica = 0;
    this.tempo = Math.random() * 3;

    // icona "zzz" quando dorme
    this.zzz = scene.add.image(x, y - 26, 'icona_zzz').setScale(2).setVisible(false).setDepth(990);

    // pallini sopra la testa: quanti colpi mancano
    this.pallini = scene.add.graphics().setDepth(990);

    // si può cliccare: clic sulla guardia = tira una freccia
    this.setInteractive({ useHandCursor: true });
  }

  aggiorna(dt, robin) {
    this.setDepth(100 + this.y);
    this.zzz.setPosition(this.x + 10, this.y - 26);
    this.disegnaPallini();
    if (this.stato === 'addormentata') {
      this.zzz.setAlpha(0.5 + Math.sin(this.scene.time.now / 300) * 0.5);
      return;
    }

    this.tempo += dt;
    this.ricarica -= dt;
    const v = Accessibilita.valori.velocitaGuardie;
    const d = Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y);

    if (this.attiva && d < 90 && !robin.bloccato) {
      this.stato = 'insegue';
    } else if (this.stato === 'insegue' && d > 140) {
      this.stato = 'calma';
    }

    if (this.stato === 'insegue') {
      if (d > 20) {
        const a = Math.atan2(robin.y - this.y, robin.x - this.x);
        this.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
        this.setFlipX(Math.cos(a) < 0);
      } else {
        this.setVelocity(0, 0);
        if (this.ricarica <= 0) {
          this.ricarica = 2.5; // colpisce raramente: c'è tempo per reagire
          Suoni.suona('spada');
          this.scene.tweens.add({ targets: this, angle: 15, duration: 90, yoyo: true });
          this.scene.robinColpito();
        }
      }
    } else {
      // passeggia vicino al suo posto
      const tx = this.casa.x + Math.sin(this.tempo * 0.6) * 18;
      const dx = tx - this.x;
      this.setVelocity(Math.abs(dx) > 2 ? Math.sign(dx) * v * 0.5 : 0, (this.casa.y - this.y) * 2);
      if (Math.abs(dx) > 2) this.setFlipX(dx < 0);
    }

    if (this.body.velocity.lengthSq() > 4) this.anims.play('guardia_cammina', true);
    else {
      this.anims.stop();
      this.setFrame(0);
    }
  }

  disegnaPallini() {
    const g = this.pallini;
    g.clear();
    if (this.stato === 'addormentata' || !this.attiva) return;
    for (let i = 0; i < this.colpiNecessari; i++) {
      g.fillStyle(0x000000, 1);
      g.fillRect(this.x - 9 + i * 10, this.y - 30, 8, 8);
      g.fillStyle(0xff6b5a, 1);
      g.fillRect(this.x - 8 + i * 10, this.y - 29, 6, 6);
    }
  }

  // Colpita da una freccia di Robin
  colpisci() {
    if (this.stato === 'addormentata') return;
    this.colpiNecessari -= 1;
    this.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => this.clearTint());
    this.attiva = true;
    if (this.colpiNecessari <= 0) {
      this.stato = 'addormentata';
      this.setVelocity(0, 0);
      this.body.enable = false;
      this.setRotation(Math.PI / 2);
      this.setTint(0xaaaaee);
      this.zzz.setVisible(true);
      this.disableInteractive();
      Suoni.suona('stordito');
      this.scene.guardiaAddormentata();
    }
  }

  // Torna al suo posto (dopo che Robin è stato colpito troppe volte)
  tornaAlPosto() {
    if (this.stato === 'addormentata') return;
    this.setPosition(this.casa.x, this.casa.y);
    this.stato = 'calma';
  }
}
