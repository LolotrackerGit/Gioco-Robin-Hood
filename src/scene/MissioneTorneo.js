// =============================================================
// MISSIONE 3: IL TORNEO DELLA FRECCIA D'ORO
// Minigioco di mira. Robin (travestito) sfida Guy di Gisborne.
//   - 3 manche da 4 frecce: bersaglio fermo, mobile, lontano
//   - il VENTO sposta la freccia di lato: bisogna correggere la mira
//   - la CARICA decide quanto lontano arriva la freccia: troppo poca e
//     cade corta, troppa e la mira diventa imprecisa
//   - il mirino trema: tieni SHIFT per trattenere il respiro
// Vincere fa scoprire il passaggio segreto del castello (utile nel finale).
// =============================================================

class MissioneTorneo extends Phaser.Scene {
  constructor() {
    super('MissioneTorneo');
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.controlli = new Controlli(this);
    this.diff = Partita.diff();
    this.tempo = 0;
    this.manche = 0;
    this.frecciaNellaManche = 0;
    this.FRECCE_PER_MANCHE = 4;
    this.punteggioRobin = 0;
    this.punteggioGisborne = 0;
    this.punteggiManche = [];       // [{ robin, gisborne }]
    this.centroPerfetto = false;
    this.stato = 'attesa';          // 'mira', 'volo', 'attesa', 'fine'
    this.carica = 0;
    this.inCarica = false;
    this.respiro = 1;               // da 0 a 1
    this.mirino = { x: 480, y: 200 };
    this.ROBIN = { x: 480, y: 470 };

    this.disegnaCampo();
    this.creaInterfaccia();
    Suoni.musica('foresta');
    this.iniziaManche();
  }

  // ---------------------------------------------------------
  // SCENOGRAFIA
  // ---------------------------------------------------------
  disegnaCampo() {
    const g = this.add.graphics();
    // prato a strisce
    for (let y = 0; y < 540; y += 30) {
      g.fillStyle(y % 60 === 0 ? 0x3f7a35 : 0x47833a, 1);
      g.fillRect(0, y, 960, 30);
    }
    // tribuna in alto
    g.fillStyle(0x5b3a1e, 1);
    g.fillRect(0, 0, 960, 70);
    g.fillStyle(0x7a5a3a, 1);
    for (let x = 0; x < 960; x += 40) g.fillRect(x, 0, 36, 66);
    // bandiere
    for (let x = 30; x < 960; x += 120) {
      g.fillStyle(x % 240 === 30 ? 0xc0392b : 0xf2c14e, 1);
      g.fillTriangle(x, 70, x + 30, 70, x + 15, 95);
    }
    // pubblico
    for (let x = 30; x < 960; x += 34) {
      if (Math.abs(x - 480) < 50) continue;
      const tex = Phaser.Utils.Array.GetRandom(['popolano', 'popolano', 'marian', 'guardia']);
      const p = this.add.sprite(x, 38, tex, 0).setScale(2.4);
      this.tweens.add({ targets: p, y: 34, duration: 300 + Math.random() * 400, yoyo: true, repeat: -1, delay: Math.random() * 500 });
    }
    // lo Sceriffo in tribuna d'onore
    this.add.rectangle(480, 36, 80, 66, 0x2b3a67);
    this.add.sprite(480, 38, 'sceriffo', 0).setScale(3);
    // linea di tiro
    g.fillStyle(0xf4f0e0, 0.8);
    g.fillRect(0, 440, 960, 3);

    this.add.sprite(this.ROBIN.x, this.ROBIN.y, 'robin_mendicante', 0).setScale(3).setDepth(20);
    this.gisborne = this.add.sprite(620, 470, 'gisborne', 0).setScale(3).setDepth(20);
    Interfaccia.testo(this, 620, 505, 'Guy di Gisborne', 13, COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5);

    this.arco = this.add.image(this.ROBIN.x, this.ROBIN.y, 'arco').setScale(3).setOrigin(0.1, 0.5).setDepth(21);
    this.graficaMira = this.add.graphics().setDepth(50);
  }

  creaInterfaccia() {
    Interfaccia.pannello(this, 10, 105, 210, 130, 'scuro');
    this.testoPunti = Interfaccia.testo(this, 22, 115, '', 15, COSTANTI.CSS.pergamena, { interlinea: 6 });
    Interfaccia.pannello(this, 740, 105, 210, 110, 'scuro');
    Interfaccia.testo(this, 845, 118, 'VENTO', 15, COSTANTI.CSS.oro, {}).setOrigin(0.5, 0);
    this.frecciaVento = this.add.graphics();
    this.testoVento = Interfaccia.testo(this, 845, 185, '', 15, COSTANTI.CSS.bianco).setOrigin(0.5, 0);
    this.testoCentro = Interfaccia.testo(this, 480, 270, '', 30, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5).setDepth(100);
    this.testoAiuto = Interfaccia.testo(this, 480, 524, '', 15, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);
    this.aggiornaAiuto();
    this.graficaBarre = this.add.graphics().setDepth(60);
  }

