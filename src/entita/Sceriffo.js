// =============================================================
// LO SCERIFFO DI NOTTINGHAM (boss finale)
// "Eredita" (extends) dalla Guardia: usa lo stesso movimento,
// ma ha un comportamento tutto suo diviso in 3 FASI:
//   Fase 1: attacca con la spada e fa "cariche" improvvise
//   Fase 2: chiama le guardie in aiuto
//   Fase 3: arretra e lancia pugnali, protetto dai balestrieri
// =============================================================

class Sceriffo extends Guardia {
  constructor(scene, x, y) {
    super(scene, x, y, { texture: 'sceriffo', salute: Partita.diff().saluteSceriffo });
    this.setScale(1.3);
    this.eSceriffo = true;
    this.saluteMax = this.salute;
    this.raggioColpo = 9;
    this.fase = 1;
    this.stato = 'attesa';
    this.direzione = Math.PI / 2; // guarda verso il basso, verso l'ingresso
    this.tempoCarica = 3;         // secondi alla prossima carica
    this.caricaAttiva = null;     // { preparazione, durata, angolo }
    this.tempoPugnali = 2.5;
    this.timerStordita = 0;
  }

  aggiorna(dt, robin) {
    this.setDepth(100 + this.y);
    this.icona.setVisible(false);
    if (this.stato === 'sconfitto') return;

    // stordito (solo per un attimo: lo Sceriffo è robusto)
    if (this.timerStordita > 0) {
      this.timerStordita -= dt;
      this.setVelocity(0, 0);
      if (this.timerStordita <= 0) this.clearTint();
      return;
    }

    const d = Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y);

    if (this.stato === 'attesa') {
      this.cono.disegna(0xff4030, 0.15);
      if (d < 150 || this.scene.allarme.livello === 2) this.iniziaDuello();
      return;
    }
    this.cono.pulisci();

    // Nel fumo lo Sceriffo non vede niente e va a tentoni
    if (this.scene.inFumo(this.x, this.y)) {
      this.setVelocity(Math.cos(this.scene.time.now / 400) * 20, Math.sin(this.scene.time.now / 500) * 20);
      this.aggiornaAnimazione();
      return;
    }

    this.ricaricaAttacco -= dt;
    this.aggiornaFase();

    // ---- carica in corso ----
    if (this.caricaAttiva) {
      const c = this.caricaAttiva;
      if (c.preparazione > 0) {
        // lampeggia di rosso: avviso per il giocatore!
        c.preparazione -= dt;
        this.setVelocity(0, 0);
        this.setTint(Math.floor(this.scene.time.now / 80) % 2 ? 0xff3030 : 0xffffff);
      } else {
        c.durata -= dt;
        this.clearTint();
        this.setVelocity(Math.cos(c.angolo) * 210, Math.sin(c.angolo) * 210);
        if (d < 14 && !c.colpito) {
          c.colpito = true;
          robin.subisciDanno(2, this.x, this.y);
        }
        if (c.durata <= 0 || this.bloccatoDaMuro()) this.caricaAttiva = null;
      }
      this.aggiornaAnimazione();
      return;
    }

    // ---- fase 3: si tiene a distanza e lancia pugnali ----
    if (this.fase === 3) {
      this.tempoPugnali -= dt;
      if (d < 80) {
        const a = Math.atan2(this.y - robin.y, this.x - robin.x);
        this.setVelocity(Math.cos(a) * 45, Math.sin(a) * 45);
      } else if (d > 140) {
        this.vaiVerso(robin.x, robin.y, 50, dt);
      } else {
        this.setVelocity(0, 0);
      }
      if (this.tempoPugnali <= 0) this.lanciaPugnali(robin);
    } else if (d < 18) {
      // ---- in mischia ----
      this.setVelocity(0, 0);
      if (this.ricaricaAttacco <= 0) {
        this.ricaricaAttacco = 1.1;
        Suoni.suona('spada');
        this.scene.tweens.add({ targets: this, scaleX: 1.5, scaleY: 1.5, duration: 90, yoyo: true });
        robin.subisciDanno(Partita.diff().dannoGuardia + 1, this.x, this.y);
      }
    } else {
      this.vaiVerso(robin.x, robin.y, 52 + this.fase * 6, dt);
    }

    // ---- prepara una carica ----
    this.tempoCarica -= dt;
    if (this.tempoCarica <= 0 && d > 30 && d < 170 && this.scene.griglia.lineaLibera(this.x, this.y, robin.x, robin.y, 'passo')) {
      this.tempoCarica = this.fase === 3 ? 7 : 4.5;
      this.caricaAttiva = {
        preparazione: 0.7,
        durata: 0.6,
        angolo: Math.atan2(robin.y - this.y, robin.x - this.x)
      };
    }
    this.direzione = Math.atan2(robin.y - this.y, robin.x - this.x);
    this.aggiornaAnimazione();
  }

  iniziaDuello() {
    this.stato = 'combattimento';
    this.scene.iniziaDuello();
  }

  aggiornaFase() {
    const percentuale = this.salute / this.saluteMax;
    const nuovaFase = percentuale > 0.66 ? 1 : percentuale > 0.33 ? 2 : 3;
    if (nuovaFase > this.fase) {
      this.fase = nuovaFase;
      this.scene.cambioFaseSceriffo(this.fase);
    }
  }

  lanciaPugnali(robin) {
    this.tempoPugnali = 2.6;
    const base = Math.atan2(robin.y - this.y, robin.x - this.x);
    [-0.25, 0, 0.25].forEach((delta) => {
      this.scene.frecce.push(new Freccia(this.scene, this.x, this.y, base + delta, 230, 220, 'dardo', 1, false));
    });
    Suoni.suona('tiro');
  }

  colpisci(freccia) {
    if (this.stato === 'sconfitto') return;
    if (this.stato === 'attesa') this.iniziaDuello();
    if (freccia.tipo === 'stordente') {
      this.timerStordita = 1.2;
      this.caricaAttiva = null;
      this.setTint(0xaaaaee);
      Suoni.suona('stordito');
      return;
    }
    this.salute -= freccia.danno;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(120, () => { if (this.stato !== 'sconfitto') this.clearTint(); });
    if (this.salute <= 0) {
      this.salute = 0;
      this.stato = 'sconfitto';
      this.setVelocity(0, 0);
      this.body.enable = false;
      this.setRotation(Math.PI / 2);
      this.scene.sceriffoSconfitto();
    }
  }

  // Lo Sceriffo non può essere stordito a lungo né colpito alle spalle
  stordisci() {
    this.timerStordita = 1.2;
  }

  attaccabileAlleSpalle() {
    return false;
  }

  // Lo Sceriffo non va a controllare i rumori: aspetta Robin nella sala
  accorri() {}

  sentiRumore() {}
}
