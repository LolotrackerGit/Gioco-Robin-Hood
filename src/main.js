// =============================================================
// AVVIO DEL GIOCO
// Qui creiamo il "gioco" Phaser con le impostazioni principali
// e l'elenco di tutte le scene (schermate).
// La prima scena dell'elenco (AvvioScene) parte da sola.
// =============================================================

const configurazione = {
  type: Phaser.AUTO,              // WebGL se disponibile, altrimenti Canvas
  parent: 'gioco',                // il <div id="gioco"> di index.html
  width: COSTANTI.LARGHEZZA,
  height: COSTANTI.ALTEZZA,
  backgroundColor: '#0d1a10',
  pixelArt: true,                 // niente sfocature: pixel nitidi
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,       // si adatta alla finestra mantenendo le proporzioni
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',            // fisica semplice: rettangoli e cerchi
    arcade: { debug: false }
  },
  // Disattiviamo l'audio interno di Phaser: usiamo il nostro (Suoni.js),
  // che parte solo dopo il clic su "Gioca" (necessario per Safari).
  audio: { noAudio: true },
  scene: [
    AvvioScene,
    MenuScene,
    DiarioScene,
    ImpostazioniScene,
    CaricamentoScene,
    CutsceneScene,
    AccampamentoScene,
    MissioneConvoglio,
    MissionePrigione,
    MissioneTorneo,
    MissioneFinale,
    HUDScene,
    PausaScene,
    RiepilogoScene,
    FinaleScene
  ]
};

let gioco = null;

function avviaGioco() {
  if (!gioco) gioco = new Phaser.Game(configurazione);
}

// Prima di creare il gioco aspettiamo il font pixel-art (css/stile.css),
// altrimenti i primi testi verrebbero scritti con il font di sistema.
// Se il font non si carica entro 2 secondi, partiamo lo stesso.
if (document.fonts && document.fonts.load) {
  document.fonts.load('16px Pixelify').then(avviaGioco, avviaGioco);
  setTimeout(avviaGioco, 2000);
} else {
  avviaGioco();
}
