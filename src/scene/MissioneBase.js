// =============================================================
// MISSIONE BASE (classe "madre")
// Tutte le missioni con mappa (convoglio, prigione, finale)
// ereditano da questa classe con "extends MissioneBase".
// Qui c'è tutto ciò che hanno in comune:
//   - creazione della mappa, di Robin, della telecamera e dell'HUD
//   - guardie, frecce, fumo, rumori, oggetti, corda, allarme
//   - interazioni con il tasto E
//   - fine della missione (successo o cattura)
//
// Le missioni figlie possono "riscrivere" (override) questi metodi:
//   preparaMissione()      -> posiziona le cose specifiche
//   aggiornaMissione(dt)   -> logica specifica a ogni fotogramma
//   interazioniMissione()  -> azioni speciali con il tasto E
//   puoUscire()            -> l'uscita è attiva?
//   testoObiettivo()       -> testo mostrato nell'HUD
// =============================================================

class MissioneBase extends Phaser.Scene {
  // ---------------------------------------------------------
  // CREAZIONE
  // ---------------------------------------------------------
  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.datiMissione = MISSIONI[this.idMissione];

    // Elenchi degli oggetti attivi
    this.guardie = [];
    this.frecce = [];
    this.frecceATerra = [];
    this.oggetti = [];
    this.fumi = [];
    this.anelli = [];
    this.statistiche = { uccisioni: 0, storditi: 0 };
    this.bottino = 0;
    this.tempo = 0;
    this.finita = false;
    this.speciale = false;          // obiettivo speciale della missione
    this.interazioneAttuale = null; // azione disponibile con E
    this.ultimoAvvisoUscita = 0;

    // Mappa
    const livello = CostruttoreLivello.costruisci(this, this.datiMissione.mappa);
    this.livello = livello;
    this.griglia = livello.griglia;
    this.punti = livello.punti;
    this.physics.world.setBounds(0, 0, livello.larghezzaPx, livello.altezzaPx);

    // Sistemi
    this.allarme = new Allarme(this);
    this.controlli = new Controlli(this);
    this.graficaIndicatori = this.add.graphics().setDepth(970);

    // Robin
    const partenza = this.punti['P'][0];
    this.robin = new Giocatore(this, partenza.x, partenza.y, true);
    this.colliderTerra = this.physics.add.collider(this.robin, livello.strato);
    this.colliderTetti = this.physics.add.collider(this.robin, livello.stratoTetti);
    this.colliderTetti.active = false;

    // Telecamera che segue Robin
    const cam = this.cameras.main;
    cam.setZoom(COSTANTI.ZOOM);
    cam.setBounds(0, 0, livello.larghezzaPx, livello.altezzaPx);
    cam.startFollow(this.robin, true, 0.12, 0.12);
    cam.setRoundPixels(true);

