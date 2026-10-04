# Database e confronto storico — 5 ottobre 2026

**Atlas aggiornato e riletto: zero differenze. I nuovi indici sono sperimentali: il confronto non dimostra una precisione maggiore del riferimento mondiale.**

Questa revisione aggiorna quella del 4 ottobre: riguarda tutte le 396 schede dei 12 circuiti, non soltanto i GP futuri. Copertura: 23 piloti, 11 scuderie, 12 gare, 264 analisi pilota e 132 analisi scuderia. Nelle analisi sono presenti 5.016 campi semantici; gli overall globali e i campi del circuito sono aggiuntivi.

## Che cosa è stato aggiornato

- Fonte sportiva portata a [F1DB v2026.16.0, CC BY 4.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0), fino a Sepang. Serie 2026 unica a 16 GP; rimosso il duplicato Sepang dalla lista delle integrazioni allo snapshot.
- Riscontrati 2.376 risultati storici 2023–2025, 34 classifiche correnti e 110 schede pilota con gara/qualifica 2026 negli eventi conclusi.
- Corrette 63 posizioni di qualifica negli archivi e 6 classificazioni di gara rispetto ai dati precedenti. Fase Q1/Q2/Q3, posizione e griglia ora sono distinte. Russell a Sepang è P20 con ritiro, non una gara completata.
- Corretto lo schieramento storico di Zandvoort: Tsunoda partecipante, Hadjar assente e Lawson in Red Bull. Aggiunto l’archivio Monza.
- Riscritti N.B., passo, gomme, affidabilità, aggiornamenti e conclusioni delle 396 schede nelle sei lingue: eliminate deduzioni causali non sostenute dai dati e riferimenti vecchi ai punti o alla Sprint di Austin.
- Salvati overall con campione, metodo, stato e limite temporale. Nei cinque GP conclusi le conclusioni indicano esplicitamente il ricalcolo retrospettivo.

## Significato dei campi

| Campo | Overall / significato | Limite |
|---|---|---|
| Risultati gara / qualifica | Media di 100×(N−posizione)/(N−1), da 0 a 100 | Esiti regolari per la gara; non è una misura del pilota isolata dalla vettura |
| Andamento / trend | Ultimi 3 GP con presenza contro i 3 precedenti; delta dell’indice | Vettura, pista e condizioni possono cambiare |
| Affidabilità | Percentuale di esiti regolari fra le partenze documentate | Include incidenti e squalifiche; non è affidabilità meccanica |
| N.B. | Contesto documentato; overall numerico null | Note e responsabilità non sono voti prestazionali |
| Passo gara | null / non misurato | Occorrono giri comparabili |
| Gestione gomme | null / non misurata | Occorrono stint e degrado comparabili |
| Aggiornamenti | null per il beneficio isolato | Installazione o annuncio non dimostrano un guadagno |
| Compatibilità tecnica | Stima editoriale distinta dal valore osservato | Esclusa dal modello semantico |
| Conclusioni | Indice sperimentale aggregato dai risultati | Non è probabilità di vittoria o arrivo |

**ND/null non significa zero né prestazione media.** Solo durante il calcolo il modello usa una prior convenzionale 50 e due osservazioni per attenuare i campioni piccoli; gli overall mancanti restano null nel database. Gli overall non sono valori telemetrici e non giustificano causalmente potenza, trazione, frenata o degrado.

## Pesi e valutazione cronologica

Pesi fissati per questo esperimento, prima del calcolo: rendimento recente 45%, qualifica recente 30%, rendimento della scuderia 20%, storico personale sul circuito 5%. Nessuna ricerca dei pesi che meglio descrivono le gare appena viste. Il modello è salvato in metodiPrevisionali con stato **sperimentale_non_promosso**.

I primi 3 GP servono da warm-up. Per ogni gara successiva i fattori utilizzano soltanto round precedenti e storico 2023–2025. Non vengono usati risultato, qualifica o griglia del GP target. L’universo dei partecipanti è quello finale del weekend. È una simulazione ricostruita oggi su una release revisionata dopo gli eventi, non una prova delle previsioni effettivamente pubblicate prima delle gare.

| Metrica su 13 GP / 286 classificazioni | Nuovi indici | Mondiale precedente al GP |
|---|---:|---:|
| Errore medio assoluto, posizioni | 3,972 | 3,958 |
| Correlazione Spearman media | 0,613 | 0,621 |
| Vincitori corretti | 4/13 | 6/13 |
| Piloti del podio riconosciuti, senza richiedere ordine | 15/39 | 19/39 |
| Piloti della top 10 riconosciuti | 96/130 | 96/130 |


La differenza media fra gli indici nuovi e il mondiale è piccola e non è stata sottoposta a un test di significatività. Il mondiale fa meglio su vincitori e podi in questo campione: non si può affermare che i nuovi pesi aumentino l’accuratezza. Negli ultimi cinque GP l’errore medio è 3,891 contro 3,691 posizioni.

## Cinque GP conclusi presenti nel database

| GP | Podio previsto dagli indici | Podio reale | Vincitore corretto | Errore medio |
|---|---|---|---|---:|
| zandvoort | LEC / HAM / NOR | NOR / ANT / RUS | No | 3,455 |
| monza | ANT / NOR / LEC | ANT / RUS / VER | Sì | 3,818 |
| madring | NOR / ANT / RUS | ANT / VER / NOR | No | 3,455 |
| baku | ANT / RUS / NOR | RUS / VER / HAD | No | 5,273 |
| sepang | RUS / VER / ANT | VER / ANT / HAM | No | 3,455 |


