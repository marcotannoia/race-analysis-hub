# Race Analysis Hub

Applicazione indipendente per consultare dati, risultati e analisi editoriali
sul campionato mondiale di Formula 1.

Il progetto utilizza React e Vite per il frontend, Node.js ed Express per le
API e MongoDB per la persistenza dei dati. Le API pubbliche sono anonime, di
sola lettura e documentate con Swagger.

La parte finale della landing page mostra una classifica previsionale dei
piloti per il solo Gran Premio attuale. Il modello combina risultati 2026,
compatibilità con la pista, valutazioni tecniche e contenuti editoriali già
presenti nel progetto.

## Collegamenti

- [Sito pubblico](https://www.race-analysis-hub.it)
- [Documentazione Swagger](https://f1-stats-5v93.onrender.com/api/docs)
- [Specifica OpenAPI](https://f1-stats-5v93.onrender.com/api/v1/openapi.json)

## Avvio locale

Creare `backend/.env` partendo da `backend/.env.example`, quindi installare le
dipendenze e avviare backend e frontend in due terminali:

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run dev
npm --prefix frontend run dev
```

Il backend è disponibile su `http://localhost:5002` e il frontend su
`http://localhost:5173`.

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

- [Deployment](DEPLOYMENT.md)
- [Aggiornamento post-GP](post-gp.md)
- [Contenuti editoriali](fix-frontend.md)
