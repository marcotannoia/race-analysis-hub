# Previsioni e trend — verifica del 5 ottobre 2026

**Corrette le anomalie riproducibili. Database sincronizzato; backend ancora da distribuire. Per queste modifiche non occorre una nuova versione iOS.**

## Correzioni nel modello pubblico v4.1

| Problema verificato | Comportamento corretto |
|---|---|
| Una penalità lieve poteva aumentare un indice basso | Formula moltiplicativa: indice finale = indice base × (0,65 + 0,35 × fattore penalità/100). La riduzione cresce con la severità, fino al 35%. È una convenzione editoriale, non una perdita di posizioni calibrata |
| Un annuncio tecnico poteva produrre un bonus numerico | Aggiornamenti sempre neutri a 50 finché manca un modello calibrato del beneficio; disponibilità e beneficio sono distinti. Anche il vecchio voto editoriale non certifica il guadagno |
| Dati assenti penalizzati come risultati negativi; ritiri classificati usati come rendimento regolare | Campioni mancanti esclusi, fallback neutro. Lo snapshot conserva presenza, classificazione e causa di ritiro, oltre al flag garaRegolare. La posizione classificata resta nel grafico; non viene usata come gara regolare nei fattori di rendimento |
| Storico testuale senza distinzione del ritiro classificato | Preferenza agli overall verificati degli esiti regolari, con campione esplicito; fallback per i vecchi input |
| Dipendenza dall’ordine delle righe | Ordinamento dei round prima delle finestre mobili e dei grafici; le serie e le etichette rimangono allineate |
| Risultati del GP target potenzialmente inclusi nei recenti | Filtro round < ordineCalendario per gli eventi. Nel backtest vengono ricostruite separatamente anche le classifiche mondiali precedenti al GP |
| Arrotondamenti precoci negli indici | Ordinamento prima dell’arrotondamento finale; contributi dei fattori conservati a tre decimali |

Il servizio mantiene le chiavi e la struttura delle risposte API. La stringa modello diventa statistico-editoriale-v4.1. I pesi restano quelli editoriali correnti; non sono stati ottimizzati sui risultati appena osservati. Il fattore storico verificato usa la normalizzazione dichiarata degli overall, mentre gli altri fattori editoriali mantengono la propria scala: non sono misure telemetriche intercambiabili.

## Correzioni nel modello semantico e nel backtest

- I ritiri al primo giro con zero giri completati contano fra le partenze; DNS/DNQ/DNP sono esclusi. Il completamento non viene interpretato come affidabilità meccanica.
- Le finestre recenti vengono scelte cronologicamente anche se il file sorgente viene riordinato.
- Confronti vuoti, schieramenti diversi e piloti duplicati generano un errore; non producono metriche di accuratezza.
- La media aggregata degli errori usa le somme esatte, evitando di riaggregare medie per GP già arrotondate.
- Il rendimento viene ordinato a precisione interna; gli indici esposti restano a un decimale.
- I campioni con posizione fuori dalla numerosità non entrano né nella media dell’indice né nella media della posizione.

Il ricalcolo cronologico riguarda **13 GP e 286 classificazioni**. L’errore medio assoluto del modello semantico è **3,972 posizioni**, contro **3,958** del mondiale precedente al GP; vincitori **4/13 contro 6/13**, piloti del podio **15/39 contro 19/39**. Non c’è evidenza di un miglioramento predittivo: stato sperimentale_non_promosso conservato nel database.

Questa è una simulazione ricostruita oggi, con risultati revisionati e schieramenti finali, non la verifica di previsioni originali salvate prima delle gare. Il confronto del modello editoriale sugli ultimi cinque GP usa profili tecnici aggiornati dopo gli eventi: è soltanto diagnostico. Gli indici non sono probabilità di vittoria.

## Ottimizzazioni e robustezza

Gli input del modello semantico sono indicizzati per pilota e scuderia una volta per scenario: eliminate le scansioni ripetute dell’intero storico per ogni partecipante. Non viene creata una cache condivisa fra scenari storici che potrebbe mescolare i limiti temporali. Meteo e query database partono insieme negli endpoint home e previsioni.

I profili tecnici incompleti o con tutti i pesi a zero restituiscono un dato assente, senza NaN. La media pesata ignora valori non numerici e pesi non positivi. Il servizio meteo accetta timestamp UTC espliciti: il valore è il **massimo delle probabilità orarie** nella fascia gara, non una probabilità congiunta del weekend. La fonte definisce precipitation_probability come probabilità sull’ora precedente: [documentazione Open-Meteo](https://open-meteo.com/en/docs). Il meteo è configurato per il GP corrente di Singapore; senza previsione disponibile vengono usati i pesi senza meteo.

Non è stata dimostrata l’ottimalità dei pesi né la calibrazione dei vettori tecnici 0–100. Lo storico delle gare bagnate e degli errori del pilota rimane da verificare individualmente. Passo cronometrico, degrado gomme e beneficio isolato degli aggiornamenti restano non misurati. Questi limiti sono registrati nel [rapporto database](RAPPORTO.md).

## Verifiche concluse

- 92 test backend passati, inclusi monotonia delle penalità, dati mancanti, ritiri, esclusione del GP target, ordinamento temporale, duplicati e meteo UTC.
- Qualità: 2.376 risultati storici, 34 classifiche, 16 GP 2026 allineati a [F1DB v2026.16.0](https://github.com/f1db/f1db/releases/tag/v2026.16.0), ancora ultima release al controllo del 5 ottobre.
- Traduzioni: 24.312 campi backend e 1.164 campi interfaccia verificati nelle sei lingue; documentazione e OpenAPI valide; build web riuscita.
- Lint frontend terminato con avvisi per chiavi duplicate nelle traduzioni preesistenti. Non sono state modificate in questa revisione.
- Atlas: ultima transazione 52 documenti (2 scuderie, 2 piloti, 24 analisi pilota, 24 analisi scuderia), più aggiornamento del metodo/backtest. Backup privato, transazione atomica, guardia updatedAt, rilettura e verify-db con zero differenze.
- Test dati nativi passati. Le previsioni v4.1 generate dal backend sono state decodificate dai modelli Swift reali per tutte le sei lingue: 22 partecipanti, fattori dinamici e meteo.

## Rilascio necessario

Il controllo pubblico su /api/v1/previsioni/piloti ha restituito HTTP 200, Singapore e modello statistico-editoriale-v3. Il codice v4.1 è locale fino alla distribuzione del backend: il commit e la sincronizzazione Atlas non aggiornano il server Render.

**iOS:** queste modifiche non richiedono un nuovo binario o un rilascio App Store; le risposte sono compatibili e i calcoli sono lato server. La verifica riguarda il codice Swift attuale e il contratto dati, non un test diretto del binario installato su ogni dispositivo.

**Web:** nessuna modifica frontend è stata fatta per questo intervento. Il sito usa l’API; per adottare le correzioni ai calcoli serve il backend aggiornato. Eventuali modifiche frontend già presenti nel checkout sono escluse dal commit di questa revisione.

**Backend:** occorre pubblicare il commit su Render e verificare modello v4.1 e F1DB v2026.16.0 sull’API pubblica. In questo intervento sono stati eseguiti aggiornamento Atlas e commit, senza push o deployment.
