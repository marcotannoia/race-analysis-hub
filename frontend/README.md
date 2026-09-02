# Frontend Race Analysis Hub

Interfaccia React/Vite del progetto. Consuma esclusivamente l'API pubblica v1
del backend e visualizza analisi editoriali, classifiche, grafici Chart.js e la
classifica previsionale spiegabile del Gran Premio attuale.

La release `1.5.0` dell'API ha aggiunto ai piloti i codici ISO2/ISO3, il numero
vettura e l'abbreviazione del nome; l'oggetto `scuderia` include inoltre
abbreviazione e colore esadecimale. I precedenti campi `codice` e `numero`
restano disponibili, quindi le viste esistenti continuano a funzionare senza
modifiche.

Dalla release `1.6.0` il selettore globale supporta `it`, `en`, `fr`, `pt`,
`es` e `de`. La scelta iniziale segue le lingue del browser, viene salvata in
`localStorage` e aggiunge `?lingua=...` alle richieste verso home, dettagli e
classifica previsionale. Il controllo mostra icona, nome nativo e codice della
lingua in un elemento compatto coerente con la grafica del sito, mantenendo un
`select` nativo per tastiera e tecnologie assistive. Il codice `pt` seleziona il
catalogo portoghese europeo (`pt-PT`). Le stringhe dell'interfaccia sono in
`src/i18n/traduzioniInterfaccia.js`; i contenuti editoriali arrivano già
localizzati dal backend. Il frontend non contiene credenziali Azure e non
invia richieste a servizi di traduzione esterni.

Dalla release `1.7.0` la landing usa soltanto `GET /api/v1/home`: la risposta
include anche la classifica previsionale. In produzione il frontend chiama
`/api` sullo stesso dominio, così CloudFront può servire le risposte ripetute
senza raggiungere ogni volta Render e MongoDB Atlas.

Dalla release `1.8.0` le pagine di piloti e scuderie mostrano tre indicatori
percentuali normalizzati: bravura sul bagnato, errori imputabili al pilota ed
errori fatali o compromettenti. Per il bagnato l'API espone anche i due conteggi
usati nel calcolo, così la percentuale è verificabile. La pagina
`/confronto` affianca due piloti o due scuderie riproponendo le schede complete
dei profili singoli; usa gli endpoint dedicati `/api/v1/confronti/piloti/...`
e `/api/v1/confronti/scuderie/...`.

## Avvio locale

```bash
npm ci
npm run dev
```

In assenza di configurazione il frontend usa il backend locale su
`http://127.0.0.1:5002`. Per indicare un'altra istanza, creare `.env` da
`.env.example` e impostare `VITE_API_URL`.

Per una prova completa avviare prima `npm run dev` nella cartella `backend`:
quel comando prepara un MongoDB temporaneo con il catalogo locale, senza usare
Atlas. Avviare poi questo frontend con `npm run dev` e cambiare lingua dal
selettore globale; ogni cambio ricarica i contenuti dall'API con il parametro
`lingua` corrispondente.

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

La landing page usa `GET /api/v1/home` per contenuti generali e classifica. Per
ogni pilota mostra indice, confidenza, scomposizione dei nove fattori ordinari e
trattamento degli aggiornamenti tecnici. L'endpoint dedicato
`GET /api/v1/previsioni/piloti` resta disponibile per le integrazioni che
richiedono soltanto la previsione. L'avvertenza sulla natura fallibile della
previsione deve restare visibile e non va rimossa nelle personalizzazioni
grafiche.
