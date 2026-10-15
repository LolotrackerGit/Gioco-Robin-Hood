// =============================================================
// MISSIONE 2: LE PRIGIONI DI NOTTINGHAM
// Little John è chiuso in una cella. Serve la chiave che porta
// il carceriere (la guardia vestita di nero).
//
// Modi per riuscirci:
//   ASTUZIA:       indossare gli stracci da mendicante al mercato;
//                  le guardie ignorano i mendicanti (ma non nelle
//                  stanze interne, né se corri o tendi l'arco)
//   STEALTH:       freccia-corda sugli anelli dorati: dai tetti della
//                  città al cammino di ronda, poi giù nel cortile sul retro
//   COMBATTIMENTO: entrare dal portone e affrontare le guardie
//
// La chiave si può rubare alle spalle (obiettivo "Mani leggere")
// oppure prendere al carceriere dopo averlo messo fuori gioco.
// =============================================================

class MissionePrigione extends MissioneBase {
  constructor() {
    super('MissionePrigione');
    this.idMissione = 'prigione';
  }

  preparaMissione() {
    this.robinHaChiave = false;
    this.johnLibero = false;

    // Will Scarlet presta le frecce con corda, se mancano
    if (Partita.stato.frecce.corda < 2) {
      Partita.stato.frecce.corda = 2;
      this.time.delayedCall(800, () => this.mostraMessaggio('Will Scarlet ti presta 2 frecce con corda (tasto 4).', '#8fd16a'));
    }

    this.creaGuardieCasuali();
    this.creaBottinoCasuale();

    // Il carceriere pattuglia il corridoio delle celle e ha la chiave
    const c = this.punti['c'][0];
    const T = COSTANTI.TILE;
    this.carceriere = this.creaGuardia(c.x, c.y, 'spada', {
      texture: 'carceriere',
      haChiave: true,
      pattuglia: [{ x: 18 * T + 8, y: c.y }, { x: 38 * T + 8, y: c.y }]
    });

    // Little John nella sua cella
    const j = this.punti['J'][0];
    this.john = new LittleJohn(this, j.x, j.y, false);
    this.physics.add.collider(this.john, this.livello.strato);
    // le porte della cella di John sono le "C" proprio sotto di lui
    this.porteCella = this.punti['C'].filter((p) => Math.abs(p.tx - j.tx) <= 1 && p.ty === j.ty + 2);

    // Stracci da mendicante al mercato
    const m = this.punti['M'][0];
    this.stracci = this.add.image(m.x, m.y, 'stracci').setDepth(40);

    this.time.delayedCall(500, () => this.mostraMessaggio('Little John è nelle celle del castello. Trova il carceriere!', '#f2c14e'));
  }

  aggiornaMissione(dt) {
    this.john.aggiorna(dt, this.robin);
  }

  interazioniMissione() {
    const azioni = [];
    // stracci da mendicante
    if (this.stracci && !this.robin.travestito) {
      azioni.push({
        x: this.stracci.x, y: this.stracci.y,
        testo: 'Indossa gli stracci da mendicante',
        azione: () => {
          this.robin.indossaTravestimento();
          Suoni.suona('raccogli');
          this.mostraMessaggio('Travestito! Non correre, non tendere l\'arco e stai lontano dalle stanze interne.', '#8fd16a');
        }
      });
    }
    // porta della cella
    if (!this.johnLibero && this.porteCella.length > 0) {
      const p = this.porteCella[0];
      azioni.push({
        x: p.x + 8, y: p.y + 10,
        testo: this.robinHaChiave ? 'Apri la cella di Little John' : 'Cella chiusa (serve la chiave)',
        azione: () => this.apriCella()
      });
    }
    return azioni;
  }

  apriCella() {
    if (!this.robinHaChiave) {
      this.mostraMessaggio('La cella è chiusa a chiave. Ce l\'ha il carceriere vestito di nero.', '#f2c14e');
      return;
    }
    this.porteCella.forEach((p) => {
      this.livello.strato.putTileAt(TILE.CELLA_APERTA, p.tx, p.ty);
      this.griglia.imposta(p.tx, p.ty, ':');
    });
    this.johnLibero = true;
    this.john.libera();
    Suoni.suona('porta');
    this.emettiRumore(this.robin.x, this.robin.y, 60, 0.3);
    this.mostraMessaggio('Little John è libero! Portalo fuori dalla città.', '#8fd16a');
  }

  puoUscire() {
    return this.johnLibero;
  }

  testoObiettivo() {
    if (!this.robinHaChiave && !this.johnLibero) return 'prendi la chiave al carceriere (vestito di nero)';
    if (!this.johnLibero) return 'apri la cella di Little John';
    return 'fuggi con John dall\'uscita a ovest della città';
  }

  // Obiettivo speciale "Mani leggere": la chiave è stata sfilata con il borseggio
  controllaSpeciale() {
    return this.speciale && this.carceriere.stato !== 'morta';
  }

  termina(successo, motivo) {
    if (successo) Partita.stato.littleJohnLibero = true;
    super.termina(successo, motivo);
  }
}
