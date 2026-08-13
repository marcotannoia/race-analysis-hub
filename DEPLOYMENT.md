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

Esempio completo, usando variabili dedicate per evitare di pubblicare sul
bucket o sulla distribuzione sbagliati:

```bash
export RACE_HUB_S3_BUCKET="nome-bucket"
export RACE_HUB_CLOUDFRONT_ID="ID_DISTRIBUZIONE"

aws s3 sync frontend/dist "s3://${RACE_HUB_S3_BUCKET}" \
  --delete \
  --exclude "index.html" \
  --exclude "favicon-race.svg" \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=31536000,immutable"

aws s3 cp frontend/dist/index.html \
  "s3://${RACE_HUB_S3_BUCKET}/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache"

aws s3 cp frontend/dist/favicon-race.svg \
  "s3://${RACE_HUB_S3_BUCKET}/favicon-race.svg" \
  --content-type "image/svg+xml" \
  --cache-control "no-cache"

aws cloudfront create-invalidation \
  --distribution-id "${RACE_HUB_CLOUDFRONT_ID}" \
  --paths "/*"
```

Prima del caricamento verificare con `aws sts get-caller-identity` l'account
attivo e controllare che l'alias CloudFront corrisponda al dominio pubblico.
La landing page richiede anche `GET /api/v1/previsioni/piloti`: se il backend è
distribuito automaticamente dal push, attendere che l'endpoint restituisca il
modello e la classifica completa prima di aggiornare S3.

Per la release multilingua attendere inoltre che
`GET /api/v1/lingue` e `GET /api/v1/home?lingua=en` rispondano dalla versione
backend `1.6.0`. Soltanto dopo si può pubblicare il frontend: in caso contrario
il selettore cambierebbe l'interfaccia ma riceverebbe ancora testi italiani.
`AZURE_TRANSLATOR_KEY` non deve essere configurata su Render o inclusa nella
build Vite: serve soltanto allo script amministrativo locale.

## Controlli prima della pubblicazione

Prima di qualsiasi seed, commit o deployment eseguire il controllo locale
offline. Il primo comando deve terminare con `0 segmenti nuovi` e `0 caratteri`:

```bash
npm run translate-data -- --rebuild-from-cache --offline
npm run verify-translations
npm run verify-data
npm test
npm run lint:api
npm run lint
npm run build
```

L'opzione `--offline` impedisce l'inizializzazione del client Azure e termina
con errore se manca una traduzione in cache; questa verifica non consuma quota
F0. Per la sola anteprima non eseguire `seed`, sincronizzazioni S3 o
invalidazioni CloudFront.

- ruotare le credenziali usate durante lo sviluppo;
- limitare l'IP Access List di MongoDB Atlas agli indirizzi del servizio;
- assegnare all'utente MongoDB soltanto i permessi necessari;
- usare esclusivamente HTTPS;
- configurare le variabili nel gestore dei segreti della piattaforma;
- eseguire `npm audit`, build, lint, `npm --prefix backend test` e verificare
  l'endpoint `/api/v1/health`;
- usare uno store condiviso per il rate limit se il backend avrà più istanze.

Per la release `1.6.0`, verificare inoltre che:

- `GET /api/v1` restituisca `"versione": "1.6.0"`;
- `GET /api/v1/lingue` elenchi esattamente le sei lingue;
- `GET /api/v1/gare/attuale?lingua=de` restituisca `"lingua": "de"` e
  l'header `Content-Language: de`;
- `GET /api/v1/home?lingua=xx` restituisca HTTP `400`, codice
  `LINGUA_NON_SUPPORTATA` e i sei codici ammessi;
- `GET /api/v1/piloti/leclerc` esponga ISO2, ISO3, numero vettura,
  abbreviazione del nome, abbreviazione e colore della scuderia;
- `/api/v1/openapi.json` dichiari gli stessi campi senza variazioni a rotte,
  parametri o metodi HTTP;
- `npm run verify-db` termini con `0 differenze`.

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
