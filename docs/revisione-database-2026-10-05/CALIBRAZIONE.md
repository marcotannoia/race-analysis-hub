# Calibrazione dei pesi — 5 ottobre 2026

**16 GP, 4.598.126 combinazioni, pesi interi a passi dell’1%.** Ricerca esaustiva sul simplesso di cinque fattori con somma 100: rendimento recente, qualifica recente, scuderia recente, storico circuito e mondiale precedente.

## Risultato

Migliore combinazione comune: **14 / 47 / 19 / 7 / 13%**. Ordine dei fattori: rendimento / qualifica / scuderia / storico / mondiale.

| Confronto | MAE esiti regolari | MAE classifica completa |
|---|---:|---:|
| iniziali | 2,42 | 4,153 |
| globale | 2,239 | 3,955 |
| ottimoWeekend | 1,841 | 3,869 |
| mondiale | 2,587 | 4,153 |

Il fit comune riduce l’errore regolare da 2,420 a 2,239 posizioni. Gli ottimi per singolo GP arrivano a 1,841, ma usano il risultato di quel weekend per scegliere i pesi: sono ricostruzioni del passato e non previsioni.

## Verifica temporale e metodo attivo

Walk-forward round 4–16, con training solo sui GP precedenti: errore regolare 2,249 contro 2,4 del riferimento mondiale. Sulla classifica completa: 3,783 contro 3,923.

Controllo fisso: pesi congelati dopo round 12, test sui round 13–16. Errore regolare **2,789 contro 2,282**; completa 3,932 contro 3,636.

La regola di adozione richiede miglioramento in entrambi i controlli. Il candidato non è promosso. La previsione attiva usa **100% mondiale**, con gli altri sette campi ordinari a peso zero per preservare il contratto API. Il mondiale è normalizzato tra i partecipanti; assenti dai dati ricevono la prior neutra 50. Non è una probabilità. Le penalità confermate riducono l’indice separatamente, fino al 35%.

Per i GP correnti/futuri il mondiale viene letto dal database aggiornato; per scenari passati resta il limite temporale esclusivo. Confidenza bassa. Meteo, richieste tecniche e aggiornamenti restano contesto senza bonus numerici non verificati.

## Ogni weekend

| Round | Circuito | Pesi R/Q/S/H/M % | MAE regolare ottimo | Esclusi | Dossier |
|---|---|---|---:|---:|---|
| 1 | melbourne | 45 / 30 / 20 / 5 / 0 | 4,125 | 6 | [Classifiche e cause](weekend-calibrazione/1-melbourne.md) |
| 2 | shanghai | 50 / 24 / 13 / 0 / 13 | 1,733 | 7 | [Classifiche e cause](weekend-calibrazione/2-shanghai.md) |
| 3 | suzuka | 7 / 37 / 56 / 0 / 0 | 1,5 | 2 | [Classifiche e cause](weekend-calibrazione/3-suzuka.md) |
| 4 | miami | 5 / 71 / 20 / 4 / 0 | 2,222 | 4 | [Classifiche e cause](weekend-calibrazione/4-miami.md) |
| 5 | montreal | 42 / 19 / 15 / 24 / 0 | 1,625 | 6 | [Classifiche e cause](weekend-calibrazione/5-montreal.md) |
| 6 | monaco | 49 / 6 / 20 / 25 / 0 | 2,267 | 7 | [Classifiche e cause](weekend-calibrazione/6-monaco.md) |
| 7 | catalunya | 9 / 19 / 48 / 21 / 3 | 0,429 | 8 | [Classifiche e cause](weekend-calibrazione/7-catalunya.md) |
| 8 | spielberg | 1 / 52 / 0 / 47 / 0 | 1,111 | 4 | [Classifiche e cause](weekend-calibrazione/8-spielberg.md) |
| 9 | silverstone | 9 / 57 / 29 / 5 / 0 | 2,316 | 3 | [Classifiche e cause](weekend-calibrazione/9-silverstone.md) |
| 10 | spa-francorchamps | 0 / 7 / 79 / 11 / 3 | 1,053 | 3 | [Classifiche e cause](weekend-calibrazione/10-spa-francorchamps.md) |
| 11 | hungaroring | 19 / 7 / 31 / 43 / 0 | 1,895 | 3 | [Classifiche e cause](weekend-calibrazione/11-hungaroring.md) |
| 12 | zandvoort | 7 / 80 / 0 / 11 / 2 | 1,75 | 6 | [Classifiche e cause](weekend-calibrazione/12-zandvoort.md) |
| 13 | monza | 16 / 24 / 22 / 7 / 31 | 1,368 | 3 | [Classifiche e cause](weekend-calibrazione/13-monza.md) |
| 14 | madring | 19 / 30 / 10 / 5 / 36 | 1,556 | 4 | [Classifiche e cause](weekend-calibrazione/14-madring.md) |
| 15 | baku | 4 / 0 / 14 / 41 / 41 | 2,4 | 7 | [Classifiche e cause](weekend-calibrazione/15-baku.md) |
| 16 | sepang | 30 / 4 / 35 / 7 / 24 | 2,211 | 3 | [Classifiche e cause](weekend-calibrazione/16-sepang.md) |

