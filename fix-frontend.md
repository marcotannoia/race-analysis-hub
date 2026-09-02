# Guida ai contenuti editoriali

## File da modificare

Le analisi editoriali si trovano in:

```text
backend/data/dati-iniziali.json
```

- `analisiGare`: analisi dei singoli piloti;
- `analisiScuderie`: analisi delle scuderie.


## Corrispondenza fra JSON e pagina

| Campo JSON | Testo visibile nella pagina | Modifica diretta |
|---|---|---|
| `risultatiGara` | Storico essenziale → Gara | Sì |
| `risultatiQualifica` | Storico essenziale → Qualifica | Sì |
| `notaBene` | Risultati sul circuito ↳ Analisi | Sì; il blocco non appare se non ci sono eventi |
| `andamentoPerAnno` | Risultati sul circuito ↳ Analisi | Sì, se compilato |
| `gestioneGomme` | Prestazioni e performance ↳ Gestione gomme | Sì |
| `passoGara` | Prestazioni e performance ↳ Passo gara | Sì |
| Compatibilità della scuderia | Considerazioni finali → Compatibilità col circuito | Calcolata nella home |
| Classifica previsionale | Considerazioni finali → Classifica previsionale | Calcolata nella home |
| `aggiornamentiInArrivo` | Aggiornamenti in arrivo → Tipo e benefici attesi | Sì |
| `fonti` | Fonti associate all'analisi | Sì |

I campi `considerazioniFinali`, `passoGara`, `gestioneGomme`, `affidabilita`,
`penalita` e `aggiornamentiInArrivo` alimentano anche la classifica previsionale
della landing page. Le modifiche devono quindi descrivere evidenze reali e non
vantaggi ipotetici presentati come certi.

## Anagrafiche esposte dalle API

Le anagrafiche si trovano nelle sezioni `piloti` e `scuderie` di
`backend/data/dati-iniziali.json`. Dalla versione `1.5.0` vengono esposti anche:

| Campo JSON | Posizione nella risposta API | Regola |
|---|---|---|
| `nazionalitaIso2` | `pilota.nazionalitaIso2` | ISO 3166-1 alpha-2, due lettere maiuscole |
| `nazionalitaIso3` | `pilota.nazionalitaIso3` | ISO 3166-1 alpha-3, tre lettere maiuscole |
| `abbreviazione` della scuderia | `pilota.scuderia.abbreviazione` | identificatore editoriale stabile |
| `colore` della scuderia | `pilota.scuderia.colore` | RGB esadecimale `#RRGGBB` |

`abbreviazioneNome` e `numeroVettura` sono nomi pubblici espliciti derivati dai
campi storici `codice` e `numero`. Non rimuovere questi ultimi: garantiscono la
compatibilità con chi usa già l'API.

`andamentoPerAnno` è un campo particolare:

- se contiene del testo, la pagina mostra esattamente il contenuto inserito;
- se è vuoto, la pagina costruisce l'analisi usando `risultatiGara`,
  `risultatiQualifica` e soltanto le note realmente presenti in `notaBene`;
- le frasi equivalenti a “nessun evento da segnalare” non generano un widget;
- quando il pilota non ha partecipato, nelle schede Gara e Qualifica appare
  soltanto `DNP` (*Did Not Participate*) e quell'anno non genera un'analisi.

## Considerazioni finali

Il frontend non ricava più questa sezione da etichette editoriali come
`FAVORITO`, `PODIO` o `PUNTI`. Pilota e scuderia caricano in parallelo la propria
scheda e `/api/v1/home`: la conclusione mostra la compatibilità reale della
scuderia col circuito e la classifica previsionale già calcolata per il GP.

Nel profilo pilota compare la sua posizione; nel profilo scuderia compaiono le
posizioni di entrambi i piloti. In questo modo i valori restano identici alla
home e non vengono duplicati o ricalcolati nel browser.

## Aggiornamenti e indice previsionale

Il modello distingue quattro casi:

| Stato dell'aggiornamento | Trattamento |
|---|---|
| Nessun pacchetto confermato | Nessun vantaggio aggiuntivo |
| Quasi certo ma non ancora ufficiale | Mostrato come provvisorio, senza bonus previsionale |
| Annunciato ma non verificato | Vantaggio ridotto |
| Già introdotto o confermato | Valutato secondo la pertinenza con la pista |
| Nessun miglioramento reale o scarsa pertinenza | Punteggio ridotto |

Nel testo indicare sempre cosa è stato confermato, se il componente è già stato
usato e quali caratteristiche del circuito può migliorare. Le ipotesi del tipo
“sarebbe utile” non vengono trattate come componenti realmente disponibili.
La compatibilità dichiarata viene inoltre corretta usando la competitività 2026
della scuderia: un'etichetta positiva non può nascondere una vettura debole.

