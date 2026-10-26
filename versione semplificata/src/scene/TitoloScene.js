// =============================================================
// SCHERMATA DEL TITOLO
// 1. Prima un grande pulsante "Clicca per iniziare": il browser
//    (soprattutto Safari) permette audio e voce solo dopo un clic.
// 2. Poi il menu: GIOCA e Personaggi.
// =============================================================

class TitoloScene extends Phaser.Scene {
  constructor() {
    super('Titolo');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    Interfaccia.sfondoForesta(this);
    Interfaccia.titolo(this, 480, 70, 'ROBIN HOOD', 64);
    Interfaccia.testo(this, 480, 122, 'Versione semplificata', 26, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);

    this.add.sprite(160, 330, 'robin', 0).setScale(9);
    this.add.sprite(800, 330, 'john', 0).setScale(10).setFlipX(true);
    Interfaccia.testo(this, 480, 515, 'Progetto di Storia - Svolto da Yaroslav Pogribnyi, Classe 3°F, ITTS Rimini', 16, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);

    this.elementi = [];
    if (Suoni.ctx) this.mostraMenu();
    else this.mostraInizio();
  }

  pulisci() {
    this.elementi.forEach((e) => (e.distruggi ? e.distruggi() : e.destroy()));
    this.elementi = [];
  }

  // Primo clic: attiva suoni e voce
  mostraInizio() {
    this.pulisci();
    const p = Interfaccia.pulsante(this, 480, 320, 'Clicca per iniziare', () => {
      Suoni.avvia();
      Voce.inizializza();
      Suoni.musica('foresta');
      this.mostraMenu();
    }, { larghezza: 440, altezza: 110, dimensione: 34 });
    this.elementi.push(p);
  }

  mostraMenu() {
    this.pulisci();
    const gioca = Interfaccia.pulsante(this, 480, 280, 'GIOCA', () => this.gioca(), { larghezza: 380, altezza: 110, dimensione: 48, frase: 'Gioca' });
    const personaggi = Interfaccia.pulsante(this, 480, 410, 'Personaggi', () => this.scene.start('Personaggi'), { larghezza: 300, altezza: 70, dimensione: 26 });
    this.elementi.push(gioca, personaggi);
    Voce.parla(FRASI.benvenuto + ' Clicca su Gioca per iniziare la storia.');
  }

  gioca() {
    Voce.ferma();
    this.scene.start('Cutscene', { quadri: CUTSCENE_INIZIALE, poi: 'Livello' });
  }
}
