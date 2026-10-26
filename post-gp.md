# Procedura completa dopo ogni Gran Premio

Documento operativo per aggiornare Race Analysis Hub e le API usate da FantaStats GP.
La richiesta «esegui il post-GP» comprende tutte le fasi qui descritte, inclusa la
pubblicazione. Non richiede di inventare dati che le fonti non hanno pubblicato.

## 1. Risultato atteso

| Area | Operazione | Verifica di completamento |
| --- | --- | --- |
| GP concluso | Archiviare risultati di gara, qualifica, prove, eventuali sprint, griglie, giri veloci, pit stop e classifiche disponibili. | Stagione/round e partecipanti corretti; confronto con la classifica finale FIA. |
| Stagione | Aggiornare il corpus quantitativo e le tabelle della stagione corrente. | Fonte F1DB, checksum e ultimo round registrati nell’audit PostgreSQL. |
| Analisi | Aggiornare overall, rendimento, qualifica, completamento, affidabilità, passo e gomme dove misurabili. | Punteggi e campioni coerenti tra documenti e tabelle; mancanti a `null`. |
| GP successivo | Passare al prossimo appuntamento del calendario verificato. | Un solo GP attuale, quello concluso archiviato. |
| Futuri GP | Aggiornare gli input stagionali e confrontare circuiti, piloti e scuderie. | Solo risultati antecedenti al GP; nessuna posizione futura inventata. |
| Previsioni | Valutare gli errori sul GP finito e ricalcolare il prossimo con input aggiornati. | Metriche separate per ordine completo e classificati regolari. |
| App e API | Pubblicare e verificare il servizio effettivamente online. | Contratti v1/v2, sei lingue, GP, anno, qualifiche e punteggi coerenti. |

«Tutti i dati» significa tutti i gruppi accessibili, pertinenti e verificabili:
non garantisce la disponibilità di telemetria privata, misure fisiche di usura,
carburante o informazioni non ancora pubblicate. Registrare sempre le lacune.

## 2. Due livelli di esecuzione

**Server, già automatico:** controllo ogni 30 minuti, F1DB stabile, checksum,
classifica finale FIA, transazione, archiviazione e cambio GP. Non dipende dal Mac.
Riferimento: [automazione del server](docs/supabase/AUTOMAZIONE-GP.md).

**Revisione approfondita:** il comando `review:gp` acquisisce i giri mancanti della
stagione da OpenF1, applica i filtri, aggiorna passo/gomme nelle schede e nei
punteggi, analizza i circuiti simili e salva una revisione persistente nel database.
Richiede Node, Python 3, dipendenze backend e connessione PostgreSQL configurata.
Il controllo di questa chat è pianificato ogni sei ore e rimane silenzioso in assenza di novità.
Non è un servizio Python eseguito da Render. Eseguirlo da questo ambiente, anche
quando una successiva esecuzione autonoma riprende questa procedura.

La ricerca editoriale sul web resta una fase distinta: nessun comando presente
sostituisce la lettura e verifica di notizie, documenti tecnici e discussioni.

## 3. Sequenza dei comandi

Dalla radice del repository, con un `backend/.env` già configurato. Non stampare
credenziali. Non eseguire seed o sincronizzazioni integrali del catalogo: possono
ripristinare vecchi GP e sovrascrivere modifiche online.

```sh
# 1. Simulazione con rollback e confronto FIA/F1DB.
npm --prefix backend run check:auto-gp

# 2. Applicazione del cambio GP, se il server non lo ha già fatto.
npm --prefix backend run check:auto-gp -- --apply

# 3. Acquisizione, derivazione dei giri e revisione, con rollback.
npm run review:gp

# 4. Applicazione verificata della revisione al database.
npm run review:gp -- --apply

# 5. Verifiche della base dati e del codice prima della pubblicazione.
npm run verify-db
npm run verify-translations
npm run verify-data
npm run verify-docs
npm test
python3 -m unittest discover -s backend/test -p '*_test.py'
npm run lint:api
npm --prefix backend run lint:api:v2
npm run lint
npm run build
```

Il comando di revisione usa l’ultima release stabile già importata e validata;
si arresta se il corpus online appartiene a una release differente. Riutilizza le
sessioni già presenti; scarica quelle mancanti con cache locale e backoff.
`POST_GP_OUTPUT=/percorso` cambia la cartella di lavoro, predefinita `output/post-gp`.
Non pubblicare questa cartella: contiene cache e artefatti intermedi.

Una correzione della fonte o un hash incoerente richiede una nuova acquisizione
controllata, non la modifica manuale del checksum. Non riutilizzare cache di una
sessione che si sa essere stata rettificata senza averla nuovamente verificata.

## 4. Acquisizione e qualità

1. Verificare anno, round, circuito, fuso, fine della gara e identità degli iscritti.
2. Acquisire la release F1DB stabile e confrontare SHA-256 con il manifest ufficiale.
3. Confrontare numeri vettura, posizioni e punti con la classifica finale FIA.
4. Importare i gruppi disponibili di tutte le sessioni della stagione: prove,
   qualifica, griglie, sprint, gara, pit, giri veloci e classifiche.
5. Per i GP conclusi acquisire piloti, giri, stint, pit, race control, meteo e
   intervalli OpenF1. Conservare URL, hash, numerosità e session key.
6. Derivare passo e deriva gomme con i filtri esistenti: partenza, pit, bandiere,
   SC/VSC, pioggia, traffico, mescola ed età. Riportare esclusioni e campioni.
