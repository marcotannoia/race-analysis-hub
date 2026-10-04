# Verifica dei GP rimanenti — 4 ottobre 2026

**Esito: risultati storici e classifiche effettive coerenti; testi previsionali e metodo non ancora certificabili come accurati.**

Sono state controllate 231 schede: 22 piloti e 11 scuderie per ciascuno dei 7 GP rimanenti. Sepang è già concluso e viene usato come riferimento aggiornato. Tsunoda resta nella classifica a 23 piloti, ma non ha una scheda da partecipante ai GP futuri: lo schieramento definitivo andrà confrontato con ogni entry list FIA.

## Cosa è verificato

| Controllo | Risultato |
|---|---|
| 1.386 voci storiche 2023–2025: gara e qualifica, piloti e scuderie | 0 differenze rispetto alla release F1DB v2026.16.0 scaricata oggi |
| 23 classifiche piloti e 11 classifiche scuderie dopo applicazione archivi | 0 differenze rispetto alla nuova release |
| Partenze in carriera dei 22 partecipanti | Tutte coincidenti con F1DB; il dato Tsunoda è assente nelle statistiche locali |
| Date, format e geometria dei 7 GP | Riscontro con F1; divergenze FP1 Singapore e distanza Abu Dhabi segnalate sotto |
| Test esistenti e verifica interna dati | 80 test passati; verify-data passato |
| API pubblica | Singapore attuale, classifiche post-Sepang; modello dichiarato v3 |
| Database Atlas | Connessione non riuscita; sincronizzazione diretta non verificata |

