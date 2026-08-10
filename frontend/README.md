# Frontend Race Analysis Hub

Interfaccia React/Vite del progetto. Consuma esclusivamente l'API pubblica v1
del backend e visualizza analisi editoriali, classifiche, grafici Chart.js e la
classifica previsionale spiegabile del Gran Premio attuale.

## Avvio locale

```bash
npm ci
npm run dev
```

In assenza di configurazione il frontend usa il backend locale su
`http://127.0.0.1:5002`. Per indicare un'altra istanza, creare `.env` da
`.env.example` e impostare `VITE_API_URL`.

## Controlli

```bash
npm run lint
npm run build
```

Le posizioni quantitative visualizzate nei grafici arrivano dal backend e
derivano dallo snapshot F1DB indicato nel `NOTICE.md` principale. Chart.js si
occupa soltanto della rappresentazione grafica ed è distribuito con licenza
MIT. Per contratto API, deployment, fonti e condizioni di riutilizzo consultare
il `README.md`, il `NOTICE.md` e la documentazione Swagger del progetto.

La landing page usa `GET /api/v1/home` per i contenuti generali e l'endpoint
isolato `GET /api/v1/previsioni/piloti` per la classifica. Per ogni pilota mostra
indice, confidenza, scomposizione dei dieci fattori e trattamento degli
aggiornamenti tecnici. L'avvertenza sulla natura fallibile della previsione deve
restare visibile e non va rimossa nelle personalizzazioni grafiche.