## Esclusioni e limiti

**obiettivo:** Minimizzare la somma degli errori assoluti di posizione tra gli esiti regolari; classifiche ristrette agli stessi piloti. Media aggregata pesata sul numero di esiti.

**outlier:** Esclusione uniforme per cause di ritiro documentate o DSQ/EX/DNS/DNF/NC, indipendente dal favorito o dall'errore del modello. Cause non specificate non vengono attribuite a guasti. Incidenti inclusi nelle esclusioni, responsabilità non dedotta.

**limiti:** Filtro degli esiti noto dopo la gara: valuta il rendimento condizionato a esiti regolari, non l'accuratezza della classifica integrale. Danni, errori o penalità di piloti classificati senza causa documentata non sono esclusi arbitrariamente.

**riferimento:** Mondiale precedente fra i presenti; piloti senza un dato mondiale ricevono la prior neutra 50. Non è una probabilità né il punteggio mondiale.

**primaGara:** Tutti i fattori usano soltanto round precedenti e storico dei 3 anni precedenti. Nel primo GP i fattori 2026 restano neutri.

**verificaTemporale:** Walk-forward round 4–16: training soltanto sulle gare precedenti. Holdout fisso round 13–16: pesi congelati dopo round 12. La calibrazione finale su tutti i 16 GP è in-sample.

**adozione:** Calibrazione finale adottata soltanto se sia holdout fisso sia walk-forward migliorano la MAE regolare rispetto al mondiale. Altrimenti adottato il mondiale, candidato conservato come sperimentale. Nessuna prova di significatività con questo piccolo campione.

**datiEsclusi:** compatibilità tecnica editoriale senza snapshot pre-gara; similarità tecnica senza snapshot pre-gara; meteo storico non archiviato; beneficio upgrade non misurato; passo cronometrico; degrado gomme; penalità non archiviate prima della gara

**caveat:** Release F1DB revisionata dopo gli eventi ed entry list finale utilizzate per ricostruire lo scenario; nessuna affermazione di previsione originale salvata nel weekend.

Le esclusioni sono 76 su 352 classificazioni: restano 276 esiti regolari. Non vengono eliminati errori grandi del modello né risultati sfavorevoli del favorito senza causa documentata. Danni o incidenti di piloti classificati senza causa registrata non sono esclusi arbitrariamente.

La release è revisionata dopo le gare; l’entry list finale è usata come universo del weekend. Si analizzano i sedici Gran Premi principali, non una previsione separata delle Sprint. Qualifica significa i GP precedenti, senza la qualifica del target. Il primo GP non ha input sportivi 2026, quindi usa lo storico disponibile e prior neutre.

## Riproduzione e aggiornamento

`node backend/scripts/calibraPesiPrevisionali.js /percorso/f1db-v2026.16.0 1`

`node backend/scripts/aggiornaPrevisioniCalibrate.js`

[Dati completi della ricerca](../../backend/data/calibrazione-pesi-2026-10-05.json), [campioni verificati](../../backend/data/campioni-previsionali-2026.json), [migrazione Atlas](migrazione-calibrazione.json). Hash delle fonti e del corpus conservati nel risultato; verifica in avvio fra corpus e calibrazione.

Atlas conserva il nuovo metodo e, per le 12 gare del prodotto, la previsione selezionata e il candidato non promosso. Test backend e decodifica Swift nelle sei lingue; nessuna modifica nativa necessaria. Push e verifica della distribuzione backend seguono i controlli del codice.
