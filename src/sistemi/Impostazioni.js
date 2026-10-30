// =============================================================
// IMPOSTAZIONI DEL GIOCO
// Tutte le scelte del giocatore (generali e di accessibilità) stanno
// qui, in un unico oggetto salvato nel browser (localStorage).
// Il resto del gioco legge per esempio: Impostazioni.valori.frecciaGuida
// =============================================================

const Impostazioni = {
  PREDEFINITE: {
    // ---- generali ----
    volume: 0.6,            // volume di effetti e musica (da 0 a 1)
    musica: true,
    miraTastiera: false,    // false = mira con il mouse, true = frecce direzionali

    // ---- accessibilità ----
    sintesiVocale: false,   // una voce legge messaggi, obiettivi, dialoghi e cutscene
    velocitaVoce: 1,        // 0.75 lenta, 1 normale, 1.2 veloce
    leggiPulsanti: false,   // la voce legge il nome dei pulsanti quando ci passi sopra
    frecciaGuida: false,    // una freccia indica dove andare
    testoGrande: false,     // testi dell'interfaccia più grandi
    altoContrasto: false,   // coni visivi delle guardie molto più evidenti
    riduciMovimenti: false, // niente scossoni dello schermo
    miraAssistita: false,   // le frecce vanno quasi sempre dove miri
    guardieLente: false,    // guardie più lente e meno attente
    messaggiLunghi: false   // i messaggi restano sullo schermo il doppio del tempo
  },

  valori: null,

  carica() {
    const salvate = Salvataggio.leggi('impostazioni', {});
    this.valori = Object.assign({}, this.PREDEFINITE, salvate);
    // compatibilità con la versione precedente, che salvava solo "audio sì/no"
    if (salvate.audio === false && salvate.volume === undefined) this.valori.volume = 0;
  },

  salva() {
    Salvataggio.scrivi('impostazioni', this.valori);
  },

  ripristina() {
    this.valori = Object.assign({}, this.PREDEFINITE);
    this.salva();
  },

  // Scuote la telecamera solo se il giocatore non ha scelto "movimenti ridotti"
  scuoti(camera, durata, intensita) {
    if (!this.valori.riduciMovimenti) camera.shake(durata, intensita);
  },

  // Dimensione del testo dell'interfaccia (più grande con "testo grande")
  dimensione(n) {
    return this.valori.testoGrande ? Math.round(n * 1.3) : n;
  },

  // Per quanti millisecondi resta visibile un messaggio
  durataMessaggio(ms) {
    return this.valori.messaggiLunghi ? ms * 2 : ms;
  }
};

Impostazioni.carica();
