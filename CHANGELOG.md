# Changelog

Le modifiche rilevanti del progetto sono documentate in questo file.

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
