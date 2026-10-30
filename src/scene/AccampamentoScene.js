// =============================================================
// ACCAMPAMENTO NELLA FORESTA DI SHERWOOD (l'"hub")
// Robin cammina liberamente e, con il tasto E, può:
//   - leggere i cartelli delle missioni (1, 2, 3 e il finale)
//   - comprare da Fra Tuck (negozio)
//   - dividere il bottino al forziere (villaggi o equipaggiamento)
//   - consultare il Diario nella sua tenda
//
// Usiamo DUE telecamere: una con lo zoom per il mondo e una
// senza zoom per l'interfaccia (barra in alto e pannelli).
// =============================================================

class AccampamentoScene extends Phaser.Scene {
  constructor() {
    super('Accampamento');
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    Partita.salva();
    this.pannelloAperto = false;
    this.elementiPannello = [];

    // ---- mondo ----
    const livello = CostruttoreLivello.costruisci(this, 'accampamento');
    this.griglia = livello.griglia;
    this.punti = livello.punti;
    this.physics.world.setBounds(0, 0, livello.larghezzaPx, livello.altezzaPx);

    const p = this.punti;
    this.add.sprite(p['F'][0].x, p['F'][0].y - 2, 'fuoco').play('fuoco_anim').setDepth(100 + p['F'][0].y);

    this.robin = new Giocatore(this, p['P'][0].x, p['P'][0].y, false);
    this.physics.add.collider(this.robin, livello.strato);
    this.controlli = new Controlli(this);

    // Punti con cui si può interagire
    this.puntiInterazione = [];
    this.cartelliMissione = {}; // posizione del cartello di ogni missione (per la freccia guida)
    const missioniHub = [['1', 'convoglio'], ['2', 'prigione'], ['3', 'torneo'], ['4', 'finale']];
    missioniHub.forEach(([carattere, id]) => {
      const pt = p[carattere][0];
      const cartello = this.add.image(pt.x, pt.y - 4, 'cartello').setDepth(100 + pt.y);
      this.cartelliMissione[id] = pt;
      const completata = Partita.stato.missioni[id] && Partita.stato.missioni[id].completata;
      if (completata) cartello.setTint(0x8fd16a);
      if (id === 'finale' && !Partita.finaleSbloccato()) cartello.setTint(0x777777);
      this.puntiInterazione.push({ x: pt.x, y: pt.y, testo: 'Leggi: ' + MISSIONI[id].titolo, azione: () => this.pannelloMissione(id) });
    });

    const tuck = this.add.sprite(p['N'][0].x, p['N'][0].y, 'tuck', 0).setDepth(100 + p['N'][0].y);
    this.add.image(p['N'][0].x + 14, p['N'][0].y + 2, 'frecce_terra').setDepth(99 + p['N'][0].y);
    this.puntiInterazione.push({ x: tuck.x, y: tuck.y, testo: 'Fra Tuck (negozio)', azione: () => this.pannelloNegozio() });

    const forziere = this.add.image(p['B'][0].x, p['B'][0].y, 'forziere').setDepth(100 + p['B'][0].y);
    this.forziere = forziere;
    this.puntiInterazione.push({ x: forziere.x, y: forziere.y, testo: 'Forziere del bottino', azione: () => this.pannelloBottino() });

    this.add.image(p['D'][0].x, p['D'][0].y, 'libro').setDepth(100 + p['D'][0].y);
    this.puntiInterazione.push({ x: p['D'][0].x, y: p['D'][0].y, testo: 'Diario di Robin', azione: () => this.apriDiario() });

    if (Partita.stato.littleJohnLibero) {
      const john = this.add.sprite(p['L'][0].x, p['L'][0].y, 'john', 0).setScale(1.2).setDepth(100 + p['L'][0].y);
      this.puntiInterazione.push({ x: john.x, y: john.y, testo: 'Parla con Little John', azione: () => this.dialogo('Little John', Phaser.Utils.Array.GetRandom(DIALOGHI_JOHN)) });
    }

    // Popolani venuti a ringraziare: più reputazione = più visite
    const visitatori = Math.floor(Partita.stato.reputazione / 20);
    for (let i = 0; i < visitatori; i++) {
      const angolo = (i / Math.max(1, visitatori)) * Math.PI * 2;
      const x = p['F'][0].x + Math.cos(angolo) * 34;
      const y = p['F'][0].y + Math.sin(angolo) * 26;
      const v = this.add.sprite(x, y, i % 2 ? 'marian' : 'popolano', 0).setDepth(100 + y).setFlipX(Math.cos(angolo) > 0);
      this.puntiInterazione.push({ x: v.x, y: v.y, testo: 'Parla con un abitante', azione: () => this.dialogo('Un abitante di Sherwood', Phaser.Utils.Array.GetRandom(DIALOGHI_POPOLO)) });
    }

    // ---- telecamere ----
    const cam = this.cameras.main;
    cam.setZoom(COSTANTI.ZOOM);
    cam.setBounds(0, 0, livello.larghezzaPx, livello.altezzaPx);
    cam.startFollow(this.robin, true, 0.12, 0.12);
    cam.setRoundPixels(true);
    // freccia guida (accessibilità): creata prima della telecamera UI, così fa parte del mondo
    this.guida = new FrecciaGuida(this);

    // la seconda telecamera (UI) non deve vedere il mondo
    this.camUI = this.cameras.add(0, 0, COSTANTI.LARGHEZZA, COSTANTI.ALTEZZA);
    this.camUI.ignore(this.children.list.slice());

    this.creaBarraSuperiore();
    this.testoSugg = this.ui(Interfaccia.testo(this, 480, 500, '', 17, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5));

    Suoni.musica('foresta');
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.pannelloAperto) this.chiudiPannello();
      else this.pannelloPausa();
    });

    // Se c'è del bottino appena portato, apriamo subito il forziere
    if (Partita.stato.oroDaDividere > 0) {
      this.time.delayedCall(600, () => this.pannelloBottino());
    } else if (Partita.missioniCompletate() === 0 && Partita.stato.statistiche.tempoTotale === 0) {
      this.time.delayedCall(600, () => this.dialogo('L\'accampamento',
        'Muoviti con WASD e premi E vicino ai cartelli per scegliere una missione.\n' +
        'Da Fra Tuck compri frecce e attrezzatura, al forziere dividi il bottino.\n' +
        'Le prime tre missioni si fanno in qualsiasi ordine. Dopo due si apre il finale.'));
    }
  }

  // Aggiunge oggetti all'interfaccia: li vede solo la telecamera UI
  ui(oggetto) {
    const lista = oggetto.oggetti ? oggetto.oggetti : [oggetto];
    lista.forEach((o) => this.cameras.main.ignore(o));
    return oggetto;
  }

  creaBarraSuperiore() {
    this.ui(this.add.rectangle(480, 22, 960, 44, 0x000000, 0.6));
    this.ui(this.add.image(24, 22, 'moneta').setScale(3));
    this.testoOro = this.ui(Interfaccia.testo(this, 42, 11, '', 20, COSTANTI.CSS.oro));
    this.ui(Interfaccia.testo(this, 160, 13, 'Reputazione', 16, COSTANTI.CSS.pergamena));
    this.ui(this.add.rectangle(270, 22, 154, 14, 0x000000).setOrigin(0, 0.5).setStrokeStyle(2, 0x8a6a3a));
    this.barraReputazione = this.ui(this.add.rectangle(272, 22, 150, 10, 0x6fbf4a).setOrigin(0, 0.5));
    this.testoReputazione = this.ui(Interfaccia.testo(this, 432, 13, '', 16, COSTANTI.CSS.verdeChiaro));
    this.testoMissioni = this.ui(Interfaccia.testo(this, 600, 13, '', 16, COSTANTI.CSS.pergamena));
    this.testoFrecce = this.ui(Interfaccia.testo(this, 940, 13, '', 14, COSTANTI.CSS.pergamena).setOrigin(1, 0));
  }

  aggiornaBarra() {
    const s = Partita.stato;
    this.testoOro.setText(String(s.oro));
    this.barraReputazione.width = 150 * (s.reputazione / 100);
    this.barraReputazione.setFillStyle(s.reputazione >= 60 ? 0x6fbf4a : s.reputazione >= 35 ? 0xf2c14e : 0xc0392b);
    this.testoReputazione.setText(s.reputazione + ' - ' + etichettaReputazione(s.reputazione));
    this.testoMissioni.setText('Missioni: ' + Partita.missioniCompletate() + '/3');
    const f = s.frecce;
    this.testoFrecce.setText('Frecce  C:' + f.normale + '  S:' + f.stordente + '  F:' + f.fumogena + '  K:' + f.corda);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.aggiornaBarra();
    const avviso = this.controlli.tastiSpeciali();
    if (avviso) this.avviso(avviso);
    if (this.pannelloAperto) {
      this.robin.setVelocity(0, 0);
      this.robin.anims.stop();
      this.testoSugg.setText('');
      return;
    }
    this.robin.aggiorna(dt, this.controlli);
    this.guida.aggiorna(dt, this.robin, this.obiettivoGuida());

    // interazione più vicina
    let vicino = null;
    let migliore = 22;
    this.puntiInterazione.forEach((pi) => {
      const d = Phaser.Math.Distance.Between(this.robin.x, this.robin.y, pi.x, pi.y);
      if (d < migliore) {
        migliore = d;
        vicino = pi;
      }
    });
    this.testoSugg.setText(vicino ? '[E] ' + vicino.testo : '');
    if (vicino && this.controlli.interagisci()) vicino.azione();
  }

  // Breve messaggio in alto (es. "Audio spento")
  avviso(testo) {
    if (this.testoAvviso) this.testoAvviso.destroy();
    this.testoAvviso = this.ui(Interfaccia.testo(this, 480, 64, testo, 18, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5));
    Interfaccia.leggi(testo);
    this.tweens.add({ targets: this.testoAvviso, alpha: 0, delay: 1800, duration: 400 });
  }

  // ---------------------------------------------------------
  // PANNELLI
  // ---------------------------------------------------------
  apriPannello(titolo, larghezza, altezza) {
    this.chiudiPannello();
    this.pannelloAperto = true;
    Suoni.suona('click');
    const x = 480 - larghezza / 2;
    const y = 270 - altezza / 2 + 10;
    this.aggiungi(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.5));
    this.aggiungi(Interfaccia.pannello(this, x, y, larghezza, altezza, 'legno'));
    this.aggiungi(Interfaccia.titolo(this, 480, y + 28, titolo, 26));
    return { x, y };
  }

  aggiungi(oggetto) {
    this.ui(oggetto);
    this.elementiPannello.push(oggetto);
    return oggetto;
  }

  chiudiPannello() {
    this.elementiPannello.forEach((e) => (e.distruggi ? e.distruggi() : e.destroy()));
    this.elementiPannello = [];
    this.pannelloAperto = false;
  }

  pulsanteChiudi(y, etichetta) {
    return this.aggiungi(Interfaccia.pulsante(this, 480, y, etichetta || 'Chiudi', () => this.chiudiPannello(), { larghezza: 180, altezza: 32, dimensione: 16 }));
  }

  // Freccia guida all'accampamento: prima il forziere (se c'è bottino),
  // poi il cartello della prossima missione da fare
  obiettivoGuida() {
    if (Partita.stato.oroDaDividere > 0) return this.forziere;
    const daFare = ['convoglio', 'prigione', 'torneo'].find((id) => !Partita.stato.missioni[id].completata);
    if (Partita.finaleSbloccato() && (!daFare || Partita.missioniCompletate() >= 3)) return this.cartelliMissione.finale;
    return daFare ? this.cartelliMissione[daFare] : this.cartelliMissione.finale;
  }

  dialogo(chi, testo) {
    Interfaccia.leggi(chi + '. ' + testo);
    const { y } = this.apriPannello(chi, 640, 220);
    this.aggiungi(Interfaccia.testo(this, 480, y + 105, testo, 16, COSTANTI.CSS.pergamena, { align: 'center', larghezza: 580, interlinea: 6 }).setOrigin(0.5));
    this.pulsanteChiudi(y + 190, 'Va bene');
  }

  pannelloMissione(id) {
    const m = MISSIONI[id];
    const { x, y } = this.apriPannello(m.titolo, 680, 380);
    const bloccata = id === 'finale' && !Partita.finaleSbloccato();
    Interfaccia.leggi(m.titolo + '. ' + m.descrizione + (bloccata ? ' Missione ancora bloccata.' : ''));
    this.aggiungi(Interfaccia.testo(this, x + 30, y + 60, m.descrizione, 16, COSTANTI.CSS.pergamena, { larghezza: 620, interlinea: 5 }));
    this.aggiungi(Interfaccia.testo(this, x + 30, y + 140, 'Come affrontarla:', 16, COSTANTI.CSS.oro, {}));
    m.modi.forEach((modo, i) => {
      this.aggiungi(Interfaccia.testo(this, x + 40, y + 168 + i * 26, '- ' + modo, 14, COSTANTI.CSS.verdeChiaro, { larghezza: 600 }));
    });

    const stato = Partita.stato.missioni[id];
    let info = '';
    if (stato && stato.completata) info = 'Già completata. Puoi rigiocarla per prendere altro bottino.';
    else if (stato && stato.tentativi > 0) info = 'Tentativi: ' + stato.tentativi;
    if (bloccata) info = 'Bloccata: completa almeno ' + MISSIONI_PER_FINALE + ' missioni (' + Partita.missioniCompletate() + ' fatte).';
    this.aggiungi(Interfaccia.testo(this, 480, y + 268, info, 14, bloccata ? COSTANTI.CSS.rosso : COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5));

    this.aggiungi(Interfaccia.pulsante(this, 380, y + 330, 'Parti!', () => this.partiPer(id), { larghezza: 180, altezza: 34, disabilitato: bloccata }));
    this.aggiungi(Interfaccia.pulsante(this, 580, y + 330, 'Annulla', () => this.chiudiPannello(), { larghezza: 180, altezza: 34 }));
  }

  partiPer(id) {
    const m = MISSIONI[id];
    Partita.salva();
    // prima la cutscene che spiega la missione, poi il caricamento, poi la missione
    Interfaccia.vaiA(this, 'Cutscene', {
      quadri: CUTSCENE_MISSIONI[id].inizio,
      titolo: m.titolo,
      poi: 'Caricamento',
      datiPoi: { destinazione: m.scena, titolo: m.titolo, suggerimenti: m.modi }
    });
  }

  pannelloNegozio() {
    const { x, y } = this.apriPannello('Il negozio di Fra Tuck', 760, 440);
    const s = Partita.stato;

    NEGOZIO.forEach((voce, i) => {
      const ry = y + 80 + i * 40;
      const prezzo = Math.round(voce.prezzo * Partita.diff().prezzi);
      let motivo = '';
      if (voce.tipo === 'potenziamento' && s.potenziamenti[voce.id]) motivo = 'Già tuo';
      else if (voce.tipo === 'frecce' && s.frecce[voce.freccia] >= Partita.maxFrecce(voce.freccia)) motivo = 'Faretra piena';
      else if (s.oro < prezzo) motivo = 'Oro insufficiente';

      this.aggiungi(Interfaccia.testo(this, x + 25, ry, voce.nome, 15, COSTANTI.CSS.pergamena, {}));
      this.aggiungi(Interfaccia.testo(this, x + 25, ry + 18, voce.descrizione, 12, COSTANTI.CSS.grigio));
      this.aggiungi(Interfaccia.testo(this, x + 520, ry + 6, prezzo + ' oro', 15, COSTANTI.CSS.oro));
      this.aggiungi(Interfaccia.pulsante(this, x + 680, ry + 14, motivo || 'Compra', () => this.compra(voce, prezzo),
        { larghezza: 130, altezza: 28, dimensione: 13, disabilitato: !!motivo }));
    });
    this.pulsanteChiudi(y + 410);
  }

  compra(voce, prezzo) {
    const s = Partita.stato;
    if (s.oro < prezzo) return;
    s.oro -= prezzo;
    if (voce.tipo === 'frecce') Partita.aggiungiFrecce(voce.freccia, voce.quantita);
    else s.potenziamenti[voce.id] = true;
    Partita.salva();
    Suoni.suona('moneta');
    this.pannelloNegozio(); // ridisegniamo il pannello aggiornato
  }

  pannelloBottino() {
    const s = Partita.stato;
    if (s.oroDaDividere <= 0) {
      this.dialogo('Forziere del bottino',
        'Il forziere è vuoto. Porta a casa il bottino delle missioni per decidere come usarlo.\n\n' +
        'Oro donato finora ai villaggi: ' + s.statistiche.oroDonato + '\nOro tenuto per te: ' + s.statistiche.oroTenuto);
      return;
    }
    const { x, y } = this.apriPannello('Dividi il bottino', 700, 380);
    const totale = s.oroDaDividere;
    this.quotaVillaggi = Math.round(totale / 2);

    this.aggiungi(Interfaccia.testo(this, 480, y + 62,
      'Hai portato ' + totale + ' monete. Quanto dai ai villaggi poveri di Sherwood?\n' +
      'Le famiglie devono pagare la tassa per il riscatto del re: il tuo aiuto aumenta la reputazione.',
      14, COSTANTI.CSS.pergamena, { align: 'center', larghezza: 640 }).setOrigin(0.5, 0));

    // cursore (slider)
    const barraX = x + 150;
    const barraL = 400;
    const barraY = y + 175;
    const barra = this.aggiungi(this.add.rectangle(barraX + barraL / 2, barraY, barraL, 12, 0x2b1a0e).setStrokeStyle(2, 0x8a6a3a));
    const riempimento = this.aggiungi(this.add.rectangle(barraX, barraY, 0, 8, 0x6fbf4a).setOrigin(0, 0.5));
    const maniglia = this.aggiungi(this.add.rectangle(barraX, barraY, 14, 26, 0xf2c14e).setStrokeStyle(2, 0x000000));
    this.aggiungi(Interfaccia.testo(this, barraX - 10, barraY, 'A te', 14, COSTANTI.CSS.oro).setOrigin(1, 0.5));
    this.aggiungi(Interfaccia.testo(this, barraX + barraL + 10, barraY, 'Ai villaggi', 14, COSTANTI.CSS.verdeChiaro).setOrigin(0, 0.5));
    const testoQuote = this.aggiungi(Interfaccia.testo(this, 480, y + 215, '', 18, COSTANTI.CSS.bianco, { align: 'center' }).setOrigin(0.5));
    this.aggiungi(Interfaccia.testo(this, 480, y + 250, 'Trascina il cursore oppure usa A / D', 13, COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5));

    const aggiorna = () => {
      const frazione = this.quotaVillaggi / totale;
      maniglia.x = barraX + frazione * barraL;
      riempimento.width = frazione * barraL;
      const rep = Math.round(this.quotaVillaggi / 8);
      testoQuote.setText('Ai villaggi: ' + this.quotaVillaggi + ' (+' + rep + ' reputazione)     A te: ' + (totale - this.quotaVillaggi));
    };
    const daMouse = (pointer) => {
      if (!pointer.isDown) return;
      const f = Phaser.Math.Clamp((pointer.x - barraX) / barraL, 0, 1);
      this.quotaVillaggi = Math.round(f * totale);
      aggiorna();
    };
    barra.setInteractive({ useHandCursor: true });
    maniglia.setInteractive({ useHandCursor: true, draggable: true });
    barra.on('pointerdown', daMouse);
    this.input.on('pointermove', daMouse);
    const passo = Math.max(1, Math.round(totale / 20));
    const sinistra = () => { this.quotaVillaggi = Math.max(0, this.quotaVillaggi - passo); aggiorna(); };
    const destra = () => { this.quotaVillaggi = Math.min(totale, this.quotaVillaggi + passo); aggiorna(); };
    this.input.keyboard.on('keydown-LEFT', sinistra);
    this.input.keyboard.on('keydown-A', sinistra);
    this.input.keyboard.on('keydown-RIGHT', destra);
    this.input.keyboard.on('keydown-D', destra);
    aggiorna();

    // quando il pannello si chiude, togliamo gli "ascoltatori" dei tasti
    this.elementiPannello.push({
      destroy: () => {
        this.input.off('pointermove', daMouse);
        this.input.keyboard.off('keydown-LEFT', sinistra);
        this.input.keyboard.off('keydown-A', sinistra);
        this.input.keyboard.off('keydown-RIGHT', destra);
        this.input.keyboard.off('keydown-D', destra);
      }
    });

    this.aggiungi(Interfaccia.pulsante(this, 480, y + 320, 'Conferma', () => this.confermaBottino(), { larghezza: 200, altezza: 36 }));
  }

  confermaBottino() {
    const donati = this.quotaVillaggi;
    const guadagno = Partita.dividiBottino(donati);
    Suoni.suona('moneta');
    let reazione;
    if (donati === 0) reazione = 'Hai tenuto tutto per te. Nei villaggi la gente non è contenta.';
    else if (guadagno >= 15) reazione = 'I villaggi festeggiano! Con quest\'oro molte famiglie potranno pagare la tassa senza vendere il raccolto. (+' + guadagno + ' reputazione)';
    else reazione = 'Le famiglie più povere ti ringraziano. (+' + guadagno + ' reputazione)';
    this.dialogo('Bottino diviso', reazione);
  }

  apriDiario() {
    this.scene.pause();
    this.scene.launch('Diario', { sopra: 'Accampamento' });
  }

  pannelloPausa() {
    const { y } = this.apriPannello('Accampamento', 380, 310);
    this.aggiungi(Interfaccia.pulsante(this, 480, y + 85, 'Riprendi', () => this.chiudiPannello()));
    this.aggiungi(Interfaccia.pulsante(this, 480, y + 135, 'Diario di Robin', () => { this.chiudiPannello(); this.apriDiario(); }));
    this.aggiungi(Interfaccia.pulsante(this, 480, y + 185, 'Impostazioni', () => {
      this.chiudiPannello();
      this.scene.pause();
      this.scene.launch('Impostazioni', { sopra: 'Accampamento' });
    }));
    this.aggiungi(Interfaccia.pulsante(this, 480, y + 235, 'Salva ed esci al menu', () => {
      Partita.salva();
      Suoni.fermaMusica();
      this.scene.start('Menu');
    }));
  }
}

// Descrizione della reputazione a parole
function etichettaReputazione(r) {
  if (r >= 80) return 'Leggenda';
  if (r >= 60) return 'Amato';
  if (r >= 35) return 'Rispettato';
  if (r >= 20) return 'Temuto';
  return 'Odiato';
}

const DIALOGHI_JOHN = [
  'Mi chiamano "Little" John, ma sono il più alto della banda.',
  'Il mio bastone non uccide: stende e basta. Così la gente ci rispetta di più.',
  'Dopo la prigione ho voglia di restituire qualche colpo alle guardie dello Sceriffo.'
];

const DIALOGHI_POPOLO = [
  'Per il riscatto del re ci hanno preso un quarto di tutto quello che avevamo.',
  'Dicono che il principe Giovanni voglia diventare re al posto di suo fratello.',
  'Mio cugino ha preso una multa per aver raccolto legna nella foresta del re.',
  'Con il tuo aiuto quest\'anno riusciamo a pagare le tasse senza vendere il raccolto.',
  'Noi lavoriamo la terra del signore tre giorni a settimana, senza paga.'
];
