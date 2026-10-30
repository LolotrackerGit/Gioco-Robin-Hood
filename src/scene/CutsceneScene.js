// =============================================================
// CUTSCENE (scena animata con sottotitoli)
// Usata per l'introduzione del gioco e all'inizio e alla fine di
// ogni missione. Riceve un elenco di "quadri" (config/storia.js).
// Per ogni quadro:
//   - disegna una piccola scenografia con le caselle e i personaggi
//   - mostra il testo in basso (e lo fa leggere, se la voce è attiva)
//   - passa al quadro dopo il tempo di lettura (o con "Avanti")
// Alla fine avvia la scena "poi", passandole i dati "datiPoi".
// =============================================================

class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('Cutscene');
  }

  init(dati) {
    this.quadri = dati.quadri;
    this.poi = dati.poi;
    this.datiPoi = dati.datiPoi || {};
    this.titolo = dati.titolo || '';   // es. il nome della missione
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
    Interfaccia.pulsante(this, 590, 522, 'Salta', () => this.termina(), { larghezza: 150, altezza: 34, dimensione: 18 });
    this.testoNumero = Interfaccia.testo(this, 60, 522, '', 16, COSTANTI.CSS.grigio).setOrigin(0, 0.5);
    if (this.titolo) {
      this.add.rectangle(480, 26, 960, 52, 0x000000, 0.6).setDepth(5);
      Interfaccia.titolo(this, 480, 26, this.titolo, 28).setDepth(6);
    }

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
    this.quadro = quadro;
    this.disegnaQuadro(quadro.scena);
    this.sottotitolo.setText(quadro.testo);

    const questo = this.indice;
    const vaiAvanti = () => { if (this.indice === questo) this.prossimo(); };
    if (Impostazioni.valori.sintesiVocale) {
      // con la voce: si va avanti un attimo dopo la fine della lettura
      Voce.parla(quadro.testo, { poi: () => this.time.delayedCall(1500, vaiAvanti) });
    } else {
      // senza voce: il tempo di leggere (circa 60 ms a lettera, il doppio con "messaggi lunghi")
      this.time.delayedCall(Impostazioni.durataMessaggio(2500 + quadro.testo.length * 60), vaiAvanti);
    }
  }

  termina() {
    if (this.finita) return;
    this.finita = true;
    Voce.ferma();
    Interfaccia.vaiA(this, this.poi, this.datiPoi);
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
    } else if (tipo === 'obiettivo') {
      // cartello dell'obiettivo, con un'icona che rappresenta cosa fare
      this.riempi(erba);
      this.palco.add(this.add.rectangle(480, 184, 960, 448, 0x000000, 0.45));
      this.palco.add(Interfaccia.pannello(this, 250, 70, 460, 300, 'pergamena'));
      this.palco.add(Interfaccia.testo(this, 480, 110, 'Obiettivo', 36, '#8a3b2a', { senzaBordo: true, align: 'center' }).setOrigin(0.5));
      const icona = this.quadro.icona || 'sacco';
      const personaggi = ['john', 'sceriffo', 'robin'];
      const img = personaggi.indexOf(icona) !== -1
        ? this.add.sprite(480, 250, icona, 0).setScale(7)
        : this.add.image(480, 250, icona).setScale({ forziere: 6, bersaglio: 4, anello: 8 }[icona] || 7);
      this.palco.add(img);
      this.tweens.add({ targets: img, y: 236, duration: 700, yoyo: true, repeat: -1 });
    } else if (tipo === 'bottino') {
      // Robin e John nella foresta con i sacchi d'oro
      this.riempi((c, r) => (r === 0 || c === 0 || c === 14 ? TILE.ALBERO : erba(c, r)));
      this.personaggio('robin', 400, 250, 7);
      this.personaggio('john', 560, 245, 8, true);
      [330, 480, 630].forEach((x, i) => {
        const sacco = this.add.image(x, 330, 'sacco').setScale(5);
        this.palco.add(sacco);
        this.tweens.add({ targets: sacco, y: 318, duration: 500, yoyo: true, repeat: -1, delay: i * 150 });
      });
    } else if (tipo === 'prigione') {
      // Little John in cella, il carceriere con la chiave fuori
      this.riempi((c, r) => (r <= 1 ? TILE.MURO : TILE.INTERNO));
      this.personaggio('john', 330, 250, 8);
      const sbarre = this.add.graphics();
      sbarre.fillStyle(0x2a2a2e, 1);
      for (let x = 230; x <= 430; x += 28) sbarre.fillRect(x, 140, 10, 220);
      sbarre.fillRect(220, 230, 220, 10);
      this.palco.add(sbarre);
      const carceriere = this.personaggio('carceriere', 620, 260, 7);
      this.palco.add(this.add.image(620, 300, 'chiave').setScale(4));
      this.cammina(carceriere, 760, 2500);
    } else if (tipo === 'citta') {
      // la città di Nottingham: guardie, mercato e anelli sui tetti
      this.riempi((c, r) => (r === 0 ? TILE.TETTO_ALTO : r === 1 ? TILE.FACCIATA : TILE.LASTRICATO));
      [200, 520, 840].forEach((x) => this.palco.add(this.add.image(x, 8, 'anello').setScale(4)));
      this.palco.add(this.add.image(180, 330, 'stracci').setScale(5));
      const g1 = this.personaggio('guardia', 380, 230, 6);
      const g2 = this.personaggio('guardia', 760, 300, 6, true);
      this.tweens.add({ targets: g1, x: 560, duration: 2200, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: g2, x: 620, duration: 2600, yoyo: true, repeat: -1 });
    } else if (tipo === 'liberati') {
      // Robin e John escono dalla città
      this.riempi((c) => (c < 7 ? TILE.LASTRICATO : erba(c, 3)));
      const robin = this.personaggio('robin', 120, 250, 7);
      const john = this.personaggio('john', 20, 245, 8);
      this.cammina(robin, 640, 3200);
      this.cammina(john, 520, 3200);
    } else if (tipo === 'torneo') {
      // il campo del torneo con i bersagli e il pubblico
      this.riempi((c, r) => (r === 0 ? TILE.CASSE : (r % 2 ? TILE.ERBA : TILE.ERBA2)));
      for (let i = 0; i < 14; i++) {
        const p = this.personaggio(i % 3 ? 'popolano' : 'marian', 40 + i * 68, 16, 3);
        this.saltella(p, i * 90);
      }
      [300, 480, 660].forEach((x) => this.palco.add(this.add.image(x, 160, 'bersaglio').setScale(3)));
      this.personaggio('gisborne', 600, 300, 7);
      this.personaggio('sceriffo', 860, 280, 6, true);
    } else if (tipo === 'travestimento') {
      // Robin si traveste da mendicante
      this.riempi((c, r) => (r <= 1 ? TILE.FACCIATA : TILE.LASTRICATO));
      const robin = this.personaggio('robin', 420, 250, 8);
      const mendicante = this.personaggio('robin_mendicante', 420, 250, 8).setAlpha(0);
      this.tweens.add({ targets: robin, alpha: 0, duration: 800, delay: 1500 });
      this.tweens.add({ targets: mendicante, alpha: 1, duration: 800, delay: 1500 });
      this.personaggio('guardia', 700, 260, 6, true);
    } else if (tipo === 'vittoriaTorneo') {
      // Robin vince la freccia d'oro
      this.riempi((c, r) => (r === 0 ? TILE.CASSE : (r % 2 ? TILE.ERBA : TILE.ERBA2)));
      for (let i = 0; i < 14; i++) this.saltella(this.personaggio('popolano', 40 + i * 68, 16, 3), i * 70);
      this.personaggio('robin_mendicante', 480, 270, 8);
      const freccia = this.add.image(480, 190, 'freccia_corda').setScale(6).setRotation(-Math.PI / 2);
      this.palco.add(freccia);
      this.tweens.add({ targets: freccia, y: 170, duration: 600, yoyo: true, repeat: -1 });
      this.personaggio('sceriffo', 800, 270, 6, true).setTint(0xff9999);
    } else if (tipo === 'castelloEsterno') {
      // le mura del castello di Nottingham
      this.riempi((c, r) => (r <= 2 ? ((c === 7 || c === 8) && r > 0 ? TILE.LASTRICATO : TILE.MURO) : erba(c, r)));
      const robin = this.personaggio('robin', 140, 300, 7);
      this.cammina(robin, 430, 2600);
      if (typeof Partita !== 'undefined' && Partita.stato && Partita.stato.littleJohnLibero) {
        this.cammina(this.personaggio('john', 40, 295, 8), 340, 2600);
      }
    } else if (tipo === 'sala') {
      // lo Sceriffo nella sala grande
      this.riempi((c, r) => (r === 0 ? TILE.MURO : TILE.INTERNO));
      this.personaggio('sceriffo', 480, 220, 8);
      this.personaggio('guardia', 330, 250, 6);
      this.personaggio('guardia', 630, 250, 6, true);
      this.personaggio('balestriere', 180, 300, 6);
      this.personaggio('balestriere', 780, 300, 6, true);
    } else if (tipo === 'sceriffoSconfitto') {
      // lo Sceriffo è a terra, le guardie si arrendono
      this.riempi((c, r) => (r === 0 ? TILE.MURO : TILE.INTERNO));
      this.personaggio('sceriffo', 520, 290, 7).setRotation(Math.PI / 2).setTint(0xaaaaaa);
      this.saltella(this.personaggio('robin', 380, 250, 8));
      [200, 760].forEach((x) => this.personaggio('guardia', x, 280, 5, x > 480).setTint(0x888888));
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
