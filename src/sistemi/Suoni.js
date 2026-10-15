// =============================================================
// SUONI E MUSICA
// Non usiamo file audio: i suoni vengono "sintetizzati" con la
// Web Audio API (oscillatori e rumore), come nei vecchi videogiochi.
//
// IMPORTANTE (Safari): il browser blocca l'audio finché l'utente
// non clicca. Per questo Suoni.avvia() viene chiamata SOLO quando
// si preme il pulsante "Gioca". Prima di allora ogni suono viene
// semplicemente ignorato.
// =============================================================

const Suoni = {
  ctx: null,          // il "contesto audio" del browser
  volumeGenerale: null,
  bufferRumore: null,
  musicaAttiva: null, // nome della musica in riproduzione
  timerMusica: null,
  prossimaNota: 0,
  passoMusica: 0,

  // Da chiamare dentro un clic dell'utente
  avvia() {
    if (this.ctx) {
      // già creato: su Safari a volte va "risvegliato"
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const ContestoAudio = window.AudioContext || window.webkitAudioContext;
    if (!ContestoAudio) return; // browser senza audio: pazienza
    try {
      this.ctx = new ContestoAudio();
      this.volumeGenerale = this.ctx.createGain();
      this.volumeGenerale.connect(this.ctx.destination);
      this.impostaVolume(Salvataggio.leggiImpostazioni().audio ? 0.6 : 0);
      this.creaRumore();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (errore) {
      console.warn('Audio non disponibile:', errore);
      this.ctx = null;
    }
  },

  impostaVolume(v) {
    if (this.volumeGenerale) this.volumeGenerale.gain.value = v;
  },

  // Tasto M: accende o spegne tutto l'audio (la scelta viene salvata)
  alternaAudio() {
    const imp = Salvataggio.leggiImpostazioni();
    imp.audio = !imp.audio;
    Salvataggio.scriviImpostazioni(imp);
    this.impostaVolume(imp.audio ? 0.6 : 0);
    if (!imp.audio) this.fermaMusica();
    return imp.audio;
  },

  // Prepara 1 secondo di "rumore bianco" (serve per fruscii e colpi)
  creaRumore() {
    const lunghezza = this.ctx.sampleRate;
    this.bufferRumore = this.ctx.createBuffer(1, lunghezza, this.ctx.sampleRate);
    const dati = this.bufferRumore.getChannelData(0);
    for (let i = 0; i < lunghezza; i++) dati[i] = Math.random() * 2 - 1;
  },

  // Suona una nota: frequenza (Hz), durata (s), forma d'onda, volume,
  // frequenza finale (per fare "scivolare" il suono), ritardo di partenza
  tono(freq, durata, forma, volume, freqFinale, ritardo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (ritardo || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = forma || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (freqFinale) osc.frequency.exponentialRampToValueAtTime(freqFinale, t + durata);
    gain.gain.setValueAtTime(volume || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durata);
    osc.connect(gain);
    gain.connect(this.volumeGenerale);
    osc.start(t);
    osc.stop(t + durata + 0.05);
  },

  // Suona un pezzetto di rumore filtrato (fruscio, colpo, fumo...)
  rumore(durata, volume, filtro, freqFiltro, ritardo) {
    if (!this.ctx || !this.bufferRumore) return;
    const t = this.ctx.currentTime + (ritardo || 0);
    const sorgente = this.ctx.createBufferSource();
    sorgente.buffer = this.bufferRumore;
    const f = this.ctx.createBiquadFilter();
    f.type = filtro || 'lowpass';
    f.frequency.value = freqFiltro || 1000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durata);
    sorgente.connect(f);
    f.connect(gain);
    gain.connect(this.volumeGenerale);
    sorgente.start(t);
    sorgente.stop(t + durata + 0.05);
  },

  // ---------- EFFETTI SONORI DEL GIOCO ----------
  suona(nome) {
    if (!this.ctx) return;
    switch (nome) {
      case 'click':
        this.tono(660, 0.06, 'square', 0.08);
        break;
      case 'tiro': // corda dell'arco + sibilo
        this.tono(180, 0.12, 'triangle', 0.25, 90);
        this.rumore(0.18, 0.12, 'highpass', 2500);
        break;
      case 'colpo': // freccia che colpisce una persona
        this.rumore(0.12, 0.3, 'lowpass', 600);
        this.tono(120, 0.1, 'square', 0.12, 60);
        break;
      case 'muro': // freccia che si pianta nel legno o nella pietra
        this.tono(900, 0.05, 'square', 0.08, 500);
        this.rumore(0.06, 0.12, 'bandpass', 1800);
        break;
      case 'sospetto':
        this.tono(440, 0.1, 'triangle', 0.15);
        this.tono(620, 0.15, 'triangle', 0.15, null, 0.1);
        break;
      case 'allarme': // campana
        [0, 0.35, 0.7].forEach((r) => {
          this.tono(880, 0.6, 'sine', 0.2, null, r);
          this.tono(1320, 0.4, 'sine', 0.08, null, r);
        });
        break;
      case 'moneta':
        this.tono(988, 0.07, 'square', 0.1);
        this.tono(1319, 0.15, 'square', 0.1, null, 0.07);
        break;
      case 'danno':
        this.tono(220, 0.25, 'sawtooth', 0.2, 80);
        break;
      case 'fumo':
        this.rumore(0.9, 0.2, 'lowpass', 500);
        break;
      case 'corda':
        this.tono(200, 0.4, 'triangle', 0.2, 700);
        break;
      case 'stordito':
        this.tono(500, 0.2, 'sine', 0.15, 200);
        this.tono(400, 0.2, 'sine', 0.1, 150, 0.15);
        break;
      case 'porta':
        this.rumore(0.3, 0.2, 'lowpass', 300);
        this.tono(90, 0.3, 'square', 0.08, 70);
        break;
      case 'raccogli':
        this.tono(523, 0.06, 'square', 0.1);
        this.tono(784, 0.1, 'square', 0.1, null, 0.06);
        break;
      case 'spada':
        this.rumore(0.1, 0.2, 'highpass', 3000);
        this.tono(1500, 0.08, 'square', 0.05, 800);
        break;
      case 'vittoria':
        [523, 659, 784, 1047].forEach((f, i) => this.tono(f, 0.3, 'square', 0.12, null, i * 0.12));
        break;
      case 'sconfitta':
        [392, 330, 262, 196].forEach((f, i) => this.tono(f, 0.35, 'triangle', 0.18, null, i * 0.18));
        break;
      case 'bersaglio':
        this.tono(1200, 0.08, 'square', 0.1);
        this.rumore(0.08, 0.15, 'bandpass', 1500);
        break;
      default:
        break;
    }
  },

  // ---------- MUSICA ----------
  // Una melodia semplice in modo "dorico" (tipico della musica medievale).
  // I numeri sono semitoni rispetto alla nota base; null = pausa.
  MUSICHE: {
    foresta: {
      base: 220, tempo: 0.28,
      melodia: [0, null, 3, 5, 7, null, 5, 3, 2, null, 0, 2, 3, null, null, null,
                7, null, 10, 9, 7, null, 5, 3, 5, null, 3, 2, 0, null, null, null],
      basso: [0, 0, 0, 0, -2, -2, -5, -5]
    },
    tensione: {
      base: 196, tempo: 0.18,
      melodia: [0, 1, 0, null, 3, null, 1, 0, 6, null, 5, null, 3, 1, 0, null],
      basso: [0, 0, 1, 1]
    }
  },

  musica(nome) {
    if (!this.ctx || this.musicaAttiva === nome) return;
    this.fermaMusica();
    if (!Salvataggio.leggiImpostazioni().audio) return;
    this.musicaAttiva = nome;
    this.passoMusica = 0;
    this.prossimaNota = this.ctx.currentTime + 0.1;
    // Ogni 100 ms programmiamo le note dei prossimi 0,3 secondi
    this.timerMusica = setInterval(() => this.programmaNote(), 100);
  },

  programmaNote() {
    const m = this.MUSICHE[this.musicaAttiva];
    if (!m || !this.ctx) return;
    while (this.prossimaNota < this.ctx.currentTime + 0.3) {
      const ritardo = Math.max(0, this.prossimaNota - this.ctx.currentTime);
      const nota = m.melodia[this.passoMusica % m.melodia.length];
      if (nota !== null) {
        this.tono(m.base * Math.pow(2, nota / 12), m.tempo * 0.9, 'triangle', 0.05, null, ritardo);
      }
      // basso ogni 4 passi
      if (this.passoMusica % 4 === 0) {
        const b = m.basso[(this.passoMusica / 4) % m.basso.length];
        this.tono((m.base / 2) * Math.pow(2, b / 12), m.tempo * 3.5, 'sine', 0.07, null, ritardo);
      }
      this.passoMusica++;
      this.prossimaNota += m.tempo;
    }
  },

  fermaMusica() {
    if (this.timerMusica) clearInterval(this.timerMusica);
    this.timerMusica = null;
    this.musicaAttiva = null;
  }
};
