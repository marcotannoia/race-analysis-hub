# Migrazione FantaStats a Supabase — 18 ottobre 2026

## Database verificato

Progetto `druzzflduoeqfhywkumx`, organizzazione FantaStats, piano Free.
La connessione Session pooler funziona con TLS e verifica del certificato Supabase.
La CA pubblica è inclusa in `backend/relational/certs/prod-ca-2021.crt` e proviene da
`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.

Il database conteneva già gli schemi relazionali `catalog`, `editorial`, `ratings`,
`f1db`, `live_fia` e `archive`. Sono stati riutilizzati, senza creare le tabelle
`public.f1_*` del primo progetto locale. Le migrazioni precedenti sono state
recuperate dalla cronologia del database e salvate in `supabase/migrations/`.

Sono state applicate due migrazioni additive ai vincoli dei punteggi: `score` può
restare `null`; un campione zero è ammesso solo quando il punteggio è mancante.
I valori misurati continuano a richiedere un campione positivo e una scala 0–100.

## Sincronizzazione eseguita

Transazione completata: 442 documenti di compatibilità e 3.168 valutazioni per GP
(2.112 pilota, 1.056 scuderia), distribuite su otto metriche. I punteggi mancanti
sono 131 per i piloti e 64 per le scuderie. Verifica SQL: zero punteggi fuori scala
o con campione invalido. Classifiche sincronizzate con il corpus locale effettivo.
Il database occupa circa 135 MB dopo l'operazione (quota Free: 500 MB).

Il corpus resta F1DB v2026.17.0 con gli archivi locali applicati; non è stato
importato un nuovo aggiornamento sportivo online. Il GP attuale è Austin.
Le fonti dei punteggi sono collegate nelle tabelle `ratings.*_score_source`.

Prima della sincronizzazione sono stati conservati backup JSON delle tabelle
interessate in `.codex_work/supabase-backup/`, esclusa da Git. Il processo è
transazionale e usa un lock; verifica anche l'uguaglianza dei payload prima del commit.

## Backend

`DATA_PROVIDER=postgres` seleziona il repository Postgres per le API v1
(ed è già il valore predefinito in produzione).
`DATABASE_CONNECTION` contiene la connessione Session pooler privata; è accettato
anche gli alias `SUPABASE_DATABASE_URL` e `SUPABASE_DB_URL`. Il certificato viene verificato: non occorre
impostare `rejectUnauthorized=false`. `SUPABASE_CA_FILE` permette una CA esplicita.

Anagrafiche, classifiche, stato delle gare e punteggi vengono letti dalle tabelle
relazionali. `editorial.source_document` conserva la rappresentazione precedente
per compatibilità con testi, traduzioni e metadati v1. Non è un database MongoDB:
il server legge queste informazioni da Postgres. I rapporti del monitor FIA sono
letti e aggiornati in `live_fia.report`.

Gli schemi applicativi restano privati: il pubblico passa dal backend Express,
senza accesso anonimo al database o credenziali Postgres nel browser.

## API e client

Nessun endpoint v1 è stato rimosso o rinominato. Le analisi aggiungono `valutazioni`
e `valutazioniPerAnno`. I precedenti campi testuali conservano i tipi per evitare
rotture nei client iOS e nelle integrazioni esistenti. Il sito usa i nuovi punteggi
al posto dei paragrafi su gomme, passo e riepilogo delle prestazioni.

La v2 è aggiuntiva e legge direttamente i dati relazionali. Risorse:
`/api/v2/piloti`, `/scuderie`, `/gare`, `/metriche`, `/valutazioni`;
health `/api/v2/health`, contratto `/api/v2/openapi.json`.
Gli elenchi usano `{ dati, paginazione }`, con `limit` 1–100 e `offset` 0–100000.
Valutazioni: filtri `anno`, `metrica`, `gara`, `pilota`, `scuderia`.
La v2 espone le valutazioni aggregate per la stagione del GP; i punteggi annuali
storici disponibili restano nella rappresentazione v1 `valutazioniPerAnno`.

`completamento` comprende incidenti e squalifiche, non è affidabilità meccanica.
Il punteggio gomme descrive una deriva cronometrica relativa, non l'usura fisica.
`null` non va sostituito con zero o 50. Nomi, date, posizioni e punti mantengono
le loro unità originali.

## Comandi

- `npm --prefix backend start`: backend completo, con provider selezionato dall'ambiente.
- `npm --prefix backend run migrate:supabase`: prepara e valida il piano di sincronizzazione.
- `npm --prefix backend run migrate:supabase -- --apply`: backup e sincronizzazione transazionale.
- `npm --prefix backend run dev`: ambiente temporaneo MongoDB isolato per sviluppo.

## Verifiche

108 test passati sul ramo di rilascio basato sui commit remoti già pubblicati;
il nuovo test canonico applica le vere migrazioni in PostgreSQL embedded e verifica
lettura v1, API numerica, punteggi mancanti, vincoli e accesso anonimo negato.
OpenAPI v1/v2 e build frontend validati.

`VERIFICA-LOCALE.json` registra 19 endpoint verificati con HTTP 200 sul backend
locale collegato al vero database Supabase. Il deploy Render e la verifica degli
endpoint sul dominio pubblico vengono registrati separatamente: una verifica
locale non conferma la pubblicazione.
