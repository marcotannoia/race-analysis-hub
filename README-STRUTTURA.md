# Struttura del progetto

| Percorso | Contenuto |
| --- | --- |
| `frontend/src/` | Interfaccia React, componenti, stili e traduzioni. |
| `frontend/public/` | Immagini e risorse statiche del sito. |
| `backend/server.js`, `backend/app.js` | Avvio server, middleware e montaggio API. |
| `backend/routes/v1/`, `backend/controllers/v1/` | Endpoint v1 e servizi applicativi condivisi. |
| `backend/relational/` | API v2, lettura del catalogo PostgreSQL e risposte numeriche. |
| `backend/services/` | Analisi, previsioni, fonti e aggiornamento automatico GP. |
| `backend/repositories/`, `backend/models/` | Accesso ai dati e compatibilità con il modello precedente. |
| `backend/data/` | Snapshot e dati necessari ai calcoli: non eliminare come cache. |
| `backend/scripts/`, `backend/test/` | Comandi operativi e test. |
| `supabase/` | Migrazioni e configurazione del database. |
| `docs/` | Rapporti e documentazione di approfondimento. |
| `render.yaml` | Configurazione di deploy Render. |

**Flusso:** sito → API v1/v2 → servizi → PostgreSQL.
Il GP pubblico deriva dallo stato `attuale` nel database. Dopo un aggiornamento
verificato, gli endpoint usano il nuovo GP; i risultati storici del suo circuito
restano disponibili come supporto alle analisi.

**File locali:** `node_modules/` contiene dipendenze reinstallabili; `frontend/dist/`
è la build. `.codex_work/` contiene materiali di lavoro e backup locali, esclusi
volutamente da Git. I backup non sono necessari all’avvio, ma vanno conservati.

Per avvio e verifiche: [README-COMANDI.md](README-COMANDI.md).
