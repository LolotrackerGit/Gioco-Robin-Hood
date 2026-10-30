// =============================================================
// IMPOSTAZIONI
// Due schede: "Generali" e "Accessibilità".
// Ogni voce è un pulsante: cliccandolo il valore cambia e viene
// salvato subito. Passandoci sopra, in basso compare (e, se attiva,
// viene letta dalla voce) la spiegazione di cosa fa.
// Si apre dal menu principale, dalla pausa e dall'accampamento.
// =============================================================

// Elenco delle voci: chiave = nome del valore in Impostazioni.valori
const VOCI_IMPOSTAZIONI = {
  generali: [
    { chiave: 'volume', nome: 'Volume', valori: [0, 0.2, 0.4, 0.6, 0.8, 1], formato: (v) => Math.round(v * 100) + '%',
      descrizione: 'Volume degli effetti sonori e della musica.' },
    { chiave: 'musica', nome: 'Musica',
      descrizione: 'Accende o spegne la musica di sottofondo.' },
    { chiave: 'miraTastiera', nome: 'Mira', valori: [false, true], formato: (v) => (v ? 'Tastiera' : 'Mouse'),
      descrizione: 'Mira con il mouse, oppure con le frecce direzionali della tastiera. Durante il gioco si cambia anche con il tasto T.' },
    { chiave: 'schermoIntero', nome: 'Schermo intero', speciale: true,
      descrizione: 'Il gioco occupa tutto lo schermo. Si esce con il tasto ESC.' }
  ],
  accessibilita: [
    { chiave: 'sintesiVocale', nome: 'Sintesi vocale',
      descrizione: 'Una voce legge ad alta voce messaggi, obiettivi, dialoghi, cutscene e pagine del Diario.' },
    { chiave: 'velocitaVoce', nome: 'Velocità voce', valori: [0.75, 1, 1.2], formato: (v) => (v < 0.9 ? 'Lenta' : v > 1.1 ? 'Veloce' : 'Normale'),
      descrizione: 'Quanto velocemente parla la voce.' },
    { chiave: 'leggiPulsanti', nome: 'Leggi i pulsanti',
      descrizione: 'La voce legge il nome di un pulsante quando ci passi sopra con il mouse.' },
    { chiave: 'frecciaGuida', nome: 'Freccia guida',
      descrizione: 'Una freccia gialla indica dove andare. Quando sei fermo è grande, quando ti muovi diventa piccola.' },
    { chiave: 'testoGrande', nome: 'Testo grande',
      descrizione: 'Messaggi, obiettivi e suggerimenti sono scritti più grandi.' },
    { chiave: 'altoContrasto', nome: 'Alto contrasto',
      descrizione: 'I coni visivi delle guardie sono molto più evidenti, con un bordo scuro.' },
    { chiave: 'riduciMovimenti', nome: 'Movimenti ridotti',
      descrizione: 'Lo schermo non trema più quando vieni colpito o cade un albero.' },
    { chiave: 'miraAssistita', nome: 'Mira assistita',
      descrizione: 'Le frecce vanno quasi sempre dove miri, anche con l\'arco teso al massimo.' },
    { chiave: 'guardieLente', nome: 'Guardie lente',
      descrizione: 'Le guardie si muovono più piano e ti notano più lentamente.' },
    { chiave: 'messaggiLunghi', nome: 'Messaggi lunghi',
      descrizione: 'I messaggi restano sullo schermo il doppio del tempo, per leggerli con calma.' }
  ]
};

class ImpostazioniScene extends Phaser.Scene {
  constructor() {
    super('Impostazioni');
  }

  init(dati) {
    this.sopra = dati && dati.sopra ? dati.sopra : null; // scena da riprendere alla chiusura
    this.scheda = (dati && dati.scheda) || 'generali';
  }

  create() {
    this.scene.bringToTop();
    if (this.sopra) this.add.rectangle(480, 270, 960, 540, 0x000000, 0.8);
    else Interfaccia.sfondoForesta(this, 0.8);
    Interfaccia.titolo(this, 480, 38, 'Impostazioni', 38);

    Interfaccia.pannello(this, 40, 424, 880, 66, 'pergamena');
    this.testoDescrizione = Interfaccia.testo(this, 480, 457, 'Passa con il mouse su una voce per sapere cosa fa. Clicca per cambiarla.', 16, COSTANTI.CSS.inchiostro,
      { senzaBordo: true, align: 'center', larghezza: 840 }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => this.chiudi());
    this.elementi = [];
    this.disegna();
  }

