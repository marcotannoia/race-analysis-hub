# Changelog

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
