# Public API Guide

The Race Analysis Hub v1 API is public, anonymous, read-only, and returns
JSON. The full executable contract is available at
[Swagger](https://f1-stats-5v93.onrender.com/api/docs) and the
[OpenAPI 3.1 specification](https://f1-stats-5v93.onrender.com/api/v1/openapi.json).

The current application version is `1.14.0`. Integrations must use
`GET`, `HEAD`, or `OPTIONS`; no API keys are required. The following examples
show relative paths, which can be used on the public domain or on the backend
local `http://127.0.0.1:5002`.

## Recommended app strategy

To contain the number of requests, use aggregated endpoints and load
Details only when needed:

1. At startup, call `GET /api/v1/home?lingua=it`. Only one response contains
Current Grand Prix, drivers, teams, technical profile of the circuit,
validated FIA updates and forecast ranking.
Load `GET /api/v1/stagione?lingua=it` only when the user opens
Upcoming GPs or past GPs: contains future calendar and official results
Q1, Q2, Q3 and race of the current season.
2. Save the answer, `ETag`, language, and acquisition date to the internal cache.
After five minutes, or when the app returns to the foreground, revalidate with
`If-None-Match`. A response `304 Not Modified` keeps the JSON already valid
saved and does not transfer the body again.
3. Call a driver or team card only when the user opens it. Use
the comparison endpoints to get two complete cards with one
request.
4. For all GP analysis, use the aggregate race detail, not a
separate request for each driver and team.
5. Clear or separate the cache when it changes `lingua`; revalidate it when
Change `versione` or the slug `garaAttuale.slug`.

It is not useful to call `/previsioni/piloti` immediately after `/home`, because the same
is already included in the Home. Similarly, the `/piloti` and
`/scuderie` only serve the views that want that isolated subset.
The `/health` endpoint is intended for operational monitoring and not polling
of the interface.

`/home` describes the current GP grid and may therefore differ from the
seasonal associations of the catalogue: at Monza 2026 it contains 22 participants,
with Lawson in Red Bull and Tsunoda in Racing Bulls. `/piloti` contains the
23 drivers registered in the season, including Hadjar. Replacement is saved
in the analysis of the event and does not change the database structure or profiles
used by the other GPs. In the cards, `indicatori` can be `null` until it is
a complete set of validated sources is available; the same applies to the aggregate
of a team if one of the drivers lined up does not yet have such indicators.

## Cache and Request Limit

The answers `2xx` explain:

- `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=60`;
- `ETag`, to be kept and returned with `If-None-Match`;
- `X-App-Cache: MISS|HIT|COALESCED`, relating to the backend cache;
- `Content-Language`, which identifies the catalog actually used;
- `RateLimit` and `RateLimit-Policy`, with the boundary state applied.

The backend's application cache considers a request without
`lingua` is the same request with `?lingua=it`. CloudFront retains
all queries in their own key for the bad parameters to arrive
to validation. Errors and health checks use `Cache-Control: no-store`.

The default limit is 1,000 requests per 15 minutes per IP address. If
An external backend synchronizes the data and distributes it from its own cache, the
number of its users does not multiply calls to Race Analysis Hub:
the synchronization frequency and endpoints you choose. If you `429`, don't
Perform close attempts and respect the rate limit headers.

The answers do not display a generic date of last update, because
Rankings, editorial analysis, charts and FIA documents have distinct cycles.
To avoid partial overwrites, a synchronizer must replace the
copy only after a complete and valid answer; may use `ETag` and
conditional requests to acknowledge an unchanged payload.

## Endpoint Catalog v1

| Method | Endpoint | Main Use |
|---|---|---|
| `GET` | `/api/v1` | API version, attributions, and index |
| `GET` | `/api/v1/health` | Service and database status, no cache |
| `GET` | `/api/v1/home` | Aggregate bootstrap recommended for your app |
| `GET` | `/api/v1/stagione` | Upcoming GPs & Q1/Q2/Q3 Results/Race of Finished GPs |
| `GET` | `/api/v1/lingue` | Six supported languages and default language |
| `GET` | `/api/v1/previsioni/piloti` | Forecast ranking only |
| `GET` | `/api/v1/confronti/piloti/{primoPilotaSlug}/{secondoPilotaSlug}` | Two complete pilot boards |
| `GET` | `/api/v1/confronti/scuderie/{primaScuderiaSlug}/{secondaScuderiaSlug}` | Two complete team cards |
| `GET` | `/api/v1/piloti` | Seasonal Driver Catalog |
| `GET` | `/api/v1/piloti/{pilotaSlug}` | Profile, indicators, analysis and performance of a pilot |
| `GET` | `/api/v1/scuderie` | List of teams |
| `GET` | `/api/v1/scuderie/{scuderiaSlug}` | Team Profile, Drivers, Gauges & Analysis |
| `GET` | `/api/v1/gare` | List limited to the current GP only |
| `GET` | `/api/v1/gare/attuale` | Full data of the current GP |
| `GET` | `/api/v1/gare/{garaSlug}` | Current GP with all driver and team analysis |
| `GET` | `/api/v1/classifiche/piloti` | 2026 Drivers' Standings |
| `GET` | `/api/v1/classifiche/scuderie` | Team standings 2026 |
| `GET` | `/api/v1/gare/{garaSlug}/piloti/{pilotaSlug}/analisi` | Single driver analysis of the current GP |
| `GET` | `/api/v1/gare/{garaSlug}/scuderie/{scuderiaSlug}/analisi` | Single team analysis of the current GP |

All endpoints accept only the optional query
`?lingua=it|en|fr|pt|es|de`. Portuguese uses the European variant `pt-PT`,
exposed with API code `pt`. Invalid slugs and queries return `400`; a
absent resource or a race different from the current one returns `404`.

The texts `circuitoTecnico.caratteristiche`, `circuitoTecnico.metodo` and
`profiloTecnico.metodo` also follow the required language in the home page and in the
Team comparisons. Technical codes (`dimensione`, `direzione`, `tipologia`,
`livelloCarico`, `stressFreni`, `stressGomme`) remain stable identifiers:
The client displays them using its own dictionary. Numbers, indexes, and sources
they do not change with language.

The technical texts are `backend/i18n/profiliTecnici.json` versioned, with
Italian in the original technical catalogs. The following are not MongoDB documents:
`verify-db` verifies the persisted data, while `verify-translations` checks
also the coverage of technical texts for all 12 circuits and six languages.
A change in these texts requires API release, without a new seed.

## Revalidation Example

```http
GET /api/v1/home?lingua=it HTTP/1.1
Accept: application/json
If-None-Match: W/"etag-salvato-dall-app"
```

With `200 OK`, the app replaces cached body and `ETag`. With
`304 Not Modified` retains the previous body. Each cache must distinguish
at least endpoints, path parameters, and language; do not reuse a response
Italian for a request in another language.

## Errors

v1 errors have a stable form and include `requestId`, which is useful for
Assistance:

```json
{
  "errore": {
    "codice": "PILOTA_NON_TROVATO",
    "messaggio": "Il pilota richiesto non esiste",
    "requestId": "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21"
  }
}
```

Public responses are reusable under the conditions described in
[`LICENSE.md`](LICENSE.md) and [`NOTICE.md`](NOTICE.md).

### FIA Live Report Removal — September 4, 2026

The FIA live report is no longer shown on the website and in the updated app. The `aggiornamentiLive` field of the home page is kept for compatibility but always returns `null`, even with historical documents in the database. The server no longer starts the FIA automatic monitor. Historical data is not deleted; the technical profiles and their sources remain. This removal does not constitute a verification of the rights on the other sources.

### Technical Overall — revised September 6, 2026

The forecast factor `compatibilitaVetturaCircuito` now uses the same average of the ten 0–100 capacities, weighted on the demands of the track, shown in the `profiloTecnico.compatibilita` of the circuit. The weight is 60% before any penalty. If the team or circuit profile is missing, the previous calculation based on ranking and editorial label is maintained.

Capabilities are editorial estimates, not telemetry measurements. Method, date and rationale are in `backend/data/profili-tecnici-2026.json`; summary is in `backend/data/revisione-overall-2026-09-06.md`. The review incorporates information from the Monza weekend and does not constitute a backtest of the pre-race prediction. The increased accuracy must be verified on subsequent races.

The seven ordinary weights are: compatibility 60%, qualifying 3%, personal history 3%, relevant updates 7%, 2026 driver performance 7%, driver performance in the last three GPs 15%, team performance in the last three GPs 5%. The correction for confirmed penalties remains separate and reproportions the ordinary weights.

The team performance averages the evaluations of the results of its cars in each of the last three GPs of the snapshot, with time weights 1, 2 and 3. A retirement is worth 15/100; a GP without team data is worth 40/100. The team associations of the historic event, including substitutes, are used.

The upgrade bonus requires an explicitly mentioned technical characteristic and a circuit request of at least 85/100; negative phrases and generic descriptions do not give a bonus. The threshold is an editorial rule, not a statistically optimized parameter. In the absence of a match, the value is neutral (50/100).

The site and native app do not display methodology, weights, contributions, or factor details. API fields remain available to clients: this change affects presentation and does not make the model private.