    // Anelli per la freccia-corda (le "A" della mappa)
    (this.punti['A'] || []).forEach((p) => {
      const anello = this.add.image(p.x, p.y, 'anello').setDepth(45);
      this.tweens.add({ targets: anello, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
      this.anelli.push({ x: p.x, y: p.y, sprite: anello });
    });

    // Zona d'uscita (le "U" della mappa)
    this.zonaUscita = this.punti['U'] || [];
    if (this.zonaUscita.length > 0) {
      const gr = this.add.graphics().setDepth(30);
      gr.fillStyle(0x6fbf4a, 0.35);
      this.zonaUscita.forEach((p) => gr.fillRect(p.x - 8, p.y - 8, 16, 16));
      this.tweens.add({ targets: gr, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
    }

    // Parte specifica della missione (la scrivono le classi figlie)
    this.preparaMissione();

    // Collisioni delle guardie con i muri
    this.physics.add.collider(this.guardie, livello.strato);

    // HUD (interfaccia sopra al gioco) e musica
    this.scene.launch('HUD', { missione: this.scene.key });
    Suoni.musica('foresta');

    this.events.once('shutdown', () => this.scene.stop('HUD'));
  }

  // Le classi figlie la riscrivono
  preparaMissione() {}
  aggiornaMissione() {}
  interazioniMissione() { return []; }
  puoUscire() { return true; }
  testoObiettivo() { return ''; }

  // ---------------------------------------------------------
  // CREAZIONE DI GUARDIE, OGGETTI ECC.
  // ---------------------------------------------------------

  // Posiziona guardie in una parte (casuale) dei punti "g" e "k"
  creaGuardieCasuali(percentuale) {
    const p = percentuale || { facile: 0.55, normale: 0.75, difficile: 1 }[Partita.stato.difficolta];
    const spade = this.punti['g'] || [];
    const balestre = this.punti['k'] || [];
    CostruttoreLivello.scegliACaso(spade, Math.ceil(spade.length * p)).forEach((pt) => this.creaGuardia(pt.x, pt.y, 'spada'));
    CostruttoreLivello.scegliACaso(balestre, Math.ceil(balestre.length * p)).forEach((pt) => this.creaGuardia(pt.x, pt.y, 'balestra'));
  }

  creaGuardia(x, y, tipo, opzioni) {
    const o = Object.assign({ tipo, pattuglia: this.generaPattuglia(x, y) }, opzioni || {});
    const g = new Guardia(this, x, y, o);
    this.guardie.push(g);
    return g;
  }

  // Inventa un giro di pattuglia: 2-3 punti vicini raggiungibili in linea retta
  generaPattuglia(x, y) {
    const T = COSTANTI.TILE;
    const punti = [{ x, y }];
    let ultimo = punti[0];
    for (let i = 0; i < 3; i++) {
      for (let tentativo = 0; tentativo < 15; tentativo++) {
        const tx = Math.floor(ultimo.x / T) + Phaser.Math.Between(-6, 6);
        const ty = Math.floor(ultimo.y / T) + Phaser.Math.Between(-6, 6);
        if (this.griglia.eSolido(tx, ty)) continue;
        const c = this.griglia.centro(tx, ty);
        if (Phaser.Math.Distance.Between(ultimo.x, ultimo.y, c.x, c.y) < 40) continue;
        if (!this.griglia.lineaLibera(ultimo.x, ultimo.y, c.x, c.y, 'passo')) continue;
        punti.push(c);
        ultimo = c;
        break;
      }
    }
    return punti;
  }

  // Sacchi di monete e frecce sparsi a caso tra i punti "o" e "a"
  creaBottinoCasuale() {
    const sacchi = this.punti['o'] || [];
    CostruttoreLivello.scegliACaso(sacchi, Math.ceil(sacchi.length * 0.6)).forEach((p) => {
      this.creaOggetto('sacco', p.x, p.y, { valore: Phaser.Math.Between(3, 6) * 5 });
    });
    const frecce = this.punti['a'] || [];
    CostruttoreLivello.scegliACaso(frecce, Math.ceil(frecce.length * 0.6)).forEach((p) => {
      const tipo = Phaser.Utils.Array.GetRandom(['normale', 'normale', 'stordente', 'fumogena', 'corda']);
      this.creaOggetto('frecce', p.x, p.y, { tipo, quantita: tipo === 'normale' ? 4 : 1 });
    });
  }

  creaOggetto(tipo, x, y, dati) {
    const o = new Oggetto(this, tipo, x, y, dati);
    this.oggetti.push(o);
    return o;
  }

  // Arrivano rinforzi dai punti "r" e corrono verso (x, y)
  chiamaRinforzi(quanti, x, y) {
    const ingressi = this.punti['r'] || [];
    if (ingressi.length === 0) return;
    const vive = this.guardie.filter((g) => g.stato !== 'morta').length;
    const daCreare = Math.min(quanti, 24 - vive);
    for (let i = 0; i < daCreare; i++) {
      this.time.delayedCall(1500 + i * 900, () => {
        if (this.finita) return;
        const ingresso = Phaser.Utils.Array.GetRandom(ingressi);
        const tipo = i % 3 === 2 ? 'balestra' : 'spada';
        const g = this.creaGuardia(ingresso.x, ingresso.y, tipo, { pattuglia: [{ x: ingresso.x, y: ingresso.y }] });
        g.accorri(x, y);
        g.sospetto = 0.8;
      });
    }
    this.time.delayedCall(1500, () => this.mostraMessaggio('Arrivano i rinforzi!', '#ff6b5a'));
  }

  // ---------------------------------------------------------
  // CICLO DI GIOCO (ogni fotogramma)
  // ---------------------------------------------------------
  update(time, delta) {
    if (this.finita) return;
    // dt in secondi, con un limite (se il computer rallenta, il gioco non "salta")
    const dt = Math.min(delta / 1000, 0.05);
    this.tempo += dt;

    if (this.controlli.pausa()) {
      this.apriPausa();
      return;
    }
    const avviso = this.controlli.tastiSpeciali();
    if (avviso) this.mostraMessaggio(avviso, '#f2c14e');

    this.graficaIndicatori.clear();
    this.robin.aggiorna(dt, this.controlli);
    this.guardie.forEach((g) => g.aggiorna(dt, this.robin));

    // frecce in volo (eliminiamo quelle finite)
    this.frecce.forEach((f) => f.aggiorna(dt));
    this.frecce = this.frecce.filter((f) => f.attiva);

    this.aggiornaFumi();
    this.raccogliOggetti();
    this.allarme.aggiorna(dt);
    this.aggiornaMissione(dt);
    this.aggiornaInterazioni();
    this.controllaUscita();
    this.disegnaAzioneInCorso();
  }

  apriPausa() {
    this.scene.pause();
    this.scene.pause('HUD');
    this.scene.launch('Pausa', { missione: this.scene.key });
  }

  // ---------------------------------------------------------
  // INTERAZIONI CON IL TASTO E
  // ---------------------------------------------------------
  // Raccoglie tutte le azioni possibili vicino a Robin e sceglie la più vicina
  aggiornaInterazioni() {
    const r = this.robin;
    const candidati = this.interazioniMissione().slice();

    if (!r.suTetto && !r.bloccato) {
      this.guardie.forEach((g) => {
        // borseggio della chiave (alle spalle)
        if (g.haChiave && g.attaccabileAlleSpalle(r)) {
          candidati.push({ x: g.x, y: g.y, testo: 'Ruba la chiave', azione: () => this.borseggia(g) });
        } else if (g.attaccabileAlleSpalle(r)) {
          candidati.push({ x: g.x, y: g.y, testo: 'Colpo alle spalle (stordisce)', azione: () => this.colpoAlleSpalle(g) });
        } else if (g.stato === 'stordita' && !g.legata && Phaser.Math.Distance.Between(g.x, g.y, r.x, r.y) < 18) {
          candidati.push({ x: g.x, y: g.y, testo: 'Lega la guardia', azione: () => { g.lega(); Suoni.suona('raccogli'); } });
        }
      });
    }

    // Scendere dal tetto
    if (r.suTetto && !r.bloccato) {
      candidati.push({ x: r.x, y: r.y, testo: 'Scendi dal tetto', azione: () => this.scendiDalTetto() });
    }

    // scegliamo la più vicina entro 22 pixel
    let migliore = null;
    let distanzaMigliore = 22;
    candidati.forEach((c) => {
      const d = Phaser.Math.Distance.Between(r.x, r.y, c.x, c.y);
      if (d <= distanzaMigliore) {
        migliore = c;
        distanzaMigliore = d;
      }
    });
    this.interazioneAttuale = r.azione ? null : migliore;

    if (this.controlli.interagisci() && this.interazioneAttuale) {
      this.interazioneAttuale.azione();
    }
  }

  colpoAlleSpalle(guardia) {
    Suoni.suona('colpo');
    guardia.stordisci(30, true); // colpo alle spalle: tramortita e legata
    this.mostraMessaggio('Guardia messa fuori combattimento in silenzio.', '#8fd16a');
  }

  borseggia(guardia) {
    guardia.haChiave = false;
    this.robinHaChiave = true;
    this.speciale = true; // obiettivo "Mani leggere"
    Suoni.suona('raccogli');
    this.mostraMessaggio('Hai sfilato la chiave delle celle!', '#8fd16a');
  }

  // Barra di avanzamento per le azioni lunghe (es. rubare un sacco)
  disegnaAzioneInCorso() {
    const a = this.robin.azione;
    if (!a) return;
    const gr = this.graficaIndicatori;
    gr.fillStyle(0x000000, 0.7);
    gr.fillRect(this.robin.x - 12, this.robin.y - 20, 24, 4);
    gr.fillStyle(0x8fd16a, 1);
    gr.fillRect(this.robin.x - 12, this.robin.y - 20, 24 * (a.trascorso / a.durata), 4);
  }

  // ---------------------------------------------------------
  // CORDA E TETTI
  // ---------------------------------------------------------
  // Una freccia-corda si è piantata in (x, y): c'è un anello vicino?
  provaAggancio(x, y, distanza) {
    const anello = this.anelli.find((a) => Phaser.Math.Distance.Between(a.x, a.y, x, y) < (distanza || 18));
    if (!anello) return false;
    const r = this.robin;
    r.bloccato = true;
    r.body.enable = false; // durante il volo non deve sbattere contro i muri
    if (r.arco) r.arco.annulla();
    Suoni.suona('corda');

    // disegniamo la corda mentre Robin viene "tirato" su
    const corda = this.add.graphics().setDepth(905);
    this.tweens.add({
      targets: r,
      x: anello.x,
      y: anello.y,
      duration: 600,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        corda.clear();
        corda.lineStyle(1, 0xc8b48a, 1);
        corda.lineBetween(r.x, r.y, anello.x, anello.y);
      },
      onComplete: () => {
        corda.destroy();
        r.body.enable = true;
        this.impostaTetto(true);
        r.bloccato = false;
        this.mostraMessaggio('Sei sui tetti! Premi E per scendere.', '#8fd16a');
      }
    });
    return true;
  }

  impostaTetto(sopra) {
    this.robin.suTetto = sopra;
    this.colliderTerra.active = !sopra;
    this.colliderTetti.active = sopra;
    this.robin.body.reset(this.robin.x, this.robin.y);
  }

  scendiDalTetto() {
    const r = this.robin;
    const tx = Math.floor(r.x / COSTANTI.TILE);
    const ty = Math.floor(r.y / COSTANTI.TILE);
    const libera = this.griglia.casellaLiberaVicina(tx, ty, 2);
    if (!libera) {
      this.mostraMessaggio('Troppo alto per saltare giù da qui.', '#f2c14e');
      return;
    }
    const arrivo = this.griglia.centro(libera.x, libera.y);
    r.bloccato = true;
    r.body.enable = false;
    this.tweens.add({
      targets: r,
      x: arrivo.x,
      y: arrivo.y,
      duration: 300,
      onComplete: () => {
        r.body.enable = true;
        this.impostaTetto(false);
        r.bloccato = false;
        this.emettiRumore(r.x, r.y, 50, 0.3);
      }
    });
  }

  // ---------------------------------------------------------
  // RUMORE, FUMO, OGGETTI
  // ---------------------------------------------------------
  // Le guardie entro "raggio" sentono il rumore e vanno a controllare
  emettiRumore(x, y, raggio, intensita) {
    this.guardie.forEach((g) => {
      if (Phaser.Math.Distance.Between(g.x, g.y, x, y) < raggio) g.sentiRumore(x, y, intensita);
    });
  }

  creaFumo(x, y) {
    Suoni.suona('fumo');
    const sprite = this.add.image(x, y, 'fumo').setDepth(950).setScale(0.5).setAlpha(0.9);
    this.tweens.add({ targets: sprite, scale: (COSTANTI.RAGGIO_FUMO * 2) / 32, duration: 400 });
    this.fumi.push({ x, y, raggio: COSTANTI.RAGGIO_FUMO, fine: this.tempo + COSTANTI.DURATA_FUMO, sprite });
    if (this.fumoCreato) this.fumoCreato(x, y);
  }

  aggiornaFumi() {
    this.fumi.forEach((f) => {
      const rimasto = f.fine - this.tempo;
      f.sprite.setRotation(f.sprite.rotation + 0.003);
      if (rimasto < 1.5) f.sprite.setAlpha(Math.max(0, rimasto / 1.5) * 0.9);
      if (rimasto <= 0) f.sprite.destroy();
    });
    this.fumi = this.fumi.filter((f) => f.fine > this.tempo);
  }

  inFumo(x, y) {
    return this.fumi.some((f) => Phaser.Math.Distance.Between(x, y, f.x, f.y) < f.raggio);
  }

  // Il segmento da (x1,y1) a (x2,y2) passa dentro una nube di fumo?
  fumoTra(x1, y1, x2, y2) {
    for (const f of this.fumi) {
      const linea = new Phaser.Geom.Line(x1, y1, x2, y2);
      const cerchio = new Phaser.Geom.Circle(f.x, f.y, f.raggio);
      if (Phaser.Geom.Intersects.LineToCircle(linea, cerchio)) return true;
    }
    return false;
  }

  aggiungiFrecciaATerra(freccia) {
    this.frecceATerra.push(freccia);
  }

  raccogliOggetti() {
    const r = this.robin;
    if (r.suTetto) return;
    // oggetti (sacchi, frecce, chiave)
    this.oggetti.forEach((o) => {
      if (o.raccolto || Phaser.Math.Distance.Between(r.x, r.y, o.x, o.y) > 12) return;
      if (o.tipo === 'sacco') {
        this.bottino += o.dati.valore;
        Suoni.suona('moneta');
        this.mostraMessaggio('+' + o.dati.valore + ' monete', '#f2c14e');
      } else if (o.tipo === 'frecce') {
        Partita.aggiungiFrecce(o.dati.tipo, o.dati.quantita);
        Suoni.suona('raccogli');
        const nome = TIPI_FRECCIA.find((t) => t.id === o.dati.tipo).nome;
        this.mostraMessaggio('+' + o.dati.quantita + ' frecce (' + nome + ')', '#8fd16a');
      } else if (o.tipo === 'chiave') {
        this.robinHaChiave = true;
        Suoni.suona('raccogli');
        this.mostraMessaggio('Hai preso la chiave delle celle!', '#8fd16a');
      }
      o.distruggi();
    });
    this.oggetti = this.oggetti.filter((o) => !o.raccolto);

    // frecce già tirate, rimaste a terra o piantate nei muri
    this.frecceATerra.forEach((f) => {
      if (f.eliminata) return;
      if (Phaser.Math.Distance.Between(r.x, r.y, f.x, f.y) < 12) {
        if (Partita.stato.frecce[f.tipo] < Partita.maxFrecce(f.tipo)) {
          Partita.aggiungiFrecce(f.tipo, 1);
          Suoni.suona('raccogli');
          f.distruggi();
        }
      }
    });
    this.frecceATerra = this.frecceATerra.filter((f) => !f.eliminata);
  }

  // Chi può essere colpito dalle frecce di Robin
  bersagliColpibili() {
    const fuoriGioco = ['morta', 'stordita', 'sconfitto', 'arresa'];
    return this.guardie.filter((g) => fuoriGioco.indexOf(g.stato) === -1);
  }

  // ---------------------------------------------------------
  // MESSAGGI, USCITA E FINE MISSIONE
  // ---------------------------------------------------------
  mostraMessaggio(testo, colore) {
    this.events.emit('messaggio', testo, colore || '#ffffff');
  }

  controllaUscita() {
    if (this.zonaUscita.length === 0 || this.robin.suTetto) return;
    const sopra = this.zonaUscita.some((p) => Math.abs(p.x - this.robin.x) < 12 && Math.abs(p.y - this.robin.y) < 12);
    if (!sopra) return;
    if (this.puoUscire()) {
      this.termina(true);
    } else if (this.tempo - this.ultimoAvvisoUscita > 3) {
      this.ultimoAvvisoUscita = this.tempo;
      this.mostraMessaggio('Non puoi ancora andartene: ' + this.testoObiettivo(), '#f2c14e');
    }
  }

  robinSconfitto() {
    if (this.finita) return;
    this.mostraMessaggio('Sei stato catturato!', '#ff6b5a');
    this.robin.setTint(0x777777);
    this.termina(false);
  }

  // Fine della missione: prepariamo il resoconto per la scena di riepilogo
  // motivo (facoltativo): perché la missione è fallita senza cattura
  termina(successo, motivo) {
    if (this.finita) return;
    this.finita = true;
    this.physics.pause();
    Suoni.fermaMusica();
    Suoni.suona(successo ? 'vittoria' : 'sconfitta');

    const esito = {
      successo,
      catturato: !successo && !motivo,
      motivo: motivo || null,
      bottino: successo ? this.bottino : 0,
      uccisioni: this.statistiche.uccisioni,
      storditi: this.statistiche.storditi,
      allarme: this.allarme.scattato,
      tempo: this.tempo,
      speciale: this.controllaSpeciale ? this.controllaSpeciale() : this.speciale
    };
    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('HUD');
        this.scene.start('Riepilogo', { idMissione: this.idMissione, esito });
      });
    });
  }
}
