# Sicurezza

## Versione supportata

È supportata esclusivamente l'API pubblica `/api/v1`, attualmente alla versione
applicativa `1.11.0`. Gli endpoint sono anonimi, di sola lettura e soggetti a
validazione, cache e limitazione delle richieste. La cache conserva soltanto
risposte `2xx`; health check ed errori usano `no-store`. Le richieste simultanee
per lo stesso URL vengono accorpate per evitare query duplicate sul database.

L'API non usa chiavi segrete perché i dati sono pubblici. CORS non costituisce
un controllo di accesso: la protezione dagli abusi resta affidata a rate limit,
validazione, cache condivisa e monitoraggio. Quando sarà noto l'IP statico del
backend della società, potrà essere aggiunto un limite dedicato senza ridurre la
protezione applicata al traffico pubblico.

## Segnalazione responsabile

Per segnalare una vulnerabilità, scrivere in privato a
`marco.tannoia@gmail.com` indicando:

- endpoint o componente interessato;
- passaggi minimi per riprodurre il problema;
- impatto osservato;
- eventuale proposta di correzione.

Non inserire credenziali, stringhe MongoDB o altri segreti in issue pubbliche.
Non eseguire test distruttivi o volumi di traffico elevati sul servizio in
produzione.
