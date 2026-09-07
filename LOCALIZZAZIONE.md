# Localization in six languages

Race Analysis Hub publishes textual fields in Italian, English, French,
European Portuguese, Spanish and German. Italian is the default language.

## Using APIs

The `lingua` parameter is optional and accepts `it`, `en`, `fr`, `pt`, `es`, and
`de`:

| API Code | Catalog |
|---|---|
| `it` | English |
| `en` | English |
| `fr` | Français |
| `pt` | Português, variant `pt-PT` |
| `es` | Español |
| `de` | Deutsch |

```text
GET /api/v1/home?lingua=en
GET /api/v1/piloti/leclerc?lingua=fr
GET /api/v1/gare/attuale?lingua=de
```

The answer always indicates the language selected in the `lingua` field, and
in the header `Content-Language`. The updated list is available with:

```text
GET /api/v1/lingue
```

If `lingua` is absent, `it` is selected. A value other than the six codes
does not produce a silent fallback: the response is HTTP `400` with
code `LINGUA_NON_SUPPORTATA` and the list `lingueSupportate`. The other errors
v1 are localized to the required valid language.

Slugs, sports codes, ISO codes, proper names, numeric values, and URLs remain
stable. Editorial texts, nationalities, names and
translatable descriptions of the Grand Prix and the texts of the forecast standings.

## Selection in the frontend

The global selector shows the native name and language code. To the first
Access uses the first supported language among `navigator.languages`; thereafter
Reuse the saved choice in `localStorage` with `race-hub-lingua` key.
Each change updates the page's `lang` attribute and reloads the content
via the API parameter, without contacting external translation services.

## Administrative translation with Azure F0

The script `backend/scripts/generaTraduzioni.py` uses Azure Translator F0 only
during editorial maintenance. The key remains in `backend/.env`, excluding
from Git. The public backend and frontend don't import the script, they don't read
and do not expose any proxies to Azure.

Local configuration:

```env
AZURE_TRANSLATOR_KEY=chiave-privata
AZURE_TRANSLATOR_REGION=global
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

Generation and controls:

```bash
npm run translate-data -- --dry-run
npm run translate-data
npm run verify-translations
npm run verify-data
```

To regenerate the catalog by applying glossary and corrections without allowing
any calls to Azure:

```bash
npm run translate-data -- --rebuild-from-cache --offline
```

In `--offline` mode, the script uses only the local cache. If it is missing
even a single segment, ends with error before creating the Azure client, and
it does not consume altitude. For a non-destructive preventive test, the following can be used:

```bash
npm run translate-data -- --rebuild-from-cache --dry-run
```

The summary must indicate `0 segmenti nuovi` and `0 caratteri`; in case
Against the contrary, you should not perform the online generation without first evaluating
the remaining portion.

Administrative cache `backend/.translation-cache/azure.json` is written
after each block and is excluded from Git. Subsequent executions read the
translations already present and the cache as memory: if an Italian text is not
changed the approved version is reused; if you add or
modified, only the new content is translated. The Portuguese required
to Azure is `pt-PT`. The built-in glossary standardizes Formula 1 terms such as
race pace, tyre management, floor, undercut, Safety Car and technical updates.

The `--dry-run` command calculates the consumption without sending text. The script places a
security limit less than two million characters F0, use blocks
small, limits the speed and never prints the key.

Before publication, however, you must read the new translations in the
context, check names, years, `P`/`Q` positions, acronyms and terminology
technical technology. Automatic checks check completeness, structure and codes, but
they are not a substitute for editorial revision of meaning.

For the release `1.11.0` contextual revision also includes the new prose
Tyre Management and Race Pace, Calendar and Race Pace labels
characteristics of the circuit and the status of unofficial updates. The
five foreign translations must keep the same years, results,
positions, points and levels of certainty of the Italian text.

Full local control, without Azure consumption, is:

```bash
npm run translate-data -- --rebuild-from-cache --offline
npm run verify-translations
npm run verify-data
npm test
npm run lint:api
npm run lint
npm run build
```

If the translations have been manually reviewed and saved in the catalog,
Also run `npm run translate-data -- --dry-run`: the summary must indicate
`0 segmenti nuovi` and `0 caratteri`, without sending requests to Azure.

## Official Database Update

After approving the translations:

```bash
npm --prefix backend run seed
npm run verify-db
```

The seed updates the database indicated by `backend/.env`. Push to GitHub does not
updates MongoDB and the seed should not be run without verifying the
destination of `MONGO_URL`.

## Isolated local preview

Before you approve or publish a catalog, start the two projects in terminals
separated:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Backend development command intentionally ignores the link
Atlas and creates a temporary MongoDB in memory. Import every time
`backend/data/dati-iniziali.json`, then the frontend selector shows the
exact local version that would later be published. By arresting the
backend, the dial tone database is deleted. The `npm start` command does not use
this mode and preserves the production behavior.

## Texts customized by reusers

Official APIs are read-only. If a company changes in its
software `aggiornamentiInArrivo` or another field, is creating its own
Content version: This change cannot corrupt translations in the
Official database.

To keep their six versions in sync, the reuser can
save the Italian text and translations in your database and apply the
same translation memory scheme. When the source text changes, it must
mark old translations as updating, regenerate them locally, and
approve them before publishing them. Distributed changes must be
declared and must comply with the powers of `LICENSE.md` and `NOTICE.md`.
