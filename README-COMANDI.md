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

Overall v2: `node backend/scripts/backtestModelloDinamico.js` misura il modello sui GP
disputati; `node backend/scripts/ricalcolaOverallV2.js` ricalcola gli overall di tutti i GP
(simulazione, `--apply` per scrivere). Dettagli: [revisione v2](docs/modello-piloti/REVISIONE-OVERALL-V2.md).

Qualifica del sabato: acquisita da OpenF1 in automatico. Per forzarla o inserirla
a mano usare la dashboard oppure, con il token admin:
`curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}' https://f1-stats-5v93.onrender.com/api/admin/qualifica`
(`{"forza":true}`, `{"ordine":["norris","russell",...]}` o `{"cancella":true}`).
Stato pubblico: `/api/v1/gare/attuale/qualifica`.

Sostituzione editoriale provvisoria Ocon → Hirakawa nei tre GP rimanenti:
`node backend/scripts/configuraHirakawaFuturi.js` verifica con rollback; `--apply`
applica con backup delle partecipazioni. Conserva le gare concluse e usa soltanto
i dati personali di Hirakawa. Non costituisce conferma dell'iscrizione FIA.

Revisione approfondita: `npm run review:gp` simula con rollback;
`npm run review:gp -- --apply` acquisisce i giri mancanti e aggiorna analisi e pattern.
Richiede Python 3. Procedura completa: [Post-GP](post-gp.md).

Il cambio GP aggiorna il contesto degli endpoint e svuota le cache applicative.
Lo stato è consultabile in `/api/v2/automazione`. I GP diversi dall’attuale
non sono accessibili nelle analisi; lo storico riguarda il circuito attuale.

## Spazio su disco

Cache npm locali e `frontend/dist` sono rigenerabili. Per ripristinare dipendenze
rimosse usare `npm ci` nella rispettiva cartella; per la build usare `npm run build`.
Conservare `.env`, sorgenti, dati, migrazioni e backup.
