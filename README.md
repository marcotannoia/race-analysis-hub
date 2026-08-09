# Race Analysis Hub

Applicazione indipendente per consultare dati, risultati e analisi editoriali
sul campionato mondiale di Formula 1.

Il progetto utilizza React e Vite per il frontend, Node.js ed Express per le
API e MongoDB per la persistenza dei dati. Le API pubbliche sono anonime, di
sola lettura e documentate con Swagger.

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

## Dati e licenze

Le classifiche 2026, i risultati di gara e qualifica 2023–2025 e i grafici
quantitativi 2026 derivano da
[F1DB v2026.11.0](https://github.com/f1db/f1db/releases/tag/v2026.11.0),
distribuito con licenza
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). I dati vengono
filtrati e normalizzati da Race Analysis Hub; i contenuti editoriali restano
originali del progetto.

Per attribuzioni, marchi e condizioni di riutilizzo consultare
[`NOTICE.md`](NOTICE.md) e [`LICENSE.md`](LICENSE.md).

## Guide operative

- [Deployment](DEPLOYMENT.md)
- [Aggiornamento post-GP](post-gp.md)
- [Contenuti editoriali](fix-frontend.md)
