# Changelog

## Non rilasciato

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
