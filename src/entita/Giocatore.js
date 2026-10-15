// =============================================================
// GIOCATORE: ROBIN HOOD
// È uno "sprite con fisica": Phaser si occupa di farlo sbattere
// contro i muri. Noi decidiamo velocità, animazioni, salute e
// stati speciali (nascosto nei cespugli, travestito, sui tetti).
// =============================================================

class Giocatore extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, armato) {
    super(scene, x, y, 'robin', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Il "corpo fisico" è solo un quadratino ai piedi: così può
    // passare vicino ai muri in modo naturale
    this.body.setSize(8, 6);
    this.body.setOffset(4, 9);
    this.setCollideWorldBounds(true);

    this.saluteMax = Partita.saluteMassima();
    this.salute = this.saluteMax;
    this.indiceFreccia = 0;
    this.invulnerabile = 0;   // secondi di invulnerabilità dopo un colpo
    this.travestito = false;
    this.suTetto = false;
    this.nascosto = false;
    this.staCorrendo = false;
    this.inMovimento = false;
    this.bloccato = false;    // true durante la corda o un'animazione
    this.tempoRumore = 0;
    this.azione = null;       // azione lunga in corso (es. rubare un sacco)
    this.dannoSubito = 0;

    this.arco = armato ? new Arco(scene, this) : null;
  }

  aggiorna(dt, controlli) {
    if (this.invulnerabile > 0) this.invulnerabile -= dt;
    this.setDepth(100 + this.y);

    if (this.bloccato) {
      this.setVelocity(0, 0);
      return;
    }

    // ---- movimento ----
    const dir = controlli.movimento();
    this.inMovimento = dir.x !== 0 || dir.y !== 0;
    this.staCorrendo = this.inMovimento && controlli.corsa() && !(this.arco && this.arco.inCarica);

    let velocita = COSTANTI.VEL_CAMMINO;
    if (this.staCorrendo) velocita = COSTANTI.VEL_CORSA;
    if (this.arco && this.arco.inCarica) velocita = COSTANTI.VEL_MIRA;
    this.setVelocity(dir.x * velocita, dir.y * velocita);

    // un'azione lunga (es. rubare) si interrompe se ci si muove
    // (oppure, se ha un "vincolo", quando il vincolo non è più rispettato)
    if (this.azione) {
      const valida = this.azione.vincolo ? this.azione.vincolo() : !this.inMovimento;
      if (!valida) {
        this.azione = null;
      } else {
        this.azione.trascorso += dt;
        if (this.azione.trascorso >= this.azione.durata) {
          const fine = this.azione.alTermine;
          this.azione = null;
          fine();
        }
      }
    }

    // ---- animazione ----
    const chiave = this.travestito ? 'robin_mendicante' : 'robin';
    if (this.inMovimento) {
      this.anims.play(chiave + '_cammina', true);
      this.anims.timeScale = this.staCorrendo ? 1.6 : 1;
    } else {
      this.anims.stop();
      this.setTexture(chiave, 0);
    }

    // ---- nascosto nei cespugli? ----
    const sottoIPiedi = this.scene.griglia.carattereA(this.x, this.y + 4);
    this.nascosto = sottoIPiedi === 'b' && !this.staCorrendo && !this.suTetto;
    this.setAlpha(this.nascosto ? 0.55 : 1);

    // ---- correre fa rumore (solo nelle missioni, dove ci sono guardie) ----
    if (this.staCorrendo && this.scene.emettiRumore) {
      this.tempoRumore -= dt;
      if (this.tempoRumore <= 0) {
        this.tempoRumore = 0.35;
        const raggio = Partita.stato.potenziamenti.stivali ? 45 : 85;
        this.scene.emettiRumore(this.x, this.y, raggio, 0.3);
      }
    }

    // ---- arco ----
    if (this.arco) {
      const angolo = controlli.aggiornaMira(dt, this.x, this.y);
      this.setFlipX(Math.cos(angolo) < 0);
      this.arco.aggiorna(dt, angolo, controlli.tiroPremuto() && !this.azione);

      const cambio = controlli.cambioFreccia();
      if (cambio !== null) this.cambiaFreccia(cambio);
    } else if (dir.x !== 0) {
      this.setFlipX(dir.x < 0);
    }
  }

  cambiaFreccia(cambio) {
    const n = TIPI_FRECCIA.length;
    if (cambio === 'avanti') this.indiceFreccia = (this.indiceFreccia + 1) % n;
    else if (cambio === 'indietro') this.indiceFreccia = (this.indiceFreccia - 1 + n) % n;
    else this.indiceFreccia = cambio;
    if (this.arco) this.arco.annulla();
    Suoni.suona('click');
  }

  // Inizia un'azione che richiede tempo (barra di avanzamento)
  // "vincolo" (facoltativo) è una funzione: finché restituisce true l'azione continua
  iniziaAzione(testo, durata, alTermine, vincolo) {
    this.azione = { testo, durata, trascorso: 0, alTermine, vincolo };
  }

  indossaTravestimento() {
    this.travestito = true;
    this.setTexture('robin_mendicante', 0);
    if (this.arco) this.arco.annulla();
  }

  togliTravestimento() {
    this.travestito = false;
    this.setTexture('robin', 0);
    this.scene.mostraMessaggio('Hai gettato il travestimento!', '#f2c14e');
  }

  subisciDanno(quantita, daX, daY) {
    if (this.invulnerabile > 0 || this.salute <= 0) return;
    this.salute -= quantita;
    this.dannoSubito += quantita;
    this.invulnerabile = 0.9;
    Suoni.suona('danno');
    this.scene.cameras.main.shake(120, 0.006);

    // lampeggia di rosso
    this.setTint(0xff5555);
    this.scene.time.delayedCall(150, () => this.clearTint());

    // piccola spinta all'indietro
    if (daX !== undefined && !this.suTetto) {
      const a = Math.atan2(this.y - daY, this.x - daX);
      this.x += Math.cos(a) * 4;
      this.y += Math.sin(a) * 4;
    }
    if (this.travestito) this.togliTravestimento();
    if (this.salute <= 0) {
      this.salute = 0;
      this.scene.robinSconfitto();
    }
  }

  cura(quantita) {
    this.salute = Math.min(this.saluteMax, this.salute + quantita);
  }
}
