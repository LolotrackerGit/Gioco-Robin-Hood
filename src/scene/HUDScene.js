// =============================================================
// HUD (Heads-Up Display)
// È una scena separata che gira SOPRA la missione, senza zoom:
// così cuori, frecce e testi restano sempre nitidi e fermi.
// Legge i dati direttamente dalla scena della missione.
// =============================================================

class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  init(dati) {
    this.chiaveMissione = dati.missione;
  }

  create() {
    this.missione = this.scene.get(this.chiaveMissione);
    this.input.setDefaultCursor('crosshair');

    // ---- cuori ----
    this.cuori = [];
    const numeroCuori = Math.ceil(this.missione.robin.saluteMax / 2);
    for (let i = 0; i < numeroCuori; i++) {
      this.cuori.push(this.add.image(24 + i * 26, 24, 'cuore_pieno').setScale(3));
    }

    // ---- frecce ----
    this.slotFrecce = TIPI_FRECCIA.map((tipo, i) => {
      const x = 20 + i * 70;
      const riquadro = this.add.rectangle(x + 30, 62, 64, 30, 0x000000, 0.5).setStrokeStyle(2, 0x555555);
      const icona = this.add.image(x + 16, 62, 'freccia_' + tipo.id).setScale(2);
      const numero = Interfaccia.testo(this, x + 38, 53, '0', 15, COSTANTI.CSS.bianco);
      const tasto = Interfaccia.testo(this, x + 2, 44, String(i + 1), 10, COSTANTI.CSS.grigio);
      return { riquadro, icona, numero, tasto, id: tipo.id };
    });
    this.nomeFreccia = Interfaccia.testo(this, 20, 82, '', 13, COSTANTI.CSS.pergamena);

    // ---- bottino e tempo (in alto a destra) ----
    this.add.image(800, 24, 'moneta').setScale(3);
    this.testoBottino = Interfaccia.testo(this, 818, 13, '0', 20, COSTANTI.CSS.oro);
    this.testoTempo = Interfaccia.testo(this, 940, 44, '0:00', 16, COSTANTI.CSS.pergamena).setOrigin(1, 0);

    // ---- allarme (in alto al centro) ----
    this.sfondoAllarme = this.add.rectangle(480, 22, 160, 26, 0x000000, 0.6).setStrokeStyle(2, 0x6fbf4a);
    this.testoAllarme = Interfaccia.testo(this, 480, 22, 'CALMA', 15, COSTANTI.CSS.verdeChiaro, {}).setOrigin(0.5);
    this.barraAllarme = this.add.rectangle(400, 37, 160, 3, 0xff6b5a).setOrigin(0, 0.5);

    // ---- stato di Robin ----
    this.testoStato = Interfaccia.testo(this, 480, 50, '', 13, COSTANTI.CSS.verdeChiaro, { align: 'center' }).setOrigin(0.5, 0);

    // ---- obiettivo e suggerimento (in basso) ----
    // (con "testo grande" nelle impostazioni questi testi sono più grandi)
    const grande = Impostazioni.valori.testoGrande;
    this.sfondoObiettivo = this.add.rectangle(480, 520, 900, grande ? 34 : 26, 0x000000, 0.5);
    this.testoObiettivo = Interfaccia.testo(this, 480, 520, '', Impostazioni.dimensione(15), COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);
    this.sfondoSugg = this.add.rectangle(480, grande ? 474 : 480, 300, grande ? 36 : 28, 0x000000, 0.65).setStrokeStyle(1, 0xf2c14e);
    this.testoSugg = Interfaccia.testo(this, 480, grande ? 474 : 480, '', Impostazioni.dimensione(15), COSTANTI.CSS.oro).setOrigin(0.5);
    this.ultimoObiettivo = '';

    // ---- barra della salute del boss ----
    this.barraBoss = this.add.graphics();
    this.nomeBoss = Interfaccia.testo(this, 480, 92, '', 15, COSTANTI.CSS.rosso).setOrigin(0.5);

    // ---- messaggi ----
    this.messaggi = [];
    this.alMessaggio = (testo, colore) => this.aggiungiMessaggio(testo, colore);
    this.missione.events.on('messaggio', this.alMessaggio);
    this.events.once('shutdown', () => {
      this.missione.events.off('messaggio', this.alMessaggio);
      this.input.setDefaultCursor('default');
    });
  }

  aggiungiMessaggio(testo, colore) {
    // niente doppioni uguali di fila
    if (this.messaggi.length && this.messaggi[this.messaggi.length - 1].text === testo) return;
    const t = Interfaccia.testo(this, 480, 0, testo, Impostazioni.dimensione(17), colore, { align: 'center', larghezza: 900 }).setOrigin(0.5);
    Interfaccia.leggi(testo, true); // accessibilità: la voce legge il messaggio
    this.messaggi.push(t);
    if (this.messaggi.length > 3) this.messaggi.shift().destroy();
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: Impostazioni.durataMessaggio(2600),
      duration: 500,
      onComplete: () => {
        this.messaggi = this.messaggi.filter((m) => m !== t);
        t.destroy();
      }
    });
  }

  update() {
    const m = this.missione;
    if (!m || !m.robin) return;
    const r = m.robin;

    // cuori: ogni cuore vale 2 punti salute
    this.cuori.forEach((c, i) => {
      const valore = r.salute - i * 2;
      c.setTexture(valore >= 2 ? 'cuore_pieno' : valore === 1 ? 'cuore_mezzo' : 'cuore_vuoto');
    });

    // frecce
    this.slotFrecce.forEach((s, i) => {
      const quante = Partita.stato.frecce[s.id];
      s.numero.setText(String(quante));
      s.numero.setColor(quante > 0 ? COSTANTI.CSS.bianco : COSTANTI.CSS.rosso);
      const scelta = i === r.indiceFreccia;
      s.riquadro.setStrokeStyle(2, scelta ? 0xf2c14e : 0x555555);
      s.icona.setAlpha(quante > 0 ? 1 : 0.4);
    });
    this.nomeFreccia.setText('Freccia: ' + TIPI_FRECCIA[r.indiceFreccia].nome);

    this.testoBottino.setText(String(m.bottino));
    this.testoTempo.setText(Punteggio.formattaTempo(m.tempo));

    // allarme
    const livello = m.allarme.livello;
    const colori = [[COSTANTI.CSS.verdeChiaro, 0x6fbf4a], [COSTANTI.CSS.oro, 0xf2c14e], [COSTANTI.CSS.rosso, 0xff6b5a]];
    this.testoAllarme.setText(m.allarme.nome()).setColor(colori[livello][0]);
    this.sfondoAllarme.setStrokeStyle(2, colori[livello][1]);
    if (livello === 2) {
      const rimasto = 1 - m.allarme.tempoSenzaVista / m.allarme.DURATA;
      this.barraAllarme.setVisible(true).width = 160 * Phaser.Math.Clamp(rimasto, 0, 1);
      this.sfondoAllarme.setFillStyle(Math.floor(m.tempo * 3) % 2 ? 0x400000 : 0x000000, 0.7);
    } else {
      this.barraAllarme.setVisible(false);
      this.sfondoAllarme.setFillStyle(0x000000, 0.6);
    }

    // stato di Robin
    const stati = [];
    if (r.nascosto) stati.push('NASCOSTO nel cespuglio');
    if (r.travestito) stati.push('TRAVESTITO da mendicante');
    if (r.suTetto) stati.push('SUI TETTI');
    if (r.staCorrendo) stati.push('CORRI (fai rumore!)');
    this.testoStato.setText(stati.join('   '));

    // obiettivo e suggerimento
    const obiettivo = 'Obiettivo: ' + m.testoObiettivo();
    this.testoObiettivo.setText(obiettivo);
    // la voce legge l'obiettivo ogni volta che cambia
    if (obiettivo !== this.ultimoObiettivo) {
      this.ultimoObiettivo = obiettivo;
      Interfaccia.leggi(obiettivo, true);
    }
    const sugg = m.interazioneAttuale ? '[E] ' + m.interazioneAttuale.testo : (r.azione ? r.azione.testo + '...' : '');
    this.testoSugg.setText(sugg);
    this.sfondoSugg.setVisible(sugg !== '');
    this.sfondoSugg.width = this.testoSugg.width + 24;

    // messaggi impilati dall'alto
    this.messaggi.forEach((t, i) => t.setY(125 + i * Impostazioni.dimensione(24)));

    // barra del boss
    this.barraBoss.clear();
    const boss = m.sceriffo;
    if (boss && boss.stato !== 'attesa') {
      this.nomeBoss.setText('Sceriffo di Nottingham - fase ' + boss.fase);
      this.barraBoss.fillStyle(0x000000, 0.7);
      this.barraBoss.fillRect(330, 104, 300, 10);
      this.barraBoss.fillStyle(0xc0392b, 1);
      this.barraBoss.fillRect(332, 106, 296 * (boss.salute / boss.saluteMax), 6);
    } else {
      this.nomeBoss.setText('');
    }
  }
}
