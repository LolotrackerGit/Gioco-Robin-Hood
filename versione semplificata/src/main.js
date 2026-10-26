// =============================================================
// AVVIO DEL GIOCO (versione semplificata)
// L'ordine delle scene conta: quelle più in basso nell'elenco
// vengono disegnate sopra (per esempio l'HUD sopra il livello).
// =============================================================

const configurazione = {
  type: Phaser.AUTO,
  parent: 'gioco',
  width: COSTANTI.LARGHEZZA,
  height: COSTANTI.ALTEZZA,
  backgroundColor: '#0d1a10',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  audio: { noAudio: true }, // usiamo Suoni.js e Voce.js, avviati dopo il primo clic
  scene: [
    AvvioScene,
    TitoloScene,
    PersonaggiScene,
    CutsceneScene,
    LivelloScene,
    HUDLivelloScene,
    FineScene
  ]
};

let gioco = null;

function avviaGioco() {
  if (!gioco) gioco = new Phaser.Game(configurazione);
}

// aspettiamo il font pixel-art (massimo 2 secondi)
if (document.fonts && document.fonts.load) {
  document.fonts.load('16px Pixelify').then(avviaGioco, avviaGioco);
  setTimeout(avviaGioco, 2000);
} else {
  avviaGioco();
}
