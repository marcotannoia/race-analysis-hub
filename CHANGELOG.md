# Changelog

## 1.13.0 — 2026-09-06

### Previsioni e profili tecnici

- rivisti i profili tecnici 0–100 delle undici scuderie con motivazioni,
  confidenza e data della revisione;
- collegata la compatibilità vettura-circuito alle dieci capacità tecniche
  ponderate sulle richieste del tracciato;
- aggiornati i pesi previsionali: compatibilità 60%, forma pilota recente 15%,
  aggiornamenti pertinenti 7%, andamento pilota 2026 7%, forma scuderia recente
  5%, qualifica 3% e storico personale 3%;
- aggiunto l'andamento della scuderia negli ultimi tre GP usando entrambe le
  vetture e le associazioni effettive di ogni evento;
- limitato il bonus degli aggiornamenti ai benefici che corrispondono a una
  richiesta importante del circuito;
- rimossi da sito e app nativa metodologia, pesi, contributi e dettagli dei
  fattori, mantenendo questi dati nel contratto API pubblico.

## 1.12.0 — 2026-09-02

### Dati del Gran Premio d'Italia

- applicata esclusivamente a Monza la sostituzione di Hadjar: Lawson è
  associato a Red Bull e Tsunoda a Racing Bulls senza modificare le anagrafiche
  stagionali o la struttura MongoDB;
- aggiunti profilo, classifica 2026, storico di Monza, analisi completa e
  traduzioni di Tsunoda, aggiornando home e classifica previsionale ai 22
  partecipanti effettivi;
- aggiornato lo snapshot quantitativo a F1DB `v2026.12.0`;
- registrati l'aggiornamento Ferrari ADUO e l'ala posteriore specifica per basso
  carico, mantenendo il pacchetto Alpine già annunciato per Colapinto;
- gli indicatori editoriali senza un set completo di fonti validate restano
  `null`, inclusi i relativi aggregati di scuderia, invece di usare stime.

### Documentazione e API

- aggiunta una guida unica agli endpoint con una strategia di bootstrap,
  caricamento lazy e cache interna per le app che riutilizzano l'API;
- documentate la rivalidazione condizionale con `ETag`/`If-None-Match`, la
  risposta `304` e gli header di cache e rate limit;
- allineate descrizioni, conteggi del bagnato e pesi previsionali al contratto
  effettivamente implementato;
- completato l'indice restituito da `/api/v1` con `health` e `gare`;
- unificate nella cache backend le richieste equivalenti senza lingua e con
  `?lingua=it`, mantenendo isolate le query non valide;
- aggiunto `npm run verify-docs` per controllare versioni, link locali e
  copertura degli endpoint documentati.
- documentata la distinzione tra catalogo stagionale da 23 piloti e
  schieramento del GP da 22 partecipanti, comprese le associazioni temporanee.

## 1.11.0 — 2026-08-30

### Interfaccia

- rimossi i tag “Generale” da Gestione gomme e Passo gara, ora presentati con
  una prosa più discorsiva;
- sostituiti i box degli anni nei risultati storici con etichette rosse,
  centrate e sottolineate;
- ridotta la scheda circuito ai sei dati principali e spostate le
  caratteristiche in widget a piena larghezza con freccia e rientro;
- collegato il progressivo della home al calendario ufficiale Formula 1 anziché
  al sottoinsieme editoriale del database.

### Dati e traduzioni

- aggiunto `ordineCalendario` alle gare e `totaleGareCalendario` ai metadati
  della home;
- riscritte le analisi di gestione gomme e passo gara di Monza in tutte le sei
  lingue, preservando anni, risultati, punti e contesto tecnico;
- aggiunto l'aggiornamento Ferrari ADUO 2 come informazione non ufficiale ma
  attesa, con fonte pubblica e senza bonus nel modello previsionale;
- corretta la scheda Cadillac priva di storico confrontabile a Monza.

### Compatibilità

- rotte, metodi e campi esistenti restano invariati; i nuovi campi di calendario
  sono aggiuntivi;
- OpenAPI, controlli qualità, test e guide operative sono allineati alla release.

## 1.10.0 — 2026-08-29

### Interfaccia

- ridisegnate le analisi di piloti e scuderie con una gerarchia a rami per
  storico, prestazioni, valutazione finale e aggiornamenti;
- collegate compatibilità vettura-circuito e posizione previsionale ai dati già
  calcolati nella home, evitando duplicazioni nel browser;
- nascosti i blocchi di analisi privi di contenuto e introdotto `DNP`
  localizzato per le stagioni non disputate;
- verificata la disposizione responsive senza overflow a 390 px.

## 1.9.0 — 2026-08-22

### Modificato

- aumentato dal 2% al 12% il peso dell'andamento negli ultimi tre Gran Premi;
- mantenuto al 12% il peso degli aggiornamenti tecnici, ora corretto anche in
  base all'ampiezza del pacchetto;
- escluso ogni bonus prestazionale per interventi esclusivamente di
  affidabilità;
- ribilanciati i pesi stagionali, della compatibilità con il circuito, della
  qualifica e dello storico, mantenendo il totale al 100%;
