// =============================================================
// FRECCIA GUIDA
// Indica la direzione dell'obiettivo principale.
//  - Robin FERMO: la freccia è grande, ben visibile e "pulsa".
//  - Robin IN MOVIMENTO: la freccia si rimpicciolisce e diventa
//    trasparente, così non dà fastidio.
// Sull'obiettivo compare anche un cerchio giallo.
// =============================================================

class FrecciaGuida {
  constructor(scene) {
    this.scene = scene;
    this.grafica = scene.add.graphics().setDepth(980);
    this.cerchio = scene.add.graphics().setDepth(60);
    this.scala = 1;   // dimensione attuale (cambia piano piano)
  }

  aggiorna(dt, robin, obiettivo) {
    const g = this.grafica;
    g.clear();
    this.cerchio.clear();
    if (!obiettivo || !Accessibilita.valori.frecciaGuida) return;

    // cerchio che pulsa sull'obiettivo
    const t = this.scene.time.now / 1000;
    const r = 14 + Math.sin(t * 4) * 3;
    this.cerchio.lineStyle(3, 0xf2c14e, 0.9);
    this.cerchio.strokeCircle(obiettivo.x, obiettivo.y, r);

    const distanza = Phaser.Math.Distance.Between(robin.x, robin.y, obiettivo.x, obiettivo.y);
    if (distanza < 30) return; // siamo arrivati: basta il cerchio

    // grande se Robin è fermo da mezzo secondo, piccola se si muove
    const scalaVoluta = robin.fermoDa > 0.5 ? 1 : 0.4;
    this.scala += (scalaVoluta - this.scala) * Math.min(1, dt * 6);
    const alpha = 0.35 + 0.65 * ((this.scala - 0.4) / 0.6);

    const a = Math.atan2(obiettivo.y - robin.y, obiettivo.x - robin.x);
    const pulsazione = robin.fermoDa > 0.5 ? Math.sin(t * 5) * 4 : 0;
    const dist = 34 + pulsazione;
    const cx = robin.x + Math.cos(a) * dist;
    const cy = robin.y + Math.sin(a) * dist;
    const s = this.scala;

    // punti della freccia (punta, ali, coda) ruotati verso l'obiettivo
    const punto = (avanti, lato) => ({
      x: cx + Math.cos(a) * avanti * s - Math.sin(a) * lato * s,
      y: cy + Math.sin(a) * avanti * s + Math.cos(a) * lato * s
    });
    const forma = [punto(16, 0), punto(0, 12), punto(0, 5), punto(-14, 5), punto(-14, -5), punto(0, -5), punto(0, -12)];

    g.fillStyle(0x1b120a, alpha);
    g.fillPoints(forma.map((p) => ({ x: p.x + 2, y: p.y + 2 })), true);
    g.fillStyle(0xf2c14e, alpha);
    g.fillPoints(forma, true);
  }
}
