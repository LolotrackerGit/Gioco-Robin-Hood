// =============================================================
// L'UNICO LIVELLO: la foresta di Sherwood
// La storia è divisa in 14 PASSI (config/testi.js). In ogni momento
// c'è un solo obiettivo, indicato dalla freccia guida.
// A ogni passo completato: suono di conferma + riquadro che dice
// cosa hai fatto e qual è il passo successivo.
//
// Oltre alla storia ci sono cose da scoprire esplorando (facoltative):
// monete nascoste, cartelli con curiosità storiche e i cervi del re.
//
// Comandi tutti con il mouse:
//   - clic su un punto del terreno: Robin ci cammina
//   - clic su una guardia o un bersaglio: Robin tira una freccia
//   - clic su una persona, un cartello o un animale: Robin ci va
// =============================================================

class LivelloScene extends Phaser.Scene {
  constructor() {
    super('Livello');
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.passo = 0;
    this.inPausa = false;      // true quando c'è un riquadro aperto
    this.haArco = false;
    this.frecce = [];
    this.sacchi = [];
    this.sacchiPresi = 0;
    this.bersaglioInAttesa = null; // cosa colpire appena Robin è abbastanza vicino
    this.tempoInizio = this.time.now;

    // ---- mappa ----
    const livello = Livello.costruisci(this);
    this.griglia = livello.griglia;
    this.punti = livello.punti;
    this.physics.world.setBounds(0, 0, livello.larghezzaPx, livello.altezzaPx);
    const p = this.punti;
    this.creaFuoco();

    // ---- Robin ----
    this.robin = new Eroe(this, p['P'][0].x, p['P'][0].y);
    this.physics.add.collider(this.robin, livello.strato);
    this.ultimoCheckpoint = { x: this.robin.x, y: this.robin.y };

    // ---- persone ----
    const scala = Accessibilita.valori.scalaPersonaggi;
    this.john = this.creaPersona('john', p['J'][0], scala * 1.15, 'Little John');
    this.tuck = this.creaPersona('tuck', p['N'][0], scala, 'Fra Tuck');

    // erbe medicinali da raccogliere (compaiono quando Fra Tuck le chiede)
    this.erbe = p['e'].map((pt) => {
      const e = this.add.image(pt.x, pt.y, 'erba_medica').setScale(2).setDepth(55).setVisible(false);
      e.raccolta = false;
      return e;
    });
    this.erbeRaccolte = 0;
    this.marian = this.creaPersona('marian', p['V'][0], scala, 'Marian');
    (p['p'] || []).forEach((pt) => this.creaPersona('popolano', pt, scala, 'Un abitante del villaggio'));

    // i tre compagni della banda, nascosti in tre angoli diversi della foresta
    this.compagni = COMPAGNI.map((c) => {
      const sprite = this.creaPersona(c.sprite, p[c.segnaposto][0], scala, c.nome);
      return { sprite, dati: c, trovato: false, x: sprite.x, y: sprite.y };
    });

    // il contadino legato, vicino al carro
    this.contadino = this.creaPersona('popolano', p['Q'][0], scala, 'Il contadino legato');
    this.corda = this.add.graphics().setDepth(this.contadino.depth + 1);
    this.corda.lineStyle(3, 0xc8b48a, 1);
    [-4, 4].forEach((dy) => this.corda.lineBetween(this.contadino.x - 12, this.contadino.y + dy, this.contadino.x + 12, this.contadino.y + dy));

    // le tre famiglie del villaggio (porte con la bandierina)
    this.famiglie = p['h'].map((pt, i) => {
      const persona = this.creaPersona('popolano', { x: pt.x, y: pt.y + 14 }, scala, 'Una famiglia del villaggio');
      persona.setTint(0xffe0c0);
      const bandiera = this.add.image(pt.x + 14, pt.y - 6, 'bandierina').setScale(2).setDepth(99 + pt.y).setVisible(false);
      return { persona, bandiera, x: pt.x, y: pt.y + 14, aiutata: false, indice: i };
    });

    // ---- arco, bersagli, carro, guardie ----
    this.puntoArco = p['A'][0];
    this.immagineArco = this.add.image(this.puntoArco.x, this.puntoArco.y, 'arco').setScale(2).setRotation(-Math.PI / 4).setDepth(60);
    this.tweens.add({ targets: this.immagineArco, y: this.puntoArco.y - 4, duration: 600, yoyo: true, repeat: -1 });

    this.bersagli = p['B'].map((pt) => {
      const b = new Bersaglio(this, pt.x, pt.y);
      b.on('pointerdown', () => this.cliccaBersaglio(b));
      return b;
    });

    this.carro = this.add.image(p['C'][0].x, p['C'][0].y, 'carro').setScale(1.5).setDepth(100 + p['C'][0].y);
    this.guardie = p['g'].slice(0, Accessibilita.valori.numeroGuardie).map((pt) => {
      const g = new Nemico(this, pt.x, pt.y);
      g.on('pointerdown', () => this.cliccaBersaglio(g));
      g.on('pointerover', () => { if (Accessibilita.valori.leggiPulsanti) Voce.parla('Guardia'); });
      return g;
    });
    // anche le guardie aggiunte dopo (nel villaggio) usano questa collisione
    this.physics.add.collider(this.guardie, livello.strato);
    this.puntoPonte = p['S'][0];

    // ---- esplorazione (facoltativa) ----
    this.creaEsplorazione();

    // ---- telecamera ----
    const cam = this.cameras.main;
    cam.setZoom(COSTANTI.ZOOM);
    cam.setBounds(0, 0, livello.larghezzaPx, livello.altezzaPx);
    cam.startFollow(this.robin, true, 0.1, 0.1);
    cam.setRoundPixels(true);

    this.guida = new FrecciaGuida(this);
    this.segnoClic = this.add.graphics().setDepth(70);
    this.input.on('pointerdown', (pointer, oggetti) => this.cliccaTerreno(pointer, oggetti));

    // ---- interfaccia ----
    this.scene.launch('HUDLivello', { livello: this });
    this.events.once('shutdown', () => this.scene.stop('HUDLivello'));
    Suoni.musica('foresta');
    this.time.delayedCall(600, () => this.hud().annunciaObiettivo());
  }

