# Robin Hood - Il bandito di Sherwood

Videogioco 2D in pixel art per il progetto di **Storia**.
Svolto da **Yaroslav Pogribnyi**, classe 3°F, ITTS Rimini.
Robin Hood, dall'accampamento nella foresta di Sherwood, affronta quattro missioni contro lo Sceriffo di Nottingham.
Le missioni si possono completare in modi diversi: di nascosto, combattendo o con l'astuzia.
Tutta la parte storica è nel **Diario di Robin**, che si apre dal menu, dalla pausa o dalla tenda all'accampamento.

Realizzato con **HTML + JavaScript + Phaser 3** (versione 3.80.1, salvata in `lib/`).

---

## Come avviarlo

**Metodo veloce:** fai doppio clic su `index.html`. Il gioco funziona anche senza server, perché usa normali `<script>` e non i moduli.

**Metodo consigliato (server locale):** apri il Terminale nella cartella del progetto e scrivi:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000` in Safari o in Chrome.

## Pubblicare su GitHub Pages

1. Crea un repository su GitHub e carica **tutto il contenuto** di questa cartella: `index.html` deve stare nella radice.
2. Su GitHub apri **Settings → Pages**.
3. In "Source" scegli **Deploy from a branch**, poi il branch `main` e la cartella `/ (root)`. Premi Save.
4. Dopo un minuto il gioco è online all'indirizzo `https://TUONOME.github.io/NOMEREPOSITORY/`.

Il file `.nojekyll` (vuoto) dice a GitHub di pubblicare i file così come sono.
Tutti i percorsi del progetto sono relativi, quindi il gioco funziona anche dentro una sottocartella.

## Comandi

| Azione | Modalità mouse (predefinita) | Modalità tastiera (tasto T) |
|---|---|---|
| Muoversi | WASD o frecce | WASD |
| Mirare | Mouse / trackpad | Frecce direzionali |
| Tendere l'arco | Tieni premuto clic o SPAZIO, poi rilascia | Tieni premuto SPAZIO, poi rilascia |
| Correre (fa rumore!) | SHIFT | SHIFT |
| Interagire / colpo alle spalle | E | E |
| Cambiare freccia | Q, tasti 1-4, rotellina | Q, tasti 1-4 |
| Pausa | ESC o P | ESC o P |
| Cambiare modalità di mira | T | T |
| Audio sì / no | M | M |

Nel torneo **SHIFT** serve a trattenere il respiro, così il mirino smette di tremare.

---

## Struttura del progetto

```
ProgettoRobinHood/
├── index.html          pagina unica: carica tutti gli script nell'ordine giusto
├── .nojekyll           serve a GitHub Pages
├── css/stile.css       sfondo, centratura del gioco e font
├── assets/font/        font pixel-art "Pixelify Sans" (licenza OFL)
├── lib/phaser.min.js   libreria Phaser 3 (in locale, niente CDN)
└── src/
    ├── main.js         crea il gioco Phaser ed elenca le scene
    ├── config/         SOLO DATI (niente logica)
    │   ├── costanti.js     numeri del gioco: velocità, colori, dimensioni
    │   ├── difficolta.js   parametri di Facile / Normale / Difficile
    │   ├── storia.js       pagine del Diario e curiosità storiche
    │   ├── missioni.js     descrizione missioni, obiettivi extra, finali
    │   ├── negozio.js      oggetti in vendita da Fra Tuck
    │   └── mappe.js        le mappe disegnate come testo
    ├── sistemi/        "servizi" usati da tutto il gioco
    │   ├── Salvataggio.js      localStorage (partita, record, impostazioni)
    │   ├── StatoPartita.js     oro, reputazione, frecce, missioni fatte
    │   ├── Suoni.js            effetti e musica sintetizzati (Web Audio)
    │   ├── GraficaPixel.js     personaggi e oggetti in pixel art da codice
    │   ├── GraficaTile.js      caselle della mappa (erba, muri, tetti…)
    │   ├── Controlli.js        tastiera e mouse in un unico posto
    │   ├── Griglia.js          muri, linea di vista, percorso più breve
    │   ├── CostruttoreLivello.js  trasforma la mappa di testo in tilemap
    │   ├── Allarme.js          livelli calma / allerta / allarme
    │   ├── Punteggio.js        punti, obiettivi extra, scelta del finale
    │   └── Interfaccia.js      pulsanti, pannelli, testi dei menu
    ├── entita/         i "personaggi" e gli oggetti vivi
    │   ├── Giocatore.js    Robin Hood
    │   ├── Arco.js         carica, dispersione, tiro
    │   ├── Freccia.js      volo delle frecce e dei dardi
    │   ├── ConoVisivo.js   cosa vede una guardia
    │   ├── Guardia.js      IA a stati delle guardie
    │   ├── Sceriffo.js     il boss finale (eredita da Guardia)
    │   ├── LittleJohn.js   il compagno che ti segue
    │   ├── Carro.js        il convoglio delle tasse
    │   ├── Bersaglio.js    bersagli del torneo
    │   └── Oggetto.js      sacchi d'oro, frecce a terra, chiave
    └── scene/          le schermate del gioco
        ├── AvvioScene.js        crea texture e animazioni
        ├── MenuScene.js         menu principale e scelta difficoltà
        ├── DiarioScene.js       il Diario di Robin (parte storica)
        ├── CaricamentoScene.js  schermata con curiosità storica
        ├── AccampamentoScene.js l'hub: missioni, negozio, bottino
        ├── MissioneBase.js      classe "madre" delle missioni
        ├── MissioneConvoglio.js missione 1
        ├── MissionePrigione.js  missione 2
        ├── MissioneTorneo.js    missione 3 (minigioco di tiro)
        ├── MissioneFinale.js    missione 4 (lo Sceriffo)
        ├── HUDScene.js          cuori, frecce, allarme sopra il gioco
        ├── PausaScene.js        menu di pausa
        ├── RiepilogoScene.js    risultato di una missione
        └── FinaleScene.js       finale, punteggio e record
```

