// =============================================================
// RIEPILOGO DELLA MISSIONE
// Mostra com'è andata: bottino, tempo, obiettivi extra e punti.
// Qui il risultato viene registrato nello stato della partita.
// =============================================================

class RiepilogoScene extends Phaser.Scene {
  constructor() {
    super('Riepilogo');
  }

  init(dati) {
    this.idMissione = dati.idMissione;
    this.esito = dati.esito;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    Interfaccia.sfondoForesta(this, 0.8);

    const e = this.esito;
    const missione = MISSIONI[this.idMissione];

    // Calcolo obiettivi e punti, poi registriamo tutto nella partita
    const obiettivi = Punteggio.obiettiviMissione(this.idMissione, e);
    const punti = Punteggio.puntiMissione(e, obiettivi);
    Partita.registraMissione(this.idMissione, {
      successo: e.successo,
      catturato: !!e.catturato,
      bottino: e.bottino,
      uccisioni: e.uccisioni,
      storditi: e.storditi,
      allarme: e.allarme,
      tempo: e.tempo,
      obiettivi: obiettivi.filter((o) => o.ottenuto).map((o) => o.id),
      punti
    });

    let titoloSconfitta = 'Catturato';
    if (this.idMissione === 'torneo') titoloSconfitta = 'Torneo perso';
    else if (e.motivo) titoloSconfitta = 'Missione fallita';
    Interfaccia.titolo(this, 480, 50, e.successo ? 'Missione completata' : titoloSconfitta, 40)
      .setColor(e.successo ? COSTANTI.CSS.verdeChiaro : COSTANTI.CSS.rosso);
    Interfaccia.testo(this, 480, 92, missione.titolo, 20, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);

    Interfaccia.pannello(this, 140, 120, 680, 330, 'legno');

    // Colonna sinistra: statistiche
    const righe = [
      ['Tempo', Punteggio.formattaTempo(e.tempo)],
      ['Bottino', e.successo ? e.bottino + ' monete' : 'perso'],
      ['Guardie uccise', String(e.uccisioni)],
      ['Guardie stordite', String(e.storditi)],
      ['Allarme', e.allarme ? 'scattato' : 'mai scattato']
    ];
    if (this.idMissione === 'torneo') righe.splice(2, 3);
    righe.forEach(([nome, valore], i) => {
      Interfaccia.testo(this, 170, 140 + i * 30, nome + ':', 17, COSTANTI.CSS.grigio);
      Interfaccia.testo(this, 350, 140 + i * 30, valore, 17, COSTANTI.CSS.bianco);
    });

    // Colonna destra: obiettivi extra
    Interfaccia.testo(this, 500, 140, 'Obiettivi extra', 18, COSTANTI.CSS.oro, {});
    obiettivi.forEach((o, i) => {
      const simbolo = o.ottenuto ? '[x] ' : '[ ] ';
      Interfaccia.testo(this, 500, 172 + i * 28, simbolo + o.nome, 16, o.ottenuto ? COSTANTI.CSS.verdeChiaro : '#7a7a7a');
    });

    // Messaggi finali
    let nota = '';
    if (e.successo) {
      nota = 'Punti guadagnati: ' + punti;
      if (this.idMissione === 'prigione') nota += '\nLittle John è libero e ti aiuterà nel finale.';
      if (this.idMissione === 'torneo') nota += '\nHai scoperto il passaggio segreto del castello.';
      if (e.uccisioni > 0) nota += '\nReputazione persa per le vittime: -' + e.uccisioni;
    } else if (e.motivo) {
      nota = e.motivo + '\nNon hai perso oro: puoi riprovare quando vuoi.';
    } else if (this.idMissione === 'torneo') {
      nota = 'Ha vinto Guy di Gisborne. Puoi riprovare quando vuoi.';
    } else {
      nota = 'Lo Sceriffo ti ha preso un terzo dell\'oro.\nI tuoi compagni ti hanno fatto scappare: puoi riprovare.';
    }
    Interfaccia.testo(this, 480, 380, nota, 16, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);

    const etichetta = this.idMissione === 'finale' ? 'Continua' : 'Torna all\'accampamento';
    const pulsante = Interfaccia.pulsante(this, 480, 490, etichetta, () => this.continua(), { larghezza: 320 });
    Interfaccia.menuTastiera(this, [pulsante]);
  }

  continua() {
    if (this.idMissione === 'finale') {
      Interfaccia.vaiA(this, 'Finale', { vinto: this.esito.successo });
    } else {
      Interfaccia.vaiA(this, 'Caricamento', { destinazione: 'Accampamento', titolo: 'Ritorno a Sherwood' });
    }
  }
}
