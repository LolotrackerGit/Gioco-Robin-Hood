// =============================================================
// INTERFACCIA DEL LIVELLO (sopra il gioco, senza zoom)
//   - in alto: obiettivo attuale e "Passo X di 5"
//   - pulsanti grandi: Ripeti (rilegge l'ultima frase) e Pausa
//   - in basso: cuori e sottotitolo dell'ultima frase letta
//   - riquadri: dialoghi, passo completato, pausa
// Ogni frase che compare qui viene anche letta dalla voce.
// =============================================================

class HUDLivelloScene extends Phaser.Scene {
  constructor() {
    super('HUDLivello');
  }

  init(dati) {
    this.livello = dati.livello;
  }

  create() {
    this.riquadro = [];     // oggetti del riquadro aperto (dialogo, passo, pausa)

    // ---- obiettivo ----
    Interfaccia.pannello(this, 150, 6, 660, 96, 'legno');
    this.testoPasso = Interfaccia.testo(this, 172, 16, '', 15, COSTANTI.CSS.oro);
    this.testoObiettivo = Interfaccia.testo(this, 480, 64, '', 20, COSTANTI.CSS.pergamena, { align: 'center', larghezza: 620 }).setOrigin(0.5);

    // ---- pulsanti grandi ----
    Interfaccia.pulsante(this, 72, 45, 'Pausa', () => this.apriPausa(), { larghezza: 120, altezza: 70, dimensione: 24 });
    Interfaccia.pulsante(this, 888, 45, 'Ripeti', () => Voce.ripeti(), { larghezza: 120, altezza: 70, dimensione: 24, frase: 'Ripeti la frase' });

    // ---- cuori ----
    this.cuori = [];
    for (let i = 0; i < this.livello.robin.saluteMax; i++) {
      this.cuori.push(this.add.image(30 + i * 34, 506, 'cuore_pieno').setScale(4));
    }

    // ---- monete trovate (esplorazione facoltativa) ----
    this.add.image(902, 112, 'moneta').setScale(3);
    this.testoMonete = Interfaccia.testo(this, 878, 112, '', 20, COSTANTI.CSS.oro).setOrigin(1, 0.5);

    // ---- sottotitolo ----
    this.sfondoSottotitolo = this.add.rectangle(560, 506, 760, 52, 0x000000, 0.7).setVisible(false);
    this.sottotitolo = Interfaccia.testo(this, 560, 506, '', 20, COSTANTI.CSS.bianco, { align: 'center', larghezza: 740 }).setOrigin(0.5);

    this.aggiornaObiettivo();
  }

  update() {
    const r = this.livello.robin;
    this.cuori.forEach((c, i) => c.setTexture(i < r.salute ? 'cuore_pieno' : 'cuore_vuoto'));
    this.testoMonete.setText(this.livello.moneteTrovate + ' / ' + this.livello.monete.length);
  }

  aggiornaObiettivo() {
    const passo = PASSI[this.livello.passo];
    if (!passo) {
      this.testoPasso.setText('');
      this.testoObiettivo.setText('Hai finito!');
      return;
    }
    this.testoPasso.setText('Passo ' + (this.livello.passo + 1) + ' di ' + PASSI.length);
    this.testoObiettivo.setText(passo.obiettivo);
  }

  annunciaObiettivo() {
    this.aggiornaObiettivo();
    const passo = PASSI[this.livello.passo];
    if (passo) Voce.parla(passo.obiettivo);
  }

  // Frase breve: compare come sottotitolo e viene letta
  mostra(testo) {
    this.sottotitolo.setText(testo);
    this.sfondoSottotitolo.setVisible(true);
    Voce.parla(testo);
    if (this.timerSottotitolo) this.timerSottotitolo.remove();
    this.timerSottotitolo = this.time.delayedCall(Voce.durataStimata(testo) + 2500, () => {
      this.sottotitolo.setText('');
      this.sfondoSottotitolo.setVisible(false);
    });
  }

