// =============================================================
// SCENA DI AVVIO
// Prepara tutte le immagini (generate da codice) e le animazioni,
// poi passa al menu principale.
// =============================================================

class AvvioScene extends Phaser.Scene {
  constructor() {
    super('Avvio');
  }

  create() {
    // 1. Disegna tutte le texture (personaggi, oggetti, caselle)
    GraficaPixel.creaTutto(this);

    // 2. Crea le animazioni di camminata per ogni personaggio.
    //    I fotogrammi sono: 0 = fermo, 1 e 2 = passi
    const personaggi = ['robin', 'robin_mendicante', 'guardia', 'balestriere', 'carceriere',
      'sceriffo', 'john', 'tuck', 'gisborne', 'popolano', 'marian'];
    personaggi.forEach((chiave) => {
      this.anims.create({
        key: chiave + '_cammina',
        frames: [
          { key: chiave, frame: '1' },
          { key: chiave, frame: '0' },
          { key: chiave, frame: '2' },
          { key: chiave, frame: '0' }
        ],
        frameRate: 8,
        repeat: -1
      });
    });

    this.anims.create({
      key: 'fuoco_anim',
      frames: [{ key: 'fuoco', frame: '0' }, { key: 'fuoco', frame: '1' }],
      frameRate: 5,
      repeat: -1
    });

    // 3. Via al menu!
    this.scene.start('Menu');
  }
}
