# Localization in six languages

Race Analysis Hub publishes API and interface text in Italian, English,
French, European Portuguese, Spanish and German. Italian is the default.

| API code | Language | Variant |
|---|---|---|
| `it` | Italiano | default |
| `en` | English | English |
| `fr` | Français | French |
| `pt` | Português | European Portuguese (`pt-PT`) |
| `es` | Español | Spanish |
| `de` | Deutsch | German |

## API contract

Every v1 endpoint accepts the optional query parameter
`?lingua=it|en|fr|pt|es|de`. An omitted parameter selects Italian; an unknown
code returns HTTP `400` with `LINGUA_NON_SUPPORTATA`. The effective language is
reported by the `Content-Language` header and, for localized resource
responses, by the top-level `lingua` field.

```text
GET /api/v1/home?lingua=en
GET /api/v1/piloti/leclerc?lingua=fr
GET /api/v1/stagione?lingua=de
```

Editorial text, nationalities, Grand Prix names, technical descriptions,
prediction explanations and error messages are localized. Proper names,
official circuit names, slugs, ISO and sporting codes, dates, times, numbers,
URLs, JSON property names and technical enum identifiers remain stable source
data. Property names are never translated because corporate clients require one
stable schema across every language.

`GET /api/v1/stagione` localizes all 23 Grand Prix names and the F1DB
transformation notice. Race results, qualifying times and circuit names remain
identical in every language.

## Frontend contract

The frontend selects the first supported entry in `navigator.languages`, then
stores the choice under `race-hub-lingua` in `localStorage`. Changing language
updates the document `lang` attribute and the `lingua` API parameter.

Each of the six interface catalogues is complete and independent. A catalogue
must not spread or inherit another language: this prevents a missing French,
Portuguese, Spanish or German field from silently appearing in English or
Italian. Visible text and accessibility labels use the same catalogue.

## Offline maintenance

The release source of truth is local and versioned:

- `backend/data/dati-iniziali.json` contains localized editorial data;
- `backend/i18n/` contains API, calendar, prediction and technical catalogues;
- `frontend/src/i18n/traduzioniInterfaccia.js` contains interface catalogues.

Translations can be edited and reviewed entirely on the local computer. No
cloud translation account or runtime network call is required. The complete
release check is:

```bash
npm run verify-translations
npm run verify-data
npm run verify-docs
npm test
npm run lint:api
npm run lint
npm run build
```

`verify-translations` checks all six languages in both backend and frontend. It
rejects missing or empty values, incompatible object shapes, cross-language UI
fallbacks, untranslated long text, damaged placeholders, changed years,
numbers, sporting codes, proper names and suspicious Formula 1 terminology.

Automatic checks cannot prove editorial nuance. Before publishing new prose,
read it in its full driver, team or race context and verify the certainty level,
technical terminology and relationship between subject and result.

## Optional legacy Azure helper

`backend/scripts/generaTraduzioni.py` remains available as an optional legacy
translation-memory helper. It is not used by the API, frontend, tests or normal
publication workflow. Do not configure `AZURE_TRANSLATOR_KEY` on Render or in a
Vite build. If the helper is used, keep credentials only in the ignored
`backend/.env` file and review every generated translation before committing.

The existing fully translated catalogue does not require rebuilding the
ignored Azure cache. In particular, a missing `.translation-cache/azure.json`
is not a release blocker.

## Database update

After the local catalogues and translations are approved:

```bash
npm --prefix backend run seed
npm run verify-db
```

The seed writes to the database selected by `backend/.env`. Verify the exact
`MONGO_URL` and `DATABASE_NAME` before running it; pushing to GitHub does not
update MongoDB automatically.

## Isolated preview

Use two terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Backend development mode imports `backend/data/dati-iniziali.json` into a
temporary in-memory MongoDB. Stopping the process deletes that temporary
database. `npm start` keeps the normal production database behavior.

## Reusers and company integrations

The official API is read-only. A company that changes an editorial field in
its own software creates a derived content version and is responsible for all
six translations of that change. Keep source text and translations together,
invalidate translations when the source changes, rerun the same structural
checks and disclose derived changes as required by `LICENSE.md` and `NOTICE.md`.
