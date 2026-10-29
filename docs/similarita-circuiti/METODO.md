# Somiglianza tra circuiti — versione 2

**Stato al 29 ottobre 2026:** 23 circuiti, 22 criteri compilati per circuito, 506 valori e 253 confronti tra coppie. Le approssimazioni sono quelle autorizzate dall'utente; fonti, formule e qualità restano visibili per ogni campo. La richiesta di accelerazione è stata rimossa da tutte le schede.

## Formula e percentuali

Ogni criterio pesa **100/22 = 4,545454…%**. Per un criterio numerico:

`somiglianza = 100 × max(0, 1 − |valore A − valore B| / scala)`

Le scale sono fisse, esplicite e versionate in `backend/services/similaritaCircuiti.js`. Sono scelte iniziali per il confronto, non parametri già validati sulle previsioni. Una differenza pari alla scala dà 0%; valori identici danno 100%. La percentuale di una coppia non cambia aggiungendo una pista al catalogo.

| Criterio categorico | Somiglianza |
|---|---|
| Carico aerodinamico basso/medio/alto | 100% uguale, 50% tra livelli adiacenti, 0% basso contro alto |
| Pioggia sì/no | 100% uguale, 0% diverso |
| Tipologia circuito | 100% uguale, 50% tra ibrido e altra categoria, 0% cittadino contro permanente |

La percentuale finale è la media aritmetica dei 22 risultati. **Non è una probabilità di vittoria né una garanzia di uguale comportamento delle vetture.** La scheda espone anche il numero di criteri che impiegano stime.

Il motore conserva la gestione dei mancanti: se in una raccolta futura mancherà un valore, la media completa sarà `null`, con media parziale, copertura e intervallo possibile separati. Le stime esplicite sono invece ammesse, come richiesto.

## Come sono stati completati i campi

| Campo | Dato utilizzato | Limite dell'approssimazione |
|---|---|---|
| Curve, lunghezza e distanza gara | F1DB v2026.17.0 e riscontro delle schede ufficiali F1 | Conservate eventuali differenze rispetto allo snapshot; si usa la distanza programmata |
| Altitudine | Quota del punto F1DB dal DEM Copernicus via Open-Meteo; Messico e Interlagos da Mercedes | Quota ambientale di riferimento, non rilievo del piano pista |
| Temperature, umidità e vento | Medie OpenF1 delle gare 2023–2025, uguale peso per edizione | Descrivono quelle sessioni, non la climatologia annuale |
| Madrid e Sepang: meteo | Gara 2026 già conclusa, con fonte e anno espliciti | Riferimento alternativo: non viene presentato come storico F1 2023–2025 |
| Numero e lunghezza totale dei rettilinei | Stima dalla centrolinea geografica pubblica: campioni ~10 m, variazione di direzione <8° su ~60 m, tratto >=150 m, interruzioni <=30 m ricucite | Conta tratti quasi rettilinei secondo una convenzione unica; può includere sezioni che una guida raggruppa diversamente |
| Cambi di direzione per km | Alternanze sinistra/destra delle curve Torqlytics, incluso ultima–prima; dove necessario stima dalla mappa | Non misura ogni piccola correzione del volante |
| G laterale per km | Media pubblicata delle curve Torqlytics / km; in assenza, media cinematica indicativa da posizioni e velocità OpenF1 / km | Medie degli apici e medie dei campioni sotto carico hanno definizioni diverse; confronto indicativo, non omogeneità da laboratorio |
| G in frenata per km | Media dei campioni con freno attivo e decelerazione 0,2–6,5 g, ricavata dalla velocità filtrata, poi divisa per km | Non è un dato IMU né la somma di tutte le frenate |
| Velocità media del circuito | Lunghezza del layout / durata del miglior giro di riferimento Q | Influiscono vettura, anno, assetto e condizioni |
| Velocità media delle curve | Media delle velocità minime pubblicate curva per curva; in alternativa media dei campioni con G laterale stimato >=0,5 g | Le due medie sono riferimenti diversi, dichiarati nel campo `metodo` |
| Velocità massima e minima | Estremi dei campioni del giro di riferimento Q | Non sono record assoluti della pista |
| Dislivello | Differenza pubblicata tra punto più alto e più basso, in metri | Il nome tecnico del criterio ora dice “Dislivello di riferimento (max–min)”; non viene chiamata pendenza media |
| Carico aerodinamico | Enum **basso / medio / alto**, classificazione tecnica indicativa del profilo pista e delle guide | È un'interpretazione editoriale, non una misura di forza né un enum necessariamente dichiarato dalla fonte citata |
| DRS / Overtake | Un punto di rilevamento/abilitazione per giro, secondo la configurazione standard Overtake 2026 descritta da F1 | Non sono i vecchi conteggi DRS né le zone Straight Mode; il riferimento è la regola generale, non una verifica individuale di tutte le mappe FIA |
| Meteo medio | **si/no** alla pioggia, secondo la maggioranza delle edizioni osservate; parità → si | I dettagli pioggia sì/no di ogni edizione sono conservati in `meteoEdizioni` |
| Variabilità meteo | `100 × 4 × p × (1−p)`, dove p è la frazione di edizioni piovose | Una sola edizione produce zero variabilità osservata, senza dimostrare un clima stabile; `campioneLimitato` lo segnala |

