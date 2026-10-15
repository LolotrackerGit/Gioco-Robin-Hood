// =============================================================
// CARRO DELLE TASSE
// Percorre la strada seguendo le "tappe" (1, 2, 3... nella mappa).
// Si ferma a una sosta, si blocca se un albero cade sulla strada
// e si ferma se i cavalli si spaventano per il fumo.
// =============================================================

class Carro extends Phaser.Physics.Arcade.Image {
  constructor(scene, tappe, tappaSosta) {
    super(scene, tappe[0].x, tappe[0].y, 'carro');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.body.setCircle(9, 6, -4.5);

    this.tappe = tappe;
    this.indice = 1;
    this.tappaSosta = tappaSosta;
    this.sostaFatta = false;
    this.velocita = 15;
    this.velocitaAttuale = 0;
    this.direzioneMarcia = 0;
    this.fermo = 0;          // secondi di fermata rimasti
    this.bloccato = false;   // bloccato dall'albero caduto
    this.arrivato = false;
    this.sacchi = 6;
    this.sacchiIniziali = 6;
  }

  aggiorna(dt) {
    this.setDepth(100 + this.y);
    if (this.arrivato) return;

    if (this.fermo > 0 || this.bloccato) {
      this.fermo = Math.max(0, this.fermo - dt);
      this.setVelocity(0, 0);
      this.velocitaAttuale = 0;
      return;
    }

    const meta = this.tappe[this.indice];
    const d = Phaser.Math.Distance.Between(this.x, this.y, meta.x, meta.y);
    if (d < 3) {
      if (this.indice === this.tappaSosta && !this.sostaFatta) {
        this.sostaFatta = true;
        this.fermo = 20;
        this.scene.mostraMessaggio('Il convoglio si ferma nella radura per una sosta.', '#f2c14e');
      }
      this.indice++;
      if (this.indice >= this.tappe.length) {
        this.arrivato = true;
        this.setVelocity(0, 0);
        this.scene.carroArrivato();
      }
      return;
    }
    this.direzioneMarcia = Math.atan2(meta.y - this.y, meta.x - this.x);
    this.setRotation(this.direzioneMarcia);
    this.velocitaAttuale = this.velocita;
    this.setVelocity(Math.cos(this.direzioneMarcia) * this.velocita, Math.sin(this.direzioneMarcia) * this.velocita);
  }

  // Punto dietro al carro: da lì si possono rubare i sacchi
  retro() {
    return {
      x: this.x - Math.cos(this.direzioneMarcia) * 16,
      y: this.y - Math.sin(this.direzioneMarcia) * 16
    };
  }

  spaventa(secondi) {
    if (this.fermo < secondi) {
      this.fermo = secondi;
      this.scene.mostraMessaggio('I cavalli si imbizzarriscono nel fumo!', '#f2c14e');
    }
  }
}
