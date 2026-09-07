# Changelog

## 1.13.0 — 2026-09-06

### Forecasts and technical profiles

- revised the 0–100 technical profiles of the eleven teams with justifications,
confidence and date of review;
- Linked car-circuit compatibility to the ten technical capabilities
weighted on the demands of the route;
- updated the forecast weights: compatibility 60%, recent pilot form 15%,
Relevant updates 7%, 2026 driver trend 7%, recent team form
5%, qualification 3% and personal history 3%;
- added the team's performance in the last three GPs using both
cars and the actual associations of each event;
- Limited the bonus of upgrades to benefits that correspond to a
important circuit request;
- removed from the site and native app methodology, weights, contributions and details of the
factors, while keeping this data in the public API contract.

## 1.12.0 — 2026-09-02

### Data from the Italian Grand Prix

- Hadjar's substitution applied exclusively at Monza: Lawson is
associated with Red Bull and Tsunoda to Racing Bulls without changing the master data
seasonal or the MongoDB structure;
- added profile, 2026 standings, Monza history, full analysis and
translations by Tsunoda, updating home and forecast ranking to the 22
actual participants;
- updated the quantitative snapshot to F1DB `v2026.12.0`;
- the Ferrari ADUO update and the bass-specific rear wing have been registered
loaded, maintaining the Alpine package already announced for Colapinto;
- editorial indicators without a complete set of validated sources remain
`null`, including their team aggregates, instead of using estimates.

### Documentation and API

- added a unique endpoint guide with a bootstrap strategy,
lazy loading and internal caching for apps that reuse the API;
- Document conditional revalidation with `ETag`/`If-None-Match`,
`304` response and cache and rate limit headers;
- Descriptions, wet counts and forecast weights aligned with the contract
actually implemented;
- completed the index returned by `/api/v1` with `health` and `gare`;
- Unified equivalent non-language and language-free requests with
`?lingua=it`, keeping invalid queries isolated;
- added `npm run verify-docs` to check versions, local links and
coverage of documented endpoints.
- documented the distinction between the seasonal catalog of 23 drivers and
GP line-up of 22 participants, including temporary associations.

## 1.11.0 — 2026-08-30

### Interface

- removed the "General" tags from Tyre Management and Race Pace, now presented with
a more discursive prose;
- replaced the boxes of the years in the historical results with red labels,
centered and underlined;
- reduced the circuit board to the six main data and moved the
features in full-width widgets with arrow and indentation;
- linked the progressive of the home to the official Formula 1 calendar instead of
to the editorial subset of the database.

### Data and translations

- Added `ordineCalendario` to races and `totaleGareCalendario` to metadata
of the home;
- rewritten the tyre management and race pace analyses at Monza in all six
languages, preserving years, achievements, points and technical context;
- added the Ferrari ADUO 2 update as unofficial information but
expected, with public source and without bonuses in the forecasting model;
- fixed the Cadillac card without history comparable to Monza.

### Compatibility

- existing routes, methods and fields remain unchanged; the new calendar fields
are additional;
- OpenAPI, quality checks, tests, and operations guides are aligned with the release.

## 1.10.0 — 2026-08-29

### Interface

- redesigned the analysis of drivers and teams with a hierarchy of branches for
history, performance, final evaluation and updates;
- Linked car-circuit compatibility and forecast position to the data already
calculated in the home, avoiding duplication in the browser;
- Hidden content-free analysis blocks and introduced `DNP`
localized for seasons not played;
- Verified responsive arrangement without 390px overflow.

## 1.9.0 — 2026-08-22

### Modified

- increased the weight of the trend in the last three Grands Prix from 2% to 12%;
- kept the weight of technical updates at 12%, now also corrected in
based on the size of the package;
- excluded any performance bonus for interventions exclusively of
reliability;
- rebalanced the seasonal weights, compatibility with the circuit,
qualification and history, keeping the total at 100%;
- Updated the public model to `statistico-editoriale-v2`.

