// =============================================================
// ALLARME
// Gestisce il livello di allerta di tutta la missione:
//   0 = CALMA    le guardie pattugliano tranquille
//   1 = ALLERTA  l'allarme è finito, ma le guardie sono più attente
//   2 = ALLARME  campana! Le guardie cercano Robin, arrivano rinforzi
// =============================================================

class Allarme {
  constructor(scene) {
    this.scene = scene;
    this.livello = 0;
    this.tempoSenzaVista = 0; // secondi da quando nessuna guardia vede Robin
    this.scattato = false;    // è mai scattato? (serve per l'obiettivo "Mai visto")
    this.ondateRinforzi = 0;
    this.DURATA = 18;         // secondi senza vedere Robin prima che l'allarme finisca
  }

  // Una guardia ha visto Robin: suona la campana!
  attiva(x, y) {
    this.tempoSenzaVista = 0;
    if (this.livello === 2) return;

    this.livello = 2;
    this.scattato = true;
    Suoni.suona('allarme');
    Suoni.musica('tensione');
    this.scene.mostraMessaggio('Allarme! Le guardie ti cercano.', '#ff6b5a');

    // Le guardie vicine accorrono verso il punto segnalato
    this.scene.guardie.forEach((g) => {
      if (Phaser.Math.Distance.Between(g.x, g.y, x, y) < 340) g.accorri(x, y);
    });

    // Al massimo due ondate di rinforzi per missione
    if (this.ondateRinforzi < 2) {
      this.ondateRinforzi++;
      this.scene.chiamaRinforzi(Partita.diff().rinforzi, x, y);
    }
  }

  // Chiamata ogni volta che una guardia che insegue vede ancora Robin
  segnalaVista() {
    this.tempoSenzaVista = 0;
  }

  aggiorna(dt) {
    if (this.livello !== 2) return;
    this.tempoSenzaVista += dt;
    if (this.tempoSenzaVista > this.DURATA) {
      this.livello = 1;
      Suoni.musica('foresta');
      this.scene.mostraMessaggio('Le guardie si calmano, ma restano più attente.', '#f2c14e');
    }
  }

  // In allerta e in allarme le guardie notano Robin più in fretta
  moltiplicatore() {
    return [1, 1.25, 1.5][this.livello];
  }

  nome() {
    return ['CALMA', 'ALLERTA', 'ALLARME'][this.livello];
  }
}
