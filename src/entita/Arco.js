// =============================================================
// ARCO CON CARICA
// Più a lungo si tiene premuto, più la freccia è veloce, arriva
// lontano e fa danno... ma la mira diventa MENO precisa
// (il cono di dispersione si allarga). Se si tiene l'arco teso
// troppo a lungo, il braccio inizia anche a tremare.
// Il cono disegnato davanti a Robin mostra dove può finire la freccia.
// =============================================================

class Arco {
  constructor(scene, giocatore) {
    this.scene = scene;
    this.giocatore = giocatore;
    this.carica = 0;          // da 0 a 1
    this.tempoTeso = 0;       // secondi con l'arco teso
    this.inCarica = false;
    this.angolo = 0;

    this.sprite = scene.add.image(giocatore.x, giocatore.y, 'arco').setOrigin(0.1, 0.5).setDepth(901);
    this.grafica = scene.add.graphics().setDepth(899);
  }

  // Valori che dipendono dalla carica
  velocita() { return 190 + 310 * this.carica; }
  gittata() { return 80 + 240 * this.carica; }
  danno() { return this.carica >= 0.7 ? 2 : 1; }

  // Metà dell'ampiezza del cono di dispersione (in radianti)
  dispersione() {
    let d = 0.02 + 0.1 * this.carica * this.carica;
    if (this.tempoTeso > COSTANTI.TEMPO_TREMORE) {
      d += Math.min(0.25, (this.tempoTeso - COSTANTI.TEMPO_TREMORE) * 0.12);
    }
    if (this.giocatore.inMovimento) d += 0.04;
    // accessibilità: con la mira assistita la freccia va quasi dritta
    if (Impostazioni.valori.miraAssistita) d *= 0.3;
    return d;
  }

  tipoAttuale() {
    return TIPI_FRECCIA[this.giocatore.indiceFreccia].id;
  }

  aggiorna(dt, angolo, premuto) {
    this.angolo = angolo;
    const g = this.giocatore;

    // L'arco sta davanti a Robin, ruotato verso la mira
    this.sprite.setPosition(g.x + Math.cos(angolo) * 4, g.y + 1 + Math.sin(angolo) * 4);
    this.sprite.setRotation(angolo);
    this.sprite.setVisible(!g.travestito);
    this.sprite.setDepth(g.depth + (Math.sin(angolo) > 0 ? 1 : -1));

    if (premuto) {
      if (!this.inCarica) this.iniziaCarica();
      if (this.inCarica) {
        this.carica = Math.min(1, this.carica + dt / COSTANTI.TEMPO_CARICA);
        this.tempoTeso += dt;
      }
    } else if (this.inCarica) {
      this.scocca();
    }
    this.disegna();
  }

  iniziaCarica() {
    const tipo = this.tipoAttuale();
    if (Partita.stato.frecce[tipo] <= 0) {
      if (!this.avvisato) {
        this.scene.mostraMessaggio('Niente frecce di tipo "' + TIPI_FRECCIA[this.giocatore.indiceFreccia].nome + '"!', '#ff6b5a');
        this.avvisato = true;
      }
      return;
    }
    // Tendere l'arco fa cadere il travestimento
    if (this.giocatore.travestito) this.giocatore.togliTravestimento();
    this.avvisato = false;
    this.inCarica = true;
    this.carica = 0.1;
    this.tempoTeso = 0;
  }

  scocca() {
    const tipo = this.tipoAttuale();
    const g = this.giocatore;
    if (Partita.stato.frecce[tipo] <= 0) {
      this.annulla();
      return;
    }
    const disp = this.dispersione();
    const angoloFinale = this.angolo + Phaser.Math.FloatBetween(-disp, disp);
    const freccia = new Freccia(
      this.scene,
      g.x + Math.cos(this.angolo) * 6,
      g.y + 1 + Math.sin(this.angolo) * 6,
      angoloFinale,
      this.velocita(),
      this.gittata(),
      tipo,
      this.danno(),
      true
    );
    this.scene.frecce.push(freccia);
    Partita.stato.frecce[tipo] -= 1;
    Suoni.suona('tiro');
    this.inCarica = false;
    this.carica = 0;
    this.tempoTeso = 0;
  }

  annulla() {
    this.inCarica = false;
    this.carica = 0;
    this.grafica.clear();
  }

  // Disegna il cono di mira e la barra di carica
  disegna() {
    const gr = this.grafica;
    gr.clear();
    const g = this.giocatore;
    if (g.travestito) return;

    if (!this.inCarica) {
      // linea di mira sottile quando l'arco è a riposo
      gr.lineStyle(1, 0xffffff, 0.25);
      gr.lineBetween(g.x, g.y, g.x + Math.cos(this.angolo) * 26, g.y + Math.sin(this.angolo) * 26);
      return;
    }

    const lung = this.gittata();
    const disp = this.dispersione();
    const tremore = this.tempoTeso > COSTANTI.TEMPO_TREMORE;
    const colore = tremore ? 0xff6b5a : 0xf2c14e;

    // cono di dispersione
    gr.fillStyle(colore, 0.12);
    gr.fillTriangle(
      g.x, g.y,
      g.x + Math.cos(this.angolo - disp) * lung, g.y + Math.sin(this.angolo - disp) * lung,
      g.x + Math.cos(this.angolo + disp) * lung, g.y + Math.sin(this.angolo + disp) * lung
    );
    gr.lineStyle(1, colore, 0.6);
    gr.lineBetween(g.x, g.y, g.x + Math.cos(this.angolo - disp) * lung, g.y + Math.sin(this.angolo - disp) * lung);
    gr.lineBetween(g.x, g.y, g.x + Math.cos(this.angolo + disp) * lung, g.y + Math.sin(this.angolo + disp) * lung);

    // barra di carica sotto Robin
    gr.fillStyle(0x000000, 0.7);
    gr.fillRect(g.x - 9, g.y + 10, 18, 3);
    gr.fillStyle(this.carica >= 0.7 ? 0xff6b5a : 0xf2c14e, 1);
    gr.fillRect(g.x - 9, g.y + 10, 18 * this.carica, 3);
  }

  distruggi() {
    this.sprite.destroy();
    this.grafica.destroy();
  }
}
