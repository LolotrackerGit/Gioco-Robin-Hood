// =============================================================
// MISSIONE 1: IL CONVOGLIO DELLE TASSE
// Un carro con 6 sacchi d'oro attraversa la foresta scortato.
// Bisogna rubare almeno 3 sacchi e fuggire dall'uscita a sud.
//
// Modi per riuscirci:
//   STEALTH:       avvicinarsi al retro del carro e rubare (tasto E)
//   COMBATTIMENTO: mettere fuori gioco la scorta (il carro si ferma)
//   ASTUZIA:       abbattere l'albero secco con un tiro a piena carica
//                  (il carro resta bloccato e la scorta va a controllare)
//                  oppure spaventare i cavalli con una freccia fumogena
// =============================================================

class MissioneConvoglio extends MissioneBase {
  constructor() {
    super('MissioneConvoglio');
    this.idMissione = 'convoglio';
  }

  preparaMissione() {
    this.sacchiRubati = 0;
    this.alberoAbbattuto = false;
    this.carroAbbandonato = false;
    this.VALORE_SACCO = 35;

    // Il carro segue le tappe 1, 2, 3... (la 4 è la sosta nella radura)
    const tappe = [];
    for (let i = 1; i <= 7; i++) tappe.push(this.punti[String(i)][0]);
    this.carro = new Carro(this, tappe, 3);
    this.carro.fermo = 6; // parte dopo qualche secondo
    this.physics.add.collider(this.robin, this.carro);

    // La scorta: guardie che camminano intorno al carro
    const numeroScorta = { facile: 3, normale: 4, difficile: 5 }[Partita.stato.difficolta];
    const posizioni = [
      { dx: -22, dy: -14, guarda: -1.2 }, { dx: -22, dy: 14, guarda: 1.2 },
      { dx: 26, dy: -14, guarda: -0.6 }, { dx: 26, dy: 14, guarda: 0.6 },
      { dx: -38, dy: 0, guarda: Math.PI }
    ];
    this.scorta = [];
    for (let i = 0; i < numeroScorta; i++) {
      const pos = posizioni[i];
      const tipo = i === 4 ? 'balestra' : 'spada';
      const g = this.creaGuardia(this.carro.x + 4, this.carro.y, tipo, {
        scorta: { carro: this.carro, dx: pos.dx, dy: pos.dy, guarda: pos.guarda }
      });
      this.scorta.push(g);
    }

    // Guardie di pattuglia nella foresta e bottino sparso (in parte casuali)
    this.creaGuardieCasuali({ facile: 0.35, normale: 0.5, difficile: 0.7 }[Partita.stato.difficolta]);
    this.creaBottinoCasuale();

    // L'albero secco che si può abbattere
    this.alberoSecco = this.punti['Y'][0];

    this.time.delayedCall(500, () => this.mostraMessaggio('Il convoglio delle tasse arriva da ovest!', '#f2c14e'));
  }

  aggiornaMissione(dt) {
    this.carro.aggiorna(dt);

    // Se il tronco blocca la strada, il carro si ferma prima dell'albero
    if (this.alberoAbbattuto && !this.carro.bloccato && this.carro.indice === 5 &&
        this.carro.y > this.tronco.y && this.carro.y - this.tronco.y < 30) {
      this.carro.bloccato = true;
    }

    // Se tutta la scorta è a terra, il cocchiere scappa e il carro resta lì
    if (!this.carroAbbandonato) {
      const attivi = this.scorta.filter((g) => g.stato !== 'morta' && g.stato !== 'stordita');
      if (attivi.length === 0) {
        this.carroAbbandonato = true;
        this.carro.bloccato = true;
        this.mostraMessaggio('La scorta è a terra: il cocchiere scappa a gambe levate!', '#8fd16a');
      }
    }
  }

