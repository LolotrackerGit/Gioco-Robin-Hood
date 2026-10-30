// =============================================================
// MISSIONE FINALE: RESA DEI CONTI A NOTTINGHAM
// Robin entra nel castello e affronta lo Sceriffo nella sala grande.
// Le scelte fatte prima cambiano questa missione:
//   - torneo vinto     -> il passaggio segreto a ovest è aperto
//   - John liberato    -> Little John combatte al tuo fianco
//   - reputazione alta -> il popolo distrae parte delle guardie
//   - reputazione bassa-> qualcuno ti tradisce: più guardie
// =============================================================

class MissioneFinale extends MissioneBase {
  constructor() {
    super('MissioneFinale');
    this.idMissione = 'finale';
  }

  preparaMissione() {
    const s = Partita.stato;
    this.duelloIniziato = false;

    // La reputazione decide quante guardie ci sono
    let percentuale = { facile: 0.55, normale: 0.75, difficile: 1 }[s.difficolta];
    let messaggioPopolo = null;
    if (s.reputazione >= 60) {
      percentuale *= 0.6;
      messaggioPopolo = 'Il popolo di Nottingham ha distratto molte guardie per te!';
    } else if (s.reputazione < 35) {
      percentuale = 1;
      messaggioPopolo = 'Qualcuno al villaggio ti ha tradito: lo Sceriffo ti aspetta!';
    }
    this.creaGuardieCasuali(percentuale);
    this.creaBottinoCasuale();

    // Lo Sceriffo
    const z = this.punti['Z'][0];
    this.sceriffo = new Sceriffo(this, z.x, z.y);
    this.guardie.push(this.sceriffo);

    // Il passaggio segreto (solo se hai vinto il torneo)
    if (s.passaggioSegreto) {
      (this.punti['S'] || []).forEach((p) => {
        this.livello.strato.putTileAt(TILE.SEGRETO_APERTO, p.tx, p.ty);
        this.griglia.imposta(p.tx, p.ty, '=');
      });
    }

    // Little John ti accompagna
    if (s.littleJohnLibero) {
      this.john = new LittleJohn(this, this.robin.x - 14, this.robin.y + 4, true);
      this.physics.add.collider(this.john, this.livello.strato);
    }

    this.time.delayedCall(500, () => {
      this.mostraMessaggio('Il castello di Nottingham. Lo Sceriffo è nella sala grande.', '#f2c14e');
      if (s.passaggioSegreto) this.mostraMessaggio('Il passaggio segreto è a ovest, lungo le mura: segui il sentiero!', '#8fd16a');
      if (s.littleJohnLibero) this.mostraMessaggio('Little John è con te!', '#8fd16a');
      if (messaggioPopolo) this.mostraMessaggio(messaggioPopolo, s.reputazione >= 60 ? '#8fd16a' : '#ff6b5a');
    });
  }

  aggiornaMissione(dt) {
    if (this.john) this.john.aggiorna(dt, this.robin);
  }

  // Chiamata dallo Sceriffo quando vede Robin
  iniziaDuello() {
    if (this.duelloIniziato) return;
    this.duelloIniziato = true;
    Suoni.musica('tensione');
    this.mostraMessaggio('Lo Sceriffo ti ha visto!', '#ff6b5a');
  }

  cambioFaseSceriffo(fase) {
    const z = this.sceriffo;
    if (fase === 2) {
      this.mostraMessaggio('Lo Sceriffo chiama le guardie!', '#ff6b5a');
      this.chiamaRinforzi(2, z.x, z.y);
    } else if (fase === 3) {
      this.mostraMessaggio('Arrivano i balestrieri!', '#ff6b5a');
      // due balestrieri entrano nella sala
      const ingresso = this.punti['r'].find((p) => p.y < 100) || this.punti['r'][0];
      [-30, 30].forEach((dx) => {
        const g = this.creaGuardia(ingresso.x + dx, ingresso.y, 'balestra', { pattuglia: [{ x: ingresso.x + dx, y: ingresso.y }] });
        g.scopri(this.robin);
      });
    }
  }

  sceriffoSconfitto() {
    this.bottino += 300; // il forziere dello Sceriffo
    Suoni.suona('moneta');
    this.mostraMessaggio('Lo Sceriffo è sconfitto! Le guardie gettano le armi.', '#8fd16a');
    // tutte le guardie si arrendono
    this.guardie.forEach((g) => {
      if (g !== this.sceriffo && g.stato !== 'morta' && g.stato !== 'stordita') {
        g.setVelocity(0, 0);
        g.stato = 'arresa';
        g.cono.pulisci();
        g.icona.setVisible(false);
      }
    });
    this.time.delayedCall(1500, () => this.termina(true));
  }

  testoObiettivo() {
    if (!this.duelloIniziato) return 'raggiungi la sala grande e affronta lo Sceriffo';
    return 'sconfiggi lo Sceriffo di Nottingham!';
  }

  // Freccia guida: lo Sceriffo
  obiettivoGuida() {
    return this.sceriffo.stato === 'sconfitto' ? null : this.sceriffo;
  }

  // Obiettivo speciale "Intoccabile"
  controllaSpeciale() {
    return this.robin.dannoSubito <= 2;
  }
}
