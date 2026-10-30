// =============================================================
// SINTESI VOCALE (TTS = Text To Speech)
// Usa la Web Speech API del browser (window.speechSynthesis),
// presente sia in Safari che in Chrome, senza file esterni.
//
// Uso:  Voce.parla('Ciao!')                -> legge la frase
//       Voce.parla('Ciao!', { poi: fn })   -> chiama fn quando ha finito
//       Voce.ripeti()                      -> rilegge l'ultima frase
//
// Si attiva da Impostazioni > Accessibilità > Sintesi vocale.
// Nota per Safari: la voce funziona solo dopo un clic dell'utente
// (per questo viene preparata quando si preme "Gioca").
// =============================================================

const Voce = {
  disponibile: 'speechSynthesis' in window,
  voceItaliana: null,
  ultimaFrase: '',
  idParlato: 0,   // numero che cambia a ogni nuova frase (serve per ignorare le frasi vecchie)

  inizializza() {
    if (!this.disponibile || this.inizializzata) return;
    this.inizializzata = true;
    const scegli = () => {
      const voci = window.speechSynthesis.getVoices();
      this.voceItaliana =
        voci.find((v) => v.lang === 'it-IT' && v.localService) ||
        voci.find((v) => v.lang === 'it-IT') ||
        voci.find((v) => v.lang && v.lang.indexOf('it') === 0) ||
        null;
    };
    scegli();
    // in Chrome l'elenco delle voci arriva un po' dopo
    window.speechSynthesis.onvoiceschanged = scegli;
  },

  attiva() {
    return this.disponibile && Impostazioni.valori.sintesiVocale;
  },

  // Tempo stimato per leggere una frase (serve se la voce è spenta
  // o se il browser non avvisa quando ha finito di parlare)
  durataStimata(testo) {
    const velocita = Impostazioni.valori.velocitaVoce || 1;
    return (900 + testo.length * 65) / velocita;
  },

  // Legge una frase. opzioni:
  //   poi:        funzione da chiamare a fine lettura
  //   nonInterrompere: true per mettere la frase in coda invece di interrompere quella in corso
  parla(testo, opzioni) {
    opzioni = opzioni || {};
    if (!testo) return;
    this.ultimaFrase = testo;
    const id = ++this.idParlato;
    let finito = false;
    const fine = () => {
      if (finito) return;
      finito = true;
      if (opzioni.poi && id === this.idParlato) opzioni.poi();
    };

    if (!this.attiva()) {
      // senza voce aspettiamo lo stesso il tempo di lettura
      setTimeout(fine, this.durataStimata(testo));
      return;
    }

    const sintesi = window.speechSynthesis;
    if (!opzioni.nonInterrompere) sintesi.cancel();

    const frase = new SpeechSynthesisUtterance(this.pulisci(testo));
    frase.lang = 'it-IT';
    if (this.voceItaliana) frase.voice = this.voceItaliana;
    frase.rate = Impostazioni.valori.velocitaVoce;
    frase.volume = 1;
    frase.onend = fine;
    frase.onerror = fine;

    // piccola pausa dopo cancel(): su Safari evita che la frase venga saltata
    setTimeout(() => sintesi.speak(frase), 60);
    // sicurezza: se il browser non chiama onend, andiamo avanti lo stesso
    setTimeout(fine, this.durataStimata(testo) + 2500);
  },

  ripeti() {
    if (this.ultimaFrase) this.parla(this.ultimaFrase);
  },

  ferma() {
    this.idParlato++;
    if (this.disponibile) window.speechSynthesis.cancel();
  },

  // Toglie dal testo i simboli che la voce leggerebbe in modo strano
  pulisci(testo) {
    return testo.replace(/[\[\]<>_*#]/g, ' ').replace(/\s+/g, ' ').trim();
  }
};