Per Las Vegas, Lusail e Yas Marina le posizioni 2025 non erano disponibili dalla fonte: **G laterale e velocità in curva usano un giro Q 2024**, acquisito tramite API. Per Baku, Madrid e Sepang le velocità mancanti sono state recuperate dalle qualifiche 2026 già disputate. Le altre velocità di riferimento restano del 2025. Il fatto che un riferimento sia stato trovato e compilato non lo rende indipendente dall'anno e dalla vettura.

## Fonti principali

- Calendario effettivo: [Formula 1 2026](https://www.formula1.com/en/racing/2026), 23 sedi incluso Sepang.
- Identificativi e geometria ufficiale di base: [F1DB v2026.17.0](https://github.com/f1db/f1db/releases/tag/v2026.17.0), già presente nel progetto, con riscontri sulle schede F1.
- Meteo, velocità e posizioni: [OpenF1](https://openf1.org/docs/). Risposte acquisite con URL, istante di raccolta e SHA-256; la selezione di sessioni 2026 richiede che siano concluse entro il 29 ottobre 2026.
- Mappe geografiche: [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits), Copyright Tomislav Bacinger, MIT. Licenza conservata in `backend/data/fonti-similarita/LICENZA-MAPPE.txt`. Le mappe comunitarie possono rappresentare versioni approssimate o precedenti del tracciato; le lunghezze derivate vengono riscalate alla lunghezza ufficiale corrente.
- Curve, direzioni, velocità e carichi pubblicati: [Torqlytics](https://torqlytics.com/circuits) e relativa [metodologia](https://torqlytics.com/methodology). I riferimenti numerici aggregati e le direzioni estratte sono conservati in `riferimenti-curve-web.json`.
- Quote: [Open-Meteo Elevation API](https://open-meteo.com/en/docs/elevation-api). Attribuzione **Copernicus programme / ESA e Open-Meteo**, DOI [10.5270/ESA-c5d3d65](https://doi.org/10.5270/ESA-c5d3d65); DEM GLO-90, risoluzione 90 m.
- Dislivelli: [Formula 1, confronto altimetrico](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc), più guide specifiche per le sedi mancanti, collegate nei singoli campi. I dati storici sono riferimenti, non rilievi nuovi del 2026.
- Madrid: [scheda tecnica del circuito](https://www.madring.com/en/circuit).
- Overtake: [guida ufficiale F1 2026](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) e [terminologia ufficiale](https://corp.formula1.com/f1-2026-regulations-terminology-update/).

## Collegamento alla classifica

La classifica calibrata espone `confrontoCircuiti`: tutti gli altri 22 circuiti, percentuale totale, dettagli per criterio, fonti, qualità e metodo. `circuitiSimili` seleziona i due confronti completi più alti tra le gare precedenti al target. Anche il selettore editoriale usa questo catalogo, con tutti i circuiti della stagione.

Il voto del fattore `risultatiCircuitiSimili` viene calcolato dai risultati precedenti sulle due piste selezionate, con peso lineare dato dalla somiglianza; assenza di risultati → valore neutro 50. **Nel modello calibrato il peso del fattore resta 0%:** il confronto è ora disponibile e il voto è calcolato, ma non è stata effettuata una nuova calibrazione dei pesi. Nessun miglioramento predittivo viene dichiarato sulla sola base di questa raccolta.

Le revisioni storiche e l'helper tecnico legacy mantengono il proprio significato editoriale. La raccolta attuale non è un insieme di snapshot disponibili prima di ogni vecchio GP e non va usata per presentare come fuori campione un backtest storico.

## Consultazione e riproduzione

- [Schede complete](SCHEDE.md): tutti i 22 campi per ciascuna pista, con fonti e qualità.
- [Copertura e scale](COPERTURA.md): riepilogo e primi confronti del Messico.
- `dati-2026.csv`: i 506 valori, con stato, definizione e fonti.
- `confronti-2026.csv`: i 253 confronti e le percentuali per ogni criterio.

Per ricostruire da zero, eseguire i tre passaggi nell'ordine indicato. I primi due creano lo schema iniziale; il terzo applica le semplificazioni autorizzate e rimuove l'accelerazione.

```sh
python3 backend/scripts/raccogliDatiCircuiti.py
python3 backend/scripts/arricchisciDatiCircuiti.py
python3 backend/scripts/completaDatiCircuiti.py
node backend/scripts/esportaSimilaritaCircuiti.js
node --test backend/test/similaritaCircuiti.test.js
npm --prefix backend test
```

Le risposte già salvate sono riutilizzate. Per aggiornare una fonte si elimina soltanto il relativo file di cache identificato dall'URL. La raccolta aggiorna il JSON finale in modo atomico. I tre script di raccolta non scrivono nel database né pubblicano l'applicazione. La successiva importazione PostgreSQL è descritta in [DATABASE.md](DATABASE.md).

## Database

I dati sono ora anche persistiti nelle tabelle `catalog.circuit_similarity_profile` e `ratings.circuit_similarity`. Vedere [schema, importazione e verifica](DATABASE.md).
