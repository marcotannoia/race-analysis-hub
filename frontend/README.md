# Frontend Race Analysis Hub

Project React/Lifetime interface. Consume only the v1 public API
and view editorial analytics, rankings, Chart.js charts, and the
explainable forecast standings of the current Grand Prix.

The `1.5.0` release of the API added ISO2/ISO3 codes to the pilots, the number
and the abbreviation of the name; the object `scuderia` also includes
abbreviation and hexadecimal color. The above fields `codice` and `numero`
remain available, so existing views continue to work without
modifications.

Since release `1.6.0` the global selector supports `it`, `en`, `fr`, `pt`,
`es` and `de`. The initial choice follows the browser languages, is saved in
`localStorage` and adds `?lingua=...` to requests to home, details and
forecast ranking. The control shows the icon, native name and code of the
language in a compact element consistent with the graphics of the site, maintaining a
`select` native for keyboard and assistive technologies. The code `pt` select the
European Portuguese Catalog (`pt-PT`). The interface strings are in
`src/i18n/traduzioniInterfaccia.js`; editorial content arrives already
localized from the backend. The frontend does not contain Azure credentials and does not
Send requests to external translation services.

Since release `1.7.0` the landing page uses only `GET /api/v1/home`: the answer
it also includes the forecast ranking. In production the frontend calls
`/api` on the same domain, so CloudFront can serve repeated responses
without reaching Render and MongoDB Atlas every time.

Since the release `1.8.0` the driver and team pages show three indicators
normalized percentages: skill in the wet, errors attributable to the driver and
fatal or compromising errors. For wet weather, the API also exposes the two counts
used in the calculation, so the percentage is verifiable. The page
`/confronto` supports two drivers or two teams by re-proposing the complete sheets
individual profiles; use dedicated endpoints `/api/v1/confronti/piloti/...`
and `/api/v1/confronti/scuderie/...`.

## Local Boot

```bash
npm ci
npm run dev
```

In the absence of configuration, the frontend uses the local backend on
`http://127.0.0.1:5002`. To indicate another instance, create `.env` from
`.env.example` and set up `VITE_API_URL`.

For a full trial, start `npm run dev` in the `backend` folder first:
that command prepares a temporary MongoDB with the local catalog, without using
Atlas. Then start this frontend with `npm run dev` and change language from the
global selector; each change reloads the contents from the API with the
`lingua` correspondent.

## Controls

```bash
npm run lint
npm run build
```

The quantitative positions displayed in the charts come from the backend and
they are derived from the F1DB snapshot shown in the main `NOTICE.md`. Chart.js you
it deals only with the graphic representation and is distributed under license
MIT. For API contract, deployment, sources, and reuse terms, see
the `README.md`, `NOTICE.md`, and Swagger documentation of the project.

The landing page uses `GET /api/v1/home` for general content and ranking. For
each driver shows index, confidence, breakdown of the nine ordinary factors and
processing of technical updates. The dedicated endpoint
`GET /api/v1/previsioni/piloti` remains available for integrations that
only require prediction. The warning about the fallible nature of the
Prediction must remain visible and should not be removed in customizations
graphics.