F1DB è una banca dati derivata, distinta dalla fonte sportiva ufficiale. Le classifiche post-Sepang sono state riscontrate anche sulle pagine [piloti](https://www.formula1.com/en/results/2026/drivers) e [scuderie F1](https://www.formula1.com/en/results/2026/team). La release usata è [F1DB v2026.16.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0), con attribuzione e licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Errori e limiti da risolvere

1. **Testi obsoleti:** 150 schede contengono punti 2026 diversi dalla classifica effettiva, con 246 occorrenze nei campi analizzati. Esempio Austin: Antonelli 219 invece di 320; Mercedes 379 invece di 556. Tutte e 7 le schede generali dei GP contengono almeno una posizione mondiale superata nei favoriti. Singapore indica Russell P3/Hamilton P2, mentre la classifica effettiva e pubblica indica P2/P3.
2. **Austin non è Sprint nel 2026:** 33 schede motivano assetto o gestione gomme con un formato che non è previsto. La sola Sprint fra i GP rimanenti è Singapore. [Calendario Sprint FIA](https://api.fia.com/news/fia-and-formula-1-announce-2026-sprint-calendar), [programma Austin](https://www.formula1.com/en/racing/2026/united-states).
3. **Serie non uniformemente aggiornata:** il modello locale aggiunge Sepang soltanto per Singapore e solo con lo snapshot predefinito; per gli altri GP usa ancora gli eventi fino a Baku. La serie annuale in andamentoAnnuale.js resta anch’essa ferma allo snapshot. L’endpoint stagione aggiunge Sepang da un altro JSON: esistono tre percorsi temporali distinti.
4. **Ritiro e classificazione confusi:** nell’archivio Sepang Russell è DNF; F1DB e il risultato ufficiale gli attribuiscono P20 con ritiro per perdita di potenza. Occorre mantenere sia la classificazione sia lo stato di ritiro: un numero non significa gara conclusa. [Risultato F1](https://www.formula1.com/en/results/2026/races/1308/bahrain/race-result).
5. **Penalità non monotona:** con indice base 40 e penalità di 3 posizioni il valore penalità è 70 e l’indice diventa 40×0,65 + 70×0,35 = 50,5. La penalità può quindi migliorare il punteggio. È un difetto della formula, dimostrato su un caso sintetico; non è una penalità attribuita a un pilota reale.
6. **Bonus per annunci:** un testo di annuncio pertinente genera 65,75 anziché il valore neutro 50, pur con stato “Annunciato, da verificare”. Questo contraddice la prudenza dichiarata nei profili. Serve distinguere annuncio, pezzo dichiarato/installato e beneficio misurato. Tutte le 231 schede future hanno il campo aggiornamenti vuoto: significa informazione mancante, non assenza di novità.
7. **Peso dominante di ipotesi editoriali:** senza meteo, compatibilità e circuiti simili pesano insieme il 70%. Le capacità 0–100 non hanno errori di misura o intervalli; le fonti non giustificano i singoli valori numerici. Raffreddamento, quota, temperatura gomme e strategia non sono dimensioni separate.
8. **“Circuiti simili” su un campione ristretto:** su 15 GP dello snapshot soltanto 4 possono partecipare alla selezione, perché il progetto dispone dei profili di Zandvoort, Monza, Madrid e Baku. Suzuka, Silverstone, Monaco, Ungheria ecc. sono esclusi. Il punteggio di similarità non è una correlazione verificata dei tempi o dei risultati.
9. **Passo e gomme:** media dell’arrivo, recupero da qualifica e punti non dimostrano passo o degrado. In 11 schede la “media griglia” non coincide con le posizioni di partenza F1DB; qualifiche, penalità e pit lane vanno distinte. I 231 campi affidabilità sono vuoti, pur essendoci ritiri tecnici recenti.
10. **Confidenza non calibrata:** il codice ricava bassa/media/alta da etichette e quantità di storico. Non è una probabilità empirica di correttezza. Non sono presenti una validazione fuori campione o confronti con un riferimento semplice; i test funzionali non sostituiscono questi controlli.

## GP e dossier completi

Gli orari sotto sono convertiti in **Europe/Rome**, inclusa la fine dell’ora legale il 25 ottobre. Le date sono confermate nel [calendario F1 corrente](https://www.formula1.com/en/racing/2026).

| GP | Gara in Italia | Formato | Verifica specifica |
|---|---|---|---|
| [Singapore](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/singapore-marina-bay.md) | 11/10/26, 14:00 | Sprint | Favoriti vecchi; FP1 discordante F1DB/F1 |
| [Austin](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/usa-austin.md) | 25/10/26, 21:00 | Standard | Correggere riferimenti Sprint |
| [Messico](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/messico-citta-del-messico.md) | 01/11/26, 21:00 | Standard | Aggiornare forma e contenuti dopo Sepang |
| [Interlagos](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/brasile-interlagos.md) | 08/11/26, 18:00 | Standard | Aggiornare forma e contenuti dopo Sepang |
| [Las Vegas](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/usa-las-vegas.md) | 22/11/26, 05:00 | Standard | Aggiornare forma e contenuti dopo Sepang |
| [Qatar](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/qatar-lusail.md) | 29/11/26, 17:00 | Standard | Aggiornare forma e contenuti dopo Sepang |
| [Abu Dhabi](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/abu-dhabi-yas-marina.md) | 06/12/26, 14:00 | Standard | Distanza discordante F1DB/F1 |


FP1 Singapore: locale e pagina F1 08:30 UTC, nuova release F1DB 09:30 UTC; non modificare la finestra dei monitor sulla sola base del dato derivato. Abu Dhabi: F1 mostra 306,188 km, F1DB e progetto 306,183 km. Sono conflitti documentati, distinti dagli errori certi. [Singapore F1](https://www.formula1.com/en/racing/2026/singapore), [Abu Dhabi F1](https://www.formula1.com/en/racing/2026/united-arab-emirates).

## Scuderie: riscontri più recenti e aggiornamenti

La tabella distingue quanto emerso a Sepang dal trasferimento a un GP futuro. Sono parafrasi brevi delle [dichiarazioni pubblicate da F1 dopo Sepang](https://www.formula1.com/en/latest/article/what-the-teams-said-race-day-in-bahrain-2026.4kwHL7ygJLqVlSMHhAj6ce); una dichiarazione del team non isola un guadagno causale.

| Scuderia | Evidenza/limite a Sepang |
|---|---|
| Mercedes | Aggiornamenti presenti a Sepang; beneficio isolato non dimostrato. Russell: perdita di potenza. |
| Ferrari | Rimonta dopo scelta iniziale delle slick; strategia e contatto condizionano il risultato. |
| McLaren | Nuovi pezzi valutati positivamente dal team, ma ritmo insufficiente. Norris: errore sotto Safety Car. |
| Red Bull Racing | Aggiornamenti prestazionali dichiarati dal pilota; Hadjar segnala sottosterzo nel finale. |
| Racing Bulls | Entrambe a punti; strategia e partenza favorevoli. Non prova di superiorità tecnica generalizzata. |
| Alpine | Scelta delle slick penalizzante; Gasly perde tempo già prima della partenza. |
| Haas | Strategie iniziali diverse; Ocon penalizzato dal finale. Nessun guadagno isolato verificato. |
| Audi (linea Sauber) | Punti mancati in gara condizionata da episodi; evitare deduzioni automatiche sulla gestione gomme. |
| Williams | Albon: cambio; Sainz: contatto. Separare affidabilità e incidente dal passo. |
| Aston Martin | Alonso sfrutta occasione da punti; risultato singolo non dimostra un salto tecnico stabile. |
| Cadillac | Bottas: uscita; Pérez: molte soste. Risultati poco adatti a stimare degrado o passo pulito. |


Il [documento FIA Car Presentation Submissions di Sepang](https://www.fia.com/system/files/decision-document/2026_bahrain_grand_prix_in_malaysia_-_car_presentation_submissions.pdf) è indicizzato ufficialmente, ma il download del contenuto ha ripetutamente restituito timeout. Il suo elenco componenti non è stato certificato. Per tutte le scuderie i pacchetti specifici dei prossimi 7 GP rimangono da verificare con documenti, disponibilità sulle singole vetture e riscontri in pista: un campo vuoto non basta.

Le note del profilo tecnico locale sulle evoluzioni fino a Baku sono riportate per ciascuna squadra nei dossier: costituiscono provenienza esistente da aggiornare, non una nuova verifica di quei benefici. La performance futura non è ancora osservabile.

## Sensibilità del modello ai dati aggiornati

Ho ricalcolato gli indici in uno scenario diagnostico senza meteo e senza penalità live. L’unico cambiamento negli input del confronto è la sostituzione della serie fino a Baku con la serie F1DB fino a Sepang. I profili e i pesi restano quelli esistenti. **Questo non è un miglioramento predittivo validato e non va pubblicato come nuovo pronostico.**

| GP | Russell prima → dopo, posizione/indice | Verstappen prima → dopo, posizione/indice |
|---|---|---|
| Singapore | P2/83.9 → P2/83.8 | P4/83.5 → P4/83.5 |
| Austin | P2/87.1 → P7/76.5 | P5/81.5 → P2/85.4 |
| Messico | P1/87.3 → P4/83.6 | P3/83.5 → P2/84 |
| Interlagos | P2/87.2 → P7/76.8 | P5/81.6 → P2/85.4 |
| Las Vegas | P1/87.7 → P2/84 | P3/83.5 → P3/84 |
| Qatar | P2/87.3 → P7/77.9 | P5/81.2 → P3/82.9 |
| Abu Dhabi | P1/87.5 → P4/83.8 | P3/83.4 → P2/83.9 |


Le differenze ampie ad Austin e in Brasile dipendono anche dal fatto che Sepang entra fra i due circuiti simili selezionati. Il ritiro tecnico di Russell viene trattato principalmente come cattivo risultato, senza separare il passo osservato: aggiornare i dati risolve la freschezza, non questo problema metodologico.

## Locali, pubblici e verifiche mancanti

L’API pubblica espone statistico-editoriale-v3, il codice locale statistico-editoriale-v4. Nello snapshot pubblico letto oggi la prima posizione di Singapore è Russell (87,5), mentre il ricalcolo locale asciutto dà Antonelli (86,5). Si tratta di versioni/output diversi; nessuna conclusione sulle sole etichette di versione. Il payload completo è conservato in api-pubblica.json. Le rotte dei sei GP futuri restituiscono 404 per scelta esplicita del controller, che pubblica solo il GP attuale: non è una prova di dati mancanti nel database.

La connessione ad Atlas non è riuscita: il client non ha raggiunto un server del cluster. Il messaggio suggerisce di verificare anche la allowlist, ma non dimostra da solo la causa. Non ho modificato la allowlist. Nessuna sincronizzazione o distribuzione è stata eseguita in questa verifica. Le traduzioni non sono state riesaminate linguisticamente; la loro verifica automatica non dimostrerebbe la correttezza delle conclusioni tradotte.

## Come rendere le previsioni verificabili

1. Correggere fatti e riferimenti temporali in tutte le lingue; mantenere un’unica serie di eventi conclusi e una sola definizione di classificazione/ritiro.
2. Rendere le penalità sempre peggiorative o neutrali, con effetto calibrato su griglia, pista e prestazione; eliminare bonus di performance per meri annunci.
3. Collegare ogni forza/debolezza a una misura o a una dichiarazione datata e pertinente; indicare ipotesi e dati mancanti. Per il passo usare giri comparabili, separando mescola/età, traffico, neutralizzazioni e incidenti. Per le gomme non usare il solo risultato finale.
4. Conservare previsioni e input prima di ciascun weekend. Confrontare il modello, usando solo informazioni disponibili allora, con ordinamento da mondiale e forma recente. Non utilizzare profili rivisti dopo la gara per dimostrarne retroattivamente la precisione.
5. Misurare errore di posizione e qualità dell’ordinamento; se si introducono probabilità, misurarne la calibrazione. Valutare separatamente GP asciutti/bagnati, Sprint/standard, ritiri e cambi di scuderia. Se il modello non migliora i riferimenti, ridurre complessità e peso degli indici editoriali.
6. Verificare nei weekend futuri entry list, penalità, prescrizioni gomme, aggiornamenti sulle singole vetture e meteo della fascia gara. Per Austin–Abu Dhabi il servizio meteo locale non ha configurazione. I conteggi di bagnato/errori hanno vincoli aritmetici validi, ma manca un registro completo di eventi e attribuzioni per verificarli uno per uno.

## Evidenze e riproducibilità

Riferimenti nel codice esaminato: [formula penalità](/Users/marcotannoia/f1_stats/backend/services/classificaPrevisionale.js:755), [inserimento speciale di Sepang](/Users/marcotannoia/f1_stats/backend/services/classificaPrevisionale.js:637), [bonus aggiornamenti](/Users/marcotannoia/f1_stats/backend/services/classificaPrevisionale.js:515), [confidenza](/Users/marcotannoia/f1_stats/backend/services/classificaPrevisionale.js:572), [serie annuale](/Users/marcotannoia/f1_stats/backend/services/andamentoAnnuale.js:61).

- [Audit numerico e schede strutturate](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/audit.json): riscontri, hash degli input, tutte le classifiche diagnostiche e i 231 record.
- [Snapshot API pubblica](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/api-pubblica.json): risposte lette oggi, senza credenziali.
- [Script di confronto in sola lettura](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/audit.cjs) e [generatore del rapporto](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/report.cjs).

Le due release F1DB sono state scaricate dall’asset ufficiale GitHub e confrontate con il digest della release. SHA-256 v2026.15.1: 79f5c1df8c6f58ed6e2b50c9d7a7cd73b4eb9ec9678ed60d0349390e12758049. SHA-256 v2026.16.0: 5bfcde5546bd16ec58a86a87c5d1e4c4150c2ec680480ea5cc487cb6223ea45f.

Per rieseguire: scaricare/estrarre f1db-json-splitted.zip dalla release v2026.16.0; eseguire node docs/verifica-gp-2026-10-04/audit.cjs /cartella/dei/json e poi node docs/verifica-gp-2026-10-04/report.cjs. Il secondo comando usa lo snapshot API salvato, non lo aggiorna.

I dati di prodotto, il modello e le modifiche di lavoro già presenti sono stati lasciati invariati. Il rapporto certifica i confronti descritti; non garantisce la precisione delle gare future.
