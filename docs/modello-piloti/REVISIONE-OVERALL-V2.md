# Revisione overall v2 — 12 novembre 2026

Analisi di tutti i 12 GP nel database (Zandvoort → Abu Dhabi, 9 conclusi) e del
corpus 2026 fino a San Paolo (round 20). Pesi del modello invariati (43/35/8/10/5,
scelti dall'utente): cambiano solo i calcoli dei singoli fattori e degli overall.

## Problemi trovati

| Area | Problema | Effetto |
|---|---|---|
| Compatibilità pilota-circuito (35%) | Media dei risultati 2023–2026 con le vetture di allora; 2025 al 60% | Russell previsto P1 in 15 GP su 19: Antonelli, rookie nel 2025 (−20 dal compagno), nel 2026 batte Russell 14-6 |
| Compatibilità vettura (43%) | Tutte le gare 2026 con lo stesso peso | Sviluppo in stagione ignorato (Red Bull in crescita) |
| Storico sul circuito | Una o due edizioni senza attenuazione | Valori 0 o 100 da una gara; correlazione con l'esito 0,41 (gara) e 0,54 (qualifica) |
| Passo gara | Media semplice degli ultimi 3 GP | 11 valori 0/100 su Las Vegas e futuri, 18 nulli |
| Gestione gomme | Media degli ultimi 3 GP | L'indice non è stabile fra gare (Spearman ≈ 0,1): 23 valori 0/100 fuorvianti |

## Modifiche

- **Pilota**: scarto dal compagno nella stessa gara (separa pilota e vettura), applicato
  alla vettura attuale; anni precedenti al 15% (nuovo regolamento 2026); 3 osservazioni
  convenzionali a scarto zero per campioni piccoli.
- **Vettura**: gare 2026 con emivita di 4 GP.
- **Storico circuito** (fattore e overall `race_results`/`qualifying_results`): attirato
  verso la stima del pilota / l'indice stagionale con 3 osservazioni convenzionali.
  Idempotente: il valore grezzo resta in `overallOsservato`.
- **Passo gara** (`race_pace`): intera stagione, emivita 6 GP, peso per giri comparabili,
  un'osservazione a 50. Predice il passo della gara successiva meglio (0,795 → 0,825).
- **Gestione gomme** (`tyre_management`): ultimi 3 GP attirati verso 50 con 2 osservazioni.
- Modello: `dinamico-similarita-meteo-v2`. Il contratto API non cambia; nei dettagli interni
  `valorePuro`/`fattoreScuderia` sono sostituiti da `scartoCompagno`/`baseVettura`.

## Backtest 2026, round 2–20 (19 GP, solo dati anteriori a ogni GP)

| Metrica | v1 | **v2** | Mondiale pre-GP | Tetto: qualifica del GP |
|---|---:|---:|---:|---:|
| Spearman, classifica completa | 0,678 | **0,686** | 0,655 | 0,703 |
| Errore medio, completa (posizioni) | 3,526 | **3,488** | 3,785 | 3,335 |
| Spearman, esiti regolari | 0,820 | **0,838** | 0,801 | 0,826 |
| Errore medio, esiti regolari | 2,190 | **2,037** | 2,368 | 2,044 |
| Piloti del podio indovinati (regolari) | 33/57 | **38/57** | 32/57 | 36/57 |
| Vincitori (completa) | 2/19 | **3/19** | 7/19 | 13/19 |

Il v2 migliora in entrambe le metà della stagione (errore regolari 2,20 → 2,03 nei round
2–11, 2,18 → 2,05 nei round 12–20) e in 12 GP su 19. Ogni componente, tolto, peggiora il
risultato. Il vincitore resta il punto debole: nel 2026 hanno vinto sei piloti diversi.

Limiti: 19 GP sono pochi; i parametri sono stati scelti su questi stessi GP (in-sample),
ma sono pochi, semplici e stabili fra le due metà. Release F1DB revisionata e schieramenti
finali: è una ricostruzione, non una previsione salvata prima delle gare.

## Riproduzione e applicazione

```sh
node backend/scripts/backtestModelloDinamico.js            # backtest sul runtime online
node backend/scripts/ricalcolaOverallV2.js                 # simulazione con rollback
node backend/scripts/ricalcolaOverallV2.js --apply         # scrittura transazionale con backup
```

La simulazione del 12 novembre ([report](ricalcolo-overall-v2-simulazione.json)) aggiorna
401 schede e 1.588 punteggi su 12 GP; nessun valore 0/100 residuo su passo, gomme e storico.
Dettaglio per GP: [backtest-v2-2026.json](backtest-v2-2026.json).

**Stato:** pubblicato il 12 novembre 2026. Codice v2 su Render; ricalcolo applicato al
database alle 17:34 UTC (401 schede, 1.588 punteggi) con backup locale in
`output/overall-v2/` e copia in `editorial.post_gp_update.payload.reviewBackup`.

## Previsione del sabato: qualifica del GP

`GET /api/v1/gare/attuale/qualifica` (anche v2) espone la classifica di qualifica del GP
attuale: posizione, tempi Q1/Q2/Q3, esito e fonte. Il server la legge da OpenF1
(`/session_result`, numero vettura → pilota del catalogo) ogni 10 minuti tra la fine
prevista della qualifica e la partenza della gara. La qualifica di San Paolo letta da
OpenF1 coincide con quella F1DB. In riserva:

- `POST /api/dashboard/qualifica` (sessione della dashboard) o `POST /api/admin/qualifica`
  (token admin) con `{}` per acquisire da OpenF1, `{"forza":true}` per sovrascrivere un
  inserimento manuale, `{"ordine":[slug,...]}` per l'ordine manuale, `{"cancella":true}`
  per tornare alla previsione pre-qualifica.
- Lo stato è in `editorial.automation_state` (`qualifica_gp`) e vale solo per il GP su cui
  è impostato; un ordine manuale non viene sovrascritto da OpenF1 senza `forza`.

Con la qualifica disponibile la previsione passa a `fase: "post_qualifica"`: il fattore
`qualificaGp` pesa il 50% e gli altri si riducono in proporzione (scuderie:
`scuderiaQualificaGp`, 60% vettura migliore e 40% l'altra). Penalità FIA e modifiche
della dashboard restano attive.

| Round 2–20 | Pre-qualifica v2 | Con qualifica 50% | Solo qualifica |
|---|---:|---:|---:|
| Spearman, completa | 0,686 | **0,718** | 0,703 |
| Errore medio, completa | 3,49 | **3,28** | 3,34 |
| Errore medio, regolari | 2,04 | **1,95** | 2,04 |
| Vincitori | 3/19 | **12/19** | 13/19 |
| Piloti del podio | 32/57 | **35/57** | 33/57 |

## Segnali valutati e non adottati

| Segnale | Esito | Decisione |
|---|---|---|
| Nuovi pesi dei fattori esistenti (ricerca esaustiva, anche con forma in qualifica) | Fuori campione peggiori di 43/35/8/10/5: walk-forward round 7–20 errore regolari 1,90 → 2,03; leave-one-out 2,04 → 2,06 | Pesi invariati |
| Classifica tempi delle libere (FP1/FP2/FP3, sprint), OpenF1 | Nessun guadagno stabile; oltre il 10% peggiora | Non adottato |
| Passo long run delle libere (stint ≥ 5 giri, per mescola) | Da solo Spearman 0,40; mescolato peggiora | Non adottato |
| Penalità per i ritiri della scuderia | Errore regolari 2,04 → 2,10–2,15 | Non adottato |
| Punti delle ultime 3 gare al 10% | In-sample vincitori 3 → 7; round 7–20 solo 3 → 4 con errore peggiore; in walk-forward 2/14 | Non adottato |
| Similarità fra circuiti più selettiva | Peggiora | Non adottato |

Prima della qualifica il margine è piccolo: il modello (Spearman 0,686) è già vicino a
quello che darebbe la sola qualifica (0,703). L'errore residuo dipende soprattutto da
ritiri (20% dei piloti, 36% dell'errore) ed episodi di gara. Senza carburante e programmi
dei team, i tempi pubblici delle libere non aggiungono informazione affidabile.
Per misurare l'accuratezza reale servirebbe archiviare la previsione pubblicata prima
di ogni GP: i valori qui sono ricostruzioni.

## Partecipazioni dopo San Paolo

Su richiesta del gestore, Hirakawa sostituisce Ocon come scelta editoriale provvisoria
nei GP di Las Vegas, Qatar e Abu Dhabi. L'iscrizione ufficiale resta da confermare:
questa scelta è indicata nelle note delle sei lingue. Ocon resta nello storico delle
gare concluse. Hirakawa è già nel catalogo e ha disputato il Messico 2026 (P10, un punto);
i suoi risultati, qualifiche e giri disponibili sono riutilizzati, senza trasferire
metriche o penalità di Ocon. Gli storici sul circuito mancanti restano nulli.

`node backend/scripts/configuraHirakawaFuturi.js` verifica la sostituzione con rollback
e controlla che la previsione contenga 22 piloti. Dopo il deploy v2 verificato,
eseguire lo stesso script con `--apply`, poi `ricalcolaOverallV2.js --apply`.
Il backup locale `output/overall-v2/backup-partecipazioni-*.json.gz` conserva documenti
e tabelle di partecipazioni, analisi, testi e punteggi; una copia gzip-base64 è
conservata in `editorial.post_gp_update.payload.rosterBackup`. È distinta dal backup
del successivo ricalcolo overall: per annullare anche la sostituzione serve il backup
delle partecipazioni. La sostituzione non modifica i risultati F1DB né i pesi del modello.
