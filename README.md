# Race Analysis Hub

Applicazione indipendente per consultare dati, risultati e analisi editoriali
sul campionato mondiale di Formula 1.

Il progetto utilizza React e Vite per il frontend, Node.js ed Express per le
API e MongoDB per la persistenza dei dati. Le API pubbliche sono anonime, di
sola lettura e documentate con Swagger.

La versione corrente del progetto e dell'API è `1.6.0`.

La parte finale della landing page mostra una classifica previsionale dei
piloti per il solo Gran Premio attuale. Il modello combina risultati 2026,
compatibilità con la pista, valutazioni tecniche e contenuti editoriali già
presenti nel progetto.

## Collegamenti

- [Sito pubblico](https://www.race-analysis-hub.it)
- [Documentazione Swagger](https://f1-stats-5v93.onrender.com/api/docs)
- [Specifica OpenAPI](https://f1-stats-5v93.onrender.com/api/v1/openapi.json)

## Lingue e traduzioni

Frontend e API supportano sei lingue:

| Parametro | Lingua | Variante |
|---|---|---|
| `it` | Italiano | predefinita |
| `en` | English | inglese |
| `fr` | Français | francese |
| `pt` | Português | portoghese europeo (`pt-PT`) |
| `es` | Español | spagnolo |
| `de` | Deutsch | tedesco |

Il frontend propone la prima lingua supportata tra quelle del browser, ricorda
la scelta e invia il parametro `lingua` a ogni richiesta. Il selettore globale
mostra nome nativo e codice della lingua ed è utilizzabile anche da tastiera e
con tecnologie assistive.

Le integrazioni possono usare, per esempio,
`GET /api/v1/home?lingua=en`. Ogni risposta v1 dichiara la lingua effettiva nel
campo `lingua`, quando previsto dal relativo schema, e nell'header
`Content-Language`. Senza parametro viene usato `it`; un codice non supportato
restituisce HTTP `400` con `LINGUA_NON_SUPPORTATA`. L'endpoint
`GET /api/v1/lingue` espone l'elenco aggiornato.

La traduzione iniziale viene generata con Azure Translator F0 tramite uno script
amministrativo, conservata nel database e verificata prima della pubblicazione.
Le richieste degli utenti selezionano esclusivamente testi già salvati: Azure
non viene chiamato a runtime e non è accessibile tramite le API pubbliche o il
frontend. La memoria di traduzione permette di elaborare soltanto i testi nuovi
o modificati, evitando un catalogo rigido. Procedura, sicurezza e regole per le
personalizzazioni sono descritte in
[`LOCALIZZAZIONE.md`](LOCALIZZAZIONE.md).

## Dati anagrafici dei piloti

La release `1.5.0` arricchisce le risposte dei piloti senza modificare rotte,
parametri o metodi HTTP. I campi `codice` e `numero` restano disponibili; sono
stati aggiunti nomi più espliciti e dati utili alla localizzazione e alla
grafica:

| Campo | Contenuto | Esempio |
|---|---|---|
| `abbreviazioneNome` | codice sportivo del pilota | `LEC` |
| `numeroVettura` | numero della vettura | `16` |
| `nazionalitaIso2` | codice ISO 3166-1 alpha-2 | `MC` |
| `nazionalitaIso3` | codice ISO 3166-1 alpha-3 | `MCO` |
| `scuderia.abbreviazione` | codice breve della scuderia | `FER` |
| `scuderia.colore` | colore RGB esadecimale | `#E8002D` |

Gli stessi oggetti brevi sono riutilizzati nelle analisi, nelle classifiche e
nella classifica previsionale, così il significato dei campi resta uniforme in
tutta l'API.

## Avvio locale

Installare le dipendenze e avviare backend e frontend in due terminali:

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run dev
npm --prefix frontend run dev
```

Il backend è disponibile su `http://localhost:5002` e il frontend su
`http://localhost:5173`.

In sviluppo, `npm --prefix backend run dev` crea automaticamente un MongoDB
temporaneo in memoria e importa `backend/data/dati-iniziali.json`. In questo
modo l'anteprima mostra esattamente le API e le traduzioni della copia locale,
senza leggere o modificare Atlas. Al primo avvio viene scaricato e conservato
in cache il binario MongoDB necessario; gli avvii successivi lo riutilizzano.

`npm --prefix backend start` mantiene invece il comportamento di produzione e
richiede `MONGO_URL`. Il comando `seed` scrive nel database configurato e non
deve essere usato per la semplice anteprima locale.

## Riutilizzo delle API

Le API ufficiali sono di sola lettura: chi le utilizza non può modificare il
database di Race Analysis Hub. Le risposte ricevute possono però essere
copiate, mostrate e personalizzate nel software del riutilizzatore, anche per
finalità commerciali. È quindi possibile, per esempio, riscrivere localmente il
campo `aggiornamentiInArrivo` senza alterare la fonte originale.

Le risposte pubbliche sono distribuite con licenza CC BY 4.0. Occorre citare
`Race Analysis Hub — Marco Tannoia`, mantenere l'attribuzione a F1DB per i dati
quantitativi e indicare chiaramente le eventuali modifiche. Le condizioni
complete sono riportate in [`LICENSE.md`](LICENSE.md) e [`NOTICE.md`](NOTICE.md).

## Dati e licenze

Le classifiche 2026, i risultati di gara e qualifica 2023–2025 e i grafici
quantitativi 2026 derivano da
[F1DB v2026.11.0](https://github.com/f1db/f1db/releases/tag/v2026.11.0),
distribuito con licenza
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). I dati vengono
filtrati e normalizzati da Race Analysis Hub; i contenuti editoriali restano
originali del progetto e, quando restituiti dalle API pubbliche, sono anch'essi
riutilizzabili secondo le condizioni indicate in `LICENSE.md`.

Per attribuzioni, marchi e condizioni di riutilizzo consultare
[`NOTICE.md`](NOTICE.md) e [`LICENSE.md`](LICENSE.md).

I colori delle scuderie sono verificati sulla pagina ufficiale
[Formula 1 Teams](https://www.formula1.com/en/teams). I codici paese aggiunti
alle nazionalità seguono lo standard
[ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html); le abbreviazioni
delle scuderie sono identificatori editoriali stabili di Race Analysis Hub.

## Classifica previsionale

L'indice dei favoriti va da 0 a 100 ed è isolato nell'endpoint dedicato
`GET /api/v1/previsioni/piloti`, insieme alla scomposizione dei fattori. I pesi
sono:

- andamento della scuderia nel 2026: 26%;
- andamento del pilota nel 2026: 20%;
- compatibilità vettura-circuito: 18%;
- aggiornamenti tecnici pertinenti: 12%;
- qualifica 2026: 8%;
- confidenza pilota-circuito: 7%;
- storico personale: 3%;
- passo gara recente: 2%;
- gestione gomme: 2%;
- affidabilità e rischi: 2%.

La compatibilità vettura-circuito combina l'affinità tecnica editoriale con la
forza effettiva della scuderia nel 2026. Una vettura poco competitiva non può
quindi risalire eccessivamente soltanto grazie allo storico sulla pista o a un
aggiornamento promettente.

Gli aggiornamenti non ricevono automaticamente un punteggio positivo. Il
vantaggio viene ridotto se il pacchetto è soltanto annunciato, non è stato
verificato in pista o riguarda caratteristiche poco importanti per il circuito.
Un aggiornamento senza beneficio reale può diminuire il punteggio.

La classifica è una previsione statistico-editoriale soggetta a errore. Non
rappresenta un risultato certo e può cambiare dopo prove libere, meteo,
penalità, specifiche FIA o nuove informazioni tecniche.

## Guide operative

- [Changelog](CHANGELOG.md)
- [Deployment](DEPLOYMENT.md)
- [Aggiornamento post-GP](post-gp.md)
- [Contenuti editoriali](fix-frontend.md)
- [Localizzazione](LOCALIZZAZIONE.md)
