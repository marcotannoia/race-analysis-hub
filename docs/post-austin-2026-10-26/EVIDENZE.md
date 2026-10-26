# Post-GP Austin — 26 ottobre 2026

## Dati applicati

- GP concluso: Austin 2026, round 18. GP attuale: Città del Messico, round 19.
- F1DB: `v2026.18.0`, archivio SHA-256 `fba7a98c9b0ee946525e6ef497a86eb933f45fbf40398dd568e60196724e0840`.
- Importazione del cambio GP: 102 documenti, 594 punteggi, 3.566 righe delle sessioni della stagione.
- Revisione approfondita: 435 documenti e 3.564 punteggi, applicati dopo simulazione con rollback.
- OpenF1 Austin: sessione `11396`, 22 piloti, 1.166 giri, 54 stint, 32 pit, 173 record race control, 159 meteo e 24.227 intervalli.
- Copertura complessiva delle evidenze: 48 sessioni, incluse tutte le 18 gare 2026.
- Backup della revisione: `reviewBackup`, codifica `gzip-base64`, 5.604.048 byte codificati. Non è esposto nell’API pubblica.

La prima procedura su tutti i testi ha provocato disconnessioni del database durante
le simulazioni. La versione finale comprime il backup nel client e aggiorna/verifica
le schede in blocchi di 12, mantenendo una transazione unica. La simulazione corretta
e l’applicazione finale sono riuscite. Il database ha recuperato le connessioni;
la verifica prima dell’applicazione riportava circa 180 MiB e tutti i vincoli soddisfatti.

## Previsioni e pattern

Con il modello pubblicato congelato `forma-recente-v1`, input antecedenti ad Austin
e partecipanti effettivi, la ricostruzione ha MAE **2,182** sull’ordine completo e
**1,158** sui classificati regolari. Il riferimento basato solo sul mondiale ha MAE
**2,364** e **1,158** rispettivamente. Questo confronto singolo non giustifica nuovi pesi.
Non è una previsione salvata prima della gara.

L’errore più evidente nella parte alta riguarda Russell: posizione ricostruita 2,
risultato 8. Leclerc è ricostruito 5 e termina 2. Le dichiarazioni e la cronaca
suggeriscono di verificare traffico, sequenze di gomme e strategie; non dimostrano
un guadagno costante da attribuire ai prossimi GP.

Per il Messico i profili tecnici editoriali selezionano Madring, Baku e Sepang come
circuiti più simili tra quelli conclusi e profilati. Red Bull mostra in quei tre GP
una media di posizione migliore della propria media stagionale; il rapporto contiene
i campioni per pilota e scuderia. Non è una probabilità di vittoria né una prova
causale: campione ridotto, ritiri e forza delle vetture possono alterare l’associazione.
I pattern delle altre gare future sono nel [rapporto completo](REVISIONE.json).

## Ricerca delle fonti

| Fonte | Riscontro e utilizzo |
| --- | --- |
| [F1DB v2026.18.0](https://github.com/f1db/f1db/releases/tag/v2026.18.0) | Risultati e corpus della stagione, con checksum verificato. |
| [Formula 1: risultati Austin](https://www.formula1.com/en/results/2026/races/1297/united-states/race-result) | Riscontro indipendente dal parsing FIA dell’ordine finale. |
| [Formula 1: dichiarazioni dopo Austin](https://www.formula1.com/en/latest/article/what-the-teams-said-race-day-in-the-united-states-2026.4FopoItrER6KX395f6ZENu) | Contesto di traffico, strategie e neutralizzazione finale; dichiarazioni attribuite, non voti numerici. |
| [Pirelli: mescole del trittico](https://press.pirelli.com/the-compound-selection-for-austin-mexico-city-and-so-paulo/) | C3/C4/C5 confermate per Messico e San Paolo. |
| [Formula 1: programma Messico](https://www.formula1.com/en/latest/article/formula-1-gran-premio-de-la-ciudad-de-mexico-2026.14b3wTWzNNLJ5Wd8cG7HCQ) | Gara il 1 novembre alle 20 UTC, 21 in Italia; qualifica 31 ottobre alle 21 UTC. Soggetto a revisioni. |
| [Pitpass: risultato](https://www.pitpass.com/83916/United-States-Grand-Prix-Result) | Riscontro di stampa, subordinato alle classifiche ufficiali rettificate. |
| [Discussione pubblica post gara](https://www.reddit.com/r/formula1/comments/1xfemqj/2026_united_states_grand_prix_postrace_discussion/) | Spunti su VSC, aria libera e differenze tra compagni, da verificare sui giri. |

Le prove FIA con URL e digest sono nel rapporto e nell’audit dell’importazione.
La ricerca è estesa ma non può essere letteralmente esaustiva di Internet.
Il registro editoriale versionato è `backend/data/ricerca-post-gp-2026.json`.

## Limiti mantenuti espliciti

- I risultati di qualifica e gara del Messico sono ancora mancanti.
- Meteo e aggiornamenti tecnici del weekend vanno acquisiti quando disponibili.
- Il passo usa giri filtrati; la deriva gomme non isola usura fisica, carburante o gestione volontaria.
- Gli indicatori cumulativi di errori e bagnato non sono dedotti dalle sole classifiche e non sono stati dichiarati aggiornati da questa procedura.
- I risultati sintetici delle altre sessioni provengono da F1DB; la derivazione dettagliata OpenF1 attuale riguarda le gare, non telemetria privata o GPS.
- Nessun cambiamento del binario nativo è incluso: l’app riceve i nuovi dati dalle API.

## Verifiche

132 test backend e 5 test Python dei filtri; qualità dati, traduzioni, documentazione,
OpenAPI v1/v2, lint frontend e build completati. La qualità dei file base resta riferita
al seed v2026.17.0; il corpus aggiornato v2026.18.0 è persistito nel database e ricaricato
a runtime. Le verifiche online finali sono registrate separatamente.


## Compatibilità con FantaStats GP

Il controllo con il decoder nativo ha riprodotto un errore di tipo in
`analisi.prestazioni.affidabilita`: il client attende una stringa, mentre il server
restituiva un numero. È stato ripristinato il testo in quel campo; gli indici
meccanici restano numerici nei campi dedicati. Il test pubblico con i modelli
nativi ora legge tutti i 22 piloti, le 11 scuderie e le sei lingue.
I dettagli sono in [verifica nativa](VERIFICA-NATIVA.txt) e nei rapporti API.
Non è stata modificata né distribuita una nuova build App Store.

Il meteo delle prossime gare viene ora configurato da coordinate e orari F1DB nel
database, superando il precedente supporto limitato a Singapore. La verifica del
26 ottobre ha restituito una previsione Open-Meteo per la fascia 20–22 UTC del
1 novembre in Messico. È un massimo orario previsto, non una probabilità combinata
né una condizione meteo già osservata.