7. Aggiornare le traduzioni quantitative nelle sei lingue. Conservare gli storici
   precedenti e i cutoff delle analisi passate.
8. Verificare separatamente gli indicatori di errori e bagnato: non sono aggiornati
   dalla sola classifica. Non presentare i loro campioni precedenti come nuovi.

La deriva dei tempi non misura l’usura fisica. Una classifica finale non dimostra
un errore del pilota o un guasto. Un componente dichiarato non dimostra un guadagno.
Le sessioni OpenF1 di prove/qualifica non vengono trattate come passo gara:
i loro risultati sintetici provengono da F1DB; la derivazione dettagliata attuale
riguarda le gare. Telemetria vettura e posizione GPS non sono acquisite da questo comando.

## 5. Ricerca estesa per GP concluso e prossimo GP

Consultare fonti ufficiali e indipendenti, cercando anche smentite delle ipotesi.
Non esiste una ricerca letteralmente esaustiva di tutto Internet.

| Priorità | Fonti | Uso |
| --- | --- | --- |
| 1 | FIA: classifiche, decisioni, race control, Car Presentation, mappe e note del direttore. | Risultati, penalità, revisioni, componenti e vincoli del weekend. |
| 2 | Formula 1, F1DB, OpenF1, Pirelli, comunicati dei team. | Calendario, risultati, misure, mescole e dichiarazioni attribuite. |
| 3 | Testate tecniche e cronache indipendenti. | Incrociare strategia, problemi, traffico e contesto. |
| 4 | Forum, Reddit, discussioni e analisi pubbliche. | Individuare domande e pattern da verificare; mai promuovere una voce a fatto. |

Per ogni evidenza registrare URL, pubblicazione, acquisizione, evento, entità,
asserzione, stato confermato/provvisorio/smentito e riscontro. Conservare riassunti
originali e riferimenti; non copiare integralmente articoli o aggirare accessi.
Per il prossimo GP verificare programma e fusi, iscritti, mescole, meteo aggiornato,
penalità riportate, lavori sul circuito e pacchetti tecnici effettivamente dichiarati.
Qualifica e risultato rimangono mancanti finché la sessione non è stata disputata.

## 6. Data mining e revisione delle previsioni

Il rapporto automatico confronta ogni futuro GP con i tre circuiti conclusi più
simili tra quelli con profilo tecnico. La similarità pesa le differenze nelle dieci
richieste tecniche del circuito target. È una misura editoriale di somiglianza.

Per pilota e scuderia riporta risultati regolari, numero di eventi, posizione media
e differenza rispetto alla media stagionale. La differenza è un’associazione
esplorativa: campioni piccoli, ritiri esclusi e forza della vettura possono distorcerla.
Le osservazioni di due vetture non equivalgono a due GP indipendenti.

La revisione ricostruisce il GP appena concluso con pesi congelati e soli input
anteriori al target. Non la chiamare previsione archiviata prima della gara: usa
l’elenco effettivo dei partecipanti. Confrontare MAE completa e MAE dei regolari;
spiegare gli errori usando soltanto evidenze verificabili.

Nuovi pesi o nuovi fattori richiedono una valutazione cronologica su più gare,
un confronto con il modello pubblico e un intervallo mai usato per selezionare
il candidato. Un miglioramento retrospettivo su una singola gara non basta.
Il comando aggiorna gli input; **non cambia automaticamente i pesi del modello**.

## 7. Pubblicazione e controllo online

Le scritture passano dalla procedura transazionale con lock, controllo delle
modifiche concorrenti, backup compresso nel client e verifica dei documenti in piccoli blocchi.
Il backup della revisione è conservato nell’audit con codifica `gzip-base64`;
lo si decodifica e decomprime prima di qualsiasi ripristino controllato. Non introdurre SQL manuale
per manipolare risultati o aggirare una verifica fallita.

Per modifiche al codice: verificare il diff, conservare modifiche estranee,
committare e pubblicare sul ramo collegato a Render. Attendere la fine del deploy;
un push riuscito non dimostra che il nuovo codice sia attivo.
Il solo aggiornamento dati non richiede un nuovo binario App Store. Una modifica
nativa richiede invece il relativo percorso di build e distribuzione.

Controllare il backend e il dominio pubblico:

- [Stato dell’automazione](https://f1-stats-5v93.onrender.com/api/v2/automazione)
- [Ultima revisione e pattern](https://f1-stats-5v93.onrender.com/api/v2/revisione-post-gp)
- [GP attuale v2](https://f1-stats-5v93.onrender.com/api/v2/gare/attuale)
- [Home v1](https://f1-stats-5v93.onrender.com/api/v1/home)
- [Sito](https://www.race-analysis-hub.it)
- [Questa procedura online](https://f1-stats-5v93.onrender.com/post-gp.md)

Verificare anche lingua inglese, numeri di partecipanti, anno dello storico,
qualifica, campioni di passo/gomme, previsioni e assenza di risultati futuri.
Non dichiarare «tutto aggiornato» se una fonte, il deploy o una verifica è ancora in attesa.

## 8. Rapporto finale di ogni esecuzione

Registrare data e ora, GP concluso e attuale, release e checksum, prove FIA,
righe importate, sessioni e giri acquisiti, copertura per pilota/scuderia, lacune,
pattern esplorativi, errori del modello, fonti editoriali, controlli e URL online.
In caso di attesa, indicare il motivo e riprendere dalla fase incompleta.
