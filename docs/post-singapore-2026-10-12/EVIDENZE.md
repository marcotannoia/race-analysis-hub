# Singapore concluso, Austin corrente — 12 ottobre 2026

## Dati verificati

- [Classifica finale FIA, documento 90](https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_final_race_classification.pdf): podio Verstappen, Leclerc, Antonelli. Archivio completo di 22 risultati, qualifiche, griglia, giri e cause documentate; mondiali completi di 23 piloti e 11 scuderie, inclusi i punti Sprint.
- [F1DB v2026.17.0](https://github.com/f1db/f1db/releases/tag/v2026.17.0), pubblicato l'11 ottobre alle 17:18:30 UTC. SHA-256 ZIP: `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`. Il manifest separato conserva gli hash dei sette file sorgente.
- 18 decisioni FIA esaminate integralmente, con URL, SHA-256 e provvedimento nel registro `backend/data/decisioni-fia-singapore-2026.json`. Russell: 40 + 20 posizioni, applicate a Singapore. Hadjar, Alonso e Stroll: pit lane. Sainz: pit lane nella Sprint. Nessuna penalità per Hülkenberg nel caso di impeding; nessun ulteriore provvedimento per Hamilton nel caso di uscita di pista. Le decisioni applicate a Singapore non diventano penalità di Austin.
- [Pirelli, nomine della tripletta americana](https://press.pirelli.com/the-compound-selection-for-austin-mexico-city-and-so-paulo/): Austin C2/C3/C4; Messico e San Paolo C3/C4/C5. Il registro tecnico FIA di Singapore è conservato come contesto; non certifica componenti nuovi o installazioni ad Austin.
- OpenF1, gara Singapore sessione 11388: 22 piloti, 1.240 giri, 47 stint, 25 pit, 155 messaggi di race control, 160 campioni meteo, 28.131 intervalli. Acquisizione riscontrata con l'entry list F1DB e analizzata con gli stessi filtri del corpus precedente. Ora 47 sessioni, comprese 17 gare 2026.

## Aggiornamento

Singapore è concluso; Austin è il GP corrente, con gara il 25 ottobre. Aggiornati grafici quantitativi, mondiali, forma recente, indici, conclusioni, favoriti e schede nelle sei lingue. Gli input includono il round 17; pesi, parametri e metriche del training fino al round 16 restano congelati. Ogni scheda conserva il proprio cutoff: un GP passato non usa risultati o giri successivi. Le previsioni ricostruite non sono presentate come previsioni originali archiviate prima della gara.

## Database e rilascio

Il collegamento locale ad Atlas fallisce nella negoziazione TLS. La sincronizzazione viene eseguita da Render usando il collegamento già configurato, senza modificare liste IP o permessi. La migrazione `post-singapore-2026-10-12`:

1. accetta soltanto la sorgente F1DB v2026.17.0 con Austin corrente e un database nella fase Singapore/Austin;
2. verifica copertura e schemi prima di scrivere;
3. salva ogni documento modificato nella collezione privata `backup_rilasci_dati`;
4. applica modifiche e controllo JSON-Atlas nella stessa transazione;
5. registra il completamento in `rilasci_dati` solo con zero differenze;
6. ai riavvii successivi conserva i dati senza ripetere la migrazione.

Verifiche: 104 test Node, compreso un test su replica set che simula un errore a metà transazione, controlla rollback, backup e idempotenza; 5 test Python dei filtri; qualità dati; traduzioni backend/frontend; documentazione; OpenAPI; diff. Le modifiche preesistenti al frontend e al vecchio snapshot sono escluse dal rilascio. Nessun nuovo binario iOS è necessario per ricevere i dati API condivisi.
