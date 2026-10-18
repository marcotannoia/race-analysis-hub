# API FantaStats — nota per l'integrazione

Stato al 18 ottobre 2026, ore 12:32 Europe/Rome: rilascio pubblicato su Render
e verificato sul dominio pubblico (commit applicativo `d0c825a`).
Il database Supabase sincronizzato è `druzzflduoeqfhywkumx`, organizzazione FantaStats.

## Endpoint attualmente pubblicati

Base URL: `https://f1-stats-5v93.onrender.com/api/v1`.
Il documento OpenAPI pubblico è stato recuperato con HTTP 200 e confrontato con
la versione locale: nessun percorso v1 aggiunto, rimosso o rinominato.

La produzione disponeva già del primo runtime PostgreSQL. Questo rilascio aggiunge
la compatibilità della nuova connessione e i nuovi punteggi, mantenendo gli URL v1.

## Campi numerici aggiuntivi nelle risposte v1

Le analisi pilota e scuderia espongono due proprietà aggiuntive:

```json
{
  "valutazioni": {
    "passoGara": 82.9,
    "gestioneGomme": 24,
    "rendimento": 85.7,
    "qualifica": 84.3,
    "completamento": 82.4,
    "formaRecente": 88.9,
    "storicoGara": null,
    "storicoQualifica": null
  },
  "valutazioniPerAnno": {
    "2025": { "passoGara": null, "gestioneGomme": null }
  }
}
```

L'esempio illustra il formato; non costituisce una risposta verificata di produzione.
I vecchi campi testuali v1 mantengono i loro tipi per compatibilità. I client possono
passare ai nuovi campi senza ricavare numeri dalla prosa. Non interpretare `null`
come zero o 50. Non interpretare i punteggi come probabilità o usura fisica della gomma.

## Nuovi endpoint v2 disponibili

La v2 è aggiuntiva ed è disponibile sullo stesso host:
`https://f1-stats-5v93.onrender.com`.
Contratto: `https://f1-stats-5v93.onrender.com/api/v2/openapi.json`.

| Percorso | Utilizzo |
|---|---|
| `/api/v2/piloti` | Piloti e iscrizioni stagionali |
| `/api/v2/scuderie` | Scuderie |
| `/api/v2/gare` | Gare collegate ai circuiti, filtro `anno` e `stato` |
| `/api/v2/metriche` | Catalogo degli otto indici |
| `/api/v2/valutazioni` | Punteggi, campioni, metodo e fonti |
| `/api/v2/openapi.json` | Contratto OpenAPI v2 |
| `/api/v2/health` | Disponibilità del database importato |

Le risposte degli elenchi v2 usano `{ "dati": [], "paginazione": { "limit": 100,
"offset": 0 } }`: non hanno lo stesso formato degli elenchi v1. Paginazione obbligatoria
per scaricare tutti i dati: massimo 100 righe per chiamata. Accesso GET pubblico,
senza operazioni di scrittura.

`/api/v2/valutazioni` accetta i filtri `anno`, `metrica`, `gara`, `pilota`, `scuderia`.
Il campo del punteggio è `valore` (numero 0–100 oppure `null`). I riferimenti alle
fonti si trovano in `f1_valutazioni_fonti`; l'entità è nella relazione `f1_analisi`.

Esempio di percorso:
`/api/v2/valutazioni?gara=usa-austin&pilota=leclerc&anno=2026&metrica=gestioneGomme`.

## Testo breve da comunicare alla società

> Il database FantaStats è stato sincronizzato su Supabase e il backend aggiornato
> è in produzione. Gli endpoint v1 restano invariati negli URL e nei campi legacy;
> le analisi aggiungono punteggi numerici 0–100 in `valutazioni` e
> `valutazioniPerAnno` (`null` indica dati insufficienti). Sono disponibili anche
> le API aggiuntive `/api/v2`, sullo stesso host, con risposte paginate e un formato
> distinto. Documentazione: https://f1-stats-5v93.onrender.com/api/v2/openapi.json.
