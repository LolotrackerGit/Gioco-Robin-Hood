// =============================================================
// GRIGLIA DELLA MAPPA
// Tiene in memoria il carattere di ogni casella e risponde a
// domande come:
//   - "questa casella è un muro?"
//   - "da qui a lì si vede senza ostacoli?"
//   - "qual è la strada più breve da A a B?" (ricerca in ampiezza, BFS)
// Le guardie la usano per muoversi e per vedere.
// =============================================================

class Griglia {
  constructor(righe) {
    this.altezza = righe.length;
    this.larghezza = righe[0].length;
    // trasformiamo ogni riga di testo in un array di caratteri
    this.celle = righe.map((riga) => riga.split(''));
  }

  // Carattere della casella (tx, ty). Fuori dalla mappa = muro.
  carattere(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.larghezza || ty >= this.altezza) return '#';
    return this.celle[ty][tx];
  }

  // Stessa cosa, ma partendo da coordinate in pixel
  carattereA(px, py) {
    return this.carattere(Math.floor(px / COSTANTI.TILE), Math.floor(py / COSTANTI.TILE));
  }

  imposta(tx, ty, carattere) {
    if (tx >= 0 && ty >= 0 && tx < this.larghezza && ty < this.altezza) this.celle[ty][tx] = carattere;
  }

  eSolido(tx, ty) {
    return Griglia.SOLIDI.indexOf(this.carattere(tx, ty)) !== -1;
  }

  bloccaVista(tx, ty) {
    return Griglia.BLOCCA_VISTA.indexOf(this.carattere(tx, ty)) !== -1;
  }

  eTetto(tx, ty) {
    return Griglia.TETTI.indexOf(this.carattere(tx, ty)) !== -1;
  }

  // Centro di una casella, in pixel
  centro(tx, ty) {
    return { x: tx * COSTANTI.TILE + COSTANTI.TILE / 2, y: ty * COSTANTI.TILE + COSTANTI.TILE / 2 };
  }

  // Controlla se tra due punti (in pixel) non ci sono ostacoli.
  // Avanziamo a piccoli passi lungo la linea e controlliamo ogni casella.
  // tipo = 'vista' (muri che bloccano la vista) oppure 'passo' (caselle solide)
  lineaLibera(x1, y1, x2, y2, tipo) {
    const distanza = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const passi = Math.ceil(distanza / 4);
    for (let i = 1; i < passi; i++) {
      const x = x1 + ((x2 - x1) * i) / passi;
      const y = y1 + ((y2 - y1) * i) / passi;
      const tx = Math.floor(x / COSTANTI.TILE);
      const ty = Math.floor(y / COSTANTI.TILE);
      const bloccato = tipo === 'passo' ? this.eSolido(tx, ty) : this.bloccaVista(tx, ty);
      if (bloccato) return false;
    }
    return true;
  }

  // Lancia un "raggio" dal punto (x, y) nella direzione "angolo" e
  // restituisce quanto lontano arriva prima di sbattere su un muro.
  lunghezzaRaggio(x, y, angolo, massimo) {
    const cos = Math.cos(angolo);
    const sin = Math.sin(angolo);
    for (let d = 4; d <= massimo; d += 4) {
      if (this.bloccaVista(Math.floor((x + cos * d) / COSTANTI.TILE), Math.floor((y + sin * d) / COSTANTI.TILE))) {
        return d;
      }
    }
    return massimo;
  }

  // Ricerca del percorso più breve (BFS: ricerca in ampiezza).
  // Partiamo dalla casella iniziale e "allarghiamo" a cerchi
  // finché non troviamo quella di arrivo. Restituisce un elenco
  // di punti (in pixel) da seguire, oppure null se non c'è strada.
  percorso(daX, daY, aX, aY) {
    const T = COSTANTI.TILE;
    const inizio = { x: Math.floor(daX / T), y: Math.floor(daY / T) };
    const fine = { x: Math.floor(aX / T), y: Math.floor(aY / T) };
    if (this.eSolido(fine.x, fine.y)) return null;

    const chiave = (x, y) => y * this.larghezza + x;
    const provenienza = new Map();
    provenienza.set(chiave(inizio.x, inizio.y), null);
    const coda = [inizio];
    const direzioni = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let trovato = false;

    while (coda.length > 0) {
      const attuale = coda.shift();
      if (attuale.x === fine.x && attuale.y === fine.y) {
        trovato = true;
        break;
      }
      for (const [dx, dy] of direzioni) {
        const nx = attuale.x + dx;
        const ny = attuale.y + dy;
        if (this.eSolido(nx, ny)) continue;
        // in diagonale non si "tagliano" gli angoli dei muri
        if (dx !== 0 && dy !== 0 && (this.eSolido(attuale.x + dx, attuale.y) || this.eSolido(attuale.x, attuale.y + dy))) continue;
        const k = chiave(nx, ny);
        if (provenienza.has(k)) continue;
        provenienza.set(k, attuale);
        coda.push({ x: nx, y: ny });
      }
    }
    if (!trovato) return null;

    // Ricostruiamo la strada all'indietro, dall'arrivo alla partenza
    const strada = [];
    let nodo = fine;
    while (nodo) {
      strada.unshift(this.centro(nodo.x, nodo.y));
      nodo = provenienza.get(chiave(nodo.x, nodo.y));
    }
    strada.shift(); // la prima casella è quella dove siamo già
    return strada;
  }

  // Cerca la casella non solida più vicina (per scendere da un tetto)
  casellaLiberaVicina(tx, ty, raggio) {
    for (let r = 1; r <= raggio; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (!this.eSolido(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
        }
      }
    }
    return null;
  }
}

// Caratteri che NON si possono attraversare camminando a terra
Griglia.SOLIDI = '#T~^ACSYxtFL';
// Caratteri che bloccano la vista (muri, alberi, edifici)
Griglia.BLOCCA_VISTA = '#T^ASxt';
// Caratteri dei tetti (ci si cammina sopra solo dopo la freccia-corda)
Griglia.TETTI = '^A';