  // ---------------------------------------------------------
  // RIQUADRI
  // ---------------------------------------------------------
  apriRiquadro(larghezza, altezza) {
    this.chiudiRiquadro();
    this.livello.inPausa = true;
    const x = 480 - larghezza / 2;
    const y = 280 - altezza / 2;
    this.riquadro.push(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55));
    this.riquadro.push(Interfaccia.pannello(this, x, y, larghezza, altezza, 'legno'));
    return { x, y };
  }

  chiudiRiquadro() {
    this.riquadro.forEach((o) => (o.distruggi ? o.distruggi() : o.destroy()));
    this.riquadro = [];
    this.livello.inPausa = false;
  }

  // Dialogo con un personaggio: le frasi vengono mostrate e lette una alla volta
  dialogo(nome, sprite, frasi, poi) {
    let indice = 0;
    const { x, y } = this.apriRiquadro(780, 250);
    this.riquadro.push(this.add.sprite(x + 90, y + 120, sprite, 0).setScale(7));
    this.riquadro.push(Interfaccia.testo(this, x + 180, y + 26, nome, 26, COSTANTI.CSS.oro));
    const testo = Interfaccia.testo(this, x + 180, y + 70, '', 22, COSTANTI.CSS.pergamena, { larghezza: 570, interlinea: 6 });
    this.riquadro.push(testo);

    const mostraFrase = () => {
      const questa = indice;
      testo.setText(frasi[indice]);
      Voce.parla(nome + ' dice: ' + frasi[indice], {
        // se il giocatore non clicca, si va avanti da soli dopo la lettura
        poi: () => this.time.delayedCall(2500, () => { if (indice === questa) avanti(); })
      });
    };
    const avanti = () => {
      indice++;
      if (indice < frasi.length) {
        mostraFrase();
      } else {
        indice = 999;
        this.chiudiRiquadro();
        poi();
      }
    };
    this.riquadro.push(Interfaccia.pulsante(this, x + 640, y + 214, 'Avanti', () => avanti(), { larghezza: 200, altezza: 52, dimensione: 24 }));
    mostraFrase();
  }

  // Riquadro di fine passo: cosa hai fatto e cosa fare adesso
  passoCompletato(fatto, prossimo, poi) {
    const { x, y } = this.apriRiquadro(720, 270);
    this.riquadro.push(Interfaccia.testo(this, 480, y + 36, 'Fatto!', 36, COSTANTI.CSS.verdeChiaro, { align: 'center' }).setOrigin(0.5));
    this.riquadro.push(Interfaccia.testo(this, 480, y + 88, fatto.fatto, 22, COSTANTI.CSS.pergamena, { align: 'center', larghezza: 660 }).setOrigin(0.5));
    let frase = 'Fatto! ' + fatto.fatto;
    if (prossimo) {
      this.riquadro.push(Interfaccia.testo(this, 480, y + 136, 'Adesso:', 20, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5));
      this.riquadro.push(Interfaccia.testo(this, 480, y + 172, prossimo.obiettivo, 22, COSTANTI.CSS.pergamena, { align: 'center', larghezza: 660 }).setOrigin(0.5));
      frase += ' Adesso: ' + prossimo.obiettivo;
    }
    const continua = () => {
      if (!this.riquadro.length) return;
      this.chiudiRiquadro();
      this.aggiornaObiettivo();
      poi();
    };
    this.riquadro.push(Interfaccia.pulsante(this, 480, y + 236, prossimo ? 'Continua' : 'Fine', continua, { larghezza: 260, altezza: 56, dimensione: 26 }));
    // la voce parte dopo il suono di completamento
    this.time.delayedCall(700, () => Voce.parla(frase));
  }

  // Cartello con una curiosità storica (si chiude da solo dopo la lettura)
  cartello(testo) {
    const { x, y } = this.apriRiquadro(700, 230);
    this.riquadro.push(Interfaccia.pannello(this, x + 16, y + 16, 668, 140, 'pergamena'));
    this.riquadro.push(this.add.image(x + 60, y + 60, 'cartello').setScale(3));
    this.riquadro.push(Interfaccia.testo(this, x + 110, y + 34, testo, 21, COSTANTI.CSS.inchiostro, { senzaBordo: true, larghezza: 550, interlinea: 6 }));
    let chiuso = false;
    const chiudi = () => {
      if (chiuso) return;
      chiuso = true;
      this.chiudiRiquadro();
      this.annunciaObiettivo();
    };
    this.riquadro.push(Interfaccia.pulsante(this, 480, y + 196, 'Chiudi', chiudi, { larghezza: 200, altezza: 50, dimensione: 22 }));
    Voce.parla('Cartello. ' + testo, { poi: () => this.time.delayedCall(4000, chiudi) });
  }

  apriPausa() {
    if (this.livello.inPausa) return;
    const { y } = this.apriRiquadro(420, 260);
    this.riquadro.push(Interfaccia.testo(this, 480, y + 40, 'Pausa', 34, COSTANTI.CSS.oro, { align: 'center' }).setOrigin(0.5));
    this.riquadro.push(Interfaccia.pulsante(this, 480, y + 110, 'Continua a giocare', () => {
      this.chiudiRiquadro();
      this.annunciaObiettivo();
    }, { larghezza: 320, altezza: 56, dimensione: 22 }));
    this.riquadro.push(Interfaccia.pulsante(this, 480, y + 190, 'Torna al menu', () => {
      Voce.ferma();
      Suoni.fermaMusica();
      this.scene.stop('Livello');
      this.scene.start('Titolo');
    }, { larghezza: 320, altezza: 56, dimensione: 22 }));
    Voce.parla('Pausa. Il gioco è fermo.');
  }
}
