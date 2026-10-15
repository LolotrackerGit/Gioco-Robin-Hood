// =============================================================
// GUARDIA DELLO SCERIFFO
// L'intelligenza artificiale è una "macchina a stati": in ogni
// momento la guardia si trova in UNO di questi stati e cambia
// stato quando succede qualcosa.
//
//   PATTUGLIA ──vede Robin──▶ SOSPETTO (il "?" si riempie)
//      ▲                         │ pieno
//      │                         ▼
//   RICERCA ◀──lo perde── INSEGUIMENTO (fa scattare l'ALLARME)
//
// Altri stati: STORDITA (si risveglia dopo un po', a meno che non
// venga legata) e MORTA.
//
// Tipi: 'spada' (attacca da vicino) e 'balestra' (tira da lontano).
// =============================================================

class Guardia extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, opzioni) {
    opzioni = opzioni || {};
    const tipo = opzioni.tipo || 'spada';
    const texture = opzioni.texture || (tipo === 'balestra' ? 'balestriere' : 'guardia');
    super(scene, x, y, texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(8, 6);
    this.body.setOffset(4, 9);

    this.chiaveTexture = texture;
    this.tipo = tipo;
    this.salute = opzioni.salute || Partita.diff().saluteGuardia;
    this.stato = 'pattuglia';
    this.direzione = Phaser.Math.FloatBetween(-Math.PI, Math.PI); // dove guarda
    this.sospetto = 0;                 // da 0 a 1
    this.ultimoPuntoNoto = null;       // dove ha visto/sentito Robin l'ultima volta
    this.tempoSenzaVista = 0;
    this.tempoRicerca = 0;
    this.puntoRicerca = null;
    this.ricaricaAttacco = 0;
    this.timerStordita = 0;
    this.legata = false;
    this.notata = false;               // il corpo è già stato scoperto?
    this.haChiave = !!opzioni.haChiave;
    this.scorta = opzioni.scorta || null; // { carro, dx, dy } per la scorta del convoglio
    this.velocitaBase = COSTANTI.VEL_GUARDIA * (opzioni.velocita || 1);

    // Pattuglia: elenco di punti da visitare a giro
    this.pattuglia = opzioni.pattuglia || [{ x, y }];
    this.indicePattuglia = 0;
    this.attesa = Phaser.Math.FloatBetween(0, 1.5);

    // Percorso calcolato con la BFS (quando la strada diretta è bloccata)
    this.strada = null;
    this.destinazioneStrada = null;
    this.tempoRicalcolo = 0;

    this.cono = new ConoVisivo(scene, this);
    this.icona = scene.add.image(x, y - 14, 'icona_sospetto').setDepth(960).setVisible(false);
  }

  // ---------------------------------------------------------
  // AGGIORNAMENTO (ogni fotogramma)
  // ---------------------------------------------------------
  aggiorna(dt, robin) {
    this.setDepth(100 + this.y);
    this.icona.setPosition(this.x, this.y - 14);

    if (this.stato === 'morta' || this.stato === 'arresa') return;
    if (this.stato === 'stordita') {
      this.aggiornaStordita(dt);
      return;
    }

    this.ricaricaAttacco -= dt;
    const visibilita = this.calcolaVisibilita(robin);
    const velocitaSospetto = Partita.diff().velocitaSospetto * this.scene.allarme.moltiplicatore() *
      (Partita.stato.potenziamenti.mantello ? 0.75 : 1);

    // Una guardia tranquilla che vede un compagno a terra dà l'allarme... di sospetto
    if (this.stato === 'pattuglia' || this.stato === 'sospetto') this.controllaCorpi();

    switch (this.stato) {
      case 'pattuglia':
        if (visibilita > 0) {
          this.sospetto += velocitaSospetto * visibilita * dt;
          this.ultimoPuntoNoto = { x: robin.x, y: robin.y };
          this.stato = 'sospetto';
          Suoni.suona('sospetto');
        } else {
          this.sospetto = Math.max(0, this.sospetto - 0.2 * dt);
          this.eseguiPattuglia(dt);
        }
        break;

      case 'sospetto':
        if (visibilita > 0) {
          this.sospetto += velocitaSospetto * visibilita * dt;
          this.ultimoPuntoNoto = { x: robin.x, y: robin.y };
          this.ruotaVerso(robin.x, robin.y, dt, 5);
          this.setVelocity(0, 0);
          if (this.sospetto >= 1) this.scopri(robin);
        } else {
          // va a controllare piano piano il punto sospetto
          this.sospetto -= 0.18 * dt;
          if (this.ultimoPuntoNoto) this.vaiVerso(this.ultimoPuntoNoto.x, this.ultimoPuntoNoto.y, this.velocitaBase * 0.8, dt);
          if (this.sospetto <= 0) {
            this.sospetto = 0;
            this.stato = 'pattuglia';
          }
        }
        break;

      case 'inseguimento':
        this.aggiornaInseguimento(dt, robin, visibilita);
        break;

      case 'ricerca':
        this.aggiornaRicerca(dt, robin, visibilita, velocitaSospetto);
        break;

      default:
        break;
    }

    this.aggiornaAnimazione();
    this.aggiornaGrafica();
  }

