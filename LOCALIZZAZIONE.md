# Localizzazione in sei lingue

Race Analysis Hub pubblica i campi testuali in italiano, inglese, francese,
portoghese europeo, spagnolo e tedesco. L'italiano è la lingua predefinita.

## Uso delle API

Il parametro `lingua` è opzionale e accetta `it`, `en`, `fr`, `pt`, `es` e
`de`:

| Codice API | Catalogo |
|---|---|
| `it` | Italiano |
| `en` | English |
| `fr` | Français |
| `pt` | Português, variante `pt-PT` |
| `es` | Español |
| `de` | Deutsch |

```text
GET /api/v1/home?lingua=en
GET /api/v1/piloti/leclerc?lingua=fr
GET /api/v1/gare/attuale?lingua=de
```

La risposta indica sempre la lingua selezionata nel campo `lingua` e
nell'header `Content-Language`. L'elenco aggiornato è disponibile con:

```text
GET /api/v1/lingue
```

Se `lingua` è assente viene selezionato `it`. Un valore diverso dai sei codici
supportati non produce un fallback silenzioso: la risposta è HTTP `400` con
codice `LINGUA_NON_SUPPORTATA` e l'elenco `lingueSupportate`. Gli altri errori
v1 vengono localizzati nella lingua valida richiesta.

Slug, codici sportivi, codici ISO, nomi propri, valori numerici e URL restano
stabili. Vengono localizzati i testi editoriali, le nazionalità, i nomi e le
descrizioni traducibili dei Gran Premi e i testi della classifica previsionale.

## Selezione nel frontend

Il selettore globale mostra il nome nativo e il codice della lingua. Al primo
accesso usa la prima lingua supportata tra `navigator.languages`; in seguito
riutilizza la scelta salvata in `localStorage` con chiave `race-hub-lingua`.
Ogni cambio aggiorna l'attributo `lang` della pagina e ricarica i contenuti
tramite il parametro API, senza contattare servizi di traduzione esterni.

## Traduzione amministrativa con Azure F0

Lo script `backend/scripts/generaTraduzioni.py` usa Azure Translator F0 solo
durante la manutenzione editoriale. La chiave resta in `backend/.env`, escluso
da Git. Il backend pubblico e il frontend non importano lo script, non leggono
la chiave e non espongono alcun proxy verso Azure.

Configurazione locale:

```env
AZURE_TRANSLATOR_KEY=chiave-privata
AZURE_TRANSLATOR_REGION=global
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

Generazione e controlli:

```bash
npm run translate-data -- --dry-run
npm run translate-data
npm run verify-translations
npm run verify-data
```

Per rigenerare il catalogo applicando glossario e correzioni senza consentire
alcuna chiamata ad Azure:

```bash
npm run translate-data -- --rebuild-from-cache --offline
```

In modalità `--offline` lo script usa esclusivamente la cache locale. Se manca
anche un solo segmento, termina con errore prima di creare il client Azure e
non consuma quota. Per una verifica preventiva non distruttiva si può usare:

```bash
npm run translate-data -- --rebuild-from-cache --dry-run
```

Il riepilogo deve indicare `0 segmenti nuovi` e `0 caratteri`; in caso
contrario non bisogna eseguire la generazione online senza aver prima valutato
la quota residua.

La cache amministrativa `backend/.translation-cache/azure.json` viene scritta
dopo ogni blocco ed è esclusa da Git. Le esecuzioni successive leggono le
traduzioni già presenti e la cache come memoria: se un testo italiano non è
cambiato viene riutilizzata la versione approvata; se viene aggiunto o
modificato, viene tradotto soltanto il nuovo contenuto. Il portoghese richiesto
ad Azure è `pt-PT`. Il glossario integrato uniforma termini di Formula 1 come
passo gara, gestione gomme, fondo, undercut, Safety Car e aggiornamenti tecnici.

Il comando `--dry-run` calcola il consumo senza inviare testo. Lo script pone un
limite di sicurezza inferiore ai due milioni di caratteri F0, usa blocchi
piccoli, limita la velocità e non stampa mai la chiave.

Prima della pubblicazione bisogna comunque leggere le nuove traduzioni nel
contesto, controllare nomi, anni, posizioni `P`/`Q`, acronimi e terminologia
tecnica. I controlli automatici verificano completezza, struttura e codici, ma
non sostituiscono la revisione editoriale del significato.

Per la release `1.11.0` la revisione contestuale comprende anche la nuova prosa
di Gestione gomme e Passo gara, le etichette del calendario e delle
caratteristiche del circuito e lo stato degli aggiornamenti non ufficiali. Le
cinque traduzioni straniere devono conservare gli stessi anni, risultati,
posizioni, punti e livelli di certezza del testo italiano.

Il controllo completo locale, senza consumo Azure, è:

```bash
npm run translate-data -- --rebuild-from-cache --offline
npm run verify-translations
npm run verify-data
npm test
npm run lint:api
npm run lint
npm run build
```

Se le traduzioni sono state revisionate e salvate manualmente nel catalogo,
eseguire anche `npm run translate-data -- --dry-run`: il riepilogo deve indicare
`0 segmenti nuovi` e `0 caratteri`, senza inviare richieste ad Azure.

## Aggiornamento del database ufficiale

Dopo aver approvato le traduzioni:

```bash
npm --prefix backend run seed
npm run verify-db
```

Il seed aggiorna il database indicato da `backend/.env`. Il push su GitHub non
aggiorna MongoDB e il seed non deve essere eseguito senza aver verificato la
destinazione di `MONGO_URL`.

## Anteprima locale isolata

Prima di approvare o pubblicare un catalogo, avviare i due progetti in terminali
separati:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Il comando di sviluppo del backend ignora intenzionalmente il collegamento
Atlas e crea un MongoDB temporaneo in memoria. Importa ogni volta
`backend/data/dati-iniziali.json`, quindi il selettore del frontend mostra la
versione locale esatta che verrebbe successivamente pubblicata. Arrestando il
backend, il database temporaneo viene eliminato. Il comando `npm start` non usa
questa modalità e conserva il comportamento di produzione.

## Testi personalizzati dai riutilizzatori

Le API ufficiali sono di sola lettura. Se un'azienda modifica nel proprio
software `aggiornamentiInArrivo` o un altro campo, sta creando una propria
versione del contenuto: questa modifica non può corrompere le traduzioni nel
database ufficiale.

Per mantenere sincronizzate le proprie sei versioni, il riutilizzatore può
salvare il testo italiano e le traduzioni nel proprio database e applicare lo
stesso schema di memoria di traduzione. Quando cambia il testo sorgente deve
marcare le vecchie traduzioni come da aggiornare, rigenerarle localmente e
approvarle prima di pubblicarle. Le modifiche distribuite devono essere
dichiarate e devono rispettare le attribuzioni di `LICENSE.md` e `NOTICE.md`.
