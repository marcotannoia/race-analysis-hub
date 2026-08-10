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
| `notaBene` | N.B. | Sì |
| `andamentoPerAnno` | Prestazioni e performance → Andamento per anno | Sì, se compilato |
| `gestioneGomme` | Prestazioni e performance → Gestione gomme | Sì |
| `passoGara` | Prestazioni e performance → Passo gara | Sì |
| `considerazioniFinali` | Considerazioni finali | Sì |
| `affidabilita` | Considerazioni finali → Affidabilità | Sì |
| `aggiornamentiInArrivo` | Aggiornamenti in arrivo | Sì |
| `fonti` | Fonti associate all'analisi | Sì |

`andamentoPerAnno` è un campo particolare:

- se contiene del testo, la pagina mostra esattamente il contenuto inserito;
- se è vuoto, la pagina costruisce automaticamente l'andamento usando
  `risultatiGara`, `risultatiQualifica` e `notaBene`.

## Considerazioni finali

Il frontend riconosce alcune etichette all'interno di `considerazioniFinali`:

```json
"considerazioniFinali": "Valutazione generale. Forma 2026: descrizione della forma. Fit pista: descrizione del circuito. Confidenza media: motivazione della confidenza."
```

La prima frase viene mostrata come `Valutazione`. Le frasi che iniziano con
`Forma 2026:`, `Fit pista:` e `Confidenza` vengono separate nelle rispettive
righe. Il campo `affidabilita` genera la riga `Affidabilità`.

## Controllare che il JSON sia valido
```bash
node -e "JSON.parse(require('fs').readFileSync('backend/data/dati-iniziali.json')); console.log('JSON valido')"
```

## Applicare le modifiche al database

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
`v2026.11.0`. Il frontend non interroga provider esterni: il backend legge lo
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
  "url": "https://github.com/f1db/f1db/releases/tag/v2026.11.0",
  "licenza": "CC BY 4.0",
  "licenzaUrl": "https://creativecommons.org/licenses/by/4.0/",
  "versione": "v2026.11.0"
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
