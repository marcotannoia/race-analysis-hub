# Guida all'API pubblica

L'API v1 di Race Analysis Hub è pubblica, anonima, di sola lettura e restituisce
JSON. Il contratto eseguibile completo è disponibile in
[Swagger](https://f1-stats-5v93.onrender.com/api/docs) e come
[OpenAPI 3.1](https://f1-stats-5v93.onrender.com/api/v1/openapi.json).

La versione applicativa corrente è `1.12.0`. Le integrazioni devono usare
`GET`, `HEAD` o `OPTIONS`; non sono richieste chiavi API. Gli esempi seguenti
mostrano percorsi relativi, utilizzabili sul dominio pubblico oppure sul backend
locale `http://127.0.0.1:5002`.

## Strategia consigliata per l'app

Per contenere il numero di richieste, usare gli endpoint aggregati e caricare i
dettagli soltanto quando servono:

1. All'avvio chiamare `GET /api/v1/home?lingua=it`. Una sola risposta contiene
   Gran Premio attuale, piloti, scuderie, profilo tecnico del circuito,
   aggiornamenti FIA validati e classifica previsionale.
2. Salvare risposta, `ETag`, lingua e data di acquisizione nella cache interna.
   Dopo cinque minuti, o quando l'app torna in primo piano, rivalidare con
   `If-None-Match`. Una risposta `304 Not Modified` mantiene valido il JSON già
   salvato e non trasferisce nuovamente il corpo.
3. Chiamare una scheda pilota o scuderia soltanto quando l'utente la apre. Usare
   gli endpoint di confronto per ottenere due schede complete con una sola
   richiesta.
4. Per tutte le analisi del GP usare il dettaglio gara aggregato, non una
   richiesta separata per ogni pilota e scuderia.
5. Svuotare o separare la cache quando cambia `lingua`; rivalidarla quando
   cambia `versione` o lo slug `garaAttuale.slug`.

Non è utile richiamare `/previsioni/piloti` subito dopo `/home`, perché la stessa
classifica è già inclusa nella home. Analogamente, gli elenchi `/piloti` e
`/scuderie` servono solo alle viste che desiderano quel sottoinsieme isolato.
L'endpoint `/health` è destinato al monitoraggio operativo e non al polling
dell'interfaccia.

`/home` descrive lo schieramento del GP attuale e può quindi differire dalle
associazioni stagionali del catalogo: a Monza 2026 contiene 22 partecipanti,
con Lawson in Red Bull e Tsunoda in Racing Bulls. `/piloti` contiene invece i
23 piloti registrati nella stagione, compreso Hadjar. La sostituzione è salvata
nell'analisi dell'evento e non modifica la struttura del database né i profili
usati dagli altri GP. Nelle schede, `indicatori` può essere `null` finché non è
disponibile un set completo di fonti validate; lo stesso vale per l'aggregato
di una scuderia se uno dei piloti schierati non ha ancora tali indicatori.

## Cache e limite richieste

Le risposte `2xx` espongono:

- `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=60`;
- `ETag`, da conservare e reinviare con `If-None-Match`;
- `X-App-Cache: MISS|HIT|COALESCED`, relativo alla cache del backend;
- `Content-Language`, che identifica il catalogo effettivamente usato;
- `RateLimit` e `RateLimit-Policy`, con lo stato del limite applicato.

La cache applicativa del backend considera equivalenti una richiesta senza
`lingua` e la stessa richiesta con `?lingua=it`. CloudFront conserva invece
tutte le query nella propria chiave affinché i parametri non ammessi arrivino
alla validazione. Errori e health check usano `Cache-Control: no-store`.

Il limite predefinito è di 1.000 richieste ogni 15 minuti per indirizzo IP. Se
un backend esterno sincronizza i dati e li distribuisce dalla propria cache, il
numero dei suoi utenti non moltiplica le chiamate a Race Analysis Hub: incidono
la frequenza di sincronizzazione e gli endpoint scelti. In caso di `429`, non
eseguire tentativi ravvicinati e rispettare gli header del rate limit.

Le risposte non espongono una data generica di ultimo aggiornamento, perché
classifiche, analisi editoriali, grafici e documenti FIA hanno cicli distinti.
Per evitare sovrascritture parziali, un sincronizzatore deve sostituire la
propria copia soltanto dopo una risposta completa e valida; può usare `ETag` e
richieste condizionali per riconoscere un payload invariato.

## Catalogo endpoint v1

| Metodo | Endpoint | Uso principale |
|---|---|---|
| `GET` | `/api/v1` | Versione, attribuzioni e indice dell'API |
| `GET` | `/api/v1/health` | Stato di servizio e database, senza cache |
| `GET` | `/api/v1/home` | Bootstrap aggregato consigliato per l'app |
| `GET` | `/api/v1/lingue` | Sei lingue supportate e lingua predefinita |
| `GET` | `/api/v1/previsioni/piloti` | Sola classifica previsionale |
| `GET` | `/api/v1/confronti/piloti/{primoPilotaSlug}/{secondoPilotaSlug}` | Due schede pilota complete |
| `GET` | `/api/v1/confronti/scuderie/{primaScuderiaSlug}/{secondaScuderiaSlug}` | Due schede scuderia complete |
| `GET` | `/api/v1/piloti` | Catalogo stagionale dei piloti |
| `GET` | `/api/v1/piloti/{pilotaSlug}` | Profilo, indicatori, analisi e andamento di un pilota |
| `GET` | `/api/v1/scuderie` | Elenco delle scuderie |
| `GET` | `/api/v1/scuderie/{scuderiaSlug}` | Profilo, piloti, indicatori e analisi di una scuderia |
| `GET` | `/api/v1/gare` | Elenco limitato al solo GP attuale |
| `GET` | `/api/v1/gare/attuale` | Dati completi del GP attuale |
| `GET` | `/api/v1/gare/{garaSlug}` | GP attuale con tutte le analisi piloti e scuderie |
| `GET` | `/api/v1/classifiche/piloti` | Classifica piloti 2026 |
| `GET` | `/api/v1/classifiche/scuderie` | Classifica scuderie 2026 |
| `GET` | `/api/v1/gare/{garaSlug}/piloti/{pilotaSlug}/analisi` | Singola analisi pilota del GP attuale |
| `GET` | `/api/v1/gare/{garaSlug}/scuderie/{scuderiaSlug}/analisi` | Singola analisi scuderia del GP attuale |

Tutti gli endpoint accettano soltanto la query opzionale
`?lingua=it|en|fr|pt|es|de`. Il portoghese usa la variante europea `pt-PT`,
esposta con il codice API `pt`. Slug e query non validi restituiscono `400`; una
risorsa assente o una gara diversa da quella attuale restituisce `404`.

## Esempio di rivalidazione

```http
GET /api/v1/home?lingua=it HTTP/1.1
Accept: application/json
If-None-Match: W/"etag-salvato-dall-app"
```

Con `200 OK` l'app sostituisce corpo ed `ETag` in cache. Con
`304 Not Modified` conserva il corpo precedente. Ogni cache deve distinguere
almeno endpoint, parametri di percorso e lingua; non riutilizzare una risposta
italiana per una richiesta in un'altra lingua.

## Errori

Gli errori v1 hanno una forma stabile e includono `requestId`, utile per
l'assistenza:

```json
{
  "errore": {
    "codice": "PILOTA_NON_TROVATO",
    "messaggio": "Il pilota richiesto non esiste",
    "requestId": "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21"
  }
}
```

Le risposte pubbliche sono riutilizzabili alle condizioni descritte in
[`LICENSE.md`](LICENSE.md) e [`NOTICE.md`](NOTICE.md).