- aggiornato il modello pubblico a `statistico-editoriale-v2`.

### Dati

- aggiornati gli interventi dichiarati per il Gran Premio d'Olanda 2026 usando
  il documento FIA del 21 agosto;
- rigenerate e verificate le schede in tutte le sei lingue supportate.

## 1.8.0 — 2026-08-21

### Aggiunto

- percentuale di bravura sul bagnato normalizzata sulle gare bagnate o miste
  effettivamente disputate;
- percentuale degli errori del pilota e degli errori fatali, entrambe rapportate
  a tutte le partenze in carriera;
- aggregato ponderato degli stessi indicatori per ogni scuderia;
- confronto affiancato tra due piloti o due scuderie, disponibile nel frontend
  e tramite due nuovi endpoint API;
- aggiornamento incrementale, verificato e idempotente degli indicatori nel
  comando `npm run gp`;
- schemi Swagger, test, traduzioni e guide operative per tutte le nuove funzioni.

### Compatibilità

- rotte e campi esistenti restano invariati; i nuovi campi sono aggiuntivi;
- i conteggi grezzi restano interni e le API espongono soltanto percentuali;
- MongoDB non richiede una migrazione, perché gli indicatori sono calcolati da
  un dataset versionato insieme al codice.

### Sicurezza

- aggiornata la dipendenza transitiva di sviluppo `nanoid` da `3.3.16` a
  `3.3.18`, correggendo `GHSA-2v37-7h3g-55p8`;
- verificati backend e frontend con `npm audit`: nessuna vulnerabilità residua.

### Manutenzione

- aggiornati `express-rate-limit` a `8.6.2`, `mongoose` a `9.9.2` e
  `@redocly/cli` a `2.46.1` nel backend;
- aggiornati `vite` a `8.2.1` e `oxlint` a `1.78.0` nel frontend.

## 1.7.0 — 2026-08-14

### Aggiunto

- cache in memoria delle risposte API pubbliche, limitata a 500 voci e con TTL
  configurabile, per evitare query MongoDB duplicate;
- coalescenza delle richieste simultanee: alla scadenza della cache una sola
  richiesta ricostruisce la risposta mentre le altre attendono lo stesso dato;
- intestazioni `s-maxage`, `stale-while-revalidate` e `X-App-Cache` per integrare
  una cache condivisa davanti a Render senza nuovi servizi a costo fisso;
- classifica previsionale nella risposta di `GET /api/v1/home`.

### Ottimizzato

- la landing usa una sola chiamata API invece delle precedenti due;
- la build CloudFront usa `/api` sul dominio pubblico, permettendo alla CDN di
  assorbire le richieste ripetute prima che raggiungano Render e Atlas;
- errori e health check non vengono memorizzati in cache.

### Compatibilità

- rotte, metodi, parametri e campi pubblici esistenti restano invariati;
- `GET /api/v1/previsioni/piloti` rimane disponibile come endpoint dedicato;
- MongoDB Atlas non richiede modifiche né un passaggio a un piano a pagamento.

## 1.6.0 — 2026-08-12

### Aggiunto

- localizzazione completa in italiano, inglese, francese, portoghese, spagnolo
  e tedesco per contenuti editoriali, nazionalità, gare e previsioni;
- parametro opzionale `lingua` su tutti gli endpoint di contenuto e nuovo
  endpoint `GET /api/v1/lingue`;
- selettore persistente e accessibile della lingua nel frontend, con nome
  nativo e codice del catalogo;
- pipeline amministrativa Azure Translator F0 con memoria di traduzione,
  glossario Formula 1 e verifiche automatiche di completezza e struttura;
- chiave Azure confinata all'ambiente locale, senza accesso dal frontend o
  dagli endpoint pubblici;
- modalità `--offline` per rigenerare e verificare il catalogo senza consumare
  quota Azure;
- ambiente `npm run dev` del backend isolato su MongoDB temporaneo popolato dai
  dati locali, senza letture o scritture su Atlas.

### Compatibilità

- rotte, metodi, slug, codici, URL e campi pubblici precedenti sono invariati;
- l'italiano resta la lingua predefinita e le traduzioni sono selezionate senza
  esporre i cataloghi interni del database;
- Swagger e le guide descrivono fallback, portoghese europeo, errori di lingua
  e assenza di traduzione esterna a runtime.

## 1.5.0 — 2026-08-11

### Aggiunto

- codici `nazionalitaIso2` e `nazionalitaIso3` per tutti i piloti;
- alias pubblici `abbreviazioneNome` e `numeroVettura`;
- `abbreviazione` e `colore` negli oggetti brevi delle scuderie;
- propagazione dei nuovi campi in elenchi, dettagli, analisi, classifiche e
  previsioni;
- fonti e regole di validazione per codici ISO, abbreviazioni e colori.

### Compatibilità

- nessuna rotta, query, parametro o metodo HTTP è stato modificato;
- i campi esistenti `codice`, `numero` e `nazionalita` restano disponibili;
- OpenAPI e Swagger documentano l'estensione retrocompatibile delle risposte.
