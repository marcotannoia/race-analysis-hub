# Preparazione al deployment

Il frontend e il backend possono essere pubblicati separatamente oppure come un
unico servizio. In produzione il frontend usa `/api` sullo stesso dominio se
`VITE_API_URL` non è impostata; il backend può servire la cartella
`frontend/dist` tramite `SERVE_FRONTEND=true`.

## Variabili del backend

```text
NODE_ENV=production
MONGO_URL=mongodb+srv://...
DATABASE_NAME=f1_stats
PORT=5002
HOST=0.0.0.0
FRONTEND_URL=https://www.esempio.it
TRUST_PROXY=1
RATE_LIMIT_MAX=1000
SERVE_FRONTEND=true
```

`FRONTEND_URL` accetta più origini separate da virgole. Le credenziali MongoDB
devono essere configurate nel gestore dei segreti della piattaforma e non in un
file incluso nel deployment.

## Build e avvio

```bash
cd frontend
npm ci
npm run build

cd ../backend
npm ci --omit=dev
npm start
```

Per due servizi separati, impostare `VITE_API_URL` con l'indirizzo HTTPS del
backend durante la build del frontend e usare `SERVE_FRONTEND=false`.

## Frontend su S3 e CloudFront

Per la distribuzione statica su CloudFront, usare il comando dedicato:

```bash
npm run build:cloudfront
```

Il comando genera `frontend/dist` configurando il frontend per chiamare il
backend pubblico su Render. I file con hash sotto `assets/` possono essere
mantenuti in cache per un anno; `index.html` e il favicon devono invece usare
`no-cache`. Dopo il caricamento su S3 è necessario invalidare almeno `/*` sulla
distribuzione CloudFront.

## Controlli prima della pubblicazione

- ruotare le credenziali usate durante lo sviluppo;
- limitare l'IP Access List di MongoDB Atlas agli indirizzi del servizio;
- assegnare all'utente MongoDB soltanto i permessi necessari;
- usare esclusivamente HTTPS;
- configurare le variabili nel gestore dei segreti della piattaforma;
- eseguire `npm audit`, build, lint, `npm --prefix backend test` e verificare
  l'endpoint `/api/v1/health`;
- usare uno store condiviso per il rate limit se il backend avrà più istanze.

## Aggiornamento editoriale post-gara

Il cambio del Gran Premio visibile non richiede una nuova build. Dalla cartella
principale basta eseguire `npm run gp`: la prima esecuzione prepara il modulo
`backend/data/aggiornamento-gp.json`, mentre quella successiva, dopo la
compilazione e l'impostazione di `"pronto": true`, aggiorna MongoDB e sposta
automaticamente il flag `attuale` sulla gara seguente. Il file utilizzato viene
conservato in `backend/data/archivio-gp/` come fonte editoriale; non inserirvi
credenziali.

I grafici quantitativi 2026 non vengono ricavati da questo file: usano lo
snapshot locale F1DB dichiarato in `NOTICE.md`. Per includere nuovi GP nei
grafici occorre rigenerare lo snapshot da una nuova release F1DB, eseguire
`npm run verify-data` e pubblicare il codice aggiornato.
