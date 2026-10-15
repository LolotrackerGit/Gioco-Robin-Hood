// =============================================================
// FRECCIA (e dardo di balestra)
// Non usiamo la fisica di Phaser per le frecce: le muoviamo noi
// a piccoli passi di 4 pixel. Così una freccia veloce non può
// "saltare" oltre un muro sottile tra un fotogramma e l'altro.
//
// Tipi: 'normale', 'stordente', 'fumogena', 'corda', 'dardo'
// =============================================================

class Freccia {
  constructor(scene, x, y, angolo, velocita, gittata, tipo, danno, daGiocatore) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.angolo = angolo;
    this.vx = Math.cos(angolo) * velocita;
    this.vy = Math.sin(angolo) * velocita;
    this.gittata = gittata;   // distanza massima prima di cadere a terra
    this.percorsa = 0;
    this.tipo = tipo;
    this.danno = danno;
    this.daGiocatore = daGiocatore;
    this.attiva = true;
    // Se Robin tira da un tetto, la freccia passa sopra gli altri tetti
    this.daTetto = daGiocatore && scene.robin && scene.robin.suTetto;

    const chiave = tipo === 'dardo' ? 'dardo' : 'freccia_' + tipo;
    this.sprite = scene.add.image(x, y, chiave).setRotation(angolo).setDepth(900);
  }

  // Chiamata a ogni fotogramma. dt = secondi passati dall'ultimo fotogramma
  aggiorna(dt) {
    if (!this.attiva) return;
    const passoTotale = Math.hypot(this.vx, this.vy) * dt;
    const numeroPassi = Math.max(1, Math.ceil(passoTotale / 4));
    const griglia = this.scene.griglia;

    for (let i = 0; i < numeroPassi; i++) {
      this.x += (this.vx * dt) / numeroPassi;
      this.y += (this.vy * dt) / numeroPassi;
      this.percorsa += passoTotale / numeroPassi;

      // 0. La freccia-corda vola in alto: si aggancia appena passa vicino a un anello
      const corda = this.tipo === 'corda' && this.daGiocatore;
      // (ignoriamo i primi pixel, per non agganciare l'anello su cui Robin è già)
      if (corda && this.percorsa > 20 && this.scene.provaAggancio(this.x, this.y, 10)) {
        this.distruggi();
        return;
      }

      // 1. Ha colpito un ostacolo? (la corda passa sopra muri e tetti, ma non sopra gli alberi)
      const c = griglia.carattereA(this.x, this.y);
      let ostacoli = this.daTetto ? '#TxtCY' : '#T^AxtCYS';
      if (corda) ostacoli = 'T';
      if (ostacoli.indexOf(c) !== -1) {
        this.colpisciOstacolo(c);
        return;
      }

      // 2. Ha colpito un personaggio?
      if (this.controllaBersagli()) return;

      // 3. È arrivata alla fine della sua corsa?
      if (this.percorsa >= this.gittata) {
        this.cadiATerra();
        return;
      }
    }
    this.sprite.setPosition(this.x, this.y);
  }

  controllaBersagli() {
    if (this.daGiocatore) {
      const bersagli = this.scene.bersagliColpibili();
      for (const b of bersagli) {
        if (Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y - 2) < (b.raggioColpo || 8)) {
          if (this.tipo === 'fumogena') {
            this.scene.creaFumo(this.x, this.y);
          } else if (this.tipo !== 'corda') {
            b.colpisci(this);
          }
          Suoni.suona('colpo');
          this.distruggi();
          return true;
        }
      }
    } else {
      const robin = this.scene.robin;
      if (robin && !robin.suTetto && Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y - 2) < 6) {
        robin.subisciDanno(this.danno, this.x - this.vx, this.y - this.vy);
        this.distruggi();
        return true;
      }
    }
    return false;
  }

  colpisciOstacolo(carattere) {
    // indietreggiamo di un passo, così la freccia resta fuori dal muro
    this.x -= Math.cos(this.angolo) * 3;
    this.y -= Math.sin(this.angolo) * 3;
    this.sprite.setPosition(this.x, this.y);

    if (this.tipo === 'corda' && this.daGiocatore) {
      this.scene.mostraMessaggio('La corda non tiene: mira a un anello giallo!', '#f2c14e');
    }
    if (this.tipo === 'fumogena') {
      this.scene.creaFumo(this.x, this.y);
      this.distruggi();
      return;
    }
    if (carattere === 'Y' && this.daGiocatore && this.scene.colpitoAlberoSecco) {
      this.scene.colpitoAlberoSecco(this);
    }

    Suoni.suona('muro');
    // Il rumore della freccia attira le guardie: si può usare come diversivo!
    if (this.daGiocatore) this.scene.emettiRumore(this.x, this.y, 85, 0.45);
    this.fermati(true);
  }

  cadiATerra() {
    if (this.tipo === 'corda' && this.daGiocatore) {
      this.scene.mostraMessaggio('La corda non arriva: mira a un anello giallo e carica di più!', '#f2c14e');
    }
    if (this.tipo === 'fumogena') {
      this.scene.creaFumo(this.x, this.y);
      this.distruggi();
      return;
    }
    if (this.daGiocatore) this.scene.emettiRumore(this.x, this.y, 50, 0.3);
    this.fermati(false);
  }

  // La freccia si ferma. Le frecce comuni e stordenti si possono raccogliere.
  fermati(piantata) {
    this.attiva = false;
    this.sprite.setDepth(5);
    if (!piantata) this.sprite.setAlpha(0.85);
    const recuperabile = this.daGiocatore && (this.tipo === 'normale' || this.tipo === 'stordente');
    if (recuperabile) {
      // la freccia resta lì: Robin può passarci sopra per riprenderla
      this.scene.aggiungiFrecciaATerra(this);
    } else {
      this.scene.tweens.add({ targets: this.sprite, alpha: 0, delay: 3000, duration: 800, onComplete: () => this.distruggi() });
    }
  }

  distruggi() {
    this.attiva = false;
    if (this.sprite) this.sprite.destroy();
    this.sprite = null;
    this.eliminata = true;
  }
}
