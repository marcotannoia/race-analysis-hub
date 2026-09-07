# Race Analysis Hub

Race Analysis Hub is an independent application for exploring Formula 1 World
Championship data, results, and editorial analysis.

The frontend is built with React and Vite, the API with Node.js and Express,
and MongoDB provides data persistence. The public APIs are anonymous,
read-only, and documented with Swagger.

The current project and API version is `1.13.0`.

The final section of the landing page presents a driver prediction ranking for
the current Grand Prix only. The model combines 2026 results, form across the
last three Grands Prix, circuit compatibility, confirmed technical upgrades,
and editorial information already stored in the project. Updates that are not
yet official but are supported by concrete evidence are marked as provisional
and receive no prediction bonus until they are confirmed.

The home page uses each Grand Prix's position in the official season calendar,
which is separate from the internal order in which analyses are published.

## Links

- [Public website](https://www.race-analysis-hub.it)
- [FantaStats GP support](https://www.race-analysis-hub.it/assistenza.html)
- [Support page management](ASSISTENZA.md)
- [Swagger documentation](https://f1-stats-5v93.onrender.com/api/docs)
- [OpenAPI specification](https://f1-stats-5v93.onrender.com/api/v1/openapi.json)
- [Integration and caching guide](API.md)

## Languages and translations

The frontend and API support six languages:

| Parameter | Language | Variant |
|---|---|---|
| `it` | Italiano | default |
| `en` | English | English |
| `fr` | Français | French |
| `pt` | Português | European Portuguese (`pt-PT`) |
| `es` | Español | Spanish |
| `de` | Deutsch | German |

The frontend selects the first supported browser language, remembers the
choice, and sends the `lingua` parameter with every request. The global
selector displays each language's native name and code and is accessible by
keyboard and assistive technologies.

Integrations can request English content with:

```http
GET /api/v1/home?lingua=en
```

Each v1 response declares the effective language in the `lingua` field, when
included in the relevant schema, and in the `Content-Language` header. The API
defaults to `it`; an unsupported code returns HTTP `400` with
`LINGUA_NON_SUPPORTATA`. `GET /api/v1/lingue` returns the current list.

`GET /api/v1/home` includes the race, drivers, teams, and prediction ranking,
allowing an external landing page or feature to load all bootstrap data with a
single request. Public responses use a shared five-minute cache and coalesce
simultaneous requests to reduce load on Render and MongoDB Atlas. Clients with
their own cache should store the `ETag` header and revalidate with
`If-None-Match`. If the data has not changed, the API returns `304` without
transferring the JSON again. The complete strategy is documented in
[`API.md`](API.md).

The home response represents the current Grand Prix entry list only. For Monza
2026, it exposes Lawson with Red Bull and Tsunoda with Racing Bulls without
changing the season-long associations stored in the catalogue.
`GET /api/v1/piloti` therefore remains the catalogue of all 23 drivers present
during the season, while the home response, analyses, and prediction contain
the 22 drivers entered for the event.

Initial translations are generated with Azure Translator F0 through an
administrative script, stored in the database, and verified before release.
User requests only select previously stored text: Azure is not called at
runtime and is not exposed through the public API or frontend. Translation
memory processes only new or modified text without requiring a rigid
catalogue. The procedure, security constraints, and customisation rules are
documented in [`LOCALIZZAZIONE.md`](LOCALIZZAZIONE.md).

## Driver identity data

Release `1.5.0` enriched driver responses without changing routes, parameters,
or HTTP methods. The `codice` and `numero` fields remain available, while more
explicit names and data useful for localisation and graphics were added:

| Field | Meaning | Example |
|---|---|---|
| `abbreviazioneNome` | driver's sporting code | `LEC` |
| `numeroVettura` | car number | `16` |
| `nazionalitaIso2` | ISO 3166-1 alpha-2 code | `MC` |
| `nazionalitaIso3` | ISO 3166-1 alpha-3 code | `MCO` |
| `scuderia.abbreviazione` | short team code | `FER` |
| `scuderia.colore` | hexadecimal RGB colour | `#E8002D` |

The same compact objects are reused in analyses, standings, and predictions so
that field meanings remain consistent throughout the API.

## Percentage indicators and comparisons

Driver profiles expose three percentage indicators when the required sources
have been validated. Otherwise, `indicatori` is `null`; no unsupported values
are estimated. Wet-weather performance also includes the counts used in the
calculation:

- `bravuraBagnatoPercentuale`: wet races won, finished ahead of a classified
  teammate, or finished ahead of at least half of the classified direct rivals
  identified in the championship top 10 after that race, divided by wet races
  actually started. DNS entries are excluded, and other drivers' retirements
  do not improve the result;
- `gareConPioggiaPositive`: number of wet races considered positive under the
  criteria above;
- `gareConPioggiaDisputate`: number of starts in races run fully or partly in
  wet conditions;
- `erroriPilotaPercentuale`: races with a documented driver error divided by
  all of that driver's starts;
- `erroriFataliPercentuale`: races ended or definitively compromised by a
  driver error, again divided by all starts rather than by the number of
  errors. In published profiles, this remains lower than the overall driver
  error percentage.

Team indicators aggregate and weight the careers of the drivers entered in the
current Grand Prix. If a verified profile is missing, the aggregate is `null`.
This avoids directly comparing non-equivalent team histories and identities.
After each new Grand Prix, `npm run gp` updates these cumulative values without
resetting their history.

The frontend provides a `/confronto` page for comparing two drivers or two
teams. The equivalent API endpoints are:

```text
GET /api/v1/confronti/piloti/{primoPilotaSlug}/{secondoPilotaSlug}
GET /api/v1/confronti/scuderie/{primaScuderiaSlug}/{secondaScuderiaSlug}
```

Each comparison entry contains the same information as the corresponding
single profile: profile data, standings, indicators, Grand Prix analysis, and
season form.

## Local development

Requires Node.js `22.12.0` or later within the supported major-version range.
Install dependencies and start the backend and frontend in separate terminals:

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run dev
npm --prefix frontend run dev
```

The backend runs at `http://localhost:5002` and the frontend at
`http://localhost:5173`.

During development, `npm --prefix backend run dev` automatically creates a
temporary in-memory MongoDB instance and imports
`backend/data/dati-iniziali.json`. This makes the preview use the exact API data
and translations from the local checkout without reading from or writing to
Atlas. The required MongoDB binary is downloaded and cached on first use, then
reused on subsequent runs.

`npm --prefix backend start` preserves production behaviour and requires
`MONGO_URL`. The `seed` command writes to the configured database and must not
be used for a standard local preview.

## Reusing the API

The official APIs are read-only: consumers cannot modify the Race Analysis Hub
database. Responses may, however, be copied, displayed, and customised in the
consumer's own software, including for commercial purposes. For example, a
consumer may locally rewrite `aggiornamentiInArrivo` without changing the
original source.

To minimise requests, use `/api/v1/home` for bootstrapping, the comparison
endpoints instead of two separate requests, and `/api/v1/gare/{garaSlug}` when
all analyses for a Grand Prix are required. Load individual profiles only when
the user opens them. Routes, caching, `ETag` handling, errors, and rate limits
are summarised in [`API.md`](API.md).

Public API responses are distributed under CC BY 4.0. Users must credit
`Race Analysis Hub — Marco Tannoia`, preserve F1DB attribution for quantitative
data, and clearly identify any modifications. The complete terms are available
in [`LICENSE.md`](LICENSE.md) and [`NOTICE.md`](NOTICE.md).

## Data and licences

The 2026 standings, 2023–2025 race and qualifying results, and 2026 quantitative
charts are derived from
[F1DB v2026.12.0](https://github.com/f1db/f1db/releases/tag/v2026.12.0),
distributed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Race Analysis Hub
filters and normalises the data. Editorial content is original to the project
and, when returned by the public API, may also be reused under the terms in
`LICENSE.md`.

See [`NOTICE.md`](NOTICE.md) and [`LICENSE.md`](LICENSE.md) for attribution,
trademark information, and reuse terms.

Team colours are checked against the official
[Formula 1 Teams](https://www.formula1.com/en/teams) page. Nationality codes use
[ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html), while team
abbreviations are stable editorial identifiers maintained by Race Analysis
Hub.

Career starts and indicator results come from the same F1DB snapshot. Wet-race
classification is editorial and documented in [`NOTICE.md`](NOTICE.md); a
Grand Prix is classified as `misto` only when it contains significant wet and
dry phases. Driver errors are counted conservatively from documented
individual incidents and penalties.

## Driver prediction ranking

The favourites index ranges from 0 to 100 and is included in the home response
to avoid a second request. The dedicated `GET /api/v1/previsioni/piloti`
endpoint remains available, including the factor breakdown intended for API
clients. The website and native app display only the ranking, index, and
confidence. The standard weights are:

| Factor | Weight |
|---|---:|
| Car–circuit compatibility | 60% |
| Driver form across the last three Grands Prix | 15% |
| Technical upgrades relevant to circuit requirements | 7% |
| Driver's 2026 form | 7% |
| Team form across the last three Grands Prix | 5% |
| 2026 qualifying performance | 3% |
| Driver's historical performance | 3% |

When a grid penalty is confirmed, it may account for up to 35% of the final
index, with the seven standard factors proportionally rescaled across the
remaining 65%.

Car–circuit compatibility is the weighted average of the team's ten technical
capabilities against the circuit's requirements. If either technical profile
is missing, the service falls back to the previous editorial calculation.

Technical upgrades do not automatically receive a positive score. A bonus
requires an explicitly relevant characteristic matched to a circuit
requirement rated at least 85/100. A reliability-only change, generic
description, or unmatched upgrade receives a neutral value.

The ranking is a statistical-editorial prediction and is subject to error. It
is not a guaranteed result and may change after practice sessions, weather
updates, penalties, FIA specifications, or new technical information.

## Data maintained manually

No single update date can accurately describe the entire payload because each
data group changes at a different cadence. Manual tasks include:

- **After each Grand Prix:** complete `backend/data/aggiornamento-gp.json`
  through `npm run gp` with results, standings, conditions, errors, and
  editorial notes. The script also updates cumulative indicators and selects
  the next Grand Prix.
- **When F1DB publishes a useful release:** regenerate
  `backend/data/f1db-*-derivato.json` with
  `npm run sync-f1db -- <directory>`. This updates standings, quantitative
  form, and historical results.
- **When current-Grand-Prix assessments change:** review driver and team
  analyses, penalties, technical upgrades, sources, and six-language
  translations in `backend/data/dati-iniziali.json`.
- **When new technical evidence becomes available:** review
  `backend/data/profili-tecnici-2026.json` and, when circuit data or
  requirements change, `backend/data/circuiti-tecnici-2026.json`.
- **When the calendar, entry list, or team identity changes:** update the
  relevant records in `backend/data/dati-iniziali.json`, then rerun the data
  quality and translation checks.

The historical FIA live-report records remain stored, but the website and
updated native app no longer display the live report. The backend no longer
starts the automatic FIA monitor, and `aggiornamentiLive` is retained only for
compatibility and always returns `null`.

## Operational guides

- [Changelog](CHANGELOG.md)
- [API, endpoints, and caching](API.md)
- [Deployment](DEPLOYMENT.md)
- [Post-Grand-Prix update](post-gp.md)
- [Editorial content](fix-frontend.md)
- [Localisation](LOCALIZZAZIONE.md)

### Technical-data translations

Circuit characteristics and technical-method descriptions are localised by the
API in all six supported languages. The
`backend/i18n/profiliTecnici.json` catalogue covers all 12 circuits currently
included, while Italian remains in the original technical catalogues.
`npm run verify-translations` checks these texts in addition to the translations
of documents stored in MongoDB. Technical codes remain stable and are
translated through client-side dictionaries. Releasing these translations
requires a backend deployment but no new database seed. See [API.md](API.md)
for details about the language-specific contract and caching behaviour.
