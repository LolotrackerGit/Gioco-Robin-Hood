// =============================================================
// CONTROLLI
// Raccoglie in un unico posto tastiera e mouse.
// Le altre parti del gioco chiedono semplicemente:
//   "in che direzione si muove Robin?", "dove mira?", "sta tirando?"
// senza preoccuparsi di quali tasti sono stati premuti.
//
// Due modalità di mira (si cambia con il tasto T, la scelta viene salvata):
//   - MOUSE: si mira con il mouse/trackpad, si tira con clic o SPAZIO;
//            le frecce direzionali muovono Robin come WASD.
//   - TASTIERA: WASD muove, le frecce direzionali ruotano la mira,
//               SPAZIO tira.
// =============================================================

class Controlli {
  constructor(scene) {
    this.scene = scene;
    this.miraTastiera = Salvataggio.leggiImpostazioni().miraTastiera;
    this.angoloMira = 0;      // in radianti (0 = verso destra)
    this.richiestaCambio = null; // cambio di freccia chiesto con la rotellina

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.tasti = scene.input.keyboard.addKeys({
      w: K.W, a: K.A, s: K.S, d: K.D,
      su: K.UP, giu: K.DOWN, sinistra: K.LEFT, destra: K.RIGHT,
      spazio: K.SPACE, shift: K.SHIFT, e: K.E, q: K.Q,
      uno: K.ONE, due: K.TWO, tre: K.THREE, quattro: K.FOUR,
      esc: K.ESC, p: K.P, t: K.T, m: K.M
    });

    // Niente menu del tasto destro sopra il gioco
    if (scene.input.mouse) scene.input.mouse.disableContextMenu();

    // Rotellina del mouse (o due dita sul trackpad): cambia freccia
    scene.input.on('wheel', (pointer, oggetti, dx, dy) => {
      if (Math.abs(dy) > 2) this.richiestaCambio = dy > 0 ? 1 : -1;
    });
  }

  // Tasti T (mira) e M (audio): da chiamare a ogni fotogramma.
  // Restituisce un messaggio da mostrare, oppure null.
  tastiSpeciali() {
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(this.tasti.t)) {
      this.miraTastiera = !this.miraTastiera;
      const imp = Salvataggio.leggiImpostazioni();
      imp.miraTastiera = this.miraTastiera;
      Salvataggio.scriviImpostazioni(imp);
      return this.miraTastiera ? 'Mira con le frecce direzionali (T per tornare al mouse)' : 'Mira con il mouse (T per usare la tastiera)';
    }
    if (JD(this.tasti.m)) {
      return Suoni.alternaAudio() ? 'Audio acceso' : 'Audio spento';
    }
    return null;
  }

  // Direzione di movimento come vettore {x, y} lungo al massimo 1
  movimento() {
    const t = this.tasti;
    let x = 0;
    let y = 0;
    if (t.a.isDown) x -= 1;
    if (t.d.isDown) x += 1;
    if (t.w.isDown) y -= 1;
    if (t.s.isDown) y += 1;
    // In modalità mouse anche le frecce direzionali muovono
    if (!this.miraTastiera) {
      if (t.sinistra.isDown) x -= 1;
      if (t.destra.isDown) x += 1;
      if (t.su.isDown) y -= 1;
      if (t.giu.isDown) y += 1;
    }
    x = Phaser.Math.Clamp(x, -1, 1);
    y = Phaser.Math.Clamp(y, -1, 1);
    // In diagonale non si deve andare più veloci
    if (x !== 0 && y !== 0) {
      x *= 0.7071;
      y *= 0.7071;
    }
    return { x, y };
  }

  // Aggiorna l'angolo di mira partendo dalla posizione di Robin
  aggiornaMira(dt, origineX, origineY) {
    if (this.miraTastiera) {
      const t = this.tasti;
      let dx = 0;
      let dy = 0;
      if (t.sinistra.isDown) dx -= 1;
      if (t.destra.isDown) dx += 1;
      if (t.su.isDown) dy -= 1;
      if (t.giu.isDown) dy += 1;
      if (dx !== 0 || dy !== 0) {
        const obiettivo = Math.atan2(dy, dx);
        // ruota piano verso la direzione scelta (più precisa)
        this.angoloMira = Phaser.Math.Angle.RotateTo(this.angoloMira, obiettivo, 4 * dt);
      }
    } else {
      const p = this.scene.input.activePointer;
      const cam = this.scene.cameras.main;
      const mondo = cam.getWorldPoint(p.x, p.y);
      this.angoloMira = Math.atan2(mondo.y - origineY, mondo.x - origineX);
    }
    return this.angoloMira;
  }

  // Posizione del mouse nel mondo (serve per disegnare il mirino)
  puntoMouse() {
    const p = this.scene.input.activePointer;
    return this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }

  tiroPremuto() {
    if (this.tasti.spazio.isDown) return true;
    if (!this.miraTastiera) {
      const p = this.scene.input.activePointer;
      return p.isDown && p.button === 0;
    }
    return false;
  }

  corsa() {
    return this.tasti.shift.isDown;
  }

  interagisci() {
    return Phaser.Input.Keyboard.JustDown(this.tasti.e);
  }

  pausa() {
    return Phaser.Input.Keyboard.JustDown(this.tasti.esc) || Phaser.Input.Keyboard.JustDown(this.tasti.p);
  }

  // Restituisce: un numero 0-3 (freccia scelta), 'avanti', 'indietro' oppure null
  cambioFreccia() {
    const t = this.tasti;
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(t.uno)) return 0;
    if (JD(t.due)) return 1;
    if (JD(t.tre)) return 2;
    if (JD(t.quattro)) return 3;
    if (JD(t.q)) return 'avanti';
    if (this.richiestaCambio !== null) {
      const r = this.richiestaCambio > 0 ? 'avanti' : 'indietro';
      this.richiestaCambio = null;
      return r;
    }
    return null;
  }
}