  disegna() {
    this.elementi.forEach((e) => (e.distruggi ? e.distruggi() : e.destroy()));
    this.elementi = [];

    // ---- schede ----
    [['generali', 'Generali'], ['accessibilita', 'Accessibilità']].forEach(([id, nome], i) => {
      const p = Interfaccia.pulsante(this, 380 + i * 200, 88, nome, () => {
        this.scheda = id;
        this.disegna();
        Interfaccia.leggi(nome);
      }, { larghezza: 190, altezza: 38, dimensione: 18 });
      if (id === this.scheda) p.evidenzia(true);
      p.evidenzia = id === this.scheda ? () => {} : p.evidenzia; // la scheda scelta resta evidenziata
      this.elementi.push(p);
    });

    // ---- voci della scheda ----
    const voci = VOCI_IMPOSTAZIONI[this.scheda];
    const dueColonne = voci.length > 5;
    voci.forEach((voce, i) => {
      const colonna = dueColonne ? Math.floor(i / 5) : 0;
      const riga = dueColonne ? i % 5 : i;
      const x = dueColonne ? 260 + colonna * 440 : 480;
      const y = 150 + riga * 52;
      const etichetta = voce.nome + ': ' + this.valoreTesto(voce);
      const p = Interfaccia.pulsante(this, x, y, etichetta, () => this.cambia(voce),
        { larghezza: dueColonne ? 420 : 460, altezza: 42, dimensione: 17, frase: etichetta + '. ' + voce.descrizione });
      p.oggetti[2].on('pointerover', () => this.testoDescrizione.setText(voce.descrizione));
      this.elementi.push(p);
    });

    if (this.scheda === 'generali') {
      const comandi = 'Comandi:  WASD muovi   Mouse mira   Clic o SPAZIO tira   SHIFT corri   E interagisci   Q o 1-4 frecce   T mira   M audio   ESC pausa';
      this.elementi.push(Interfaccia.testo(this, 480, 370, comandi, 14, COSTANTI.CSS.grigio, { align: 'center', larghezza: 860 }).setOrigin(0.5));
    }

    this.elementi.push(Interfaccia.pulsante(this, 330, 515, 'Ripristina', () => {
      Impostazioni.ripristina();
      Suoni.impostaVolume(Impostazioni.valori.volume);
      this.disegna();
      this.testoDescrizione.setText('Tutte le impostazioni sono tornate come all\'inizio.');
    }, { larghezza: 200, altezza: 36, dimensione: 17 }));
    this.elementi.push(Interfaccia.pulsante(this, 630, 515, 'Fatto', () => this.chiudi(), { larghezza: 200, altezza: 36, dimensione: 18 }));
  }

  valoreTesto(voce) {
    if (voce.chiave === 'schermoIntero') return this.scale.isFullscreen ? 'SÌ' : 'NO';
    const v = Impostazioni.valori[voce.chiave];
    if (voce.formato) return voce.formato(v);
    return v ? 'SÌ' : 'NO';
  }

  cambia(voce) {
    const v = Impostazioni.valori;
    if (voce.chiave === 'schermoIntero') {
      this.scale.toggleFullscreen();
      this.time.delayedCall(300, () => this.disegna());
      return;
    }
    if (voce.valori) {
      // passa al valore successivo dell'elenco
      const i = voce.valori.indexOf(v[voce.chiave]);
      v[voce.chiave] = voce.valori[(i + 1) % voce.valori.length];
    } else {
      v[voce.chiave] = !v[voce.chiave];
    }
    Impostazioni.salva();

    // effetti immediati
    if (voce.chiave === 'volume') Suoni.impostaVolume(v.volume);
    if (voce.chiave === 'musica' || voce.chiave === 'volume') {
      if (!v.musica || v.volume === 0) Suoni.fermaMusica();
      else Suoni.musica('foresta');
    }
    if (voce.chiave === 'sintesiVocale' && v.sintesiVocale) Voce.inizializza();

    this.disegna();
    this.testoDescrizione.setText(voce.descrizione);
    Interfaccia.leggi(voce.nome + ': ' + this.valoreTesto(voce));
  }

  chiudi() {
    if (this.sopra) {
      const sotto = this.sopra;
      this.scene.stop();
      this.scene.resume(sotto);
    } else {
      this.scene.start('Menu');
    }
  }
}