  hud() {
    return this.scene.get('HUDLivello');
  }

  creaFuoco() {
    // fiamme animate sopra la casella del fuoco (la "F" della mappa)
    const riga = MAPPA.findIndex((r) => r.indexOf('F') !== -1);
    const col = MAPPA[riga].indexOf('F');
    this.add.sprite(col * 16 + 8, riga * 16 + 6, 'fuoco').setScale(1.5).play('fuoco_anim').setDepth(100 + riga * 16);
  }

  // Persona cliccabile: cliccandola Robin ci va vicino
  creaPersona(chiave, punto, scala, nome) {
    const s = this.add.sprite(punto.x, punto.y, chiave, 0).setScale(scala).setDepth(100 + punto.y);
    s.nome = nome;
    s.setInteractive({ useHandCursor: true });
    s.on('pointerdown', () => this.vaiVerso(s));
    s.on('pointerover', () => { if (Accessibilita.valori.leggiPulsanti) Voce.parla(nome); });
    return s;
  }

  vaiVerso(oggetto) {
    this.clicOggetto = Date.now();
    if (this.inPausa) return;
    this.bersaglioInAttesa = null;
    // prova ad arrivare appena sotto l'oggetto, altrimenti proprio sopra
    if (!this.robin.vaiA(oggetto.x, oggetto.y + 16)) this.robin.vaiA(oggetto.x, oggetto.y);
  }

  // Monete, cartelli e cervi
  creaEsplorazione() {
    const p = this.punti;
    this.monete = (p['o'] || []).map((pt) => {
      const m = this.add.image(pt.x, pt.y, 'moneta').setScale(1.5).setDepth(55);
      this.tweens.add({ targets: m, y: pt.y - 3, duration: 500, yoyo: true, repeat: -1 });
      return m;
    });
    this.moneteTrovate = 0;

    this.cartelli = (p['c'] || []).map((pt, i) => {
      const c = this.add.image(pt.x, pt.y - 4, 'cartello').setScale(1.5).setDepth(100 + pt.y);
      c.testo = CARTELLI[i % CARTELLI.length];
      c.letto = false;
      c.setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => {
        this.clicOggetto = Date.now();
        if (this.inPausa) return;
        if (Phaser.Math.Distance.Between(this.robin.x, this.robin.y, c.x, c.y) < 60) this.leggiCartello(c);
        else this.vaiVerso(c);
      });
      return c;
    });

