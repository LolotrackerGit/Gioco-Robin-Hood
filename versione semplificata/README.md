# Robin Hood - Versione semplificata (accessibile)

Versione semplificata, a un solo livello, del gioco "Robin Hood - Il bandito di Sherwood".
È pensata per uno studente con disabilità ed è **già impostata** con il profilo di accessibilità di **Alessandro D'Ambrosio**.

Svolto da **Yaroslav Pogribnyi**, classe 3°F, ITTS Rimini.

## Come avviarla

La cartella è indipendente: contiene il suo Phaser (`lib/`), il suo font (`assets/`) e tutto il codice.

- Su GitHub Pages si apre all'indirizzo del gioco principale + `/versione%20semplificata/`.
- In locale, dalla cartella principale del progetto:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000/versione%20semplificata/`.

La sintesi vocale funziona in Safari e in Chrome. Il gioco parte con un grande pulsante "Clicca per iniziare", perché i browser attivano voce e suoni solo dopo un clic.

## Come i requisiti sono stati realizzati

| Requisito | Come funziona nel gioco | Dove si trova nel codice |
|---|---|---|
| Accessibilità già impostata per Alessandro D'Ambrosio | Le impostazioni sono fisse e già pronte: non c'è un menu per cambiarle. Per modificarle si cambiano i valori nel file. | `src/config/accessibilita.js` |
| Sintesi vocale di ogni frase | Vengono lette tutte le frasi: titoli, obiettivi, dialoghi, sottotitoli, cutscene e schede. Anche i pulsanti vengono letti quando ci passi sopra. Il pulsante "Ripeti" rilegge l'ultima frase. | `src/sistemi/Voce.js` (Web Speech API) |
| Freccia verso l'obiettivo | Quando Robin è fermo compare una grande freccia gialla che pulsa e indica l'obiettivo. Quando Robin si muove la freccia si rimpicciolisce e diventa trasparente. | `src/entita/FrecciaGuida.js` |
| Arma singola | Solo l'arco, con frecce infinite. La freccia segue la guardia cliccata e non sbaglia mai. Le guardie si addormentano, non muoiono. | `src/entita/Freccia.js` |
| Segnale audio di azione completata | Un suono dedicato (quattro note che salgono) alla fine di ogni passo. | `Suoni.suona('completato')` in `src/sistemi/Suoni.js` |
| Personaggi ingranditi | Tutti i personaggi sono grandi il doppio (`scalaPersonaggi: 2`). | `src/config/accessibilita.js` |
| Pochi nemici | Solo 2 guardie al ponte e 1 nel villaggio. Sono lente e colpiscono raramente. Non esiste il game over: se Robin viene colpito troppo, riparte dall'ultimo punto raggiunto. | `src/entita/Nemico.js` |
| Scheda personaggi con voce e pulsante GIOCA gigante | Si clicca una carta e la voce spiega chi è il personaggio. | `src/scene/PersonaggiScene.js` |
| Cutscene iniziale | 4 quadri animati con sottotitoli e voce, che vanno avanti da soli. C'è anche la cutscene finale. Il gioco normale ha la sua cutscene iniziale. | `src/scene/CutsceneScene.js`, testi in `src/config/testi.js` |
| Storia con inizio e fine | 14 passi in ordine. Dopo ogni passo un riquadro dice "Fatto: ..." e "Adesso: ...". La schermata finale riassume tutto quello che hai fatto. | `PASSI` in `src/config/testi.js`, `src/scene/LivelloScene.js`, `src/scene/FineScene.js` |
| Comandi completi con il mouse | Si clicca un punto per camminarci: Robin trova la strada da solo con la ricerca BFS. Si clicca una guardia per tirare (se è lontana, Robin si avvicina e tira da solo). Si clicca una persona per parlarci. Tutti i pulsanti sono grandi. | `src/entita/Eroe.js`, `src/scene/LivelloScene.js` |

## La storia (un solo livello, circa 10-15 minuti)

La mappa è la foresta di Sherwood, con l'accampamento, il campo di tiro, il fiume con il ponte e il villaggio.

1. Parla con Little John all'accampamento.
2. Prendi il tuo arco davanti alla tenda.
3. Allenati: colpisci i 3 bersagli di paglia.
4. Parla con Fra Tuck.
5. Raccogli le 4 erbe medicinali sparse nel bosco.
6. Trova i 3 compagni della banda nascosti nella foresta (Will Scarlet, Much, Alan-a-Dale). Ognuno dà un indizio sul carro.
7. Vai al ponte sul fiume.
8. Ferma le due guardie con l'arco.
9. Libera il contadino legato.
10. Prendi i tre sacchi d'oro.
11. Attraversa il ponte e parla con Marian nel villaggio.
12. Porta un sacco a ognuna delle 3 famiglie (porte con la bandierina gialla).
13. Ferma la guardia arrivata nel villaggio.
14. Torna all'accampamento per la festa.

## Esplorazione (facoltativa)

Chi vuole esplorare trova anche:
- **12 monete nascoste** negli angoli della mappa (il contatore è in alto a destra);
- **5 cartelli** lungo i sentieri: avvicinandosi, la voce legge una curiosità storica (foresta del re, leggi forestali, riscatto di Riccardo, ballate);
- **i cervi del re**: cliccandoli si scopre che cacciarli era vietato dalle leggi forestali.

Il risultato dell'esplorazione compare nella schermata finale.

## Scelte di leggibilità

- I testi usano un carattere molto leggibile (Verdana) a dimensioni grandi. Il font pixel-art è usato solo per i titoli.
- Le frasi sono brevi e semplici, per essere capite sia leggendo sia ascoltando.
- La cutscene e i dialoghi vanno avanti da soli dopo la lettura, ma si possono anche far avanzare con un clic.

## Struttura

```
versione semplificata/
├── index.html
├── css/stile.css
├── lib/phaser.min.js
├── assets/font/           font dei titoli (licenza OFL)
└── src/
    ├── main.js
    ├── config/            accessibilita.js, costanti.js, testi.js, mappa.js
    ├── sistemi/           Voce.js, Suoni.js, Interfaccia.js, Livello.js, Griglia.js, GraficaPixel.js, GraficaTile.js
    ├── entita/            Eroe.js, Nemico.js, Freccia.js, Bersaglio.js, FrecciaGuida.js
    └── scene/             Avvio, Titolo, Personaggi, Cutscene, Livello, HUDLivello, Fine
```

Grafica e suoni sono generati via codice, come nel gioco principale. I file `Griglia.js`, `GraficaPixel.js` e `GraficaTile.js` sono copiati dal gioco principale. `Suoni.js` e `Interfaccia.js` sono copiati e adattati: il suono di completamento e la lettura dei pulsanti.
