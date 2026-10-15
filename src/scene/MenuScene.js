// =============================================================
// MENU PRINCIPALE
// Da qui si inizia una partita, si continua quella salvata
// oppure si legge il Diario storico.
// =============================================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    Interfaccia.sfondoForesta(this);

    Interfaccia.titolo(this, 480, 70, 'ROBIN HOOD', 64);
    Interfaccia.testo(this, 480, 122, 'Il bandito di Sherwood', 24, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);

    // Robin e lo Sceriffo ai lati, uno di fronte all'altro
    this.add.sprite(170, 300, 'robin', 0).setScale(8);
    this.add.sprite(790, 300, 'sceriffo', 0).setScale(8).setFlipX(true);

    // Record salvato su questo computer
    const record = Salvataggio.leggiRecord();
    if (record) {
      Interfaccia.testo(this, 480, 405, 'Record: ' + record.punteggio + ' punti (' + record.data + ')', 16, COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5);
    }

    Interfaccia.testo(this, 480, 470, 'WASD muovi   Mouse mira   Clic o SPAZIO tira   E interagisci   T cambia mira   M audio', 14, COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5);
    Interfaccia.testo(this, 480, 515, 'Progetto di Storia - Svolto da Yaroslav Pogribnyi, Classe 3°F, ITTS Rimini', 16, COSTANTI.CSS.pergamena, { align: 'center' }).setOrigin(0.5);

    this.elementi = [];
    this.mostraMenuPrincipale();
  }

  // Elimina i pulsanti della "vista" precedente
  pulisci() {
    this.elementi.forEach((e) => (e.distruggi ? e.distruggi() : e.destroy()));
    this.elementi = [];
    this.input.keyboard.removeAllListeners();
  }

  mostraMenuPrincipale() {
    this.pulisci();
    const voci = [
      ['Gioca', () => this.mostraDifficolta(), false],
      ['Continua', () => this.continua(), !Partita.esisteSalvataggio()],
      ['Diario di Robin', () => this.scene.start('Diario', {}), false]
    ];
    const pulsanti = voci.map(([testo, azione, disabilitato], i) =>
      Interfaccia.pulsante(this, 480, 215 + i * 56, testo, azione, { disabilitato, larghezza: 280, altezza: 44 }));
    this.elementi.push(...pulsanti);
    Interfaccia.menuTastiera(this, pulsanti);
  }

  mostraDifficolta() {
    // IMPORTANTE: l'audio parte solo ora, dopo il clic su "Gioca" (serve per Safari)
    Suoni.avvia();
    Suoni.suona('click');
    Suoni.musica('foresta');

    this.pulisci();
    this.elementi.push(Interfaccia.pannello(this, 290, 160, 380, 270, 'legno'));
    this.elementi.push(Interfaccia.testo(this, 480, 188, 'Difficoltà', 24, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5));

    const livelli = ['facile', 'normale', 'difficile'];
    const pulsanti = livelli.map((liv, i) =>
      Interfaccia.pulsante(this, 480, 236 + i * 50, DIFFICOLTA[liv].nome, () => this.nuovaPartita(liv), { larghezza: 220, altezza: 38 }));
    pulsanti.push(Interfaccia.pulsante(this, 480, 395, 'Indietro', () => this.mostraMenuPrincipale(), { larghezza: 160, altezza: 32, dimensione: 16 }));

    // la descrizione cambia quando passi sopra a un livello
    const descr = Interfaccia.testo(this, 480, 448, '', 16, COSTANTI.CSS.grigio, { align: 'center' }).setOrigin(0.5);
    this.elementi.push(descr);
    pulsanti.slice(0, 3).forEach((p, i) => {
      p.oggetti[2].on('pointerover', () => descr.setText(DIFFICOLTA[livelli[i]].descrizione));
    });

    if (Partita.esisteSalvataggio()) {
      this.elementi.push(Interfaccia.testo(this, 480, 140, 'Attenzione: la partita salvata verrà sostituita', 14, COSTANTI.CSS.rosso, { align: 'center' }).setOrigin(0.5));
    }
    this.elementi.push(...pulsanti);
    Interfaccia.menuTastiera(this, pulsanti);
    this.input.keyboard.on('keydown-ESC', () => this.mostraMenuPrincipale());
  }

  nuovaPartita(livello) {
    Partita.nuova(livello);
    // Introduzione storica prima di arrivare all'accampamento
    this.scene.start('Caricamento', {
      destinazione: 'Accampamento',
      titolo: 'Inghilterra, 1193',
      testo:
        'Re Riccardo Cuor di Leone, di ritorno dalla Terza Crociata, è prigioniero dell\'imperatore Enrico VI. ' +
        'Per pagare il riscatto, gli uomini del principe Giovanni e lo Sceriffo di Nottingham ' +
        'impongono tasse pesantissime.\n\n' +
        'Nella foresta di Sherwood vive un fuorilegge che ha deciso di opporsi: Robin Hood.'
    });
  }

  continua() {
    Suoni.avvia();
    Suoni.musica('foresta');
    if (Partita.carica()) {
      this.scene.start('Caricamento', { destinazione: 'Accampamento', titolo: 'Sherwood' });
    }
  }
}