  // Riga dei comandi in basso (cambia se si preme T)
  aggiornaAiuto() {
    this.testoAiuto.setText(this.controlli.miraTastiera
      ? 'Frecce: muovi il mirino   SPAZIO: carica e tira   SHIFT: trattieni il respiro   T: mira col mouse'
      : 'Mouse: mira   Tieni premuto clic o SPAZIO e rilascia   SHIFT: trattieni il respiro');
  }

  // ---------------------------------------------------------
  // MANCHE
  // ---------------------------------------------------------
  iniziaManche() {
    this.manche++;
    this.frecciaNellaManche = 0;
    this.punteggiManche.push({ robin: 0, gisborne: 0 });
    if (this.bersaglio) this.bersaglio.distruggi();

    // tre manche sempre più difficili
    const configurazioni = [
      { titolo: 'Manche 1: bersaglio fermo', x: 480, y: 230, scala: 3.4, mov: { tipo: 'fermo' } },
      { titolo: 'Manche 2: bersaglio mobile', x: 480, y: 210, scala: 3.0, mov: { tipo: 'orizzontale', ampiezza: 140, velocita: 0.6 } },
      { titolo: 'Manche 3: bersaglio lontano', x: 480, y: 170, scala: 2.4, mov: { tipo: 'pendolo', ampiezza: 150, velocita: 0.7 } }
    ];
    const c = configurazioni[this.manche - 1];
    this.bersaglio = new Bersaglio(this, c.x, c.y, c.scala, c.mov);
    this.mostraCentro(c.titolo, 1500, () => this.prossimaFreccia());
  }

  prossimaFreccia() {
    // vento casuale a ogni freccia: positivo = verso destra
    const max = this.diff.ventoMassimo;
    this.vento = Phaser.Math.Between(-max, max);
    this.disegnaVento();
    this.stato = 'mira';
    this.carica = 0;
    this.inCarica = false;
  }

  mostraCentro(testo, durata, poi) {
    this.testoCentro.setText(testo).setAlpha(1);
    Interfaccia.leggi(testo);
    this.time.delayedCall(durata, () => {
      this.testoCentro.setText('');
      if (poi) poi();
    });
  }

  // ---------------------------------------------------------
  // CICLO DI GIOCO
  // ---------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.tempo += dt;
    if (this.bersaglio) this.bersaglio.aggiorna(this.tempo);

    if (this.controlli.pausa() && this.stato !== 'fine') {
      this.scene.pause();
      this.scene.launch('Pausa', { missione: this.scene.key });
      return;
    }

