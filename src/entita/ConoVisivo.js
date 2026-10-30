// =============================================================
// CONO VISIVO DELLE GUARDIE
// Ogni guardia vede in un "cono" davanti a sé.
//  - Il cono viene DISEGNATO a terra lanciando tanti raggi: ogni
//    raggio si ferma quando incontra un muro (così il cono non
//    attraversa le pareti).
//  - vede(robin) risponde con un numero da 0 a 1:
//    0 = non lo vede, 1 = lo vede benissimo (vicino e allo scoperto).
// =============================================================

class ConoVisivo {
  constructor(scene, guardia) {
    this.scene = scene;
    this.guardia = guardia;
    this.grafica = scene.add.graphics().setDepth(50);
    this.NUMERO_RAGGI = 18;
  }

  // Distanza e ampiezza attuali (cambiano con difficoltà e allarme)
  distanza() {
    const d = Partita.diff().distanzaVista;
    return this.scene.allarme.livello > 0 ? d * 1.15 : d;
  }

  metaAmpiezza() {
    const gradi = Partita.diff().ampiezzaCono * (this.scene.allarme.livello > 0 ? 1.2 : 1);
    return Phaser.Math.DegToRad(gradi / 2);
  }

  // Quanto bene la guardia vede un bersaglio (0..1)
  vede(bersaglio) {
    const g = this.guardia;
    const d = Phaser.Math.Distance.Between(g.x, g.y, bersaglio.x, bersaglio.y);

    // Robin nascosto o sui tetti è più difficile da vedere
    let fattore = 1;
    if (bersaglio.nascosto) fattore = 0.35;
    if (bersaglio.suTetto) fattore = 0.6;
    const distanzaMax = this.distanza() * fattore;
    if (d > distanzaMax) return 0;

    // è dentro l'angolo del cono?
    const angoloVersoBersaglio = Math.atan2(bersaglio.y - g.y, bersaglio.x - g.x);
    const differenza = Math.abs(Phaser.Math.Angle.Wrap(angoloVersoBersaglio - g.direzione));
    if (differenza > this.metaAmpiezza()) {
      // anche alle spalle, se sei attaccato alla guardia e non nascosto, ti sente
      if (d < 14 && !bersaglio.nascosto && !bersaglio.suTetto && bersaglio.inMovimento) return 0.5;
      return 0;
    }

    // ci sono muri in mezzo? (i tetti non bloccano la vista di chi ci sta sopra)
    if (!bersaglio.suTetto && !this.scene.griglia.lineaLibera(g.x, g.y, bersaglio.x, bersaglio.y, 'vista')) return 0;

    // il fumo blocca la vista
    if (this.scene.fumoTra(g.x, g.y, bersaglio.x, bersaglio.y)) return 0;

    // più è vicino, più è visibile (da 0.5 a 1)
    return 1 - (d / distanzaMax) * 0.5;
  }

  // Disegna il cono. colore e trasparenza dipendono dallo stato della guardia
  disegna(colore, alpha) {
    const gr = this.grafica;
    gr.clear();
    const g = this.guardia;

    // non disegniamo i coni lontani dallo schermo (risparmiamo lavoro)
    const vista = this.scene.cameras.main.worldView;
    if (g.x < vista.x - 150 || g.x > vista.right + 150 || g.y < vista.y - 150 || g.y > vista.bottom + 150) return;

    const meta = this.metaAmpiezza();
    const dist = this.distanza();
    const punti = [{ x: g.x, y: g.y }];
    for (let i = 0; i <= this.NUMERO_RAGGI; i++) {
      const a = g.direzione - meta + (2 * meta * i) / this.NUMERO_RAGGI;
      const l = this.scene.griglia.lunghezzaRaggio(g.x, g.y, a, dist);
      punti.push({ x: g.x + Math.cos(a) * l, y: g.y + Math.sin(a) * l });
    }
    // accessibilità: con "alto contrasto" il cono è più pieno e ha un bordo scuro
    const contrasto = Impostazioni.valori.altoContrasto;
    gr.fillStyle(colore, contrasto ? Math.min(0.5, alpha * 2.4) : alpha);
    gr.fillPoints(punti, true);
    if (contrasto) {
      gr.lineStyle(3, 0x000000, 0.8);
      gr.strokePoints(punti, true);
    }
    gr.lineStyle(contrasto ? 2 : 1, colore, contrasto ? 1 : alpha + 0.15);
    gr.strokePoints(punti, true);
  }

  pulisci() {
    this.grafica.clear();
  }

  distruggi() {
    this.grafica.destroy();
  }
}