La pagina divide automaticamente il contenuto in due widget: la prima frase
descrive il tipo o il pacchetto e le frasi successive compongono una spiegazione
discorsiva dei benefici attesi. Se il campo è vuoto, la pagina dichiara
esplicitamente che non esistono aggiornamenti o benefici confermati.

## Progressivo del circuito

La home mostra `ordineCalendario/totaleGareCalendario` accanto al GP. Entrambi i
valori seguono il calendario ufficiale della stagione e restano distinti da
`ordineAnalisi` e `totaleGareAnalisi`, che descrivono soltanto la sequenza
editoriale interna.

## Controllare che il JSON sia valido
```bash
node -e "JSON.parse(require('fs').readFileSync('backend/data/dati-iniziali.json')); console.log('JSON valido')"
```

## Applicare le modifiche al database

Prima del seed rigenerare e controllare le traduzioni dei testi modificati,
seguendo [`LOCALIZZAZIONE.md`](LOCALIZZAZIONE.md):

```bash
npm run translate-data -- --dry-run
npm run translate-data
npm run verify-translations
```

Dalla cartella principale:

```bash
cd backend
npm run seed
```

Il comando aggiorna il database indicato da `backend/.env`.

- Se `MONGO_URL` punta al database di produzione, la modifica diventa visibile
  nelle API ufficiali.
- Se punta a un database locale o personale, cambia soltanto quella copia.
- Il push su GitHub non è necessario per aggiornare MongoDB, ma è utile per
  conservare le modifiche di `dati-iniziali.json` nella repository.

## Aggiornamento successivo a un GP

Per registrare i risultati del GP appena concluso si usa invece:

```text
backend/data/aggiornamento-gp.json
```

I campi principali sono:

```json
{
  "posizioneGara": "P4",
  "posizioneQualifica": "Q6",
  "notaRisultato": "Rimonta pulita e senza contatti.",
  "passoGara": "Ritmo costante nel secondo stint.",
  "gestioneGomme": "Degrado controllato sulle medie.",
  "affidabilita": "Nessun problema tecnico."
}
```

Prima di scrivere nel database:

```bash
npm run gp -- --controlla
```

Quando il file è completo, impostare `"pronto": true` ed eseguire:

```bash
npm run gp
```

## Grafici della stagione corrente

I grafici `Andamento in qualifica` e `Andamento in gara` mostrano esclusivamente
la stagione indicata dal Gran Premio attuale, per esempio il 2026.

Le posizioni provengono dallo snapshot locale derivato da F1DB
`v2026.12.0`. Il frontend non interroga provider esterni: il backend legge lo
snapshot, prepara le serie numeriche e restituisce insieme ai dati la fonte, la
versione, la licenza e le trasformazioni applicate.

Le classifiche 2026 e i risultati numerici di gara e qualifica 2023-2025
presenti nel database derivano anch'essi da F1DB. I testi `notaBene`,
`passoGara`, `gestioneGomme`, `considerazioniFinali` e gli altri contenuti
editoriali restano invece quelli modificati manualmente nel JSON.

La risposta relativa all'andamento indica la provenienza:

```json
"fonte": {
  "nome": "F1DB",
  "url": "https://github.com/f1db/f1db/releases/tag/v2026.12.0",
  "licenza": "CC BY 4.0",
  "licenzaUrl": "https://creativecommons.org/licenses/by/4.0/",
  "versione": "v2026.12.0"
}
```

Lo snapshot contiene esclusivamente i GP conclusi inclusi nella release F1DB
dichiarata. I risultati `DNF`, `DNS`, `DSQ` e `NC` restano valori mancanti e non
vengono convertiti in posizioni inventate.

Il comando `npm run gp` aggiorna MongoDB e lo storico editoriale, ma non modifica
automaticamente lo snapshot dei grafici. Per aggiornare quest'ultimo:

```bash
npm run sync-f1db -- /percorso/alla/distribuzione-f1db
npm run verify-data
```

L'attribuzione completa e le condizioni di riutilizzo sono riportate in
`NOTICE.md` e nella documentazione Swagger.

## Personalizzazione da parte di chi usa le API

Le API pubbliche non consentono di modificare il database ufficiale. Un
riutilizzatore può però salvare o trasformare la risposta nel proprio software
e personalizzare campi come `aggiornamentiInArrivo`, `considerazioniFinali` o
`passoGara`.

Se il contenuto personalizzato viene mostrato o distribuito, devono essere
mantenute le attribuzioni previste da `LICENSE.md` e `NOTICE.md` e deve essere
indicato che il testo è stato modificato. Per conservare le modifiche in modo
indipendente, il riutilizzatore deve usare il proprio backend o database: la sua
personalizzazione non cambia le API ufficiali di Race Analysis Hub.
