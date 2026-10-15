// =============================================================
// STATO DELLA PARTITA
// Tutto quello che deve "ricordarsi" il gioco tra una missione e
// l'altra: oro, reputazione, frecce, missioni completate...
// È un unico oggetto globale chiamato "Partita".
// La partita viene salvata ogni volta che si torna all'accampamento,
// così si può riprendere con "Continua" dal menu.
// =============================================================

const Partita = {
  stato: null,

  // Crea una partita nuova con la difficoltà scelta
  nuova(livello) {
    const d = DIFFICOLTA[livello];
    this.stato = {
      difficolta: livello,
      oro: d.oroIniziale,     // oro che Robin tiene per sé (si spende al negozio)
      oroDaDividere: 0,       // bottino appena portato all'accampamento
      reputazione: 20,        // da 0 a 100: quanto il popolo ama Robin
      frecce: { normale: d.frecceIniziali, stordente: 2, fumogena: 1, corda: 0 },
      potenziamenti: { faretra: false, mantello: false, stivali: false, erbe: false },
      missioni: {
        convoglio: { completata: false, tentativi: 0 },
        prigione: { completata: false, tentativi: 0 },
        torneo: { completata: false, tentativi: 0 }
      },
      littleJohnLibero: false,
      passaggioSegreto: false,
      statistiche: {
        uccisioni: 0,
        storditi: 0,
        oroRaccolto: 0,
        oroDonato: 0,
        oroTenuto: 0,
        allarmi: 0,
        catture: 0,
        tempoTotale: 0
      },
      obiettiviOttenuti: [], // es. "convoglio:maiVisto"
      puntiMissioni: 0,
      ultimoMessaggio: ''
    };
    this.salva();
  },

  // ---------- SALVATAGGIO ----------
  salva() {
    if (this.stato) Salvataggio.scrivi('partita', this.stato);
  },

  carica() {
    const salvata = Salvataggio.leggi('partita', null);
    if (salvata && salvata.difficolta && DIFFICOLTA[salvata.difficolta]) {
      this.stato = salvata;
      return true;
    }
    return false;
  },

  esisteSalvataggio() {
    const salvata = Salvataggio.leggi('partita', null);
    return !!(salvata && salvata.difficolta);
  },

  cancellaSalvataggio() {
    Salvataggio.cancella('partita');
  },

  // ---------- LETTURA ----------
  // Restituisce i parametri della difficoltà attuale
  diff() {
    return DIFFICOLTA[this.stato ? this.stato.difficolta : 'normale'];
  },

  saluteMassima() {
    return this.diff().saluteRobin + (this.stato.potenziamenti.erbe ? 2 : 0);
  },

  maxFrecce(tipo) {
    let max = MAX_FRECCE[tipo];
    if (tipo === 'normale' && this.stato.potenziamenti.faretra) max += 10;
    return max;
  },

  missioniCompletate() {
    const m = this.stato.missioni;
    return [m.convoglio, m.prigione, m.torneo].filter((x) => x.completata).length;
  },

  finaleSbloccato() {
    return this.missioniCompletate() >= MISSIONI_PER_FINALE;
  },

  // ---------- MODIFICHE ----------
  aggiungiFrecce(tipo, quantita) {
    const f = this.stato.frecce;
    f[tipo] = Math.min(this.maxFrecce(tipo), f[tipo] + quantita);
  },

  cambiaReputazione(delta) {
    this.stato.reputazione = Phaser.Math.Clamp(this.stato.reputazione + delta, 0, 100);
  },

  // Il giocatore decide quanto oro dare ai villaggi.
  // Ogni 8 monete donate = +1 reputazione.
  dividiBottino(aiVillaggi) {
    const s = this.stato;
    const totale = s.oroDaDividere;
    aiVillaggi = Phaser.Math.Clamp(Math.round(aiVillaggi), 0, totale);
    const tenuto = totale - aiVillaggi;
    s.oro += tenuto;
    s.statistiche.oroDonato += aiVillaggi;
    s.statistiche.oroTenuto += tenuto;
    const guadagnoReputazione = Math.round(aiVillaggi / 8);
    this.cambiaReputazione(guadagnoReputazione);
    s.oroDaDividere = 0;
    this.salva();
    return guadagnoReputazione;
  },

  // Registra il risultato di una missione (chiamata dalla scena di riepilogo)
  //   esito = { successo, catturato, bottino, uccisioni, storditi, allarme, tempo, obiettivi: [id...], punti }
  registraMissione(idMissione, esito) {
    const s = this.stato;
    s.statistiche.tempoTotale += esito.tempo;
    s.statistiche.uccisioni += esito.uccisioni;
    s.statistiche.storditi += esito.storditi;
    if (esito.allarme) s.statistiche.allarmi += 1;

    // Ogni guardia uccisa fa perdere un po' di reputazione:
    // anche i soldati dello Sceriffo sono figli del popolo.
    this.cambiaReputazione(-esito.uccisioni);

    if (s.missioni[idMissione]) s.missioni[idMissione].tentativi += 1;

    if (esito.successo) {
      if (s.missioni[idMissione] && !s.missioni[idMissione].completata) {
        s.missioni[idMissione].completata = true;
        this.cambiaReputazione(MISSIONI[idMissione].reputazione);
      }
      s.oroDaDividere += esito.bottino;
      s.statistiche.oroRaccolto += esito.bottino;
      esito.obiettivi.forEach((ob) => {
        const chiave = idMissione + ':' + ob;
        if (s.obiettiviOttenuti.indexOf(chiave) === -1) s.obiettiviOttenuti.push(chiave);
      });
      s.puntiMissioni += esito.punti;
    } else if (esito.catturato) {
      // Catturato: lo Sceriffo confisca un terzo dell'oro
      // (fallire in altro modo, o perdere il torneo, non costa nulla)
      s.statistiche.catture += 1;
      s.oro = Math.floor(s.oro * 0.66);
    }
    this.salva();
  }
};
