# Comandi essenziali

Eseguire dalla radice del progetto. Richiesto Node.js 22.12–24.

## Prima installazione

```sh
npm ci
npm --prefix backend ci
npm --prefix frontend ci
cp backend/.env.example backend/.env
```

Compilare `backend/.env` con la connessione PostgreSQL e `DATA_PROVIDER=postgres`.
Non sovrascrivere un `.env` già configurato.

## Uso quotidiano

| Comando | Cosa fa |
| --- | --- |
| `npm --prefix backend run dev` | Avvia le API in sviluppo. |
| `npm --prefix frontend run dev` | Avvia il sito in un secondo terminale. |
| `npm run build` | Genera il sito in `frontend/dist`. |
| `npm --prefix backend start` | Avvia le API senza riavvio automatico. |
| `npm test` | Esegue i test del backend. |
| `npm run lint` | Controlla il codice frontend. |
| `npm --prefix backend run lint:api:v2` | Valida la documentazione OpenAPI v2. |
| `npm --prefix backend run verify-api:v2` | Verifica le API avviate; usare `API_BASE_URL` per cambiare indirizzo. |

## Aggiornamento GP

In produzione il controllo parte con il server: `AUTO_GP_ENABLED=true`, intervallo
`AUTO_GP_INTERVAL_MINUTES=30`. Attende fine giornata e fonti verificate.

| Comando | Cosa fa |
| --- | --- |
| `npm --prefix backend run check:auto-gp` | Simula il controllo senza applicare aggiornamenti. |
| `npm --prefix backend run check:auto-gp -- --apply` | Applica l’aggiornamento se le verifiche riescono. |

Il cambio GP aggiorna il contesto degli endpoint e svuota le cache applicative.
Lo stato è consultabile in `/api/v2/automazione`. I GP diversi dall’attuale
non sono accessibili nelle analisi; lo storico riguarda il circuito attuale.

## Spazio su disco

Cache npm locali e `frontend/dist` sono rigenerabili. Per ripristinare dipendenze
rimosse usare `npm ci` nella rispettiva cartella; per la build usare `npm run build`.
Conservare `.env`, sorgenti, dati, migrazioni e backup.