    this.cervi = (p['d'] || []).map((pt) => {
      const d = this.add.image(pt.x, pt.y, 'cervo').setScale(2).setDepth(100 + pt.y);
      d.casa = { x: pt.x, y: pt.y };
      d.fase = Math.random() * 6;
      d.setInteractive({ useHandCursor: true });
      d.on('pointerdown', () => {
        this.clicOggetto = Date.now();
        if (!this.inPausa) this.hud().mostra(FRASE_CERVO);
      });
      return d;
    });
  }

  leggiCartello(c) {
    if (!c.letto) {
      c.letto = true;
      Suoni.suona('raccogli');
    }
    this.hud().cartello(c.testo);
  }

  // ---------------------------------------------------------
  // OBIETTIVO ATTUALE (dove punta la freccia guida)
  // ---------------------------------------------------------
  idPasso() {
    return PASSI[this.passo] ? PASSI[this.passo].id : null;
  }

  indicePasso(id) {
    return PASSI.findIndex((p) => p.id === id);
  }

  obiettivoAttuale() {
    switch (this.idPasso()) {
      case 'john': return this.john;
      case 'arco': return this.puntoArco;
      case 'bersagli': return this.piuVicino(this.bersagli.filter((b) => !b.colpito));
      case 'tuck': return this.tuck;
      case 'erbe': return this.piuVicino(this.erbe.filter((e) => !e.raccolta));
      case 'banda': return this.piuVicino(this.compagni.filter((c) => !c.trovato));
      case 'ponte': return this.puntoPonte;
      case 'guardie': return this.piuVicino(this.guardie.filter((g) => g.stato !== 'addormentata'));
      case 'contadino': return this.contadino;
      case 'oro': return this.piuVicino(this.sacchi.filter((s) => !s.preso));
      case 'marian': return this.marian;
      case 'famiglie': return this.piuVicino(this.famiglie.filter((f) => !f.aiutata));
      case 'guardiaVillaggio': return this.guardiaVillaggio;
      case 'festa': return this.john;
      default: return null;
    }
  }

  piuVicino(elenco) {
    let migliore = null;
    let dMin = Infinity;
    elenco.forEach((e) => {
      const d = Phaser.Math.Distance.Between(this.robin.x, this.robin.y, e.x, e.y);
      if (d < dMin) {
        dMin = d;
        migliore = e;
      }
    });
    return migliore;
  }

  // ---------------------------------------------------------
  // CLIC
  // ---------------------------------------------------------
  cliccaTerreno(pointer, oggetti) {
    if (this.inPausa) return;
    // clic su un pulsante dell'interfaccia o su un oggetto cliccabile: non camminare
    if (Date.now() - Interfaccia.ultimoClicUI < 150) return;
    if (Date.now() - (this.clicOggetto || 0) < 150 || (oggetti && oggetti.length > 0)) return;

    const punto = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // clic VICINO a una guardia o a un bersaglio (non serve essere precisi)
    const vicini = this.guardie.filter((g) => g.stato !== 'addormentata')
      .concat(this.bersagli.filter((b) => !b.colpito));
    const bersaglio = vicini.find((b) => Phaser.Math.Distance.Between(b.x, b.y, punto.x, punto.y) < 28);
    if (bersaglio) {
      this.cliccaBersaglio(bersaglio);
      return;
    }

    this.bersaglioInAttesa = null;
    if (this.robin.vaiA(punto.x, punto.y)) {
      this.segnoClic.clear();
      this.segnoClic.lineStyle(2, 0xffffff, 0.9);
      this.segnoClic.strokeCircle(punto.x, punto.y, 6);
      this.tweens.add({ targets: this.segnoClic, alpha: { from: 1, to: 0 }, duration: 600 });
    }
  }

  // Clic su una guardia o su un bersaglio di paglia: tirare una freccia
  cliccaBersaglio(b) {
    this.clicOggetto = Date.now();
    if (this.inPausa || b.colpito || b.stato === 'addormentata') return;
    if (!this.haArco) {
      this.hud().mostra(FRASI.senzaArco);
      return;
    }
    const eGuardia = this.guardie.indexOf(b) !== -1;
    if (eGuardia && this.passo < this.indicePasso('guardie')) {
      this.hud().mostra(FRASI.nonAncora);
      return;
    }
    if (this.aTiro(b)) {
      this.tira(b);
    } else {
      // troppo lontano: Robin si avvicina e tira da solo appena può
      this.bersaglioInAttesa = b;
      if (!this.robin.vaiA(b.x, b.y + 16)) this.robin.vaiA(b.x, b.y);
      this.hud().mostra(FRASI.troppoLontano);
    }
  }

  aTiro(b) {
    return Phaser.Math.Distance.Between(this.robin.x, this.robin.y, b.x, b.y) <= COSTANTI.GITTATA_ARCO &&
      this.griglia.lineaLibera(this.robin.x, this.robin.y, b.x, b.y, 'vista');
  }

  tira(b) {
    this.bersaglioInAttesa = null;
    this.robin.ferma();
    this.robin.guardaVerso(b.x);
    Suoni.suona('tiro');
    this.frecce.push(new Freccia(this, this.robin.x, this.robin.y - 4, b));
  }

  // ---------------------------------------------------------
  // CICLO DI GIOCO
  // ---------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.robin.bloccato = this.inPausa;
    this.robin.aggiorna(dt);
    this.guardie.forEach((g) => (this.inPausa ? g.setVelocity(0, 0) : g.aggiorna(dt, this.robin)));
    this.frecce.forEach((f) => f.aggiorna(dt));
    this.frecce = this.frecce.filter((f) => f.attiva);
    this.muoviCervi(dt);

    // bersaglio "prenotato" con il clic: tira appena è a tiro
    const b = this.bersaglioInAttesa;
    if (b && !this.inPausa) {
      if (b.colpito || b.stato === 'addormentata') this.bersaglioInAttesa = null;
      else if (this.aTiro(b) && Phaser.Math.Distance.Between(this.robin.x, this.robin.y, b.x, b.y) <= COSTANTI.GITTATA_ARCO * 0.8) this.tira(b);
    }

    if (!this.inPausa) {
      this.controllaEsplorazione();
      this.controllaPasso();
    }
    this.guida.aggiorna(dt, this.robin, this.inPausa ? null : this.obiettivoAttuale());
  }

  muoviCervi(dt) {
    const t = this.time.now / 1000;
    this.cervi.forEach((d) => {
      // il cervo pascola avanti e indietro; se Robin è vicino si allontana un po'
      const vicino = Phaser.Math.Distance.Between(d.x, d.y, this.robin.x, this.robin.y) < 40;
      const meta = d.casa.x + Math.sin(t * 0.4 + d.fase) * 24 + (vicino ? Math.sign(d.x - this.robin.x) * 20 : 0);
      const dx = meta - d.x;
      d.x += Phaser.Math.Clamp(dx, -30 * dt, 30 * dt);
      if (Math.abs(dx) > 1) d.setFlipX(dx > 0);
    });
  }

  vicino(o, r) {
    return o && Phaser.Math.Distance.Between(this.robin.x, this.robin.y, o.x, o.y) < r;
  }

  controllaEsplorazione() {
    this.monete.forEach((m) => {
      if (m.active && this.vicino(m, 16)) {
        m.destroy();
        this.moneteTrovate++;
        Suoni.suona('moneta');
        this.hud().mostra(FRASI.moneta + ' ' + this.moneteTrovate + ' su ' + this.monete.length + '.');
      }
    });
    // i cartelli si leggono da soli la prima volta che ci passi vicino
    this.cartelli.forEach((c) => {
      if (!c.letto && this.vicino(c, 30)) {
        this.robin.ferma();
        this.leggiCartello(c);
      }
    });
  }

  // Controlla se l'obiettivo del passo attuale è stato raggiunto
  controllaPasso() {
    const id = this.idPasso();
    if (id === 'john' && this.vicino(this.john, 32)) {
      this.dialogo('Little John', 'john', DIALOGO_JOHN);
    } else if (id === 'arco' && this.vicino(this.puntoArco, 24)) {
      this.haArco = true;
      this.immagineArco.destroy();
      Suoni.suona('raccogli');
      this.dialogo('Il tuo arco', 'robin', DIALOGO_ARCO);
    } else if (id === 'tuck' && this.vicino(this.tuck, 32)) {
      this.dialogo('Fra Tuck', 'tuck', DIALOGO_TUCK, () => this.erbe.forEach((e) => {
        e.setVisible(true);
        this.tweens.add({ targets: e, scale: 2.4, duration: 500, yoyo: true, repeat: -1 });
      }));
    } else if (id === 'erbe') {
      this.erbe.forEach((e) => {
        if (!e.raccolta && this.vicino(e, 18)) {
          e.raccolta = true;
          this.tweens.killTweensOf(e);
          e.destroy();
          this.erbeRaccolte++;
          Suoni.suona('raccogli');
          if (this.erbeRaccolte >= this.erbe.length) {
            this.completaPasso();
          } else {
            this.hud().mostra(FRASI.erba + ' ' + this.erbeRaccolte + ' su ' + this.erbe.length + '.');
          }
        }
      });
    } else if (id === 'banda') {
      const c = this.compagni.find((x) => !x.trovato && this.vicino(x, 32));
      if (c) {
        c.trovato = true;
        this.robin.ferma();
        this.hud().dialogo(c.dati.nome, c.dati.sprite, c.dati.frasi, () => {
          const trovati = this.compagni.filter((x) => x.trovato).length;
          if (trovati === this.compagni.length) this.completaPasso();
          else {
            Suoni.suona('raccogli');
            this.hud().mostra('Compagni trovati: ' + trovati + ' su ' + this.compagni.length + '. Segui la freccia per il prossimo.');
          }
        });
      }
    } else if (id === 'ponte' && this.vicino(this.puntoPonte, 36)) {
      this.ultimoCheckpoint = { x: this.puntoPonte.x, y: this.puntoPonte.y };
      this.completaPasso();
    } else if (id === 'contadino' && this.vicino(this.contadino, 30)) {
      this.dialogo('Il contadino', 'popolano', DIALOGO_CONTADINO, () => this.liberaContadino());
    } else if (id === 'oro') {
      this.sacchi.forEach((s) => {
        if (!s.preso && this.vicino(s, 18)) {
          s.preso = true;
          this.tweens.killTweensOf(s);
          s.destroy();
          this.sacchiPresi++;
          Suoni.suona('moneta');
          this.hud().mostra(FRASI.sacco + ' ' + this.sacchiPresi + ' su 3.');
          if (this.sacchiPresi >= 3) this.completaPasso();
        }
      });
    } else if (id === 'marian' && this.vicino(this.marian, 32)) {
      this.dialogo('Marian', 'marian', DIALOGO_MARIAN, () => this.famiglie.forEach((f) => f.bandiera.setVisible(true)));
    } else if (id === 'famiglie') {
      const f = this.famiglie.find((x) => !x.aiutata && this.vicino(x, 30));
      if (f) {
        f.aiutata = true;
        f.bandiera.setVisible(false);
        const rimaste = this.famiglie.filter((x) => !x.aiutata).length;
        this.robin.ferma();
        this.hud().dialogo('Una famiglia', 'popolano', [DIALOGO_FAMIGLIA[f.indice]], () => {
          Suoni.suona('moneta');
          if (rimaste === 0) this.completaPasso();
          else this.hud().mostra('Famiglie aiutate: ' + (3 - rimaste) + ' su 3.');
        });
      }
    } else if (id === 'festa' && this.vicino(this.john, 32)) {
      this.dialogo('Little John', 'john', DIALOGO_FESTA);
    }
  }

  // Apre un dialogo e, alla fine, completa il passo (dopo aver fatto "prima")
  dialogo(nome, sprite, frasi, prima) {
    this.robin.ferma();
    this.hud().dialogo(nome, sprite, frasi, () => {
      if (prima) prima();
      this.completaPasso();
    });
  }

  liberaContadino() {
    this.corda.destroy();
    // il contadino torna al villaggio
    const casa = this.punti['p'][0];
    this.tweens.add({
      targets: this.contadino, alpha: 0, duration: 600,
      onComplete: () => {
        this.contadino.setPosition(casa.x - 24, casa.y).setDepth(100 + casa.y);
        this.tweens.add({ targets: this.contadino, alpha: 1, duration: 300 });
      }
    });
  }

  completaPasso() {
    const fatto = PASSI[this.passo];
    this.passo++;
    const prossimo = PASSI[this.passo];

    // preparativi per il passo successivo
    if (prossimo && prossimo.id === 'guardie') this.guardie.forEach((g) => { g.attiva = true; });
    if (prossimo && prossimo.id === 'oro') this.creaSacchi();
    if (prossimo && prossimo.id === 'guardiaVillaggio') this.arrivaGuardiaVillaggio();

    Suoni.suona('completato');
    this.hud().passoCompletato(fatto, prossimo, () => {
      if (!prossimo) this.fine();
    });
  }

  // una guardia entra nel villaggio (dal punto G della mappa)
  arrivaGuardiaVillaggio() {
    const pt = this.punti['G'][0];
    const g = new Nemico(this, pt.x, pt.y);
    g.attiva = true;
    g.on('pointerdown', () => this.cliccaBersaglio(g));
    this.guardie.push(g);
    this.guardiaVillaggio = g;
    // se Robin viene colpito troppe volte riparte vicino a Marian
    this.ultimoCheckpoint = { x: this.marian.x, y: this.marian.y + 20 };
    this.time.delayedCall(1200, () => this.hud().mostra(DIALOGO_GUARDIA_VILLAGGIO));
  }

  // i sacchi compaiono nei punti K della mappa, vicino al carro
  creaSacchi() {
    this.punti['K'].forEach((pt) => {
      const s = this.add.image(pt.x, pt.y, 'sacco').setScale(1.5).setDepth(50);
      this.tweens.add({ targets: s, y: s.y - 3, duration: 600, yoyo: true, repeat: -1 });
      this.sacchi.push(s);
    });
  }

  // Chiamata da Bersaglio quando viene colpito
  bersaglioColpito() {
    const rimasti = this.bersagli.filter((b) => !b.colpito).length;
    if (rimasti > 0) this.hud().mostra(FRASI.bersaglio + ' Ne mancano ' + rimasti + '.');
    else if (this.idPasso() === 'bersagli') this.completaPasso();
  }

  // Chiamata da Nemico quando una guardia si addormenta
  guardiaAddormentata() {
    const sveglie = this.guardie.filter((g) => g.stato !== 'addormentata').length;
    if (this.idPasso() === 'guardiaVillaggio') {
      if (this.guardiaVillaggio.stato === 'addormentata') this.completaPasso();
    } else if (sveglie > 0) {
      this.hud().mostra(FRASI.guardiaFerma + ' Ne manca ' + sveglie + '.');
    } else if (this.idPasso() === 'guardie') {
      this.completaPasso();
    }
  }

  // Chiamata da Nemico quando colpisce Robin
  robinColpito() {
    if (this.inPausa) return;
    if (!this.robin.subisciDanno()) return;
    if (this.robin.salute > 0) {
      this.hud().mostra(FRASI.colpito);
      return;
    }
    // niente "game over": si riparte dall'ultimo punto raggiunto
    this.robin.salute = this.robin.saluteMax;
    this.robin.ferma();
    this.robin.setPosition(this.ultimoCheckpoint.x, this.ultimoCheckpoint.y);
    this.guardie.forEach((g) => g.tornaAlPosto());
    this.hud().mostra(FRASI.riprova);
  }

  fine() {
    // dati per la schermata finale
    this.registry.set('esplorazione', {
      monete: this.moneteTrovate,
      moneteTotali: this.monete.length,
      cartelli: this.cartelli.filter((c) => c.letto).length,
      cartelliTotali: this.cartelli.length,
      minuti: Math.max(1, Math.round((this.time.now - this.tempoInizio) / 60000))
    });
    Suoni.fermaMusica();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('HUDLivello');
      this.scene.start('Cutscene', { quadri: CUTSCENE_FINALE, poi: 'Fine' });
    });
  }
}