    if (this.controlli.tastiSpeciali()) this.aggiornaAiuto();
    this.aggiornaRespiro(dt);
    if (this.stato === 'mira') this.aggiornaMira(dt);
    this.disegnaMira();
    this.aggiornaPunti();
  }

  aggiornaRespiro(dt) {
    this.trattiene = this.controlli.corsa() && this.respiro > 0 && this.stato === 'mira';
    if (this.trattiene) this.respiro = Math.max(0, this.respiro - dt / 2.2);
    else this.respiro = Math.min(1, this.respiro + dt / 3);
  }

  // Il tremolio del mirino: due onde sinusoidali (più forte con l'arco teso a lungo)
  tremolio() {
    let ampiezza = 4 + this.carica * 4;
    if (this.trattiene) ampiezza = 1;
    return {
      x: Math.sin(this.tempo * 2.3) * ampiezza + Math.sin(this.tempo * 5.1) * ampiezza * 0.4,
      y: Math.cos(this.tempo * 1.9) * ampiezza * 0.7
    };
  }

  aggiornaMira(dt) {
    if (this.controlli.miraTastiera) {
      const t = this.controlli.tasti;
      const v = 220 * dt;
      if (t.sinistra.isDown) this.mirino.x -= v;
      if (t.destra.isDown) this.mirino.x += v;
      if (t.su.isDown) this.mirino.y -= v;
      if (t.giu.isDown) this.mirino.y += v;
    } else {
      const p = this.input.activePointer;
      this.mirino.x = p.x;
      this.mirino.y = p.y;
    }
    this.mirino.x = Phaser.Math.Clamp(this.mirino.x, 20, 940);
    this.mirino.y = Phaser.Math.Clamp(this.mirino.y, 90, 430);

    const premuto = this.controlli.tiroPremuto();
    if (premuto) {
      this.inCarica = true;
      this.carica = Math.min(1, this.carica + dt / 1.2);
    } else if (this.inCarica) {
      this.tira();
    }
  }

  // Quanta carica serve per arrivare fino al punto mirato
  caricaNecessaria(y) {
    const distanza = this.ROBIN.y - y;
    return Phaser.Math.Clamp((distanza - 160) / 300, 0, 1);
  }

  // Di quanti pixel il vento sposta una freccia diretta all'altezza y
  spostamentoVento(y) {
    return this.vento * 6 * ((this.ROBIN.y - y) / 250);
  }

  tira() {
    this.inCarica = false;
    this.stato = 'volo';
    Suoni.suona('tiro');
    const tr = this.tremolio();
    let arrivoX = this.mirino.x + tr.x;
    let arrivoY = this.mirino.y + tr.y;

    // troppa carica = meno precisione
    const eccesso = Math.max(0, this.carica - this.caricaNecessaria(arrivoY) - 0.2);
    const dispersione = 2 + eccesso * 20;
    arrivoX += Phaser.Math.FloatBetween(-dispersione, dispersione);
    arrivoY += Phaser.Math.FloatBetween(-dispersione, dispersione) * 0.5;

    // il vento sposta la freccia di lato (di più se la distanza è maggiore)
    const distanza = this.ROBIN.y - arrivoY;
    arrivoX += this.spostamentoVento(arrivoY);

    // poca carica: la freccia cade corta
    const gittata = 160 + this.carica * 300;
    let corta = false;
    if (gittata < distanza) {
      corta = true;
      const f = gittata / distanza;
      arrivoX = this.ROBIN.x + (arrivoX - this.ROBIN.x) * f;
      arrivoY = this.ROBIN.y - gittata;
    }

    const angolo = Math.atan2(arrivoY - this.ROBIN.y, arrivoX - this.ROBIN.x);
    const freccia = this.add.image(this.ROBIN.x, this.ROBIN.y - 10, 'freccia_normale').setScale(2).setRotation(angolo).setDepth(70);
    this.tweens.add({
      targets: freccia,
      x: arrivoX,
      y: arrivoY,
      duration: 250,
      onComplete: () => this.frecciaArrivata(freccia, arrivoX, arrivoY, corta)
    });
    this.carica = 0;
  }

  frecciaArrivata(freccia, x, y, corta) {
    const punti = corta ? 0 : this.bersaglio.punteggio(x, y);
    if (punti > 0) {
      // la freccia resta piantata nel bersaglio e si muove con lui
      const dx = x - this.bersaglio.x;
      const dy = y - this.bersaglio.y;
      this.time.addEvent({ delay: 16, repeat: 80, callback: () => freccia.setPosition(this.bersaglio.x + dx, this.bersaglio.y + dy) });
      Suoni.suona('bersaglio');
    } else {
      Suoni.suona('muro');
    }
    this.time.delayedCall(1300, () => freccia.destroy());

    if (punti === 10) this.centroPerfetto = true;
    this.punteggioRobin += punti;
    this.punteggiManche[this.manche - 1].robin += punti;
    const commento = corta ? 'Troppo corta: serve più carica' : punti === 10 ? 'Centro! 10 punti' : punti > 0 ? punti + ' punti' : 'Mancato';
    this.mostraCentro(commento, 900, () => {
      this.frecciaNellaManche++;
      if (this.frecciaNellaManche < this.FRECCE_PER_MANCHE) this.prossimaFreccia();
      else this.turnoGisborne();
    });
  }

  // Gisborne tira le sue 4 frecce: punteggio casuale in base alla difficoltà
  turnoGisborne() {
    this.stato = 'attesa';
    // Gisborne è bravo ma non infallibile: punteggio medio per freccia
    const media = { facile: 3.5, normale: 4.5, difficile: 6.5 }[Partita.stato.difficolta];
    let totale = 0;
    const tiri = [];
    for (let i = 0; i < this.FRECCE_PER_MANCHE; i++) {
      const p = Phaser.Math.Clamp(Math.round((media + Phaser.Math.FloatBetween(-2.5, 2.5)) / 2) * 2, 0, 10);
      tiri.push(p);
      totale += p;
    }
    this.tweens.add({ targets: this.gisborne, y: 462, duration: 120, yoyo: true, repeat: 3 });
    this.punteggioGisborne += totale;
    this.punteggiManche[this.manche - 1].gisborne = totale;
    this.mostraCentro('Gisborne tira: ' + tiri.join(' - ') + '  (totale ' + totale + ')', 2200, () => {
      if (this.manche < 3) this.iniziaManche();
      else this.fineTorneo();
    });
  }

  fineTorneo() {
    this.stato = 'fine';
    // in caso di parità vince Robin: il pubblico è tutto per lui!
    const vinto = this.punteggioRobin >= this.punteggioGisborne;
    if (vinto) {
      Partita.stato.passaggioSegreto = true;
      Suoni.suona('vittoria');
      this.mostraCentro('Hai vinto il torneo!\nUn servo del castello ti parla di un\npassaggio segreto nelle mura a ovest.', 3500, () => this.esci(true));
    } else {
      Suoni.suona('sconfitta');
      this.mostraCentro('Ha vinto Guy di Gisborne', 2200, () => this.esci(false));
    }
  }

  esci(vinto) {
    const esito = {
      successo: vinto,
      catturato: false,
      bottino: vinto ? 100 : 0,
      uccisioni: 0,
      storditi: 0,
      allarme: false,
      tempo: this.tempo,
      speciale: this.centroPerfetto
    };
    Suoni.fermaMusica();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Riepilogo', { idMissione: 'torneo', esito }));
  }

  // ---------------------------------------------------------
  // DISEGNO DI MIRINO, BARRE E VENTO
  // ---------------------------------------------------------
  disegnaMira() {
    const g = this.graficaMira;
    g.clear();
    const angolo = Math.atan2(this.mirino.y - this.ROBIN.y, this.mirino.x - this.ROBIN.x);
    this.arco.setRotation(angolo);
    if (this.stato !== 'mira') return;

    const tr = this.tremolio();
    const mx = this.mirino.x + tr.x;
    const my = this.mirino.y + tr.y;
    g.lineStyle(2, this.trattiene ? 0x8fd16a : 0xffffff, 0.9);
    g.strokeCircle(mx, my, 10);
    g.lineBetween(mx - 16, my, mx - 5, my);
    g.lineBetween(mx + 5, my, mx + 16, my);
    g.lineBetween(mx, my - 16, mx, my - 5);
    g.lineBetween(mx, my + 5, mx, my + 16);

    // barre di carica e respiro a sinistra di Robin
    const b = this.graficaBarre;
    b.clear();
    b.fillStyle(0x000000, 0.7);
    b.fillRect(300, 455, 120, 12);
    b.fillStyle(0xf2c14e, 1);
    b.fillRect(302, 457, 116 * this.carica, 8);
    // tacca bianca: quanta carica serve per arrivare al mirino
    const necessaria = this.caricaNecessaria(this.mirino.y);
    b.fillStyle(0xffffff, 1);
    b.fillRect(302 + 116 * necessaria, 453, 2, 16);
    // a Facile e Normale un puntino mostra dove il vento porterà la freccia
    if (Partita.stato.difficolta !== 'difficile') {
      b.fillStyle(0x8fd16a, 1);
      b.fillRect(this.mirino.x + this.spostamentoVento(this.mirino.y) - 2, this.mirino.y - 2, 4, 4);
    }
    b.fillStyle(0x000000, 0.7);
    b.fillRect(300, 475, 120, 8);
    b.fillStyle(0x6fa8dc, 1);
    b.fillRect(302, 477, 116 * this.respiro, 4);
  }

  disegnaVento() {
    const g = this.frecciaVento;
    g.clear();
    const lung = this.vento * 18;
    g.lineStyle(4, 0xf4f0e0, 1);
    if (this.vento !== 0) {
      g.lineBetween(845 - lung, 160, 845 + lung, 160);
      const verso = Math.sign(this.vento);
      g.fillStyle(0xf4f0e0, 1);
      g.fillTriangle(845 + lung, 152, 845 + lung, 168, 845 + lung + verso * 12, 160);
    } else {
      g.strokeCircle(845, 160, 6);
    }
    const nome = this.vento === 0 ? 'Calma' : (this.vento > 0 ? 'Verso destra ' : 'Verso sinistra ') + Math.abs(this.vento);
    this.testoVento.setText(nome);
  }

  aggiornaPunti() {
    let t = 'Robin: ' + this.punteggioRobin + '\nGisborne: ' + this.punteggioGisborne + '\n';
    t += 'Manche ' + this.manche + '/3 – freccia ' + Math.min(this.frecciaNellaManche + 1, this.FRECCE_PER_MANCHE) + '/' + this.FRECCE_PER_MANCHE;
    this.testoPunti.setText(t);
  }
}
