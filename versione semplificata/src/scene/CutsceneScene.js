// =============================================================
// CUTSCENE (scena animata con sottotitoli e voce)
// Riceve un elenco di "quadri" (config/testi.js). Per ogni quadro:
//   - disegna una piccola scenografia con le caselle e i personaggi
//   - mostra il testo in basso e lo fa leggere alla voce
//   - passa al quadro dopo quando la voce ha finito (o con "Avanti")
// Alla fine avvia la scena indicata in "poi".
// =============================================================

class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('Cutscene');
  }

  init(dati) {
    this.quadri = dati.quadri;
    this.poi = dati.poi;
    this.indice = -1;
    this.finita = false;
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.palco = this.add.container(0, 0);   // qui dentro la scenografia del quadro attuale

    Interfaccia.pannello(this, 30, 404, 900, 96, 'legno');
    this.sottotitolo = Interfaccia.testo(this, 480, 452, '', 24, COSTANTI.CSS.pergamena,
      { align: 'center', larghezza: 860, interlinea: 6 }).setOrigin(0.5);

    Interfaccia.pulsante(this, 790, 522, 'Avanti', () => this.prossimo(), { larghezza: 180, altezza: 34, dimensione: 20 });
    Interfaccia.pulsante(this, 590, 522, 'Salta', () => this.termina(), { larghezza: 150, altezza: 34, dimensione: 18, frase: 'Salta la scena' });
    this.testoNumero = Interfaccia.testo(this, 60, 522, '', 16, COSTANTI.CSS.grigio).setOrigin(0, 0.5);

    this.prossimo();
  }

  prossimo() {
    if (this.finita) return;
    this.indice++;
    if (this.indice >= this.quadri.length) {
      this.termina();
      return;
    }
    const quadro = this.quadri[this.indice];
    this.testoNumero.setText((this.indice + 1) + ' / ' + this.quadri.length);
    this.disegnaQuadro(quadro.scena);
    this.sottotitolo.setText(quadro.testo);

    // quando la voce ha finito, aspettiamo un attimo e andiamo avanti da soli
    const questo = this.indice;
    Voce.parla(quadro.testo, {
      poi: () => this.time.delayedCall(1500, () => { if (this.indice === questo) this.prossimo(); })
    });
  }

  termina() {
    if (this.finita) return;
    this.finita = true;
    Voce.ferma();
    Interfaccia.vaiA(this, this.poi);
  }

  // ---------------------------------------------------------
  // SCENOGRAFIE
  // ---------------------------------------------------------
  // Riempie il palco con caselle ingrandite 4 volte (64 pixel)
  riempi(funzioneTile) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 15; c++) {
        this.palco.add(this.add.image(c * 64, r * 64 - 40, 'tileset', funzioneTile(c, r)).setOrigin(0).setScale(4));
      }
    }
  }

  personaggio(chiave, x, y, scala, girato) {
    const s = this.add.sprite(x, y, chiave, 0).setScale(scala || 6).setFlipX(!!girato);
    this.palco.add(s);
    return s;
  }

  cammina(sprite, versoX, durata) {
    sprite.anims.play(sprite.texture.key + '_cammina', true);
    this.tweens.add({ targets: sprite, x: versoX, duration: durata, onComplete: () => { sprite.anims.stop(); sprite.setFrame(0); } });
  }

  saltella(sprite, ritardo) {
    this.tweens.add({ targets: sprite, y: sprite.y - 16, duration: 250, yoyo: true, repeat: -1, delay: ritardo || 0 });
  }

  disegnaQuadro(tipo) {
    this.tweens.killAll();
    this.palco.removeAll(true);
    const erba = (c, r) => (r === 0 || (c + r) % 5 === 0 ? TILE.ERBA2 : TILE.ERBA);

    if (tipo === 'castello') {
      // il re prigioniero in una cella
      this.riempi((c, r) => (r <= 1 ? TILE.MURO : TILE.INTERNO));
      const re = this.personaggio('re', 480, 250, 7);
      const sbarre = this.add.graphics();
      sbarre.fillStyle(0x2a2a2e, 1);
      for (let x = 380; x <= 580; x += 28) sbarre.fillRect(x, 150, 10, 200);
      sbarre.fillRect(370, 230, 220, 10);
      this.palco.add(sbarre);
      this.palco.add(this.personaggio('guardia', 250, 260, 6));
      this.palco.add(this.personaggio('guardia', 710, 260, 6, true));
      this.tweens.add({ targets: re, x: 500, duration: 1200, yoyo: true, repeat: -1 });
    } else if (tipo === 'tasse') {
      // la gente povera dà le monete allo Sceriffo
      this.riempi((c, r) => (r <= 1 ? TILE.FACCIATA : TILE.LASTRICATO));
      this.personaggio('sceriffo', 700, 250, 7, true);
      [180, 300].forEach((x, i) => this.personaggio('popolano', x, 260, 6).setTint(0xbbbbbb));
      for (let i = 0; i < 3; i++) {
        const m = this.add.image(320, 240, 'moneta').setScale(4);
        this.palco.add(m);
        this.tweens.add({ targets: m, x: 660, y: 230, duration: 1200, delay: i * 500, repeat: -1 });
      }
    } else if (tipo === 'foresta') {
      // Robin e Little John nella foresta
      this.riempi((c, r) => (r === 0 || c === 0 || c === 14 || (r === 1 && c % 3 === 0) ? TILE.ALBERO : erba(c, r)));
      const f = this.add.sprite(480, 290, 'fuoco').setScale(5).play('fuoco_anim');
      this.palco.add(f);
      const robin = this.personaggio('robin', 100, 260, 7);
      const john = this.personaggio('john', 20, 255, 8);
      this.cammina(robin, 370, 2200);
      this.cammina(john, 600, 2600);
      this.time.delayedCall(2700, () => john.setFlipX(true));
    } else if (tipo === 'carro') {
      // il carro delle tasse passa sulla strada nel bosco
      this.riempi((c, r) => (r === 3 || r === 4 ? TILE.STRADA : r === 0 ? TILE.ALBERO : (r === 6 && c < 4 ? TILE.CESPUGLIO : erba(c, r))));
      const carro = this.add.image(-120, 255, 'carro').setScale(5);
      this.palco.add(carro);
      const g1 = this.personaggio('guardia', -220, 220, 6);
      const g2 = this.personaggio('guardia', -40, 300, 6);
      this.tweens.add({ targets: carro, x: 560, duration: 4000 });
      this.cammina(g1, 460, 4000);
      this.cammina(g2, 640, 4000);
      this.personaggio('robin', 140, 360, 6);
    } else if (tipo === 'villaggio') {
      // Robin consegna l'oro a Marian
      this.riempi((c, r) => (r <= 1 ? TILE.FACCIATA : TILE.LASTRICATO));
      const robin = this.personaggio('robin', 360, 260, 7);
      this.personaggio('marian', 600, 260, 7, true);
      for (let i = 0; i < 3; i++) {
        const s = this.add.image(400, 250, 'sacco').setScale(4);
        this.palco.add(s);
        this.tweens.add({ targets: s, x: 560 - i * 20, y: 300, duration: 900, delay: 400 + i * 400 });
      }
      robin.setFlipX(false);
    } else if (tipo === 'festa') {
      // festa al villaggio
      this.riempi((c, r) => (r <= 1 ? TILE.FACCIATA : TILE.LASTRICATO));
      this.saltella(this.personaggio('robin', 480, 250, 8));
      [200, 320, 640, 760].forEach((x, i) => this.saltella(this.personaggio(i % 2 ? 'marian' : 'popolano', x, 270, 6, x > 480), i * 120));
      if (this.quadri === CUTSCENE_FINALE) this.saltella(this.personaggio('john', 100, 260, 7), 300);
    } else {
      // pagina di storia: libro aperto
      this.riempi(() => TILE.INTERNO);
      const pagina = Interfaccia.pannello(this, 220, 60, 520, 300, 'pergamena');
      this.palco.add(pagina);
      this.palco.add(this.add.image(480, 160, 'libro').setScale(10));
      this.palco.add(Interfaccia.testo(this, 480, 300, 'Leggenda di Robin Hood', 26, COSTANTI.CSS.inchiostro, { senzaBordo: true, align: 'center' }).setOrigin(0.5));
    }
  }
}