  // Con E si ruba un sacco dal retro del carro
  interazioniMissione() {
    const c = this.carro;
    if (c.sacchi <= 0 || c.arrivato) return [];
    const retro = c.retro();
    const fermo = c.fermo > 0 || c.bloccato;
    return [{
      x: retro.x,
      y: retro.y,
      testo: 'Ruba un sacco d\'oro (' + c.sacchi + ' rimasti)',
      azione: () => {
        // se il carro è in movimento bisogna stargli dietro mentre si ruba!
        this.robin.iniziaAzione('Sto rubando', fermo ? 1.0 : 1.4, () => this.sacchettoRubato(), () => {
          const r = c.retro();
          return Phaser.Math.Distance.Between(this.robin.x, this.robin.y, r.x, r.y) < 22;
        });
      }
    }];
  }

  sacchettoRubato() {
    if (this.carro.sacchi <= 0) return;
    this.carro.sacchi--;
    this.sacchiRubati++;
    this.bottino += this.VALORE_SACCO;
    Suoni.suona('moneta');
    // rubare fa un po' di rumore
    this.emettiRumore(this.robin.x, this.robin.y, 45, 0.25);
    this.mostraMessaggio('Sacco rubato! (' + this.sacchiRubati + '/6)', '#f2c14e');
  }

  // Chiamata dalla Freccia quando colpisce l'albero secco
  colpitoAlberoSecco(freccia) {
    if (this.alberoAbbattuto) return;
    if (freccia.danno < 2) {
      this.mostraMessaggio('Il tronco è robusto: serve un tiro a piena carica!', '#f2c14e');
      return;
    }
    this.alberoAbbattuto = true;
    const a = this.alberoSecco;
    this.livello.strato.putTileAt(TILE.ERBA, a.tx, a.ty);
    this.griglia.imposta(a.tx, a.ty, '.');

    // il tronco cade di traverso sulla strada (a sinistra dell'albero)
    const tx = a.tx - 1;
    this.tronco = this.add.image(tx * COSTANTI.TILE, a.y, 'tronco').setDepth(100 + a.y);
    this.physics.add.existing(this.tronco, true);
    this.physics.add.collider(this.robin, this.tronco);
    this.physics.add.collider(this.guardie, this.tronco);
    this.griglia.imposta(tx - 1, a.ty, 'L');
    this.griglia.imposta(tx, a.ty, 'L');

    Impostazioni.scuoti(this.cameras.main, 300, 0.01);
    Suoni.suona('porta');
    this.emettiRumore(this.tronco.x, this.tronco.y, 220, 0.6);

    if (this.carro.indice <= 5 && this.carro.y > this.tronco.y) {
      this.mostraMessaggio('L\'albero crolla sulla strada! Il convoglio è bloccato.', '#8fd16a');
      // la scorta va a vedere cos'è successo e lascia il carro scoperto
      this.scorta.forEach((g) => g.accorri(this.tronco.x, this.tronco.y + 10));
    } else {
      this.mostraMessaggio('L\'albero cade, ma il convoglio è già passato.', '#f2c14e');
    }
  }

  // Chiamata da MissioneBase quando nasce una nube di fumo
  fumoCreato(x, y) {
    if (Phaser.Math.Distance.Between(x, y, this.carro.x, this.carro.y) < 55) this.carro.spaventa(10);
  }

  carroArrivato() {
    if (this.sacchiRubati >= 3) {
      this.mostraMessaggio('Il convoglio è arrivato al castello. Fuggi con il bottino!', '#f2c14e');
    } else {
      this.mostraMessaggio('Il convoglio è arrivato al castello.', '#ff6b5a');
      this.termina(false, 'Il convoglio è arrivato al castello prima che tu prendessi 3 sacchi.');
    }
  }

  puoUscire() {
    return this.sacchiRubati >= 3;
  }

  testoObiettivo() {
    if (this.sacchiRubati < 3) return 'ruba almeno 3 sacchi dal carro (' + this.sacchiRubati + '/3)';
    return 'fuggi dall\'uscita a sud (sacchi: ' + this.sacchiRubati + '/6)';
  }

  // Freccia guida: prima il retro del carro, poi l'uscita
  obiettivoGuida() {
    if (this.sacchiRubati < 3 && !this.carro.arrivato) return this.carro.retro();
    return this.uscitaPiuVicina();
  }

  // Obiettivo speciale: tutti e 6 i sacchi
  controllaSpeciale() {
    return this.sacchiRubati >= 6;
  }
}
