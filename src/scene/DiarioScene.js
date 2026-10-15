// =============================================================
// DIARIO DI ROBIN
// Le pagine storiche del gioco (testi in config/storia.js).
// Si sfoglia con le frecce SINISTRA/DESTRA (o A/D) o con i pulsanti.
// Si può aprire dal menu principale, dalla pausa o dall'accampamento:
// se viene aperto "sopra" un'altra scena, quando si chiude torna lì.
// =============================================================

class DiarioScene extends Phaser.Scene {
  constructor() {
    super('Diario');
  }

  init(dati) {
    this.sopra = dati && dati.sopra ? dati.sopra : null; // scena da cui è stato aperto
    this.pagina = 0;
    this.chiuso = false;
  }

  create() {
    // Il diario deve essere disegnato SOPRA tutte le altre scene
    // (altrimenti, aperto dall'accampamento, resterebbe nascosto sotto)
    this.scene.bringToTop();

    if (this.sopra) {
      this.add.rectangle(480, 270, 960, 540, 0x000000, 0.7);
    } else {
      Interfaccia.sfondoForesta(this, 0.7);
    }

    Interfaccia.pannello(this, 90, 24, 780, 456, 'pergamena');
    this.add.image(132, 66, 'libro').setScale(4);

    const inchiostro = COSTANTI.CSS.inchiostro;
    this.testoTitolo = Interfaccia.testo(this, 176, 46, '', 28, inchiostro, { senzaBordo: true });
    this.testoPeriodo = Interfaccia.testo(this, 176, 82, '', 18, '#8a3b2a', { senzaBordo: true });
    this.testoStoria = Interfaccia.testo(this, 124, 130, '', 20, inchiostro, { senzaBordo: true, larghezza: 712, interlinea: 8 });
    this.testoNumero = Interfaccia.testo(this, 480, 452, '', 16, '#8a6a3a', { senzaBordo: true, align: 'center' }).setOrigin(0.5);

    Interfaccia.pulsante(this, 220, 512, '< Indietro', () => this.sfoglia(-1), { larghezza: 170, altezza: 34, dimensione: 16 });
    Interfaccia.pulsante(this, 480, 512, 'Chiudi', () => this.chiudi(), { larghezza: 170, altezza: 34, dimensione: 16 });
    Interfaccia.pulsante(this, 740, 512, 'Avanti >', () => this.sfoglia(1), { larghezza: 170, altezza: 34, dimensione: 16 });

    const t = this.input.keyboard;
    t.on('keydown-LEFT', () => this.sfoglia(-1));
    t.on('keydown-A', () => this.sfoglia(-1));
    t.on('keydown-RIGHT', () => this.sfoglia(1));
    t.on('keydown-D', () => this.sfoglia(1));
    t.on('keydown-ESC', () => this.chiudi());

    this.mostraPagina();
  }

  sfoglia(verso) {
    const nuova = Phaser.Math.Clamp(this.pagina + verso, 0, DIARIO.length - 1);
    if (nuova === this.pagina) return;
    this.pagina = nuova;
    Suoni.suona('click');
    this.mostraPagina();
  }

  mostraPagina() {
    const p = DIARIO[this.pagina];
    this.testoTitolo.setText(p.titolo);
    this.testoPeriodo.setText(p.periodo);
    this.testoStoria.setText(p.testo);
    this.testoNumero.setText('Pagina ' + (this.pagina + 1) + ' di ' + DIARIO.length);
  }

  chiudi() {
    // evitiamo di chiudere due volte (es. clic e tasto ESC insieme)
    if (this.chiuso) return;
    this.chiuso = true;
    if (this.sopra) {
      const sotto = this.sopra;
      // prima fermiamo il diario, poi riprendiamo la scena di sotto
      this.scene.stop();
      this.scene.resume(sotto);
    } else {
      this.scene.start('Menu');
    }
  }
}
