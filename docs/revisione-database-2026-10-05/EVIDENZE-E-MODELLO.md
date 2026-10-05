# Evidenze di passo e gomme e modello previsionale

Aggiornamento del 5 ottobre 2026. Tutte le 264 schede pilota e 132 schede scuderia dei 12 GP presenti nell’app sono aggiornate. I 23 piloti e le 11 scuderie hanno indicatori complessivi ricavati dalla stagione disponibile.

## Acquisizione e qualità

46 sessioni: 30 edizioni storiche sui circuiti dell’app e tutti i 16 GP 2026 conclusi. 951 presenze pilota/sessione. Dati scaricati da [OpenF1](https://openf1.org/docs/), riscontrati con [F1DB v2026.16.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0). I nomi pilota sono risolti sull’entry list di ogni evento, evitando omonimie dei codici a tre lettere.

Ogni sessione conserva URL, numero di record e SHA-256 dei sette input: piloti, giri, stint, pit, race control, meteo e intervalli. I dati raw sono nella cache privata; gli aggregati riproducibili sono in [evidenze-giri](../../backend/data/evidenze-giri-2023-2026.json).

- Passo: almeno 8 giri; confronto con almeno 3 altri piloti sulla stessa tornata, mescola ed età entro 5 giri. Traffico verificato all’inizio della tornata, almeno 1,5 secondi.
- Filtri: partenza, in/out lap e tornate adiacenti alle soste, neutralizzazioni, bandiere, pioggia, dati meteo/intervalli obsoleti e anomalie cronometrie.
- Gomme: sequenze di mescole, giri di stint ed età iniziale osservati. Deriva relativa Theil–Sen solo per stint con almeno 10 giri confrontabili e ampiezza di età almeno 8.
- Il delta e la pendenza non isolano carburante, usura fisica, assetto, danni o gestione volontaria. L’indice gomme non entra nella previsione.
- GP futuri: proiezione dalle sessioni antecedenti al target, esplicitamente distinta dalla misura del weekend. Nessun tempo futuro inventato.
- Quando gli ultimi tre eventi non danno un indice robusto, si recuperano le ultime tre sessioni confrontabili anteriori al target, indicando circuiti, round e finestra estesa. Assenza di partecipazione e insufficienza dopo i filtri restano segnalate con il motivo e il campione osservato.

## Componenti e mescole

Cinque documenti FIA coprono tutte le 11 scuderie; sono state lette anche le tabelle su pagine successive. Il registro è [aggiornamenti FIA](../../backend/data/aggiornamenti-fia-documentati-2026.json). Componenti dichiarati non certificano installazione su entrambe le vetture o un guadagno sul giro. Le mescole 2026 sono confermate per Zandvoort, Monza, Madring, Baku, Sepang e Singapore dalle due comunicazioni Pirelli; per gli altri GP si mantiene lo storico senza attribuire una nomina futura.

| GP | Documento FIA | Componenti elencati |
|---|---|---:|
| olanda-zandvoort | [FIA](https://www.fia.com/system/files/decision-document/2026_dutch_grand_prix_-_car_presentation_submissions.pdf) | 23 |
| italia-monza | [FIA](https://www.fia.com/system/files/decision-document/2026_italian_grand_prix_-_car_presentation_submissions.pdf) | 26 |
| spagna-madring | [FIA](https://www.fia.com/system/files/decision-document/2026_spanish_grand_prix_-_car_presentation_submissions.pdf) | 10 |
| azerbaigian-baku | [FIA](https://www.fia.com/system/files/decision-document/2026_azerbaijan_grand_prix_-_car_presentation_submissions.pdf) | 38 |
| bahrein-sepang | [FIA](https://www.fia.com/system/files/decision-document/2026_bahrain_grand_prix_in_malaysia_-_car_presentation_submissions.pdf) | 14 |

## Modello attivo

`forma-recente-v1`: 15% passo da giri filtrati, 35% forma scuderia, 50% ordine mondiale. Media esponenziale con emivita di 4 GP; nessuna prior aggiuntiva nella configurazione corrente. I dati mancanti ricevono 50 convenzionale, senza salvarlo come misura. Ricerca di 4.290 configurazioni, passi del 5%, mondiale minimo 50%. Pesi e parametri si scelgono sui tre eventi precedenti al target. Penalità confermate restano monotone e separate; meteo e benefici upgrade non ricevono bonus inventati.

Le famiglie di medie esponenziali, risultati e giri, finestre di calibrazione e vincoli sul mondiale sono state esplorate. Il blocco finale era già noto: i numeri sono una verifica diagnostica riutilizzata, non una validazione indipendente nuova. Il miglioramento modesto non giustifica una promessa di accuratezza futura.

| Confronto | Solo mondiale | Forma recente |
|---|---:|---:|
| Progressivo, GP 4–16, esiti regolari | 2.4 | 2.276 |
| Progressivo, GP 4–16, classifica integrale | 3.923 | 3.734 |
| Configurazione congelata dopo GP 12, GP 13–16 regolari | 2.282 | 2.197 |
| Configurazione congelata dopo GP 12, GP 13–16 integrali | 3.636 | 3.545 |

I ritiri e gli altri esiti non regolari documentati sono esclusi uniformemente dal confronto condizionato; la classifica integrale resta riportata. Dati del GP target non entrano nei fattori. La selezione della famiglia è avvenuta dopo gli eventi: i confronti non sono previsioni originali salvate prima del weekend.

[Valutazioni, parametri e classifiche di tutti i 16 GP](../../backend/data/valutazione-forma-recente-2026-10-05.json).

## Copertura per GP e scuderia

| GP | Piloti | Scuderie | Piloti con indice passo recente | Piloti con deriva gomme recente |
|---|---:|---:|---:|---:|
| olanda-zandvoort | 22 | 11 | 21 | 21 |
| italia-monza | 22 | 11 | 22 | 21 |
| spagna-madring | 22 | 11 | 22 | 21 |
| azerbaigian-baku | 22 | 11 | 22 | 22 |
| bahrein-sepang | 22 | 11 | 22 | 22 |
| singapore-marina-bay | 22 | 11 | 22 | 22 |
| usa-austin | 22 | 11 | 22 | 22 |
| messico-citta-del-messico | 22 | 11 | 22 | 22 |
| brasile-interlagos | 22 | 11 | 22 | 22 |
| usa-las-vegas | 22 | 11 | 22 | 22 |
| qatar-lusail | 22 | 11 | 22 | 22 |
| abu-dhabi-yas-marina | 22 | 11 | 22 | 22 |

### Gran Premio d'Olanda

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 94.8 | 43.7 | 91 | 95.7 | 1 |
| hamilton | 81.3 | 45.4 | 87 | 84.9 | 2 |
| russell | 75.5 | 16.6 | 86.2 | 90 | 3 |
| leclerc | 86.3 | 23.5 | 85.2 | 83.5 | 4 |
| norris | 68.4 | 62.4 | 84.5 | 82.3 | 5 |
| max_verstappen | 95.1 | 31.4 | 85.1 | 79.1 | 6 |
| piastri | 80.8 | 0 | 78 | 76.6 | 7 |
| tsunoda | — | — | — | — | 10 |
| lawson | 47.5 | 43.3 | 64.8 | 53.7 | 8 |
| gasly | 45.9 | 76.9 | 61.4 | 52.4 | 11 |
| arvid_lindblad | 57.3 | 37 | 57.6 | 52.4 | 9 |
| colapinto | 42.2 | 55.7 | 50.2 | 40.3 | 12 |
| bearman | 25.4 | 68.6 | 50 | 34.6 | 15 |
| bortoleto | 48.6 | 23.2 | 53.8 | 42.9 | 13 |
| sainz | 26.4 | 60.6 | 41.3 | 31.4 | 16 |
| albon | 7.4 | 71.5 | 37.4 | 26 | 17 |
| ocon | 14.3 | 68 | 41.6 | 32 | 18 |
| hulkenberg | 43.4 | 92.9 | 49.7 | 48.9 | 14 |
| alonso | 5.3 | 100 | 28.5 | 11.3 | 19 |
| stroll | 11.1 | 44.1 | 28.6 | 4.8 | 20 |
| bottas | 10.5 | 50 | 25.4 | 10.4 | 21 |
| perez | 7.9 | 67.6 | 32 | 10.8 | 22 |
| mercedes | 85.1 | 30.2 | 88.7 | 92.9 | 1 |
| ferrari | 83.3 | 39.9 | 86.2 | 84.2 | 2 |
| mclaren | 76.7 | 0 | 81.3 | 79.4 | 3 |
| red_bull | 88.5 | 43.2 | 79.6 | 75.5 | 4 |
| rb | 52.4 | 39.5 | 61.2 | 53 | 5 |
| alpine | 43.7 | 64.2 | 55.5 | 46.3 | 6 |
| haas | 19.9 | 68.3 | 45.1 | 33.3 | 8 |
| audi | 46.5 | 40.6 | 52.1 | 45.9 | 7 |
| williams | 18.8 | 66 | 39.6 | 28.6 | 9 |
| aston_martin | 9.2 | 62.7 | 28.6 | 8.2 | 10 |
| cadillac | 8.8 | 58.8 | 28.9 | 10.6 | 11 |

### Gran Premio d'Italia

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 76.7 | 39.3 | 91.3 | 95.2 | 8 |
| hamilton | 88.4 | 66.2 | 86.9 | 84.5 | 2 |
| russell | 76.7 | 43.2 | 86.7 | 90.5 | 1 |
| leclerc | 78.9 | 10 | 84.8 | 82.9 | 4 |
| norris | 93.3 | 62.4 | 86.2 | 83.7 | 3 |
| max_verstappen | 92.7 | 47.2 | 85.1 | 78.4 | 5 |
| piastri | 76.1 | 0 | 77.8 | 77.4 | 6 |
| tsunoda | 40 | — | 52.4 | 47.6 | 15 |
| lawson | 39.7 | 57.1 | 65.4 | 54.8 | 7 |
| gasly | 44.4 | 71.4 | 61 | 52.4 | 10 |
| arvid_lindblad | 59.6 | 52.5 | 56.7 | 52.8 | 9 |
| colapinto | 28.1 | 45.4 | 49.2 | 40.1 | 12 |
| bearman | 27.6 | 77.9 | 50 | 32.5 | 14 |
| bortoleto | 49.3 | 33.1 | 52.8 | 44.4 | 11 |
| sainz | 26.9 | 60 | 40 | 30.7 | 17 |
| albon | 20.5 | 81 | 37.4 | 26.2 | 18 |
| ocon | 14.5 | 55 | 41.6 | 32.1 | 19 |
| hulkenberg | 50 | 92.9 | 51.8 | 48.4 | 13 |
| alonso | 73.3 | 20 | 32.7 | 11.9 | 16 |
| stroll | 14.5 | 0 | 28.6 | 5.6 | 20 |
| bottas | 13.3 | 30 | 25.4 | 9.9 | 21 |
| perez | 10 | 90 | 32.1 | 9.9 | 22 |
| mercedes | 76.7 | 41.3 | 89.1 | 92.9 | 3 |
| ferrari | 84.6 | 52.2 | 85.9 | 83.7 | 1 |
| mclaren | 80.4 | 0 | 82 | 80.6 | 2 |
| red_bull | 89.4 | 47.9 | 79.1 | 74.9 | 4 |
| rb | 47.7 | 54 | 60.2 | 53 | 7 |
| alpine | 32.2 | 54 | 54.9 | 46.2 | 5 |
| haas | 19.7 | 66.4 | 45.1 | 32.3 | 8 |
| audi | 49.5 | 48.1 | 52.4 | 46.4 | 6 |
| williams | 23.7 | 72.6 | 38.9 | 28.4 | 9 |
| aston_martin | 34.1 | 10 | 31.3 | 8.9 | 10 |
| cadillac | 11.1 | 60 | 29.3 | 9.9 | 11 |

### Gran Premio di Spagna

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 76.7 | 39.3 | 92.1 | 93.4 | 1 |
| hamilton | 91.7 | 79.3 | 86.1 | 84.3 | 3 |
| russell | 76.7 | 43.2 | 87.4 | 90.8 | 2 |
| leclerc | 78.9 | 10 | 84.8 | 83.1 | 5 |
| norris | 93.3 | 62.4 | 86.2 | 82.1 | 4 |
| max_verstappen | 94.4 | 64.3 | 85.7 | 78.2 | 7 |
| piastri | 77.8 | 0 | 78.1 | 78.4 | 6 |
| tsunoda | 40 | — | 54.8 | 35.7 | 15 |
| lawson | 61.1 | 57.1 | 63.1 | 53.5 | 8 |
| gasly | 44.4 | 71.4 | 61.9 | 56 | 9 |
| arvid_lindblad | 55.6 | 50 | 57.5 | 53.1 | 10 |
| colapinto | 19.5 | 35.7 | 50.2 | 42.1 | 11 |
| bearman | 27.8 | 85.7 | 48.1 | 33.7 | 14 |
| bortoleto | 46.7 | 39.7 | 52.8 | 45.1 | 12 |
| sainz | 22.2 | 40 | 40.3 | 30.9 | 16 |
| albon | 26.2 | 71.5 | 35.7 | 25.6 | 18 |
| ocon | 21.7 | 100 | 40.5 | 31.9 | 19 |
| hulkenberg | 50 | 92.9 | 51.3 | 48 | 13 |
| alonso | 73.3 | 20 | 32.7 | 11.4 | 17 |
| stroll | 14.5 | 0 | 28.6 | 5.2 | 20 |
| bottas | 13.3 | 30 | 23.8 | 10.3 | 21 |
| perez | 10 | 90 | 30.7 | 9.9 | 22 |
| mercedes | 76.7 | 41.3 | 89.8 | 92.1 | 1 |
| ferrari | 85.3 | 56.2 | 85.5 | 83.7 | 2 |
| mclaren | 83 | 0 | 82.2 | 80.2 | 3 |
| red_bull | 83.3 | 35.7 | 77.6 | 73.4 | 4 |
| rb | 52.2 | 53.6 | 60.3 | 52 | 6 |
| alpine | 27.8 | 53.6 | 55.8 | 49.1 | 5 |
| haas | 23.7 | 92.9 | 43.8 | 32.8 | 8 |
| audi | 47.8 | 57.4 | 52.2 | 46.5 | 7 |
| williams | 24.2 | 61 | 38.3 | 28.2 | 9 |
| aston_martin | 34.1 | 10 | 31.3 | 8.4 | 10 |
| cadillac | 11.1 | 60 | 27.7 | 10.1 | 11 |

### Gran Premio dell'Azerbaigian

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 70.4 | 48.4 | 92.7 | 93.5 | 1 |
| hamilton | 100 | 80 | 86.1 | 84.4 | 3 |
| russell | 86.7 | 65 | 86.9 | 89.8 | 2 |
| leclerc | 80 | 10 | 84.9 | 83 | 5 |
| norris | 96.7 | 20 | 86.6 | 83.3 | 4 |
| max_verstappen | 93.8 | 80 | 86.7 | 79.1 | 6 |
| piastri | 74 | 16.7 | 77.1 | 77.9 | 7 |
| hadjar | 82 | 54.9 | 74.6 | 71.9 | 8 |
| lawson | 75 | 6.7 | 64.1 | 54.4 | 9 |
| gasly | 68.8 | 53.3 | 60.8 | 54.8 | 10 |
| arvid_lindblad | 56.2 | 63.3 | 57.9 | 53.4 | 11 |
| colapinto | 31.3 | 93.3 | 51.7 | 43.6 | 12 |
| bearman | 43.8 | 68.6 | 46.2 | 33.7 | 15 |
| bortoleto | 55 | 45.9 | 52 | 45.2 | 13 |
| sainz | 19.8 | 70 | 40.3 | 30.4 | 16 |
| albon | 29.6 | 81.7 | 35.4 | 25.8 | 17 |
| ocon | 29 | 73.3 | 41.4 | 32.7 | 18 |
| hulkenberg | 37.5 | 40 | 51.9 | 48.3 | 14 |
| alonso | 73.3 | 20 | 31.7 | 11.9 | 19 |
| stroll | 6.7 | 55.6 | 28.6 | 5.2 | 20 |
| bottas | 6.7 | 21.7 | 23.2 | 10.2 | 21 |
| perez | 19.4 | 45 | 30.7 | 10.2 | 22 |
| mercedes | 75.8 | 53.9 | 89.9 | 91.7 | 1 |
| ferrari | 90 | 45 | 85.5 | 83.7 | 2 |
| mclaren | 85.3 | 17.8 | 81.8 | 80.6 | 3 |
| red_bull | 84.4 | 43.4 | 78.4 | 73.8 | 4 |
| rb | 40.4 | 75 | 59.5 | 51.5 | 5 |
| alpine | 43.8 | 73.3 | 56.1 | 49.2 | 6 |
| haas | 33.9 | 73.3 | 43.5 | 33.2 | 8 |
| audi | 49.2 | 43.9 | 52 | 46.8 | 7 |
| williams | 24.7 | 75.8 | 38.1 | 28 | 9 |
| aston_martin | 40 | 20 | 30.8 | 8.8 | 10 |
| cadillac | 13 | 33.3 | 27.2 | 10.2 | 11 |

### Gran Premio del Bahrein in Malesia

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 91.8 | 89.2 | 1 |
| hamilton | 64.3 | 83.3 | 85.4 | 83.8 | 3 |
| russell | 79.2 | 32.7 | 87.9 | 90.5 | 2 |
| leclerc | 71.4 | 41.7 | 84.9 | 83.8 | 4 |
| norris | 96.5 | 47.5 | 86.6 | 83.2 | 5 |
| max_verstappen | 93.8 | 80 | 87.4 | 78.2 | 6 |
| piastri | 79.9 | 50 | 74.2 | 78.7 | 7 |
| hadjar | 82 | 54.9 | 76.2 | 73.2 | 8 |
| lawson | 48.2 | 28.4 | 62.9 | 54 | 9 |
| gasly | 77.3 | 76.7 | 60.8 | 55.9 | 10 |
| arvid_lindblad | 53.1 | 60.8 | 58.8 | 52 | 11 |
| colapinto | 59.8 | 50.8 | 51.7 | 44.5 | 14 |
| bearman | 29.1 | 33.3 | 47.6 | 35 | 13 |
| bortoleto | 50 | 26.7 | 50.7 | 43.8 | 12 |
| sainz | 24.6 | 100 | 41.7 | 32.6 | 17 |
| albon | 12.5 | 63.3 | 35.4 | 27 | 18 |
| ocon | 29.9 | 73.3 | 43.2 | 33 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 46.4 | 15 |
| alonso | 29.9 | 71 | 31.7 | 12.1 | 19 |
| stroll | 9.6 | 55.6 | 28.6 | 5.1 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.5 | 21 |
| perez | 13 | 0 | 31.4 | 10.1 | 22 |
| mercedes | 93.8 | 69.2 | 89.9 | 89.8 | 1 |
| ferrari | 67.9 | 62.5 | 85.2 | 83.8 | 2 |
| mclaren | 88.2 | 48.8 | 80.1 | 81 | 3 |
| red_bull | 84.4 | 43.4 | 79.6 | 74 | 4 |
| rb | 38.2 | 64.6 | 59.5 | 50.8 | 5 |
| alpine | 68.5 | 63.7 | 56.1 | 50.2 | 6 |
| haas | 29.5 | 53.3 | 45.2 | 34 | 8 |
| audi | 41.1 | 27.8 | 51.3 | 45.1 | 7 |
| williams | 20.5 | 81.7 | 39 | 29.7 | 9 |
| aston_martin | 21.5 | 52.1 | 30.8 | 8.9 | 10 |
| cadillac | 6.5 | 9.6 | 27.8 | 9.8 | 11 |

### Gran Premio di Singapore

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

### Gran Premio degli Stati Uniti

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

### Gran Premio di Città del Messico

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

### Gran Premio di San Paolo

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

### Gran Premio di Las Vegas

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

### Gran Premio del Qatar

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

### Gran Premio di Abu Dhabi

Indici dai GP precedenti; i dettagli delle edizioni concluse sono separati negli archivi.

| Entità | Passo | Gomme: deriva relativa | Rendimento | Qualifica | Previsione |
|---|---:|---:|---:|---:|---:|
| antonelli | 93.8 | 69.2 | 92.1 | 89 | 1 |
| hamilton | 64.3 | 83.3 | 85.7 | 84.5 | 3 |
| russell | 100 | 32.7 | 87.9 | 89 | 2 |
| leclerc | 71.4 | 41.7 | 85 | 83.6 | 4 |
| norris | 96.5 | 47.5 | 84.5 | 82.8 | 6 |
| max_verstappen | 93.8 | 80 | 88.5 | 79.7 | 5 |
| piastri | 79.9 | 50 | 74.4 | 78.3 | 7 |
| hadjar | 50 | 54.9 | 76.6 | 74.6 | 8 |
| lawson | 48.2 | 28.4 | 63.5 | 53.9 | 9 |
| gasly | 77.3 | 76.7 | 58.5 | 56.2 | 10 |
| arvid_lindblad | 35.4 | 60.8 | 58.7 | 50.6 | 11 |
| colapinto | 59.8 | 50.8 | 51.1 | 43.8 | 12 |
| bearman | 29.1 | 33.3 | 46.8 | 34 | 14 |
| bortoleto | 50 | 26.7 | 48.6 | 44.6 | 13 |
| sainz | 24.6 | 100 | 40.3 | 33.3 | 18 |
| albon | 12.5 | 63.3 | 35.4 | 25.9 | 19 |
| ocon | 29.9 | 73.3 | 42.6 | 31.8 | 16 |
| hulkenberg | 36.6 | 28.4 | 52 | 44.9 | 15 |
| alonso | 29.9 | 71 | 35.2 | 14.3 | 17 |
| stroll | 9.6 | 55.6 | 32.4 | 7.5 | 20 |
| bottas | 0 | 19.2 | 23.2 | 9.2 | 21 |
| perez | 13 | 0 | 29.9 | 9.5 | 22 |
| mercedes | 95.8 | 69.2 | 90.1 | 89 | 1 |
| ferrari | 67.9 | 62.5 | 85.4 | 84.1 | 2 |
| mclaren | 88.2 | 48.8 | 79.2 | 80.5 | 3 |
| red_bull | 72.9 | 43.4 | 80.4 | 75.4 | 4 |
| rb | 30.5 | 64.6 | 59.8 | 50.1 | 5 |
| alpine | 68.5 | 63.7 | 54.7 | 50 | 6 |
| haas | 29.5 | 53.3 | 44.5 | 32.9 | 8 |
| audi | 41.1 | 27.8 | 50.1 | 44.8 | 7 |
| williams | 20.5 | 81.7 | 38.3 | 29.5 | 10 |
| aston_martin | 21.5 | 52.1 | 34.3 | 11.1 | 9 |
| cadillac | 6.5 | 9.6 | 27.1 | 9.4 | 11 |

## Riproduzione

```sh
python3 backend/scripts/raccogliEvidenzeGiri.py /cartella/cache 2026-10-05T00:00:00+00:00
python3 backend/scripts/analizzaEvidenzeGiri.py /cartella/cache /cartella/f1db-v2026.16.0
node backend/scripts/valutaModelloRecente.js
node backend/scripts/aggiornaPrevisioniCalibrate.js
node backend/scripts/completaAnalisiEvidenze.js /cartella/f1db-v2026.16.0
python3 -m unittest discover -s backend/test -p "*_test.py"
npm test
npm run verify-data
npm run verify-translations
npm run verify-db
```

Per il prossimo GP si acquisiscono i nuovi giri solo dopo la sessione; prima della gara si salva lo snapshot di input, pesi e classifica. I registri FIA e le nomine Pirelli si aggiornano separatamente. Le fonti F1DB/corpus devono essere sincronizzate con la nuova release verificata: non basta cambiare il mondiale per aggiornare gli altri fattori.

Migrazione Atlas mirata, con backup privato, transazione e controllo di concorrenza: [rapporto di migrazione](migrazione-evidenze.json). Il push non sostituisce questa verifica. Frontend e binario nativo non sono modificati da questo lavoro.
