# Aggiornamento automatico dopo il Gran Premio

## Funzionamento

Il backend Render Starter esegue il controllo all'avvio e poi ogni 30 minuti.
Non dipende dal computer locale. Il calendario configurato è quello del 2026.

Il passaggio al GP successivo avviene soltanto quando:

1. È finita la giornata della gara nel fuso del circuito, con almeno quattro ore
   dalla partenza prevista. Las Vegas segue quindi il sabato locale.
2. F1DB ha pubblicato una release stabile con risultati e qualifiche completi.
3. L'archivio supera il controllo SHA-256 pubblicato dal progetto F1DB.
4. Numeri vettura, posizioni e punti coincidono con la classifica finale FIA.
   Una classifica provvisoria non autorizza il passaggio.
5. I controlli di copertura e i vincoli del database sono rispettati.

Se una fonte manca, è in ritardo o non coincide, il GP non viene anticipato:
il controllo registra il motivo e riprova. Errori HTTP temporanei hanno tre
tentativi limitati; il ciclo ordinario riparte dopo 30 minuti.

## Dati aggiornati

- Gare, risultati delle sessioni, classifiche F1DB e classifiche applicative.
- Storico dell'edizione conclusa e analisi del nuovo GP.
- Indici ricavabili dai risultati, campioni, fonti e previsioni con input aggiornati.
- Calendario e grafici stagionali, ripristinati anche dopo un riavvio o un deploy.
- Rettifiche dei GP già conclusi quando la nuova release modifica i risultati;
  anche questi cambiamenti richiedono il confronto con la classifica finale FIA.

I pesi del modello non vengono riaddestrati automaticamente. Pioggia, errori del
pilota, usura fisica, misure di passo e gomme non vengono dedotti dalle posizioni
finali: in assenza di nuove evidenze conservano i dati verificati o `null`.

Al termine dell'ultimo GP si mantiene consultabile la pagina finale e lo stato
indica `calendario_completato`; non viene inventato un prossimo GP. Una nuova
stagione richiede il suo calendario e i relativi mapping delle fonti.

## Penalità e aggiornamenti tecnici

Il server avvia entrambi i monitor FIA, con controlli ogni cinque minuti nelle
rispettive finestre del weekend. I PDF vengono confrontati tramite digest anche
quando il loro URL resta uguale, per riconoscere revisioni e documenti ritirati esplicitamente dalla FIA.

Le decisioni del GP precedente vengono riportate soltanto se pubblicate dopo
la prima classifica di gara e se indicano esplicitamente la prossima gara o
competizione. Non si riporta una penalità già scontata nel weekend precedente.

I componenti dichiarati alla FIA aggiornano le schede di piloti e scuderie del GP
interessato. `aggiornamentiTecniciUfficiali` riporta fonte, documento, digest,
componenti e `vantaggioMisurato: null`: una dichiarazione non dimostra un guadagno
prestazionale. Al cambio GP si eliminano le precedenti annotazioni non verificate
sulle penalità e sugli aggiornamenti della nuova scheda.

## Persistenza e controlli

Un lock PostgreSQL impedisce esecuzioni sovrapposte tra istanze. La transazione
controlla che GP e documenti non siano cambiati durante l'acquisizione.
`editorial.automation_state` conserva lo stato operativo, separato dai rapporti FIA.
`editorial.post_gp_update` conserva il backup dei record modificati, le prove FIA,
la versione F1DB e lo snapshot runtime. Il backup viene costruito in PostgreSQL
per contenere l'uso della memoria del backend. Le precedenti registrazioni manuali
sono conservate nell'audit.

Non vengono esposti nuovi accessi diretti al database. L'endpoint pubblico è:

`GET /api/v2/automazione`

Mostra abilitazione, intervallo, ultimo controllo, GP corrente, ultimo aggiornamento
e l'eventuale motivo di attesa. Le API v1 e v2 esistenti restano disponibili.

Configurazione:

- `AUTO_GP_ENABLED=true`: abilita il controllo; predefinito in produzione.
- `AUTO_GP_INTERVAL_MINUTES=30`: intervallo, da 5 a 1440 minuti.
- `FIA_MONITOR_ENABLED=true`: abilita penalità e documenti tecnici FIA.

`npm --prefix backend run check:auto-gp` esegue acquisizione, controlli e transazione
con rollback obbligatorio. `-- --apply` applica esplicitamente un controllo manuale.
Il server usa un limite heap di 192 MiB; gli archivi sono decompressi un file alla
volta e vengono lette solo le analisi coinvolte nell'aggiornamento.

La simulazione completa Singapore → Austin, su PostgreSQL con rollback verificato,
è documentata in `VERIFICA-AUTOMAZIONE-TRANSAZIONE.json`. La verifica del servizio
pubblicato è registrata separatamente in `VERIFICA-AUTOMAZIONE-PUBBLICA.json`.

La migrazione `20261018213023_automatic_gp_state.sql` crea la tabella privata di
stato, con RLS e accesso anonimo negato. I monitor FIA aggiornano atomicamente
solo i propri campi del rapporto, così penalità e componenti non si sovrascrivono.
