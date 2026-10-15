// =============================================================
// PUNTEGGIO E OBIETTIVI EXTRA
// Calcola i punti di ogni missione, decide il finale e il
// punteggio totale da mettere in classifica.
// =============================================================

const Punteggio = {
  PUNTI_SUCCESSO: 500,
  PUNTI_OBIETTIVO: 250,
  PUNTI_PER_MONETA: 2,

  // Controlla quali obiettivi extra sono stati ottenuti in una missione.
  //   esito = { successo, allarme, uccisioni, tempo, speciale }
  // Restituisce un elenco di { id, nome, ottenuto }
  obiettiviMissione(idMissione, esito) {
    const missione = MISSIONI[idMissione];
    const elenco = [];
    if (idMissione !== 'torneo') {
      elenco.push({ id: 'maiVisto', nome: 'Mai visto', ottenuto: esito.successo && !esito.allarme });
      elenco.push({ id: 'nessunaVittima', nome: 'Nessuna vittima', ottenuto: esito.successo && esito.uccisioni === 0 });
      elenco.push({
        id: 'tempoRecord',
        nome: 'Tempo record (' + this.formattaTempo(missione.tempoRecord) + ')',
        ottenuto: esito.successo && esito.tempo <= missione.tempoRecord
      });
    }
    elenco.push({ id: missione.obiettivoSpeciale.id, nome: missione.obiettivoSpeciale.nome, ottenuto: esito.successo && !!esito.speciale });
    return elenco;
  },

  // Punti di una missione
  puntiMissione(esito, obiettivi) {
    if (!esito.successo) return 0;
    const ottenuti = obiettivi.filter((o) => o.ottenuto).length;
    const punti = this.PUNTI_SUCCESSO + esito.bottino * this.PUNTI_PER_MONETA + ottenuti * this.PUNTI_OBIETTIVO;
    return Math.round(punti * Partita.diff().moltiplicatorePunti);
  },

  // Decide quale finale ha ottenuto il giocatore
  determinaFinale(vinto) {
    const s = Partita.stato;
    if (!vinto) return 'catturato';
    if (s.reputazione >= 60) return 'eroe';
    const avido = s.statistiche.oroTenuto > s.statistiche.oroDonato * 2;
    if (s.reputazione < 35 || avido) return 'ricco';
    return 'leggenda';
  },

  // Punteggio finale della partita
  totale(tipoFinale) {
    const s = Partita.stato;
    const molt = Partita.diff().moltiplicatorePunti;
    const dettagli = {
      missioni: s.puntiMissioni,
      reputazione: Math.round(s.reputazione * 10 * molt),
      donazioni: Math.round(s.statistiche.oroDonato * molt),
      finale: Math.round(FINALI[tipoFinale].bonus * molt)
    };
    dettagli.totale = dettagli.missioni + dettagli.reputazione + dettagli.donazioni + dettagli.finale;
    return dettagli;
  },

  // 125 secondi -> "2:05"
  formattaTempo(secondi) {
    const s = Math.max(0, Math.floor(secondi));
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return min + ':' + (sec < 10 ? '0' : '') + sec;
  }
};