### Data

- updated the declared interventions for the 2026 Dutch Grand Prix using
the FIA document of 21 August;
- Regenerate and verify cards in all six supported languages.

## 1.8.0 — 2026-08-21

### Added

- percentage of wet proficiency normalized on wet or mixed races
actually played;
- percentage of pilot errors and fatal errors, both related
to all career starts;
- weighted aggregate of the same indicators for each team;
- side-by-side comparison between two drivers or two teams, available in the frontend
and via two new API endpoints;
- incremental, verified and idempotent updating of indicators in the
command `npm run gp`;
- Swagger diagrams, tests, translations and operation guides for all new features.

### Compatibility

- existing routes and fields remain unchanged; the new fields are additional;
- the raw counts remain internal and the APIs only display percentages;
- MongoDB does not require a migration, because the indicators are calculated from
a dataset that is versioned along with the code.

### Security

- Updated the `nanoid` development transitive dependency from `3.3.16` to
`3.3.18`, correcting `GHSA-2v37-7h3g-55p8`;
- Verified backend and frontend with `npm audit`: no residual vulnerabilities.

### Maintenance

- updated `express-rate-limit` to `8.6.2`, `mongoose` to `9.9.2` and
`@redocly/cli` to `2.46.1` in the backend;
- Updated `vite` to `8.2.1` and `oxlint` to `1.78.0` in the frontend.

## 1.7.0 — 2026-08-14

### Added

- In-memory cache of public API responses, limited to 500 entries and with TTL
configurable, to avoid duplicate MongoDB queries;
- coalescence of concurrent requests: only one cache expires
request reconstructs the answer while the others wait for the same data;
- `s-maxage`, `stale-while-revalidate`, and `X-App-Cache` headers to integrate
a shared cache in front of Render without new fixed-cost services;
- Forecast ranking in the `GET /api/v1/home` response.

### Optimized

- the landing page uses only one API call instead of the previous two;
- CloudFront build uses `/api` on the public domain, allowing the CDN to
absorb repeated requests before they reach Render and Atlas;
- Errors and health checks are not cached.

### Compatibility

- existing routes, methods, parameters and public fields remain unchanged;
- `GET /api/v1/previsioni/piloti` remains available as a dedicated endpoint;
- MongoDB Atlas doesn't require any changes or a switch to a paid plan.

## 1.6.0 — 2026-08-12

### Added

- complete localization in Italian, English, French, Portuguese, Spanish
and German for editorial content, nationality, races and forecasts;
- Optional parameter `lingua` on all content and new endpoints
`GET /api/v1/lingue` endpoints;
- persistent and accessible language selector in the frontend, with name
native and catalog code;
- Azure Translator F0 administrative pipeline with translation memory,
Formula 1 glossary and automatic completeness and structure checks;
- Azure key confined to the on-premises environment, without access from the frontend or
from public endpoints;
- `--offline` mode to regenerate and check the catalog without consuming
Azure quota;
- isolated backend `npm run dev` environment on temporary MongoDB populated by
local data, with no reads or writes to Atlas.

### Compatibility

- previous routes, methods, slugs, codes, URLs, and public fields are unchanged;
- Italian remains the default language and translations are selected without
expose the internal catalogs of the database;
- Swagger and guides describe fallback, European Portuguese, language errors
and absence of external translation at runtime.

## 1.5.0 — 2026-08-11

### Added

- `nazionalitaIso2` and `nazionalitaIso3` codes for all pilots;
- public aliases `abbreviazioneNome` and `numeroVettura`;
- `abbreviazione` and `colore` in short items in the stables;
- propagation of new fields into lists, details, analyses, rankings and
forecasts;
- sources and validation rules for ISO codes, abbreviations and colors.

### Compatibility

- no HTTP route, query, parameter, or method has been changed;
- existing fields `codice`, `numero` and `nazionalita` remain available;
- OpenAPI and Swagger document the backwards compatible extension of responses.
