# Recap numerici delle analisi

Disponibili su profili, analisi del GP attuale e confronti, in v1 e v2.
La v1 conserva anche i testi esistenti: nessun campo stringa viene sostituito da un numero.

| Metrica | Significato |
| --- | --- |
| `passoGara` | Indice relativo ricavato da giri filtrati e comparabili. |
| `gestioneGomme` | Deriva cronometrica relativa degli stint; non usura fisica. |
| `rendimento` | Risultati regolari della stagione prima del GP attuale, normalizzati per partecipanti. |
| `qualifica` | Posizioni in qualifica normalizzate, prima del GP attuale. |
| `completamento` | Percentuale di partenze con esito regolare; include incidenti/DSQ fra gli esiti non regolari. |
| `formaRecente` | Rendimento negli ultimi tre GP osservati. |
| `storicoGara` | Rendimento storico in gara sul circuito. |
| `storicoQualifica` | Rendimento storico in qualifica sul circuito. |

`valutazioni.<metrica>` contiene un numero 0–100 oppure `null`.
`overall.<metrica>` contiene `{ valore, campione, fonti }` oppure `null` se
mancano valore valido, campione positivo o fonti HTTPS.
Zero è un punteggio valido. Gli indici sono descrittivi, non probabilità.

## Campi aggiuntivi

- `recapNumerici`: collega i vecchi blocchi ai rispettivi indici, con stato e fonti.
- `sintesiNumerica`: media aritmetica delle metriche verificate disponibili,
  calcolata soltanto con almeno quattro delle otto metriche.
- `coperturaPercentuale`: quota delle otto metriche disponibili, non confidenza statistica.
- `metricheIncluse` e `metricheMancanti`: rendono esplicito il campione del recap.

Non confrontare due sintesi senza considerarne la diversa copertura e composizione.
La sintesi non modifica classifica previsionale, pesi o risultati del modello.

`recapNumerici.considerazioniFinali` espone la sintesi numerica.
`risultatiGara`, `risultatiQualifica` e `andamentoPerAnno` corrispondono a
`storicoGara`, `storicoQualifica` e `formaRecente`.

Affidabilità meccanica, note esplicative, sanzioni e vantaggi di aggiornamenti
non misurati non vengono dedotti da parole come “buono” o “favorito”:
`valore: null`, `stato: non_quantificabile` e `motivo` spiegano il limite.
Per l’affidabilità è indicata la metrica alternativa `completamento`, che mantiene
il proprio significato. Posizioni, tipi di penalità e aggiornamenti restano separati.

## Client

Leggere i punteggi dalle API, senza ricalcolarli dal testo.
Mostrare `—` per `null`, conservare 0, e mostrare la copertura accanto alla sintesi.
Al cambio del GP invalidare le cache dipendenti dal contesto.

Verifiche: `npm test`, `npm --prefix backend run lint:api:v2`, `npm run build`.