**In una frase:** `config` dice *cosa c'è*, `entita` dice *chi si muove*, `sistemi` contiene *le regole comuni* e `scene` contiene *le schermate*.

---

## Le idee principali (da spiegare all'interrogazione)

### 1. Le mappe sono disegnate con i caratteri
In `config/mappe.js` ogni carattere è una casella da 16×16 pixel: `#` è un muro, `T` un albero, `b` un cespuglio…
Le lettere minuscole `g`, `o`, `a` indicano solo le **posizioni possibili** di guardie, bottino e frecce.
A ogni partita il gioco ne sceglie a caso una parte (`CostruttoreLivello.scegliACaso`): è da qui che nasce la rigiocabilità.

### 2. Le guardie sono una "macchina a stati"
Ogni guardia (`entita/Guardia.js`) è sempre in un solo stato tra **pattuglia**, **sospetto**, **inseguimento**, **ricerca**, **stordita** e **morta**.
Cambia stato quando succede qualcosa: per esempio, quando il "?" del sospetto si riempie passa a *inseguimento* e suona l'allarme.

### 3. Il cono visivo
`ConoVisivo.js` lancia 18 "raggi" davanti alla guardia. Ogni raggio si ferma al primo muro, quindi il cono disegnato a terra non attraversa le pareti.
Per capire se la guardia vede Robin si controllano quattro cose:
- la distanza (che si riduce se Robin è nascosto in un cespuglio o sta su un tetto);
- l'angolo;
- che non ci siano muri in mezzo;
- che non ci sia fumo in mezzo.

### 4. Trovare la strada: la ricerca in ampiezza (BFS)
Quando una guardia non può andare dritta verso un punto, `Griglia.percorso()` esplora la mappa "a cerchi": prima le caselle vicine, poi quelle più lontane, finché non trova l'arrivo.
Poi ricostruisce la strada all'indietro.

### 5. L'arco con carica
In `Arco.js`, più a lungo tieni premuto:
- più la freccia è veloce;
- più arriva lontano;
- più fa danno;
- **ma** più si allarga il cono di dispersione.

Dopo 2,2 secondi di arco teso il braccio inizia anche a tremare.

### 6. Ereditarietà
Le missioni con mappa ereditano da `MissioneBase` (`class MissioneConvoglio extends MissioneBase`), così il codice comune è scritto una volta sola.
Anche lo Sceriffo eredita dalla Guardia e ne cambia solo il comportamento.

### 7. Scelte e conseguenze
Il bottino si divide all'accampamento: ogni 8 monete donate ai villaggi valgono +1 di reputazione, e ogni guardia uccisa toglie 1 punto.
La reputazione cambia il finale (scelto in `Punteggio.determinaFinale`):
- **Eroe del popolo**: reputazione da 60 in su;
- **Bandito ricco ma odiato**: reputazione sotto 35, oppure oro tenuto più del doppio di quello donato;
- **La leggenda continua**: tutti gli altri casi di vittoria;
- **Catturato**: sconfitta contro lo Sceriffo.

Anche le missioni precedenti contano:
- vincere il torneo apre il passaggio segreto del finale;
- liberare Little John te lo porta come alleato nel finale.

### 8. Compatibilità con Safari
- L'audio si avvia **solo** dopo il clic su "Gioca" (`Suoni.avvia()`), perché Safari blocca i suoni che partono da soli.
- Ogni accesso a `localStorage` è dentro un `try/catch`: nella navigazione privata di Safari potrebbe dare errore.
- Il codice usa solo JavaScript standard (classi, `const`/`let`, funzioni freccia): niente API sperimentali.

---

## Personalizzare

- **Difficoltà:** cambia i numeri in `src/config/difficolta.js`.
- **Mappe:** modifica i caratteri in `src/config/mappe.js`. Tutte le righe di una mappa devono avere la stessa lunghezza.
- **Testi storici:** sono tutti in `src/config/storia.js`.

## Crediti e fonti

- Motore: Phaser 3.80.1 (licenza MIT).
- Font: "Pixelify Sans" di Stefie Justprince (licenza SIL Open Font License, testo in `assets/font/OFL.txt`).
- Grafica e suoni: generati via codice, nessun altro asset esterno.

Fonti storiche consultate:
- J. C. Holt, *Robin Hood*, Thames & Hudson, 1982
- S. Knight, *Robin Hood: A Mythic Biography*, Cornell University Press, 2003
- J. Gillingham, *Richard I*, Yale University Press, 1999
- British Library, sezione "Magna Carta" (bl.uk)
- The National Archives (UK), "Charter of the Forest, 1217"
- Encyclopaedia Britannica, voci: Robin Hood, Richard I, John, Forest law, Magna Carta
