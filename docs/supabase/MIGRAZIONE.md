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
Gli elenchi usano `{ dati, paginazione }`, con `limit` 1–100 e `offset` 0–1000000.
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

## Pubblicazione verificata

Deploy Render `dep-dba9vnbncjis73cpavsg` riuscito il 18 ottobre 2026 alle 12:31
Europe/Rome, commit `d0c825aee973e08a9d0378282841191f4b00feb1`.
`DATABASE_CONNECTION` è stato salvato come segreto nel servizio `f1_stats`,
con autorizzazione esplicita dell'utente. Il valore non è incluso nel repository.

La verifica pubblica successiva ha restituito HTTP 200 per tutti i 19 endpoint
registrati in `VERIFICA-PUBBLICA.json`. `/api/v2/health` conferma Supabase;
la valutazione gomme di Leclerc ad Austin è stata confrontata con il valore
Postgres (24/100). Gli URL v1 restano invariati e i campi `overall` precedenti
sono conservati. Le API v2 sono raggiungibili sullo stesso dominio Render.


## Completamento del codice e del caricamento

La v2 comprende ora tutti i servizi applicativi della v1, con analisi numeriche,
e aggiunge circuiti, iscrizioni e storico risultati direttamente dal database
relazionale. Il sito usa i servizi v2 per home, schede e confronti.

Rieseguita la sincronizzazione transazionale: 442 documenti e 3.168 valutazioni
nel modello `risultati-semantici-v1`. Ogni punteggio e campione viene confrontato
con il valore atteso prima del commit; le fonti del modello sono sostituite per
non conservare riferimenti obsoleti. Le altre versioni dei modelli sono preservate.

Verifica database: 1.172 gare F1DB, 188.111 righe di sessione, 23 piloti, 11 scuderie,
12 GP applicativi, 264 iscrizioni, 264 analisi pilota e 132 analisi scuderia.
Il corpus non è cambiato rispetto al precedente caricamento verificato.

`npm --prefix backend run verify-db` supporta le stesse variabili di connessione
del server e verifica TLS con la CA Supabase. `verify-api:v2` controlla tutti i
nuovi servizi e la compatibilità v1. Impostare `API_BASE_URL` per verificare il
server pubblico e passare un percorso file per conservare il rapporto JSON.

Il blueprint Render rispecchia il servizio Starter esistente e la variabile
`DATABASE_CONNECTION`, senza includere il valore del segreto.


### Rilascio completo verificato

Commit applicativo `32687fc58ae18dc2559fb27286c4fbe6c07671ac`, deploy Render
`dep-dbaita8ae00c739r67lg`: Live il 18 ottobre 2026 alle 22:40 Europe/Rome.
Il contratto pubblico espone 24 percorsi v2, oltre al documento OpenAPI.
Tutti i 41 controlli pubblici sono passati, inclusi gli errori attesi per query
errate, gli endpoint dei GP precedenti, le ultime pagine dello storico e la v1.
110 test backend passati; OpenAPI v1/v2 validati e build frontend riuscita anche
su un'esportazione pulita del commit. Verificata visivamente la scheda Leclerc
pubblicata, con storico risultati e punteggi gomme 24/100 e passo gara 82.9/100.
Rapporto dettagliato: `VERIFICA-V2-PUBBLICA.json`.

### Compatibilità dei contenuti editoriali

La v2 conserva anche i testi localizzati della v1: risultati, note, prestazioni, affidabilità, considerazioni finali e dettagli per anno. Le valutazioni numeriche restano campi separati con scala 0–100; `null` indica dati insufficienti. I contenuti provengono dagli stessi documenti già migrati in PostgreSQL, senza duplicare o inventare dati. Le proprietà tecniche del circuito sono condivise fra v1 e v2: quando assenti anche nella sorgente v1, non vengono sostituite con valori presunti.

### Completamento dei campi v2

`nota_bene` e `considerazioni_finali` sono alias testuali localizzati. `affidabilita`, `prestazioni.affidabilita` e `valutazioni.affidabilita` sono numeri 0–100: quota delle partenze senza guasti tecnici documentati, esclusi DNS ed esiti con causa ignota. Incidenti e collisioni non contano come guasti. Campione, guasti, fonti e metodo sono disponibili in `affidabilitaNumerica`. Il completamento resta una metrica distinta. Il contratto testuale della v1 resta disponibile.

La previsione espone `aggiornatoIl` e `calcolatoIl` dalla data persistita del calcolo, senza sostituirla con l'ora della richiesta. Austin usa 1,016 km per il rettilineo opposto T11–T12 (Aston Martin, 2021) e circa 60% del tempo sul giro a pieno gas (Haas, 2016); provenienza, anno e approssimazione sono espliciti in `circuitoTecnico.provenienzaDati`. Il secondo dato è un riferimento storico, non una misurazione 2026.

`node backend/scripts/completaDatiV2.js` verifica il piano; `--apply` persiste i dati e gli indici in transazione conservando un backup locale privato. Il ciclo automatico post-GP ricalcola anche l'affidabilità dai nuovi risultati.
