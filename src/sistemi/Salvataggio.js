// =============================================================
// SALVATAGGIO
// Legge e scrive dati nel localStorage del browser.
// Usiamo SEMPRE try/catch perché in alcuni casi (es. Safari in
// navigazione privata, o memoria piena) il localStorage può
// lanciare un errore: in quel caso il gioco continua lo stesso,
// semplicemente senza salvare.
// =============================================================

const Salvataggio = {
  PREFISSO: 'robinhood_sherwood_',

  // Legge un valore. Se non c'è (o c'è un errore) restituisce "predefinito".
  leggi(chiave, predefinito) {
    try {
      const testo = window.localStorage.getItem(this.PREFISSO + chiave);
      if (testo === null) return predefinito;
      return JSON.parse(testo);
    } catch (errore) {
      console.warn('Impossibile leggere il salvataggio:', errore);
      return predefinito;
    }
  },

  // Scrive un valore (viene trasformato in testo JSON)
  scrivi(chiave, valore) {
    try {
      window.localStorage.setItem(this.PREFISSO + chiave, JSON.stringify(valore));
      return true;
    } catch (errore) {
      console.warn('Impossibile salvare:', errore);
      return false;
    }
  },

  // Cancella un valore
  cancella(chiave) {
    try {
      window.localStorage.removeItem(this.PREFISSO + chiave);
    } catch (errore) {
      console.warn('Impossibile cancellare:', errore);
    }
  },

  // ---------- RECORD ----------
  // Il punteggio migliore ottenuto su questo computer
  leggiRecord() {
    const r = this.leggi('record', null);
    return r && typeof r.punteggio === 'number' ? r : null;
  },

  // Salva il risultato se è il nuovo record. Restituisce true se lo è.
  aggiornaRecord(risultato) {
    const vecchio = this.leggiRecord();
    if (vecchio && vecchio.punteggio >= risultato.punteggio) return false;
    this.scrivi('record', risultato);
    return true;
  },

  // ---------- IMPOSTAZIONI ----------
  // Si cambiano durante il gioco: T = tipo di mira, M = audio sì/no
  leggiImpostazioni() {
    const predefinite = { miraTastiera: false, audio: true };
    const salvate = this.leggi('impostazioni', {});
    return Object.assign(predefinite, salvate);
  },

  scriviImpostazioni(impostazioni) {
    this.scrivi('impostazioni', impostazioni);
  }
};
