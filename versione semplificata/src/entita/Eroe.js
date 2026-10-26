// =============================================================
// ROBIN HOOD (versione semplificata)
// Si muove con il MOUSE: si clicca un punto e Robin ci va da solo,
// seguendo la strada più breve (ricerca BFS nella Griglia).
// Funzionano anche WASD e le frecce, ma non sono necessari.
// =============================================================

class Eroe extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'robin', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(Accessibilita.valori.scalaPersonaggi);
    // corpo fisico piccolo, al centro dello sprite (così segue bene la strada calcolata)
    this.body.setSize(6, 4);
    this.body.setOffset(5, 6);
    this.setCollideWorldBounds(true);

    this.saluteMax = Accessibilita.valori.saluteRobin;
    this.salute = this.saluteMax;
    this.strada = [];        // punti da seguire
    this.tempoBloccato = 0;  // da quanto tempo sbatte contro qualcosa
    this.fermoDa = 0;        // da quanti secondi Robin è fermo
    this.inMovimento = false;
    this.invulnerabile = 0;
    this.bloccato = false;   // true durante dialoghi e riquadri

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.tasti = scene.input.keyboard.addKeys({
      w: K.W, a: K.A, s: K.S, d: K.D, su: K.UP, giu: K.DOWN, sin: K.LEFT, des: K.RIGHT
    });
  }

  // Calcola la strada fino al punto (x, y)
  vaiA(x, y) {
    const strada = this.scene.griglia.percorso(this.x, this.y, x, y);
    if (strada && strada.length > 0) {
      // l'ultimo punto è quello esatto cliccato (se è libero)
      strada[strada.length - 1] = { x, y };
      this.strada = strada;
      return true;
    }
    return false;
  }

  ferma() {
    this.strada = [];
    this.setVelocity(0, 0);
  }

  aggiorna(dt) {
    this.setDepth(100 + this.y);
    if (this.invulnerabile > 0) this.invulnerabile -= dt;

    if (this.bloccato) {
      this.ferma();
      this.mostraFermo(dt);
      return;
    }

    // 1. tastiera (facoltativa)
    const t = this.tasti;
    let dx = 0;
    let dy = 0;
    if (t.a.isDown || t.sin.isDown) dx -= 1;
    if (t.d.isDown || t.des.isDown) dx += 1;
    if (t.w.isDown || t.su.isDown) dy -= 1;
    if (t.s.isDown || t.giu.isDown) dy += 1;
    const v = COSTANTI.VEL_ROBIN;

    if (dx !== 0 || dy !== 0) {
      this.strada = [];
      const lung = Math.hypot(dx, dy);
      this.setVelocity((dx / lung) * v, (dy / lung) * v);
      if (dx !== 0) this.setFlipX(dx < 0);
    } else if (this.strada.length > 0) {
      // 2. segue la strada calcolata dopo il clic
      const meta = this.strada[0];
      const d = Phaser.Math.Distance.Between(this.x, this.y, meta.x, meta.y);
      // sicurezza: se resta incastrato contro un angolo, lo spostiamo sul punto
      const b = this.body.blocked;
      this.tempoBloccato = (b.left || b.right || b.up || b.down) ? this.tempoBloccato + dt : 0;
      if (this.tempoBloccato > 0.3) {
        this.body.reset(meta.x, meta.y);
        this.tempoBloccato = 0;
      }
      if (d < 3) {
        this.strada.shift();
        if (this.strada.length === 0) this.setVelocity(0, 0);
      } else {
        const a = Math.atan2(meta.y - this.y, meta.x - this.x);
        this.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
        if (Math.abs(Math.cos(a)) > 0.2) this.setFlipX(Math.cos(a) < 0);
      }
    } else {
      this.setVelocity(0, 0);
    }

    this.mostraFermo(dt);
  }

  // Animazione e contatore "da quanto tempo sono fermo" (serve alla freccia guida)
  mostraFermo(dt) {
    this.inMovimento = this.body.velocity.lengthSq() > 1;
    if (this.inMovimento) {
      this.fermoDa = 0;
      this.anims.play('robin_cammina', true);
    } else {
      this.fermoDa += dt;
      this.anims.stop();
      this.setFrame(0);
    }
  }

  guardaVerso(x) {
    this.setFlipX(x < this.x);
  }

  subisciDanno() {
    if (this.invulnerabile > 0 || this.salute <= 0) return false;
    this.salute -= 1;
    this.invulnerabile = 1.5;
    Suoni.suona('danno');
    this.setTint(0xff6666);
    this.scene.time.delayedCall(250, () => this.clearTint());
    return true;
  }
}
