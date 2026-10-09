# Singapore — aggiornamento del 9 ottobre 2026

## Fonti e modifiche

- [FIA, Car Presentation Submissions, documento 9](https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_car_presentation_submissions.pdf): McLaren dichiara Front Corner; Mercedes Front Wing e Front Wing Endplate; Red Bull Front wing e Rear Wheel Bodywork. Ferrari, Williams, Racing Bulls, Aston Martin, Haas, Audi, Alpine e Cadillac non dichiarano aggiornamenti per questo evento. Documento acquisito integralmente, con tutte le 11 scuderie e SHA-256 nel registro JSON. Non si deducono guadagni sul giro o installazione su entrambe le vetture.
- [Formula 1, Russell, 8 ottobre](https://www.formula1.com/en/latest/article/russell-promises-all-out-attack-from-back-of-singapore-grid-amid-engine-penalty.1Owe717iaaEqDioJZqUyaJ): Mercedes annuncia una penalità motore per Russell, minimo 10 posizioni, per la gara di domenica e non la Sprint. Entità definitiva e ordine di partenza restano in attesa della decisione FIA. L'annuncio è distinto dalle decisioni FIA; il registro delle decisioni non viene popolato con un articolo.
- [Formula 1, configurazioni Mercedes, 8 ottobre](https://www.formula1.com/en/latest/article/why-splitting-car-specifications-is-a-no-brainer-for-mercedes-at-the-singapore-grand-prix.44OonD5CF8Eg4yQ2w5REwh): Antonelli mantiene il pacchetto di Sepang con la nuova ala anteriore; Russell torna alla specifica precedente.
- [FIA, Heat Hazard Declaration, documento 4](https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_heat_hazard_declaration.pdf): allerta per Sprint e gara, sulla base dell'indice di calore previsto oltre 31 °C. Non è una temperatura dell'aria osservata.
- F1DB: la release più recente verificata rimane v2026.16.0; nessun risultato di Singapore non ancora disputato è stato aggiunto.

## Propagazione

Aggiornate 22 schede pilota, 11 schede scuderia e il riepilogo GP nelle sei lingue. Ricalcolati favoriti, ordine scuderie, indici e conclusioni delle schede con il modello esistente forma-recente-v1. Il correttivo penalità già previsto dal modello viene applicato all'arretramento annunciato: Russell P8, indice 59,7/100. È una stima descrittiva, non una previsione certificata della posizione finale.

Corretto il lettore del nuovo markup FIA (`div.title`) mantenendo il supporto del markup precedente. Il monitor torna a riconoscere il documento aggiornamenti e la mappa circuito.

## Verifiche

103 test superati; qualità dati, traduzioni backend nelle sei lingue, documentazione, OpenAPI e controllo diff superati. Aggiornamento Atlas mirato e transazionale di 34 documenti, con backup privato e verifica campo per campo. Dati Live FIA acquisiti tramite il servizio del progetto, distinti dalle schede editoriali.

Nessuna modifica agli asset frontend o al codice iOS in questo aggiornamento. Sito e app ricevono i nuovi dati dalle API condivise. Le modifiche preesistenti all'interfaccia e al vecchio snapshot F1DB sono escluse dal commit.