  // Robin travestito non viene notato... a meno che non corra,
  // sia nella zona vietata (pavimento interno) o stia troppo vicino.
  calcolaVisibilita(robin) {
    if (!robin || robin.salute <= 0) return 0;
    let v = this.cono.vede(robin);
    if (v > 0 && robin.travestito && this.stato !== 'inseguimento') {
      const zonaVietata = this.scene.griglia.carattereA(robin.x, robin.y) === ':';
      const vicino = Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y) < 26;
      if (!robin.staCorrendo && !zonaVietata) v = vicino ? v * 0.2 : 0;
    }
    return v;
  }

  eseguiPattuglia(dt) {
    // Se fa parte della scorta, segue il carro
    if (this.scorta) {
      const c = this.scorta.carro;
      const tx = c.x + this.scorta.dx;
      const ty = c.y + this.scorta.dy;
      if (Phaser.Math.Distance.Between(this.x, this.y, tx, ty) > 6) {
        this.vaiVerso(tx, ty, Math.max(this.velocitaBase, c.velocitaAttuale + 10), dt);
      } else {
        this.setVelocity(0, 0);
        this.direzione = Phaser.Math.Angle.RotateTo(this.direzione, c.direzioneMarcia + this.scorta.guarda, 2 * dt);
      }
      return;
    }

    const punto = this.pattuglia[this.indicePattuglia];
    if (Phaser.Math.Distance.Between(this.x, this.y, punto.x, punto.y) < 4) {
      // arrivato: si ferma e si guarda intorno
      this.setVelocity(0, 0);
      this.attesa -= dt;
      this.direzione += Math.sin(this.scene.time.now / 600) * dt * 1.2;
      if (this.attesa <= 0) {
        this.indicePattuglia = (this.indicePattuglia + 1) % this.pattuglia.length;
        this.attesa = Phaser.Math.FloatBetween(1, 2.5);
      }
    } else {
      this.vaiVerso(punto.x, punto.y, this.velocitaBase, dt);
    }
  }

  aggiornaInseguimento(dt, robin, visibilita) {
    const distanza = Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y);
    if (visibilita > 0 || (distanza < 40 && !robin.nascosto && !robin.suTetto)) {
      this.ultimoPuntoNoto = { x: robin.x, y: robin.y };
      this.tempoSenzaVista = 0;
      this.scene.allarme.segnalaVista();

      if (this.tipo === 'balestra') {
        this.ruotaVerso(robin.x, robin.y, dt, 8);
        const libera = this.scene.griglia.lineaLibera(this.x, this.y, robin.x, robin.y, 'vista');
        if (distanza < 160 && libera) {
          // si allontana se Robin è troppo vicino, altrimenti si ferma e tira
          if (distanza < 50) {
            const a = Math.atan2(this.y - robin.y, this.x - robin.x);
            this.setVelocity(Math.cos(a) * this.velocitaBase, Math.sin(a) * this.velocitaBase);
          } else {
            this.setVelocity(0, 0);
          }
          if (this.ricaricaAttacco <= 0) this.tiraDardo(robin);
        } else {
          this.vaiVerso(robin.x, robin.y, COSTANTI.VEL_GUARDIA_INSEGUE, dt);
        }
      } else if (distanza < 15) {
        this.setVelocity(0, 0);
        this.ruotaVerso(robin.x, robin.y, dt, 10);
        if (this.ricaricaAttacco <= 0) this.attaccaInMischia(robin);
      } else {
        this.vaiVerso(robin.x, robin.y, COSTANTI.VEL_GUARDIA_INSEGUE, dt);
      }
    } else {
      // l'ha perso di vista: va dove l'ha visto l'ultima volta
      this.tempoSenzaVista += dt;
      const p = this.ultimoPuntoNoto;
      const arrivato = !p || Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) < 8;
      if (!arrivato) this.vaiVerso(p.x, p.y, COSTANTI.VEL_GUARDIA_INSEGUE, dt);
      if (arrivato || this.tempoSenzaVista > 5) this.iniziaRicerca(10);
    }
  }

  aggiornaRicerca(dt, robin, visibilita, velocitaSospetto) {
    if (visibilita > 0) {
      this.sospetto += velocitaSospetto * 2 * visibilita * dt;
      this.ruotaVerso(robin.x, robin.y, dt, 6);
      this.ultimoPuntoNoto = { x: robin.x, y: robin.y };
      if (this.sospetto >= 1 || this.scene.allarme.livello === 2) {
        this.scopri(robin);
        return;
      }
    }
    this.tempoRicerca -= dt;
    // cammina tra punti casuali intorno all'ultimo punto noto
    if (!this.puntoRicerca || Phaser.Math.Distance.Between(this.x, this.y, this.puntoRicerca.x, this.puntoRicerca.y) < 6) {
      this.puntoRicerca = this.scegliPuntoVicino(this.ultimoPuntoNoto || { x: this.x, y: this.y }, 4);
    }
    if (this.puntoRicerca) this.vaiVerso(this.puntoRicerca.x, this.puntoRicerca.y, this.velocitaBase * 1.2, dt);
    if (this.tempoRicerca <= 0) {
      this.stato = 'pattuglia';
      this.sospetto = 0;
      this.strada = null;
    }
  }

  // ---------------------------------------------------------
  // CAMBI DI STATO (chiamati anche da fuori)
  // ---------------------------------------------------------
  scopri(robin) {
    this.stato = 'inseguimento';
    this.sospetto = 1;
    this.tempoSenzaVista = 0;
    this.ultimoPuntoNoto = { x: robin.x, y: robin.y };
    this.scene.allarme.attiva(robin.x, robin.y);
  }

  iniziaRicerca(secondi) {
    this.stato = 'ricerca';
    this.tempoRicerca = secondi;
    this.puntoRicerca = null;
    this.sospetto = Math.max(this.sospetto, 0.5);
  }

  // Corre a controllare un punto (allarme, compagno a terra...)
  accorri(x, y) {
    if (this.stato === 'morta' || this.stato === 'stordita' || this.stato === 'inseguimento') return;
    this.ultimoPuntoNoto = { x, y };
    this.iniziaRicerca(12);
    this.puntoRicerca = { x, y };
  }

  // Ha sentito un rumore (freccia, passi di corsa...)
  sentiRumore(x, y, intensita) {
    if (this.stato !== 'pattuglia' && this.stato !== 'sospetto') return;
    this.sospetto = Math.min(0.9, this.sospetto + intensita);
    this.ultimoPuntoNoto = { x, y };
    if (this.stato === 'pattuglia') Suoni.suona('sospetto');
    this.stato = 'sospetto';
    this.direzione = Math.atan2(y - this.y, x - this.x);
  }

  controllaCorpi() {
    for (const altra of this.scene.guardie) {
      if (altra === this || altra.notata) continue;
      if (altra.stato !== 'morta' && altra.stato !== 'stordita') continue;
      if (this.cono.vede(altra) > 0) {
        altra.notata = true;
        this.accorri(altra.x, altra.y);
        this.scene.mostraMessaggio('Una guardia ha trovato un compagno a terra!', '#f2c14e');
        return;
      }
    }
  }

  // ---------------------------------------------------------
  // ATTACCHI
  // ---------------------------------------------------------
  attaccaInMischia(robin) {
    this.ricaricaAttacco = 1.0;
    Suoni.suona('spada');
    // piccolo affondo visivo
    this.scene.tweens.add({ targets: this, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true });
    robin.subisciDanno(Partita.diff().dannoGuardia, this.x, this.y);
  }

  tiraDardo(robin) {
    this.ricaricaAttacco = 2.0;
    const angolo = Math.atan2(robin.y - this.y, robin.x - this.x) + Phaser.Math.FloatBetween(-0.08, 0.08);
    const dardo = new Freccia(this.scene, this.x, this.y, angolo, 260, 200, 'dardo', Partita.diff().dannoGuardia, false);
    this.scene.frecce.push(dardo);
    Suoni.suona('tiro');
  }

  // ---------------------------------------------------------
  // DANNI
  // ---------------------------------------------------------
  colpisci(freccia) {
    if (this.stato === 'morta' || this.stato === 'stordita') return;
    if (freccia.tipo === 'stordente') {
      this.stordisci(20);
      return;
    }
    this.salute -= freccia.danno;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(120, () => { if (this.stato !== 'morta') this.clearTint(); });
    if (this.salute <= 0) {
      this.muori();
    } else {
      // ferita ma viva: ora sa che Robin è qui
      this.scopri(this.scene.robin);
    }
  }

  stordisci(secondi, legata) {
    if (this.stato === 'morta') return;
    if (this.stato !== 'stordita') this.scene.statistiche.storditi += 1;
    this.stato = 'stordita';
    this.timerStordita = secondi;
    this.legata = !!legata;
    this.notata = false;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.setRotation(Math.PI / 2);
    this.setTint(0xaaaaee);
    this.cono.pulisci();
    this.icona.setTexture('icona_zzz').setVisible(true);
    Suoni.suona('stordito');
    this.lasciaChiave();
  }

  aggiornaStordita(dt) {
    if (this.legata) {
      this.icona.setVisible(false);
      return;
    }
    this.timerStordita -= dt;
    this.icona.setAlpha(0.5 + Math.sin(this.scene.time.now / 200) * 0.5);
    if (this.timerStordita <= 0) {
      // si risveglia arrabbiata e si mette a cercare
      this.body.enable = true;
      this.setRotation(0);
      this.clearTint();
      this.icona.setAlpha(1);
      this.ultimoPuntoNoto = { x: this.x, y: this.y };
      this.iniziaRicerca(10);
      this.scene.mostraMessaggio('Una guardia si è risvegliata!', '#f2c14e');
    }
  }

  lega() {
    this.legata = true;
    this.icona.setVisible(false);
    this.setTint(0x8888aa);
  }

  muori() {
    this.stato = 'morta';
    this.scene.statistiche.uccisioni += 1;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.setRotation(Math.PI / 2);
    this.setTint(0x995555);
    this.setDepth(20);
    this.cono.pulisci();
    this.icona.setVisible(false);
    this.lasciaChiave();
  }

  lasciaChiave() {
    if (this.haChiave) {
      this.haChiave = false;
      this.scene.creaOggetto('chiave', this.x + 8, this.y);
    }
  }

  // È possibile colpirla alle spalle? (Robin dietro di lei e lei non in allarme)
  attaccabileAlleSpalle(robin) {
    if (this.stato === 'morta' || this.stato === 'stordita' || this.stato === 'inseguimento') return false;
    if (Phaser.Math.Distance.Between(this.x, this.y, robin.x, robin.y) > 18) return false;
    const angoloRobin = Math.atan2(robin.y - this.y, robin.x - this.x);
    return Math.abs(Phaser.Math.Angle.Wrap(angoloRobin - this.direzione)) > 1.6;
  }

  // ---------------------------------------------------------
  // MOVIMENTO
  // ---------------------------------------------------------
  // Va verso un punto: in linea retta se la strada è libera,
  // altrimenti seguendo il percorso calcolato con la BFS.
  vaiVerso(tx, ty, velocita, dt) {
    const griglia = this.scene.griglia;
    let meta = { x: tx, y: ty };
    const diretta = griglia.lineaLibera(this.x, this.y, tx, ty, 'passo') && !this.bloccatoDaMuro();

    if (!diretta) {
      this.tempoRicalcolo -= dt;
      const cambiata = !this.destinazioneStrada ||
        Phaser.Math.Distance.Between(tx, ty, this.destinazioneStrada.x, this.destinazioneStrada.y) > 24;
      if (!this.strada || cambiata || this.tempoRicalcolo <= 0) {
        this.strada = griglia.percorso(this.x, this.y, tx, ty);
        this.destinazioneStrada = { x: tx, y: ty };
        this.tempoRicalcolo = 0.8;
      }
      if (this.strada && this.strada.length > 0) {
        meta = this.strada[0];
        if (Phaser.Math.Distance.Between(this.x, this.y, meta.x, meta.y) < 4) {
          this.strada.shift();
          if (this.strada.length > 0) meta = this.strada[0];
        }
      } else {
        // nessuna strada: resta fermo
        this.setVelocity(0, 0);
        return;
      }
    } else {
      this.strada = null;
    }

    const angolo = Math.atan2(meta.y - this.y, meta.x - this.x);
    this.setVelocity(Math.cos(angolo) * velocita, Math.sin(angolo) * velocita);
    this.direzione = Phaser.Math.Angle.RotateTo(this.direzione, angolo, 6 * dt);
  }

  bloccatoDaMuro() {
    const b = this.body.blocked;
    return b.left || b.right || b.up || b.down;
  }

  ruotaVerso(x, y, dt, velocitaRotazione) {
    const angolo = Math.atan2(y - this.y, x - this.x);
    this.direzione = Phaser.Math.Angle.RotateTo(this.direzione, angolo, velocitaRotazione * dt);
  }

  // Punto libero a caso entro "raggio" caselle da un centro
  scegliPuntoVicino(centro, raggio) {
    const griglia = this.scene.griglia;
    const T = COSTANTI.TILE;
    for (let tentativo = 0; tentativo < 12; tentativo++) {
      const tx = Math.floor(centro.x / T) + Phaser.Math.Between(-raggio, raggio);
      const ty = Math.floor(centro.y / T) + Phaser.Math.Between(-raggio, raggio);
      if (!griglia.eSolido(tx, ty)) return griglia.centro(tx, ty);
    }
    return null;
  }

  // ---------------------------------------------------------
  // GRAFICA
  // ---------------------------------------------------------
  aggiornaAnimazione() {
    const inMoto = this.body.velocity.lengthSq() > 4;
    if (inMoto) this.anims.play(this.chiaveTexture + '_cammina', true);
    else {
      this.anims.stop();
      this.setFrame(0);
    }
    this.setFlipX(Math.cos(this.direzione) < 0);
  }

  aggiornaGrafica() {
    // colore del cono: giallo tranquillo, arancione sospetto, rosso allarme
    let colore = 0xfff2a0;
    let alpha = 0.16;
    if (this.stato === 'sospetto') { colore = 0xffa040; alpha = 0.22; }
    if (this.stato === 'inseguimento' || this.stato === 'ricerca') { colore = 0xff4030; alpha = 0.22; }
    this.cono.disegna(colore, alpha);

    // icona sopra la testa
    if (this.stato === 'sospetto' || (this.stato === 'ricerca' && this.sospetto > 0)) {
      this.icona.setTexture('icona_sospetto').setVisible(true);
      this.icona.setScale(0.7 + this.sospetto * 0.6);
    } else if (this.stato === 'inseguimento') {
      this.icona.setTexture('icona_allarme').setVisible(true).setScale(1);
    } else {
      this.icona.setVisible(false);
    }

    // barretta del sospetto
    if (this.stato === 'sospetto') {
      const gr = this.scene.graficaIndicatori;
      gr.fillStyle(0x000000, 0.7);
      gr.fillRect(this.x - 7, this.y - 22, 14, 3);
      gr.fillStyle(0xffa040, 1);
      gr.fillRect(this.x - 7, this.y - 22, 14 * Phaser.Math.Clamp(this.sospetto, 0, 1), 3);
    }
  }

  distruggi() {
    this.cono.distruggi();
    this.icona.destroy();
    this.destroy();
  }
}
