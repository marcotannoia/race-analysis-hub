# Migrazione MongoDB → Supabase PostgreSQL

Stato al 16 ottobre 2026: dati importati e backend PostgreSQL implementato. `DATA_PROVIDER=postgres` attiva Supabase come unica connessione runtime; la configurazione Render nel repository usa questo provider. Nessuna variabile segreta è nel repository.

## Modello

- `f1db`: storico completo F1DB v2026.17.0, 31 tabelle relazionali e 17 viste, inclusi risultati di gare, qualifiche, sprint e qualifiche sprint. Le sessioni sono distinte dal campo `race_data.type`; duplicarle in schemi separati aumenterebbe i dati senza migliorare automaticamente le prestazioni.
- `catalog`: scuderie, piloti, circuiti, GP, partecipazioni e classifiche pubblicate. Le chiavi esterne collegano le entità ai dati F1DB.
- `editorial`: analisi e traduzioni, con uno snapshot JSONB privato delle schede Mongo per il confronto delle risposte API e il recupero di attributi non ancora normalizzati.
- `ratings`: overall 0–100, dimensioni, campioni, URL delle fonti e statistiche cumulative di contesto. La confidenza resta `NULL` finché non viene calibrata. I punteggi senza campione e fonte sono esclusi.
- `live_fia`: rapporti FIA collegati ai GP e aggiornamenti per scuderia con chiavi esterne. Il monitor scrive qui.
- `archive`: copie private dei metodi previsionali, dei rilasci e dei backup originari, conservate per audit.

Tutti gli schemi sono privati e non accessibili ai ruoli `anon` e `authenticated`. L'accesso pubblico continua a passare da Express `/api/v1`.

## Provenienza e differenze

MongoDB live è la fonte per i contenuti pubblicati. Il seed locale è una base di confronto: differiscono 17 classifiche piloti, 9 classifiche scuderie, 9 stati/dati dei GP e molti testi editoriali. A Zandvoort MongoDB contiene l'analisi di Tsunoda, il seed quella di Hadjar. `node backend/scripts/confrontaSorgentiMigrazione.js --details` mostra le differenze.

Lo storico F1DB contiene 917 piloti, 187 costruttori, 78 circuiti, 1.172 gare e 188.111 righe `race_data`. MongoDB ha fornito 23 piloti, 11 scuderie, 12 GP, 264 analisi pilota, 132 analisi scuderia e altri 450 documenti di servizio/backup. Sono stati importati 2.386 overall supportati da campione e fonte; 396 valutazioni finali senza campione sono state lasciate fuori da `ratings`.

F1DB da solo non documenta i giri e le mescole necessari per attribuire il valore di gestione gomme. Gli overall già presenti in MongoDB con URL OpenF1 sono stati conservati. Se manca un campione verificabile, il valore esposto dall'API è `null`.

## Esecuzione riproducibile

Configurare `MONGO_URL` e `SUPABASE_DB_URL` in `backend/.env` (mai committare il file). Gli script di importazione rifiutano una seconda esecuzione su tabelle già popolate.

```powershell
$dump = & ./backend/scripts/preparaDumpF1db.ps1
node backend/scripts/importaF1dbPostgres.js $dump
node backend/scripts/confrontaSorgentiMigrazione.js
node backend/scripts/migraMongoSupabase.js --dry-run
node backend/scripts/migraMongoSupabase.js
node backend/scripts/archiviaRestoMongoSupabase.js
node backend/scripts/verificaParitaSupabase.js
```

Le migrazioni DDL sono in `supabase/migrations/` e risultano applicate nel progetto Supabase. Prima di nuove migrazioni, verificare con `supabase db push --dry-run`.

## Backend e compatibilità API

Le route `/api/v1` e i campi testuali legacy restano disponibili per i client esistenti. Le risposte delle analisi aggiungono `overall.passoGara` e `overall.gestioneGomme`, ciascuno con `valore`, `campione` e `fonti`, oppure `null`. Il frontend mostra gli overall al posto dei lunghi paragrafi di passo gara e gomme.

Il backend usa `catalog` per anagrafiche, classifiche e stato GP, `ratings` per passo gara e gomme e `live_fia` per i dati FIA. Gli snapshot `editorial.source_document` conservano i campi legacy ancora richiesti dall'API, come testi storici, traduzioni e contenuti editoriali. Nessuna route runtime richiede MongoDB quando `DATA_PROVIDER=postgres`.

Il monitor FIA, `npm run set-current` e `npm run gp` scrivono su PostgreSQL. Gli aggiornamenti post-GP applicano in una transazione analisi, classifiche, indicatori cumulativi, audit e cambio del GP attuale. Le statistiche di contesto sono lette da PostgreSQL quando il backend parte; il file JSON locale resta solo come riferimento per l'importazione iniziale. I comandi di importazione Mongo restano disponibili solo per audit e ripristino; `npm run seed` è legacy e rifiuta il provider PostgreSQL per evitare la sovrascrittura dei dati pubblicati.

La verifica `node backend/scripts/verificaParitaApi.js <URL_MONGO> <URL_POSTGRES>` ha confrontato 195 risposte effettive, incluse tutte le sei lingue, le schede di 23 piloti e 11 scuderie, le analisi accessibili e gli errori: JSON identici a eccezione del `requestId` generato per richiesta. Il processo PostgreSQL era avviato con `MONGO_URL` vuota. `npm run verify-postgres-writes` verifica anche indicatori e audit post-GP in una transazione annullata.

Il database PostgreSQL occupa circa 127 MiB. Il limite del piano Free è 500 MB di database; monitorare anche traffico, egress e sospensione per inattività prima dell'uso da parte di clienti esterni.

La verifica di parità ha confrontato l'hash canonico di tutti gli 892 documenti MongoDB con gli snapshot PostgreSQL: nessuna differenza al momento della verifica.