Le classifiche complete, le differenze per ogni pilota e i confronti su tutti i 13 GP sono nel [backtest strutturato](/Users/marcotannoia/f1_stats/backend/data/backtest-semantico-2026-10-05.json). Include anche il filtro diagnostico degli esiti regolari, che usa un’informazione post-gara e non va presentato come nuova previsione.

## Ricalcolo con i pesi correnti del modello editoriale

È stato effettuato anche sui cinque GP coperti dai profili del progetto, usando classifiche e risultati anteriori alla gara. I profili tecnici sono però quelli aggiornati oggi; etichette e bonus senza snapshot precedente sono resi neutri. Per questo il risultato seguente è **diagnostico con informazione editoriale successiva**, non validazione fuori campione e non ricostruzione della classifica pubblicata allora.

| GP | Errore medio | Vincitore corretto | Piloti del podio riconosciuti |
|---|---:|---|---:|
| zandvoort | 3,182 | No | 2/3 |
| monza | 3,273 | Sì | 2/3 |
| madring | 3,091 | Sì | 2/3 |
| baku | 4,545 | No | 1/3 |
| sepang | 3,273 | No | 1/3 |


I pesi correnti senza meteo sono 42% compatibilità, 28% circuiti simili, 10% aggiornamenti, 8% rendimento pilota recente, 5% andamento mondiale, 3% qualifica, 2% storico personale, 2% scuderia recente. Questi pesi restano editoriali e non calibrati. La successiva revisione del codice corregge la formula di penalità nel modello v4.1; dettagli in ALGORITMI.md. Il nuovo modello semantico resta sperimentale.

## Overall e schede per tutti i circuiti

| Circuito / GP | Stato | Dossier |
|---|---|---|
| Gran Premio d'Olanda | conclusa | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/olanda-zandvoort.md) |
| Gran Premio d'Italia | conclusa | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/italia-monza.md) |
| Gran Premio di Spagna | conclusa | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/spagna-madring.md) |
| Gran Premio dell'Azerbaigian | conclusa | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/azerbaigian-baku.md) |
| Gran Premio del Bahrein in Malesia | conclusa | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/bahrein-sepang.md) |
| Gran Premio di Singapore | attuale | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/singapore-marina-bay.md) |
| Gran Premio degli Stati Uniti | futura | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/usa-austin.md) |
| Gran Premio di Città del Messico | futura | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/messico-citta-del-messico.md) |
| Gran Premio di San Paolo | futura | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/brasile-interlagos.md) |
| Gran Premio di Las Vegas | futura | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/usa-las-vegas.md) |
| Gran Premio del Qatar | futura | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/qatar-lusail.md) |
| Gran Premio di Abu Dhabi | futura | [22 piloti e 11 scuderie](/Users/marcotannoia/f1_stats/docs/revisione-database-2026-10-05/abu-dhabi-yas-marina.md) |

## Raccolta per i prossimi GP

Il database conserva un protocollo per ogni circuito. Prima della gara: snapshot datato di input, pesi e previsione; entry list e specifiche per vettura; decisioni FIA; nomine e prescrizioni Pirelli; meteo nella fascia di sessione. Per ogni giro: tempo/settori, mescola ed età, stint, condizioni, traffico, SC/VSC/red flag, in/out lap e limiti della stima carburante. I confronti devono registrare i giri esclusi e il motivo. Senza campioni comparabili, il relativo overall resta null. Queste misure sono **da acquisire**, non risultati già raccolti.

## Limiti ancora presenti

- Benefici prestazionali degli aggiornamenti e nomine/prescrizioni dei weekend futuri non sono tutti verificabili oggi.
- Il registro di errori del pilota e gare bagnate non è completo: gli indici semantici li marcano da verificare. Le percentuali preesistenti di statistiche-contesto.json non sono certificate da questa migrazione; quel file non è una collezione Atlas.
- Geometria e dati di contesto sono marcati riscontrati/editoriali/conflitto. Restano documentate le divergenze fra F1 e F1DB per FP1 Singapore e distanza Abu Dhabi; carico, stress e richieste 0–100 non sono misure validate.
- Dati e metodi nuovi sono salvati su Atlas. Nessuna distribuzione del backend è stata eseguita: l’algoritmo pubblico non diventa automaticamente il modello semantico.

## Applicazione e verifiche

La prima transazione ha aggiornato 442 documenti nelle cinque collezioni del prodotto e salvato il metodo/backtest. Una seconda transazione ha aggiunto il protocollo di raccolta alle 12 gare; dopo la revisione degli algoritmi sono stati aggiornati altri 52 documenti e il backtest. Backup privati prima delle operazioni; guardia updatedAt e rilettura completa dopo il commit. Ultima rilettura: applicato_e_verificato, 0 differenze. verify-db: zero differenze e copertura 23/11/12/264/132. Test: 92 passati; qualità, traduzioni e documentazione verificate.

Evidenze: [ultime modifiche Atlas](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/migrazione-database-2026-10-05.json); [correzioni degli archivi](/Users/marcotannoia/f1_stats/docs/verifica-gp-2026-10-04/correzioni-archivi-2026-10-05.json); [5.016 campi semantici](/Users/marcotannoia/f1_stats/backend/data/revisione-semantica-2026-10-05.json); [hash delle fonti](/Users/marcotannoia/f1_stats/backend/data/fonti-f1db-v2026.16.0.json).

Per riprodurre: usare i JSON della release verificata; eseguire rivediDatiSemantici.js e valutaPrevisioniStoriche.js. aggiornaDatabaseSemantico.js prepara l’anteprima senza --applica; applica soltanto con --applica, backup e controlli di concorrenza. Nessuna cancellazione o seed globale.
