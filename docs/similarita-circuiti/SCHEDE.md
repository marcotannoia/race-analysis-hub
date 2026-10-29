# Schede dei 23 circuiti — 29 ottobre 2026

22 criteri uguali per tutte le piste. **Stimato** indica le approssimazioni autorizzate; **derivato** indica un calcolo da dati acquisiti. Consultare METODO.md per le diverse definizioni e finestre temporali.

## australia-melbourne

Lunghezza giro: **5,278 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 14 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/melbourne.yml) |
| Altitudine | 4 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 29,571 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=7787) [2](https://api.openf1.org/v1/weather?session_key=9488) [3](https://api.openf1.org/v1/weather?session_key=9693) |
| Temperatura media aria | 18,227 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=7787) [2](https://api.openf1.org/v1/weather?session_key=9488) [3](https://api.openf1.org/v1/weather?session_key=9693) |
| Numero di rettilinei | 5 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/au-1953.geojson) |
| Lunghezza totale rettilinei | 1,809 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/au-1953.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | cittadino | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/melbourne.yml) |
| G laterale di riferimento / km | 0,471 | g/km | stimato | [1](https://torqlytics.com/circuits/melbourne) |
| Cambi di direzione per km | 1,895 | 1/km | stimato | [1](https://torqlytics.com/circuits/melbourne) |
| Velocità media sul giro | 253,02 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9689) [2](https://www.formula1.com/en/racing/2025/australia) |
| Velocità media in curva | 183 | km/h | stimato | [1](https://torqlytics.com/circuits/melbourne) |
| Velocità massima | 329 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9689&driver_number=4&date%3E=2025-03-15T05%3A58%3A00.264000%2B00%3A00&date%3C=2025-03-15T05%3A59%3A15.360000%2B00%3A00) |
| Velocità minima in pista | 98 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9689&driver_number=4&date%3E=2025-03-15T05%3A58%3A00.264000%2B00%3A00&date%3C=2025-03-15T05%3A59%3A15.360000%2B00%3A00) |
| G medio in frenata / km | 0,367 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9689&driver_number=4&date%3E=2025-03-15T05%3A58%3A00.264000%2B00%3A00&date%3C=2025-03-15T05%3A59%3A15.360000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 2,6 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/melbourne.yml) |
| Umidità media | 57,361 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=7787) [2](https://api.openf1.org/v1/weather?session_key=9488) [3](https://api.openf1.org/v1/weather?session_key=9693) |
| Velocità media del vento | 1,76 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=7787) [2](https://api.openf1.org/v1/weather?session_key=9488) [3](https://api.openf1.org/v1/weather?session_key=9693) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=7787) [2](https://api.openf1.org/v1/weather?session_key=9488) [3](https://api.openf1.org/v1/weather?session_key=9693) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=7787) [2](https://api.openf1.org/v1/weather?session_key=9488) [3](https://api.openf1.org/v1/weather?session_key=9693) |
| Distanza programmata gara | 306,124 | km | documentato | [1](https://www.formula1.com/en/racing/2026/australia) |

Piste più simili nel catalogo: **olanda-zandvoort: 90,747%** · **spagna-barcellona: 88,151%** · **usa-miami: 86,448%**.

## cina-shanghai

Lunghezza giro: **5,451 km**. Carico: **medio**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 16 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/shanghai.yml) |
| Altitudine | 3 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 31,361 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9673) [2](https://api.openf1.org/v1/weather?session_key=9998) |
| Temperatura media aria | 22,778 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9673) [2](https://api.openf1.org/v1/weather?session_key=9998) |
| Numero di rettilinei | 6 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/cn-2004.geojson) |
| Lunghezza totale rettilinei | 2,761 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/cn-2004.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/shanghai.yml) |
| G laterale di riferimento / km | 0,508 | g/km | stimato | [1](https://torqlytics.com/circuits/shanghai) |
| Cambi di direzione per km | 1,468 | 1/km | stimato | [1](https://torqlytics.com/circuits/shanghai) |
| Velocità media sul giro | 216,498 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9994) [2](https://www.formula1.com/en/racing/2025/china) |
| Velocità media in curva | 139 | km/h | stimato | [1](https://torqlytics.com/circuits/shanghai) |
| Velocità massima | 330 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9994&driver_number=81&date%3E=2025-03-22T07%3A58%3A40.095000%2B00%3A00&date%3C=2025-03-22T08%3A00%3A10.736000%2B00%3A00) |
| Velocità minima in pista | 65 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9994&driver_number=81&date%3E=2025-03-22T07%3A58%3A40.095000%2B00%3A00&date%3C=2025-03-22T08%3A00%3A10.736000%2B00%3A00) |
| G medio in frenata / km | 0,291 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9994&driver_number=81&date%3E=2025-03-22T07%3A58%3A40.095000%2B00%3A00&date%3C=2025-03-22T08%3A00%3A10.736000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 7,4 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | medio | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/shanghai.yml) |
| Umidità media | 43,022 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9673) [2](https://api.openf1.org/v1/weather?session_key=9998) |
| Velocità media del vento | 2,043 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9673) [2](https://api.openf1.org/v1/weather?session_key=9998) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9673) [2](https://api.openf1.org/v1/weather?session_key=9998) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9673) [2](https://api.openf1.org/v1/weather?session_key=9998) |
| Distanza programmata gara | 305,066 | km | documentato | [1](https://www.formula1.com/en/racing/2026/china) |

Piste più simili nel catalogo: **abu-dhabi-yas-marina: 93,339%** · **qatar-lusail: 89,517%** · **giappone-suzuka: 89,361%**.

## giappone-suzuka

Lunghezza giro: **5,807 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 18 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/suzuka.yml) |
| Altitudine | 38 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 32,178 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9173) [2](https://api.openf1.org/v1/weather?session_key=9496) [3](https://api.openf1.org/v1/weather?session_key=10006) |
| Temperatura media aria | 21,051 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9173) [2](https://api.openf1.org/v1/weather?session_key=9496) [3](https://api.openf1.org/v1/weather?session_key=10006) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/jp-1962.geojson) |
| Lunghezza totale rettilinei | 1,926 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/jp-1962.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/suzuka.yml) |
| G laterale di riferimento / km | 0,599 | g/km | stimato | [1](https://torqlytics.com/circuits/suzuka) |
| Cambi di direzione per km | 2,067 | 1/km | stimato | [1](https://torqlytics.com/circuits/suzuka) |
| Velocità media sul giro | 240,337 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=10002) [2](https://www.formula1.com/en/racing/2025/japan) |
| Velocità media in curva | 189,556 | km/h | stimato | [1](https://torqlytics.com/circuits/suzuka) |
| Velocità massima | 325 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=10002&driver_number=1&date%3E=2025-04-05T07%3A07%3A05.543000%2B00%3A00&date%3C=2025-04-05T07%3A08%3A32.526000%2B00%3A00) |
| Velocità minima in pista | 77 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=10002&driver_number=1&date%3E=2025-04-05T07%3A07%3A05.543000%2B00%3A00&date%3C=2025-04-05T07%3A08%3A32.526000%2B00%3A00) |
| G medio in frenata / km | 0,315 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=10002&driver_number=1&date%3E=2025-04-05T07%3A07%3A05.543000%2B00%3A00&date%3C=2025-04-05T07%3A08%3A32.526000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 40,4 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/suzuka.yml) |
| Umidità media | 54,542 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9173) [2](https://api.openf1.org/v1/weather?session_key=9496) [3](https://api.openf1.org/v1/weather?session_key=10006) |
| Velocità media del vento | 1,729 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9173) [2](https://api.openf1.org/v1/weather?session_key=9496) [3](https://api.openf1.org/v1/weather?session_key=10006) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9173) [2](https://api.openf1.org/v1/weather?session_key=9496) [3](https://api.openf1.org/v1/weather?session_key=10006) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9173) [2](https://api.openf1.org/v1/weather?session_key=9496) [3](https://api.openf1.org/v1/weather?session_key=10006) |
| Distanza programmata gara | 307,471 | km | documentato | [1](https://www.formula1.com/en/racing/2026/japan) |

Piste più simili nel catalogo: **usa-austin: 92,979%** · **qatar-lusail: 92,344%** · **abu-dhabi-yas-marina: 92,121%**.

## usa-miami

Lunghezza giro: **5,412 km**. Carico: **medio**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 19 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/miami.yml) |
| Altitudine | 5 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 38,442 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9078) [2](https://api.openf1.org/v1/weather?session_key=9507) [3](https://api.openf1.org/v1/weather?session_key=10033) |
| Temperatura media aria | 27,311 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9078) [2](https://api.openf1.org/v1/weather?session_key=9507) [3](https://api.openf1.org/v1/weather?session_key=10033) |
| Numero di rettilinei | 6 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/us-2022.geojson) |
| Lunghezza totale rettilinei | 2,676 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/us-2022.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | ibrido | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/miami.yml) |
| G laterale di riferimento / km | 0,378 | g/km | stimato | [1](https://torqlytics.com/circuits/miami) |
| Cambi di direzione per km | 1,848 | 1/km | stimato | [1](https://torqlytics.com/circuits/miami) |
| Velocità media sul giro | 226,013 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=10029) [2](https://www.formula1.com/en/racing/2025/miami) |
| Velocità media in curva | 152,579 | km/h | stimato | [1](https://torqlytics.com/circuits/miami) |
| Velocità massima | 340 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=10029&driver_number=1&date%3E=2025-05-03T21%3A13%3A09.799000%2B00%3A00&date%3C=2025-05-03T21%3A14%3A36.003000%2B00%3A00) |
| Velocità minima in pista | 69 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=10029&driver_number=1&date%3E=2025-05-03T21%3A13%3A09.799000%2B00%3A00&date%3C=2025-05-03T21%3A14%3A36.003000%2B00%3A00) |
| G medio in frenata / km | 0,324 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=10029&driver_number=1&date%3E=2025-05-03T21%3A13%3A09.799000%2B00%3A00&date%3C=2025-05-03T21%3A14%3A36.003000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 3 | m | stimato | [1](https://perencz.hu/f1/circuit/miami/info/) |
| Richiesta di carico aerodinamico | medio | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/miami.yml) |
| Umidità media | 60,647 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9078) [2](https://api.openf1.org/v1/weather?session_key=9507) [3](https://api.openf1.org/v1/weather?session_key=10033) |
| Velocità media del vento | 2,655 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9078) [2](https://api.openf1.org/v1/weather?session_key=9507) [3](https://api.openf1.org/v1/weather?session_key=10033) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9078) [2](https://api.openf1.org/v1/weather?session_key=9507) [3](https://api.openf1.org/v1/weather?session_key=10033) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9078) [2](https://api.openf1.org/v1/weather?session_key=9507) [3](https://api.openf1.org/v1/weather?session_key=10033) |
| Distanza programmata gara | 308,326 | km | documentato | [1](https://www.formula1.com/en/racing/2026/miami) |

Piste più simili nel catalogo: **cina-shanghai: 87,871%** · **abu-dhabi-yas-marina: 87,112%** · **australia-melbourne: 86,448%**.

## canada-montreal

Lunghezza giro: **4,361 km**. Carico: **basso**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 14 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/montreal.yml) |
| Altitudine | 10 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 35,08 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9110) [2](https://api.openf1.org/v1/weather?session_key=9531) [3](https://api.openf1.org/v1/weather?session_key=9963) |
| Temperatura media aria | 20,443 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9110) [2](https://api.openf1.org/v1/weather?session_key=9531) [3](https://api.openf1.org/v1/weather?session_key=9963) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/ca-1978.geojson) |
| Lunghezza totale rettilinei | 2,225 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/ca-1978.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | cittadino | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/montreal.yml) |
| G laterale di riferimento / km | 0,42 | g/km | stimato | [1](https://torqlytics.com/circuits/montreal) |
| Cambi di direzione per km | 2,293 | 1/km | stimato | [1](https://torqlytics.com/circuits/montreal) |
| Velocità media sul giro | 221,436 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9959) [2](https://www.formula1.com/en/racing/2025/canada) |
| Velocità media in curva | 131,714 | km/h | stimato | [1](https://torqlytics.com/circuits/montreal) |
| Velocità massima | 332 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9959&driver_number=63&date%3E=2025-06-14T21%3A06%3A47.471000%2B00%3A00&date%3C=2025-06-14T21%3A07%3A58.370000%2B00%3A00) |
| Velocità minima in pista | 65 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9959&driver_number=63&date%3E=2025-06-14T21%3A06%3A47.471000%2B00%3A00&date%3C=2025-06-14T21%3A07%3A58.370000%2B00%3A00) |
| G medio in frenata / km | 0,489 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9959&driver_number=63&date%3E=2025-06-14T21%3A06%3A47.471000%2B00%3A00&date%3C=2025-06-14T21%3A07%3A58.370000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 5,2 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | basso | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/montreal.yml) |
| Umidità media | 54,351 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9110) [2](https://api.openf1.org/v1/weather?session_key=9531) [3](https://api.openf1.org/v1/weather?session_key=9963) |
| Velocità media del vento | 1,387 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9110) [2](https://api.openf1.org/v1/weather?session_key=9531) [3](https://api.openf1.org/v1/weather?session_key=9963) |
| Pioggia prevalente nelle edizioni osservate | si | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9110) [2](https://api.openf1.org/v1/weather?session_key=9531) [3](https://api.openf1.org/v1/weather?session_key=9963) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9110) [2](https://api.openf1.org/v1/weather?session_key=9531) [3](https://api.openf1.org/v1/weather?session_key=9963) |
| Distanza programmata gara | 305,27 | km | documentato | [1](https://www.formula1.com/en/racing/2026/canada) |

Piste più simili nel catalogo: **australia-melbourne: 83,969%** · **usa-miami: 83,495%** · **brasile-interlagos: 81,7%**.

## monaco-montecarlo

Lunghezza giro: **3,337 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 19 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/monaco.yml) |
| Altitudine | 16 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 41,826 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9094) [2](https://api.openf1.org/v1/weather?session_key=9523) [3](https://api.openf1.org/v1/weather?session_key=9979) |
| Temperatura media aria | 22,955 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9094) [2](https://api.openf1.org/v1/weather?session_key=9523) [3](https://api.openf1.org/v1/weather?session_key=9979) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mc-1929.geojson) |
| Lunghezza totale rettilinei | 0,852 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mc-1929.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | cittadino | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/monaco.yml) |
| G laterale di riferimento / km | 0,543 | g/km | stimato | [1](https://torqlytics.com/circuits/monte-carlo) |
| Cambi di direzione per km | 2,997 | 1/km | stimato | [1](https://torqlytics.com/circuits/monte-carlo) |
| Velocità media sul giro | 171,73 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9975) [2](https://www.formula1.com/en/racing/2025/monaco) |
| Velocità media in curva | 120,316 | km/h | stimato | [1](https://torqlytics.com/circuits/monte-carlo) |
| Velocità massima | 289 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9975&driver_number=4&date%3E=2025-05-24T15%3A13%3A57.247000%2B00%3A00&date%3C=2025-05-24T15%3A15%3A07.201000%2B00%3A00) |
| Velocità minima in pista | 46 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9975&driver_number=4&date%3E=2025-05-24T15%3A13%3A57.247000%2B00%3A00&date%3C=2025-05-24T15%3A15%3A07.201000%2B00%3A00) |
| G medio in frenata / km | 0,463 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9975&driver_number=4&date%3E=2025-05-24T15%3A13%3A57.247000%2B00%3A00&date%3C=2025-05-24T15%3A15%3A07.201000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 42 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 54,471 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9094) [2](https://api.openf1.org/v1/weather?session_key=9523) [3](https://api.openf1.org/v1/weather?session_key=9979) |
| Velocità media del vento | 1,025 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9094) [2](https://api.openf1.org/v1/weather?session_key=9523) [3](https://api.openf1.org/v1/weather?session_key=9979) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9094) [2](https://api.openf1.org/v1/weather?session_key=9523) [3](https://api.openf1.org/v1/weather?session_key=9979) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9094) [2](https://api.openf1.org/v1/weather?session_key=9523) [3](https://api.openf1.org/v1/weather?session_key=9979) |
| Distanza programmata gara | 260,286 | km | documentato | [1](https://www.formula1.com/en/racing/2026/monaco) |

Piste più simili nel catalogo: **australia-melbourne: 80,673%** · **singapore-marina-bay: 79,631%** · **spagna-barcellona: 78,524%**.

## spagna-barcellona

Lunghezza giro: **4,657 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 14 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/catalunya.yml) |
| Altitudine | 121 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 39,846 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9102) [2](https://api.openf1.org/v1/weather?session_key=9539) [3](https://api.openf1.org/v1/weather?session_key=9971) |
| Temperatura media aria | 25,029 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9102) [2](https://api.openf1.org/v1/weather?session_key=9539) [3](https://api.openf1.org/v1/weather?session_key=9971) |
| Numero di rettilinei | 3 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/es-1991.geojson) |
| Lunghezza totale rettilinei | 1,616 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/es-1991.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/catalunya.yml) |
| G laterale di riferimento / km | 0,666 | g/km | stimato | [1](https://torqlytics.com/circuits/catalunya) |
| Cambi di direzione per km | 1,288 | 1/km | stimato | [1](https://torqlytics.com/circuits/catalunya) |
| Velocità media sul giro | 234,328 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9967) [2](https://www.formula1.com/en/racing/2025/spain) |
| Velocità media in curva | 170 | km/h | stimato | [1](https://torqlytics.com/circuits/catalunya) |
| Velocità massima | 328 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9967&driver_number=81&date%3E=2025-05-31T14%3A58%3A57.804000%2B00%3A00&date%3C=2025-05-31T15%3A00%3A09.350000%2B00%3A00) |
| Velocità minima in pista | 107 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9967&driver_number=81&date%3E=2025-05-31T14%3A58%3A57.804000%2B00%3A00&date%3C=2025-05-31T15%3A00%3A09.350000%2B00%3A00) |
| G medio in frenata / km | 0,381 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9967&driver_number=81&date%3E=2025-05-31T14%3A58%3A57.804000%2B00%3A00&date%3C=2025-05-31T15%3A00%3A09.350000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 29,6 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/catalunya.yml) |
| Umidità media | 61,903 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9102) [2](https://api.openf1.org/v1/weather?session_key=9539) [3](https://api.openf1.org/v1/weather?session_key=9971) |
| Velocità media del vento | 1,781 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9102) [2](https://api.openf1.org/v1/weather?session_key=9539) [3](https://api.openf1.org/v1/weather?session_key=9971) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9102) [2](https://api.openf1.org/v1/weather?session_key=9539) [3](https://api.openf1.org/v1/weather?session_key=9971) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9102) [2](https://api.openf1.org/v1/weather?session_key=9539) [3](https://api.openf1.org/v1/weather?session_key=9971) |
| Distanza programmata gara | 307,236 | km | documentato | [1](https://www.formula1.com/en/racing/2026/barcelona-catalunya) |

Piste più simili nel catalogo: **olanda-zandvoort: 93,985%** · **ungheria-hungaroring: 90,34%** · **giappone-suzuka: 88,88%**.

## austria-spielberg

Lunghezza giro: **4,326 km**. Carico: **medio**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 10 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/spielberg.yml) |
| Altitudine | 681 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 42,473 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9118) [2](https://api.openf1.org/v1/weather?session_key=9550) [3](https://api.openf1.org/v1/weather?session_key=9955) |
| Temperatura media aria | 27,668 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9118) [2](https://api.openf1.org/v1/weather?session_key=9550) [3](https://api.openf1.org/v1/weather?session_key=9955) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/at-1969.geojson) |
| Lunghezza totale rettilinei | 2,549 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/at-1969.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/spielberg.yml) |
| G laterale di riferimento / km | 0,665 | g/km | stimato | [1](https://torqlytics.com/circuits/spielberg) |
| Cambi di direzione per km | 0,925 | 1/km | stimato | [1](https://torqlytics.com/circuits/spielberg) |
| Velocità media sul giro | 243,448 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9951) [2](https://www.formula1.com/en/racing/2025/austria) |
| Velocità media in curva | 187 | km/h | stimato | [1](https://torqlytics.com/circuits/spielberg) |
| Velocità massima | 324 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9951&driver_number=4&date%3E=2025-06-28T15%3A12%3A22.382000%2B00%3A00&date%3C=2025-06-28T15%3A13%3A26.353000%2B00%3A00) |
| Velocità minima in pista | 74 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9951&driver_number=4&date%3E=2025-06-28T15%3A12%3A22.382000%2B00%3A00&date%3C=2025-06-28T15%3A13%3A26.353000%2B00%3A00) |
| G medio in frenata / km | 0,453 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9951&driver_number=4&date%3E=2025-06-28T15%3A12%3A22.382000%2B00%3A00&date%3C=2025-06-28T15%3A13%3A26.353000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 63,5 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | medio | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/spielberg.yml) |
| Umidità media | 39,267 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9118) [2](https://api.openf1.org/v1/weather?session_key=9550) [3](https://api.openf1.org/v1/weather?session_key=9955) |
| Velocità media del vento | 1,457 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9118) [2](https://api.openf1.org/v1/weather?session_key=9550) [3](https://api.openf1.org/v1/weather?session_key=9955) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9118) [2](https://api.openf1.org/v1/weather?session_key=9550) [3](https://api.openf1.org/v1/weather?session_key=9955) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9118) [2](https://api.openf1.org/v1/weather?session_key=9550) [3](https://api.openf1.org/v1/weather?session_key=9955) |
| Distanza programmata gara | 307,026 | km | documentato | [1](https://www.formula1.com/en/racing/2026/austria) |

Piste più simili nel catalogo: **abu-dhabi-yas-marina: 89,506%** · **ungheria-hungaroring: 88,367%** · **italia-monza: 88,152%**.

## gran-bretagna-silverstone

Lunghezza giro: **5,891 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 18 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/silverstone.yml) |
| Altitudine | 152 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 25,861 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9126) [2](https://api.openf1.org/v1/weather?session_key=9558) [3](https://api.openf1.org/v1/weather?session_key=9947) |
| Temperatura media aria | 18,251 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9126) [2](https://api.openf1.org/v1/weather?session_key=9558) [3](https://api.openf1.org/v1/weather?session_key=9947) |
| Numero di rettilinei | 6 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/gb-1948.geojson) |
| Lunghezza totale rettilinei | 2,715 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/gb-1948.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/silverstone.yml) |
| G laterale di riferimento / km | 0,464 | g/km | stimato | [1](https://torqlytics.com/circuits/silverstone) |
| Cambi di direzione per km | 1,698 | 1/km | stimato | [1](https://torqlytics.com/circuits/silverstone) |
| Velocità media sul giro | 249,819 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9943) [2](https://www.formula1.com/en/racing/2025/great-britain) |
| Velocità media in curva | 200,222 | km/h | stimato | [1](https://torqlytics.com/circuits/silverstone) |
| Velocità massima | 324 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9943&driver_number=1&date%3E=2025-07-05T15%3A09%3A28.589000%2B00%3A00&date%3C=2025-07-05T15%3A10%3A53.481000%2B00%3A00) |
| Velocità minima in pista | 89 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9943&driver_number=1&date%3E=2025-07-05T15%3A09%3A28.589000%2B00%3A00&date%3C=2025-07-05T15%3A10%3A53.481000%2B00%3A00) |
| G medio in frenata / km | 0,245 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9943&driver_number=1&date%3E=2025-07-05T15%3A09%3A28.589000%2B00%3A00&date%3C=2025-07-05T15%3A10%3A53.481000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 11,3 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/silverstone.yml) |
| Umidità media | 67,767 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9126) [2](https://api.openf1.org/v1/weather?session_key=9558) [3](https://api.openf1.org/v1/weather?session_key=9947) |
| Velocità media del vento | 1,887 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9126) [2](https://api.openf1.org/v1/weather?session_key=9558) [3](https://api.openf1.org/v1/weather?session_key=9947) |
| Pioggia prevalente nelle edizioni osservate | si | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9126) [2](https://api.openf1.org/v1/weather?session_key=9558) [3](https://api.openf1.org/v1/weather?session_key=9947) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9126) [2](https://api.openf1.org/v1/weather?session_key=9558) [3](https://api.openf1.org/v1/weather?session_key=9947) |
| Distanza programmata gara | 306,198 | km | documentato | [1](https://www.formula1.com/en/racing/2026/great-britain) |

Piste più simili nel catalogo: **brasile-interlagos: 90,866%** · **olanda-zandvoort: 87,838%** · **bahrein-sepang: 87,522%**.

## belgio-spa

Lunghezza giro: **7,004 km**. Carico: **basso**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 19 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/spa-francorchamps.yml) |
| Altitudine | 391 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 31,88 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9141) [2](https://api.openf1.org/v1/weather?session_key=9574) [3](https://api.openf1.org/v1/weather?session_key=9939) |
| Temperatura media aria | 18,705 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9141) [2](https://api.openf1.org/v1/weather?session_key=9574) [3](https://api.openf1.org/v1/weather?session_key=9939) |
| Numero di rettilinei | 10 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/be-1925.geojson) |
| Lunghezza totale rettilinei | 3,728 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/be-1925.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/spa-francorchamps.yml) |
| G laterale di riferimento / km | 0,383 | g/km | stimato | [1](https://torqlytics.com/circuits/spa-francorchamps) |
| Cambi di direzione per km | 1,999 | 1/km | stimato | [1](https://torqlytics.com/circuits/spa-francorchamps) |
| Velocità media sul giro | 250,735 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9935) [2](https://www.formula1.com/en/racing/2025/belgium) |
| Velocità media in curva | 204,474 | km/h | stimato | [1](https://torqlytics.com/circuits/spa-francorchamps) |
| Velocità massima | 339 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9935&driver_number=4&date%3E=2025-07-26T14%3A50%3A56.915000%2B00%3A00&date%3C=2025-07-26T14%3A52%3A37.477000%2B00%3A00) |
| Velocità minima in pista | 75 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9935&driver_number=4&date%3E=2025-07-26T14%3A50%3A56.915000%2B00%3A00&date%3C=2025-07-26T14%3A52%3A37.477000%2B00%3A00) |
| G medio in frenata / km | 0,287 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9935&driver_number=4&date%3E=2025-07-26T14%3A50%3A56.915000%2B00%3A00&date%3C=2025-07-26T14%3A52%3A37.477000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 102,2 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | basso | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 65,554 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9141) [2](https://api.openf1.org/v1/weather?session_key=9574) [3](https://api.openf1.org/v1/weather?session_key=9939) |
| Velocità media del vento | 1,65 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9141) [2](https://api.openf1.org/v1/weather?session_key=9574) [3](https://api.openf1.org/v1/weather?session_key=9939) |
| Pioggia prevalente nelle edizioni osservate | si | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9141) [2](https://api.openf1.org/v1/weather?session_key=9574) [3](https://api.openf1.org/v1/weather?session_key=9939) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9141) [2](https://api.openf1.org/v1/weather?session_key=9574) [3](https://api.openf1.org/v1/weather?session_key=9939) |
| Distanza programmata gara | 308,054 | km | documentato | [1](https://www.formula1.com/en/racing/2026/belgium) |

Piste più simili nel catalogo: **gran-bretagna-silverstone: 85,573%** · **brasile-interlagos: 83,175%** · **canada-montreal: 79,417%**.

## ungheria-hungaroring

Lunghezza giro: **4,381 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 14 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/hungaroring.yml) |
| Altitudine | 220 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 41,498 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9133) [2](https://api.openf1.org/v1/weather?session_key=9566) [3](https://api.openf1.org/v1/weather?session_key=9928) |
| Temperatura media aria | 26,821 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9133) [2](https://api.openf1.org/v1/weather?session_key=9566) [3](https://api.openf1.org/v1/weather?session_key=9928) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/hu-1986.geojson) |
| Lunghezza totale rettilinei | 1,5 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/hu-1986.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/hungaroring.yml) |
| G laterale di riferimento / km | 0,562 | g/km | stimato | [1](https://torqlytics.com/circuits/hungaroring) |
| Cambi di direzione per km | 2,283 | 1/km | stimato | [1](https://torqlytics.com/circuits/hungaroring) |
| Velocità media sul giro | 210,597 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9924) [2](https://www.formula1.com/en/racing/2025/hungary) |
| Velocità media in curva | 148,5 | km/h | stimato | [1](https://torqlytics.com/circuits/hungaroring) |
| Velocità massima | 318 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9924&driver_number=4&date%3E=2025-08-02T14%3A30%3A41.214000%2B00%3A00&date%3C=2025-08-02T14%3A31%3A56.104000%2B00%3A00) |
| Velocità minima in pista | 98 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9924&driver_number=4&date%3E=2025-08-02T14%3A30%3A41.214000%2B00%3A00&date%3C=2025-08-02T14%3A31%3A56.104000%2B00%3A00) |
| G medio in frenata / km | 0,388 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9924&driver_number=4&date%3E=2025-08-02T14%3A30%3A41.214000%2B00%3A00&date%3C=2025-08-02T14%3A31%3A56.104000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 34,7 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 45,062 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9133) [2](https://api.openf1.org/v1/weather?session_key=9566) [3](https://api.openf1.org/v1/weather?session_key=9928) |
| Velocità media del vento | 1,547 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9133) [2](https://api.openf1.org/v1/weather?session_key=9566) [3](https://api.openf1.org/v1/weather?session_key=9928) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9133) [2](https://api.openf1.org/v1/weather?session_key=9566) [3](https://api.openf1.org/v1/weather?session_key=9928) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9133) [2](https://api.openf1.org/v1/weather?session_key=9566) [3](https://api.openf1.org/v1/weather?session_key=9928) |
| Distanza programmata gara | 306,63 | km | documentato | [1](https://www.formula1.com/en/racing/2026/hungary) |

Piste più simili nel catalogo: **usa-austin: 92,86%** · **giappone-suzuka: 91,936%** · **spagna-barcellona: 90,34%**.

## olanda-zandvoort

Lunghezza giro: **4,259 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 14 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/zandvoort.yml) |
| Altitudine | 5 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 28,035 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9149) [2](https://api.openf1.org/v1/weather?session_key=9582) [3](https://api.openf1.org/v1/weather?session_key=9920) |
| Temperatura media aria | 18,596 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9149) [2](https://api.openf1.org/v1/weather?session_key=9582) [3](https://api.openf1.org/v1/weather?session_key=9920) |
| Numero di rettilinei | 3 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/nl-1948.geojson) |
| Lunghezza totale rettilinei | 1,23 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/nl-1948.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/zandvoort.yml) |
| G laterale di riferimento / km | 0,609 | g/km | stimato | [1](https://torqlytics.com/circuits/zandvoort) |
| Cambi di direzione per km | 1,878 | 1/km | stimato | [1](https://torqlytics.com/circuits/zandvoort) |
| Velocità media sul giro | 223,303 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9916) [2](https://www.formula1.com/en/racing/2025/netherlands) |
| Velocità media in curva | 184,286 | km/h | stimato | [1](https://torqlytics.com/circuits/zandvoort) |
| Velocità massima | 326 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9916&driver_number=81&date%3E=2025-08-30T13%3A49%3A31.198000%2B00%3A00&date%3C=2025-08-30T13%3A50%3A39.860000%2B00%3A00) |
| Velocità minima in pista | 101 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9916&driver_number=81&date%3E=2025-08-30T13%3A49%3A31.198000%2B00%3A00&date%3C=2025-08-30T13%3A50%3A39.860000%2B00%3A00) |
| G medio in frenata / km | 0,354 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9916&driver_number=81&date%3E=2025-08-30T13%3A49%3A31.198000%2B00%3A00&date%3C=2025-08-30T13%3A50%3A39.860000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 15 | m | stimato | [1](https://www.shell.nl/over-ons/nieuws/shell-venster-2025/zandvoort.html) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 67,237 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9149) [2](https://api.openf1.org/v1/weather?session_key=9582) [3](https://api.openf1.org/v1/weather?session_key=9920) |
| Velocità media del vento | 3,174 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9149) [2](https://api.openf1.org/v1/weather?session_key=9582) [3](https://api.openf1.org/v1/weather?session_key=9920) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9149) [2](https://api.openf1.org/v1/weather?session_key=9582) [3](https://api.openf1.org/v1/weather?session_key=9920) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9149) [2](https://api.openf1.org/v1/weather?session_key=9582) [3](https://api.openf1.org/v1/weather?session_key=9920) |
| Distanza programmata gara | 306,592 | km | documentato | [1](https://www.formula1.com/en/racing/2026/netherlands) |

Piste più simili nel catalogo: **spagna-barcellona: 93,985%** · **australia-melbourne: 90,747%** · **giappone-suzuka: 89,188%**.

## italia-monza

Lunghezza giro: **5,793 km**. Carico: **basso**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 11 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/monza.yml) |
| Altitudine | 189 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 44,085 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9157) [2](https://api.openf1.org/v1/weather?session_key=9590) [3](https://api.openf1.org/v1/weather?session_key=9912) |
| Temperatura media aria | 29,841 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9157) [2](https://api.openf1.org/v1/weather?session_key=9590) [3](https://api.openf1.org/v1/weather?session_key=9912) |
| Numero di rettilinei | 6 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/it-1922.geojson) |
| Lunghezza totale rettilinei | 3,872 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/it-1922.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/monza.yml) |
| G laterale di riferimento / km | 0,457 | g/km | stimato | [1](https://torqlytics.com/circuits/monza) |
| Cambi di direzione per km | 1,381 | 1/km | stimato | [1](https://torqlytics.com/circuits/monza) |
| Velocità media sul giro | 264,682 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9908) [2](https://www.formula1.com/en/racing/2025/italy) |
| Velocità media in curva | 170,182 | km/h | stimato | [1](https://torqlytics.com/circuits/monza) |
| Velocità massima | 348 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9908&driver_number=1&date%3E=2025-09-06T15%3A00%3A54.117000%2B00%3A00&date%3C=2025-09-06T15%3A02%3A12.909000%2B00%3A00) |
| Velocità minima in pista | 73 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9908&driver_number=1&date%3E=2025-09-06T15%3A00%3A54.117000%2B00%3A00&date%3C=2025-09-06T15%3A02%3A12.909000%2B00%3A00) |
| G medio in frenata / km | 0,356 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9908&driver_number=1&date%3E=2025-09-06T15%3A00%3A54.117000%2B00%3A00&date%3C=2025-09-06T15%3A02%3A12.909000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 12,8 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | basso | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 38,215 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9157) [2](https://api.openf1.org/v1/weather?session_key=9590) [3](https://api.openf1.org/v1/weather?session_key=9912) |
| Velocità media del vento | 1,706 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9157) [2](https://api.openf1.org/v1/weather?session_key=9590) [3](https://api.openf1.org/v1/weather?session_key=9912) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9157) [2](https://api.openf1.org/v1/weather?session_key=9590) [3](https://api.openf1.org/v1/weather?session_key=9912) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9157) [2](https://api.openf1.org/v1/weather?session_key=9590) [3](https://api.openf1.org/v1/weather?session_key=9912) |
| Distanza programmata gara | 306,72 | km | documentato | [1](https://www.formula1.com/en/racing/2026/italy) |

Piste più simili nel catalogo: **austria-spielberg: 88,152%** · **cina-shanghai: 88,082%** · **abu-dhabi-yas-marina: 87,13%**.

## spagna-madring

Lunghezza giro: **5,414 km**. Carico: **medio**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 22 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/madring.yml) |
| Altitudine | 683 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 53,896 | °C | stimato | [1](https://api.openf1.org/v1/weather?session_key=11369) |
| Temperatura media aria | 31,03 | °C | stimato | [1](https://api.openf1.org/v1/weather?session_key=11369) |
| Numero di rettilinei | 5 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/es-2026.geojson) |
| Lunghezza totale rettilinei | 1,712 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/es-2026.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | ibrido | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/madring.yml) |
| G laterale di riferimento / km | 0,37 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) |
| Cambi di direzione per km | 3,694 | 1/km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/es-2026.geojson) |
| Velocità media sul giro | 212,258 | km/h | stimato | [1](https://api.openf1.org/v1/laps?session_key=11365) |
| Velocità media in curva | 201,815 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) |
| Velocità massima | 334 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) |
| Velocità minima in pista | 81 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) |
| G medio in frenata / km | 0,302 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11365&driver_number=1&date%3E=2026-09-12T14%3A58%3A42.680000%2B00%3A00&date%3C=2026-09-12T15%3A00%3A14.504000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 26 | m | stimato | [1](https://www.madring.com/en/circuit) |
| Richiesta di carico aerodinamico | medio | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/madring.yml) |
| Umidità media | 21,958 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=11369) |
| Velocità media del vento | 1,387 | m/s | stimato | [1](https://api.openf1.org/v1/weather?session_key=11369) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=11369) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=11369) |
| Distanza programmata gara | 308,399 | km | documentato | [1](https://www.formula1.com/en/racing/2026/spain) |

Temperature e meteo: gara 2026 già conclusa, usata come riferimento alternativo esplicito allo storico 2023–2025.

Piste più simili nel catalogo: **usa-austin: 88,523%** · **abu-dhabi-yas-marina: 84,902%** · **austria-spielberg: 83,482%**.

## azerbaigian-baku

Lunghezza giro: **6,003 km**. Carico: **basso**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 20 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/baku.yml) |
| Altitudine | -23 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 36,271 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9070) [2](https://api.openf1.org/v1/weather?session_key=9598) [3](https://api.openf1.org/v1/weather?session_key=9904) |
| Temperatura media aria | 24,05 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9070) [2](https://api.openf1.org/v1/weather?session_key=9598) [3](https://api.openf1.org/v1/weather?session_key=9904) |
| Numero di rettilinei | 10 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/az-2016.geojson) |
| Lunghezza totale rettilinei | 3,768 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/az-2016.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | cittadino | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/baku.yml) |
| G laterale di riferimento / km | 0,32 | g/km | stimato | [1](https://torqlytics.com/circuits/baku) |
| Cambi di direzione per km | 1,333 | 1/km | stimato | [1](https://torqlytics.com/circuits/baku) |
| Velocità media sul giro | 210,784 | km/h | stimato | [1](https://api.openf1.org/v1/laps?session_key=11373) |
| Velocità media in curva | 151,65 | km/h | stimato | [1](https://torqlytics.com/circuits/baku) |
| Velocità massima | 331 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11373&driver_number=63&date%3E=2026-09-25T13%3A02%3A17.911000%2B00%3A00&date%3C=2026-09-25T13%3A04%3A00.437000%2B00%3A00) |
| Velocità minima in pista | 71 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11373&driver_number=63&date%3E=2026-09-25T13%3A02%3A17.911000%2B00%3A00&date%3C=2026-09-25T13%3A04%3A00.437000%2B00%3A00) |
| G medio in frenata / km | 0,262 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11373&driver_number=63&date%3E=2026-09-25T13%3A02%3A17.911000%2B00%3A00&date%3C=2026-09-25T13%3A04%3A00.437000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 26,8 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | basso | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 48,598 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9070) [2](https://api.openf1.org/v1/weather?session_key=9598) [3](https://api.openf1.org/v1/weather?session_key=9904) |
| Velocità media del vento | 1,407 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9070) [2](https://api.openf1.org/v1/weather?session_key=9598) [3](https://api.openf1.org/v1/weather?session_key=9904) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9070) [2](https://api.openf1.org/v1/weather?session_key=9598) [3](https://api.openf1.org/v1/weather?session_key=9904) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9070) [2](https://api.openf1.org/v1/weather?session_key=9598) [3](https://api.openf1.org/v1/weather?session_key=9904) |
| Distanza programmata gara | 306,042 | km | documentato | [1](https://www.formula1.com/en/racing/2026/azerbaijan) |

Piste più simili nel catalogo: **usa-las-vegas: 89,638%** · **singapore-marina-bay: 85,92%** · **cina-shanghai: 85,879%**.

## bahrein-sepang

Lunghezza giro: **5,543 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 15 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/sepang.yml) |
| Altitudine | 43 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 33,585 | °C | stimato | [1](https://api.openf1.org/v1/weather?session_key=11731) |
| Temperatura media aria | 25,668 | °C | stimato | [1](https://api.openf1.org/v1/weather?session_key=11731) |
| Numero di rettilinei | 7 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/my-1999.geojson) |
| Lunghezza totale rettilinei | 2,941 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/my-1999.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/sepang.yml) |
| G laterale di riferimento / km | 0,346 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) |
| Cambi di direzione per km | 1,804 | 1/km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/my-1999.geojson) |
| Velocità media sul giro | 209,764 | km/h | stimato | [1](https://api.openf1.org/v1/laps?session_key=11730) |
| Velocità media in curva | 175,319 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) |
| Velocità massima | 321 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) |
| Velocità minima in pista | 71 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) |
| G medio in frenata / km | 0,272 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=11730&driver_number=3&date%3E=2026-10-03T08%3A58%3A39.243000%2B00%3A00&date%3C=2026-10-03T09%3A00%3A14.373000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 22 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://www.renault.jp/information/pdf/factfile_2017Malaysia.pdf) |
| Umidità media | 87,085 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=11731) |
| Velocità media del vento | 1,668 | m/s | stimato | [1](https://api.openf1.org/v1/weather?session_key=11731) |
| Pioggia prevalente nelle edizioni osservate | si | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=11731) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=11731) |
| Distanza programmata gara | 310,417 | km | documentato | [1](https://www.formula1.com/en/racing/2026/bahrain) |

Temperature e meteo: gara 2026 già conclusa, usata come riferimento alternativo esplicito allo storico 2023–2025.

Piste più simili nel catalogo: **gran-bretagna-silverstone: 87,522%** · **qatar-lusail: 87,15%** · **giappone-suzuka: 86,276%**.

## singapore-marina-bay

Lunghezza giro: **4,927 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 19 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/marina-bay.yml) |
| Altitudine | 7 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 35,167 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9165) [2](https://api.openf1.org/v1/weather?session_key=9606) [3](https://api.openf1.org/v1/weather?session_key=9896) |
| Temperatura media aria | 29,939 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9165) [2](https://api.openf1.org/v1/weather?session_key=9606) [3](https://api.openf1.org/v1/weather?session_key=9896) |
| Numero di rettilinei | 7 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/sg-2008.geojson) |
| Lunghezza totale rettilinei | 2,269 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/sg-2008.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | cittadino | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/marina-bay.yml) |
| G laterale di riferimento / km | 0,324 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) |
| Cambi di direzione per km | 2,436 | 1/km | stimato | [1](https://torqlytics.com/circuits/singapore) |
| Velocità media sul giro | 198,941 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9892) [2](https://www.formula1.com/en/racing/2025/singapore) |
| Velocità media in curva | 178,808 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) |
| Velocità massima | 316 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) |
| Velocità minima in pista | 65 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) |
| G medio in frenata / km | 0,35 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9892&driver_number=63&date%3E=2025-10-04T14%3A05%3A38.388000%2B00%3A00&date%3C=2025-10-04T14%3A07%3A07.546000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 5,3 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/marina-bay.yml) |
| Umidità media | 73,764 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9165) [2](https://api.openf1.org/v1/weather?session_key=9606) [3](https://api.openf1.org/v1/weather?session_key=9896) |
| Velocità media del vento | 1,285 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9165) [2](https://api.openf1.org/v1/weather?session_key=9606) [3](https://api.openf1.org/v1/weather?session_key=9896) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9165) [2](https://api.openf1.org/v1/weather?session_key=9606) [3](https://api.openf1.org/v1/weather?session_key=9896) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9165) [2](https://api.openf1.org/v1/weather?session_key=9606) [3](https://api.openf1.org/v1/weather?session_key=9896) |
| Distanza programmata gara | 305,337 | km | documentato | [1](https://www.formula1.com/en/racing/2026/singapore) |

Piste più simili nel catalogo: **usa-austin: 86,756%** · **qatar-lusail: 86,476%** · **azerbaigian-baku: 85,92%**.

## usa-austin

Lunghezza giro: **5,513 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 20 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/austin.yml) |
| Altitudine | 154 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 44,605 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9213) [2](https://api.openf1.org/v1/weather?session_key=9617) [3](https://api.openf1.org/v1/weather?session_key=9888) |
| Temperatura media aria | 29,259 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9213) [2](https://api.openf1.org/v1/weather?session_key=9617) [3](https://api.openf1.org/v1/weather?session_key=9888) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/us-2012.geojson) |
| Lunghezza totale rettilinei | 2,213 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/us-2012.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/austin.yml) |
| G laterale di riferimento / km | 0,38 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) |
| Cambi di direzione per km | 2,177 | 1/km | stimato | [1](https://torqlytics.com/circuits/austin) |
| Velocità media sul giro | 214,537 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9884) [2](https://www.formula1.com/en/racing/2025/united-states) |
| Velocità media in curva | 187,859 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) |
| Velocità massima | 324 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) |
| Velocità minima in pista | 80 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) |
| G medio in frenata / km | 0,294 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9884&driver_number=1&date%3E=2025-10-18T22%3A03%3A01.553000%2B00%3A00&date%3C=2025-10-18T22%3A04%3A34.063000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 30,9 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/austin.yml) |
| Umidità media | 31,505 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9213) [2](https://api.openf1.org/v1/weather?session_key=9617) [3](https://api.openf1.org/v1/weather?session_key=9888) |
| Velocità media del vento | 2,162 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9213) [2](https://api.openf1.org/v1/weather?session_key=9617) [3](https://api.openf1.org/v1/weather?session_key=9888) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9213) [2](https://api.openf1.org/v1/weather?session_key=9617) [3](https://api.openf1.org/v1/weather?session_key=9888) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9213) [2](https://api.openf1.org/v1/weather?session_key=9617) [3](https://api.openf1.org/v1/weather?session_key=9888) |
| Distanza programmata gara | 308,432 | km | documentato | [1](https://www.formula1.com/en/racing/2026/united-states) |

Piste più simili nel catalogo: **giappone-suzuka: 92,979%** · **ungheria-hungaroring: 92,86%** · **messico-citta-del-messico: 89,633%**.

## messico-citta-del-messico

Lunghezza giro: **4,304 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 17 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/mexico-city.yml) |
| Altitudine | 2285 | m | documentato | [1](https://www.mercedesamgf1.com/news/what-impact-does-high-altitude-have-on-an-f1-car) |
| Temperatura media asfalto | 43,5 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9181) [2](https://api.openf1.org/v1/weather?session_key=9625) [3](https://api.openf1.org/v1/weather?session_key=9877) |
| Temperatura media aria | 24,331 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9181) [2](https://api.openf1.org/v1/weather?session_key=9625) [3](https://api.openf1.org/v1/weather?session_key=9877) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mx-1962.geojson) |
| Lunghezza totale rettilinei | 2,227 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mx-1962.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/mexico-city.yml) |
| G laterale di riferimento / km | 0,388 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) |
| Cambi di direzione per km | 2,788 | 1/km | stimato | [1](https://torqlytics.com/circuits/mexico-city) |
| Velocità media sul giro | 204,99 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9873) [2](https://www.formula1.com/en/racing/2025/mexico) |
| Velocità media in curva | 163,548 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) |
| Velocità massima | 351 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) |
| Velocità minima in pista | 68 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) |
| G medio in frenata / km | 0,371 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9873&driver_number=4&date%3E=2025-10-25T21%3A58%3A59.232000%2B00%3A00&date%3C=2025-10-25T22%3A00%3A14.818000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 2,8 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/mexico-city.yml) |
| Umidità media | 31,513 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9181) [2](https://api.openf1.org/v1/weather?session_key=9625) [3](https://api.openf1.org/v1/weather?session_key=9877) |
| Velocità media del vento | 1,899 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9181) [2](https://api.openf1.org/v1/weather?session_key=9625) [3](https://api.openf1.org/v1/weather?session_key=9877) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9181) [2](https://api.openf1.org/v1/weather?session_key=9625) [3](https://api.openf1.org/v1/weather?session_key=9877) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9181) [2](https://api.openf1.org/v1/weather?session_key=9625) [3](https://api.openf1.org/v1/weather?session_key=9877) |
| Distanza programmata gara | 305,354 | km | documentato | [1](https://www.formula1.com/en/racing/2026/mexico) |

Piste più simili nel catalogo: **usa-austin: 89,633%** · **ungheria-hungaroring: 88,175%** · **giappone-suzuka: 86,086%**.

## brasile-interlagos

Lunghezza giro: **4,309 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 15 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/interlagos.yml) |
| Altitudine | 800 | m | documentato | [1](https://www.mercedesamgf1.com/news/what-impact-does-high-altitude-have-on-an-f1-car) |
| Temperatura media asfalto | 33,967 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9205) [2](https://api.openf1.org/v1/weather?session_key=9636) [3](https://api.openf1.org/v1/weather?session_key=9869) |
| Temperatura media aria | 19,787 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9205) [2](https://api.openf1.org/v1/weather?session_key=9636) [3](https://api.openf1.org/v1/weather?session_key=9869) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/br-1940.geojson) |
| Lunghezza totale rettilinei | 1,563 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/br-1940.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/interlagos.yml) |
| G laterale di riferimento / km | 0,5 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) |
| Cambi di direzione per km | 1,392 | 1/km | stimato | [1](https://torqlytics.com/circuits/interlagos) |
| Velocità media sul giro | 223,165 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9865) [2](https://www.formula1.com/en/racing/2025/brazil) |
| Velocità media in curva | 201,898 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) |
| Velocità massima | 336 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) |
| Velocità minima in pista | 85 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) |
| G medio in frenata / km | 0,397 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9865&driver_number=4&date%3E=2025-11-08T19%3A02%3A47.003000%2B00%3A00&date%3C=2025-11-08T19%3A03%3A56.514000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 43 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/interlagos.yml) |
| Umidità media | 70,741 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9205) [2](https://api.openf1.org/v1/weather?session_key=9636) [3](https://api.openf1.org/v1/weather?session_key=9869) |
| Velocità media del vento | 1,227 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9205) [2](https://api.openf1.org/v1/weather?session_key=9636) [3](https://api.openf1.org/v1/weather?session_key=9869) |
| Pioggia prevalente nelle edizioni osservate | si | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9205) [2](https://api.openf1.org/v1/weather?session_key=9636) [3](https://api.openf1.org/v1/weather?session_key=9869) |
| Variabilità pioggia / asciutto | 88,889 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9205) [2](https://api.openf1.org/v1/weather?session_key=9636) [3](https://api.openf1.org/v1/weather?session_key=9869) |
| Distanza programmata gara | 305,879 | km | documentato | [1](https://www.formula1.com/en/racing/2026/brazil) |

Piste più simili nel catalogo: **gran-bretagna-silverstone: 90,866%** · **olanda-zandvoort: 87,86%** · **spagna-barcellona: 87,842%**.

## usa-las-vegas

Lunghezza giro: **6,201 km**. Carico: **basso**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 17 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/las-vegas.yml) |
| Altitudine | 608 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 17,59 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9189) [2](https://api.openf1.org/v1/weather?session_key=9644) [3](https://api.openf1.org/v1/weather?session_key=9858) |
| Temperatura media aria | 17,39 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9189) [2](https://api.openf1.org/v1/weather?session_key=9644) [3](https://api.openf1.org/v1/weather?session_key=9858) |
| Numero di rettilinei | 5 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/us-2023.geojson) |
| Lunghezza totale rettilinei | 3,922 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/us-2023.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | cittadino | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/las-vegas.yml) |
| G laterale di riferimento / km | 0,217 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) |
| Cambi di direzione per km | 0,968 | 1/km | stimato | [1](https://torqlytics.com/circuits/las-vegas) |
| Velocità media sul giro | 206,826 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9854) [2](https://www.formula1.com/en/racing/2025/las-vegas) |
| Velocità media in curva | 173,806 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) |
| Velocità massima | 331 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) |
| Velocità minima in pista | 69 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) |
| G medio in frenata / km | 0,233 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9854&driver_number=4&date%3E=2025-11-22T05%3A05%3A34.030000%2B00%3A00&date%3C=2025-11-22T05%3A07%3A21.964000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 12 | m | stimato | [1](https://paddockweather.com/circuits.php) |
| Richiesta di carico aerodinamico | basso | basso / medio / alto | stimato | [1](https://www.sarmalinux.com/blog/f1-circuits-2026-track-data-explained) |
| Umidità media | 44,295 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9189) [2](https://api.openf1.org/v1/weather?session_key=9644) [3](https://api.openf1.org/v1/weather?session_key=9858) |
| Velocità media del vento | 2,429 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9189) [2](https://api.openf1.org/v1/weather?session_key=9644) [3](https://api.openf1.org/v1/weather?session_key=9858) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9189) [2](https://api.openf1.org/v1/weather?session_key=9644) [3](https://api.openf1.org/v1/weather?session_key=9858) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9189) [2](https://api.openf1.org/v1/weather?session_key=9644) [3](https://api.openf1.org/v1/weather?session_key=9858) |
| Distanza programmata gara | 309,958 | km | documentato | [1](https://www.formula1.com/en/racing/2026/las-vegas) |

G laterale e velocità in curva: telemetria Q 2024, perché le posizioni 2025 non erano disponibili dalla fonte.

Piste più simili nel catalogo: **azerbaigian-baku: 89,638%** · **cina-shanghai: 84,132%** · **italia-monza: 82,745%**.

## qatar-lusail

Lunghezza giro: **5,419 km**. Carico: **alto**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 16 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/lusail.yml) |
| Altitudine | 12 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 28,827 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9221) [2](https://api.openf1.org/v1/weather?session_key=9655) [3](https://api.openf1.org/v1/weather?session_key=9850) |
| Temperatura media aria | 24,047 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9221) [2](https://api.openf1.org/v1/weather?session_key=9655) [3](https://api.openf1.org/v1/weather?session_key=9850) |
| Numero di rettilinei | 6 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/qa-2004.geojson) |
| Lunghezza totale rettilinei | 2,206 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/qa-2004.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/lusail.yml) |
| G laterale di riferimento / km | 0,427 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) |
| Cambi di direzione per km | 1,845 | 1/km | stimato | [1](https://torqlytics.com/circuits/losail) |
| Velocità media sul giro | 245,738 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9846) [2](https://www.formula1.com/en/racing/2025/qatar) |
| Velocità media in curva | 228,005 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) |
| Velocità massima | 327 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) |
| Velocità minima in pista | 99 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) |
| G medio in frenata / km | 0,3 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9846&driver_number=81&date%3E=2025-11-29T19%3A04%3A19.145000%2B00%3A00&date%3C=2025-11-29T19%3A05%3A38.532000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 4,2 | m | stimato | [1](https://oversteer48.com/lusail-international-circuit-layout/) |
| Richiesta di carico aerodinamico | alto | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/lusail.yml) |
| Umidità media | 67,775 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9221) [2](https://api.openf1.org/v1/weather?session_key=9655) [3](https://api.openf1.org/v1/weather?session_key=9850) |
| Velocità media del vento | 1 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9221) [2](https://api.openf1.org/v1/weather?session_key=9655) [3](https://api.openf1.org/v1/weather?session_key=9850) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9221) [2](https://api.openf1.org/v1/weather?session_key=9655) [3](https://api.openf1.org/v1/weather?session_key=9850) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9221) [2](https://api.openf1.org/v1/weather?session_key=9655) [3](https://api.openf1.org/v1/weather?session_key=9850) |
| Distanza programmata gara | 308,611 | km | documentato | [1](https://www.formula1.com/en/racing/2026/qatar) |

G laterale e velocità in curva: telemetria Q 2024, perché le posizioni 2025 non erano disponibili dalla fonte.

Piste più simili nel catalogo: **giappone-suzuka: 92,344%** · **abu-dhabi-yas-marina: 92,148%** · **cina-shanghai: 89,517%**.

## abu-dhabi-yas-marina

Lunghezza giro: **5,281 km**. Carico: **medio**.

| Criterio | Valore | Unità | Qualità | Fonti |
|---|---:|---|---|---|
| Numero di curve | 16 | curve | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/yas-marina.yml) |
| Altitudine | 7 | m | derivato | [1](https://api.open-meteo.com/v1/elevation?latitude=-37.849722%2C31.338889%2C34.843056%2C25.958056%2C45.500578%2C43.734722%2C41.57%2C47.219722%2C52.078611%2C50.437222%2C47.582222%2C52.388819%2C45.620556%2C40.465278%2C40.3725%2C2.760556%2C1.291531%2C30.132778%2C19.404197%2C-23.701111%2C36.175%2C25.49%2C24.467222&longitude=144.968333%2C121.219722%2C136.540556%2C-80.238889%2C-73.522461%2C7.420556%2C2.261111%2C14.764722%2C-1.016944%2C5.971389%2C19.251111%2C4.540922%2C9.289444%2C-3.615278%2C49.853333%2C101.7375%2C103.86385%2C-97.641111%2C-99.088747%2C-46.697222%2C-115.136389%2C51.454167%2C54.603056) |
| Temperatura media asfalto | 30,931 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9197) [2](https://api.openf1.org/v1/weather?session_key=9662) [3](https://api.openf1.org/v1/weather?session_key=9839) |
| Temperatura media aria | 26,478 | °C | derivato | [1](https://api.openf1.org/v1/weather?session_key=9197) [2](https://api.openf1.org/v1/weather?session_key=9662) [3](https://api.openf1.org/v1/weather?session_key=9839) |
| Numero di rettilinei | 4 | rettilinei | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/ae-2009.geojson) |
| Lunghezza totale rettilinei | 2,322 | km | stimato | [1](https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/ae-2009.geojson) |
| Zone DRS / Overtake | 1 | zone | stimato | [1](https://www.formula1.com/en/latest/article/circuit-guide-2026-australian-grand-prix-albert-park.19zPlhKhMbTaVNFIPKAAMa.19zPlhKhMbTaVNFIPKAAMa) |
| Tipologia circuito | permanente | categoria | documentato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/yas-marina.yml) |
| G laterale di riferimento / km | 0,418 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) |
| Cambi di direzione per km | 1,894 | 1/km | stimato | [1](https://torqlytics.com/circuits/yas-marina-circuit) |
| Velocità media sul giro | 231,265 | km/h | derivato | [1](https://api.openf1.org/v1/laps?session_key=9835) [2](https://www.formula1.com/en/racing/2025/united-arab-emirates) |
| Velocità media in curva | 205,762 | km/h | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) [2](https://api.openf1.org/v1/location?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) |
| Velocità massima | 331 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) |
| Velocità minima in pista | 68 | km/h | derivato | [1](https://api.openf1.org/v1/car_data?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) |
| G medio in frenata / km | 0,409 | g/km | stimato | [1](https://api.openf1.org/v1/car_data?session_key=9835&driver_number=1&date%3E=2025-12-06T14%3A59%3A31.374000%2B00%3A00&date%3C=2025-12-06T15%3A00%3A53.581000%2B00%3A00) |
| Dislivello di riferimento (max–min) | 10,7 | m | stimato | [1](https://www.formula1.com/en/latest/article/highs-and-lows-which-f1-track-has-the-most-elevation-changes-.7I9JEcBw3R2AqXbnJ6hyvc.7I9JEcBw3R2AqXbnJ6hyvc) |
| Richiesta di carico aerodinamico | medio | basso / medio / alto | stimato | [1](https://raw.githubusercontent.com/f1db/f1db/v2026.17.0/src/data/circuits/yas-marina.yml) |
| Umidità media | 56,78 | % | derivato | [1](https://api.openf1.org/v1/weather?session_key=9197) [2](https://api.openf1.org/v1/weather?session_key=9662) [3](https://api.openf1.org/v1/weather?session_key=9839) |
| Velocità media del vento | 1,717 | m/s | derivato | [1](https://api.openf1.org/v1/weather?session_key=9197) [2](https://api.openf1.org/v1/weather?session_key=9662) [3](https://api.openf1.org/v1/weather?session_key=9839) |
| Pioggia prevalente nelle edizioni osservate | no | si / no | stimato | [1](https://api.openf1.org/v1/weather?session_key=9197) [2](https://api.openf1.org/v1/weather?session_key=9662) [3](https://api.openf1.org/v1/weather?session_key=9839) |
| Variabilità pioggia / asciutto | 0 | % | stimato | [1](https://api.openf1.org/v1/weather?session_key=9197) [2](https://api.openf1.org/v1/weather?session_key=9662) [3](https://api.openf1.org/v1/weather?session_key=9839) |
| Distanza programmata gara | 306,188 | km | documentato | [1](https://www.formula1.com/en/racing/2026/united-arab-emirates) |

G laterale e velocità in curva: telemetria Q 2024, perché le posizioni 2025 non erano disponibili dalla fonte.

Piste più simili nel catalogo: **cina-shanghai: 93,339%** · **qatar-lusail: 92,148%** · **giappone-suzuka: 92,121%**.
