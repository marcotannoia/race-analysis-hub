# Deployment Preparation

The frontend and backend can be published separately or as a
single service. In production, the frontend uses `/api` on the same domain if
`VITE_API_URL` is not set; the backend can serve the
`frontend/dist` through `SERVE_FRONTEND=true`.

## Backend variables

```text
NODE_ENV=production
MONGO_URL=mongodb+srv://...
DATABASE_NAME=f1_stats
PORT=5002
HOST=0.0.0.0
FRONTEND_URL=https://www.esempio.it
TRUST_PROXY=1
RATE_LIMIT_MAX=1000
API_CACHE_TTL_SECONDS=300
API_CACHE_MAX_ENTRIES=500
SERVE_FRONTEND=true
```

`FRONTEND_URL` accepts multiple sources separated by commas. MongoDB credentials
must be configured in the platform secrets manager and not in a
file included in the deployment.

`API_CACHE_TTL_SECONDS` controls both the in-memory cache and `s-maxage` for
shared caches. `API_CACHE_MAX_ENTRIES` limits memory usage. The future IP of the
backend of the company will be able to receive a dedicated limit without increasing that
global audience; for now no exceptions should be configured.

## Build and launch

```bash
cd frontend
npm ci
npm run build

cd ../backend
npm ci --omit=dev
npm start
```

For two separate services, set `VITE_API_URL` with the HTTPS address of the
backend during frontend build and use `SERVE_FRONTEND=false`.

## Frontend on S3 and CloudFront

For static delivery to CloudFront, use the dedicated command:

```bash
npm run build:cloudfront
```

The command generates `frontend/dist` configuring the frontend to call `/api`
on the same domain. CloudFront then needs to forward `/api/v1*` to the backend
Render and keep queries in the cache key. Hashed files
below `assets/` can be
kept in cache for one year; `index.html` and favicon must instead use
`no-cache`. After uploading to S3, you must invalidate at least `/*` on the
CloudFront distribution.

Verified configuration uses HTTPS origin
`f1-stats-5v93.onrender.com`, `/api/v1*` behavior, and policy
`race-analysis-hub-api-v1-cache`. The policy forwards and includes in the key all
queries, so that the parameters that are not allowed reach validation and cannot be
reuse a valid answer; lawful integrations only use
`lingua`. Does not forward cookies and accepts Brotli/Gzip compression. TTL
minimum, default, and maximum are 0, 60, and 300 seconds, respectively. This
Configuration uses existing pay-as-you-go distribution and does not introduce
A new service with a fixed fee.

Full example, using dedicated variables to avoid publishing to the
Wrong buckets or distribution:

```bash
export RACE_HUB_S3_BUCKET="nome-bucket"
export RACE_HUB_CLOUDFRONT_ID="ID_DISTRIBUZIONE"

aws s3 sync frontend/dist "s3://${RACE_HUB_S3_BUCKET}" \
  --delete \
  --exclude "index.html" \
  --exclude "favicon-race.svg" \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=31536000,immutable"

aws s3 cp frontend/dist/index.html \
  "s3://${RACE_HUB_S3_BUCKET}/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache"

aws s3 cp frontend/dist/favicon-race.svg \
  "s3://${RACE_HUB_S3_BUCKET}/favicon-race.svg" \
  --content-type "image/svg+xml" \
  --cache-control "no-cache"

aws cloudfront create-invalidation \
  --distribution-id "${RACE_HUB_CLOUDFRONT_ID}" \
  --paths "/*"
```

Before uploading, verify your account with `aws sts get-caller-identity`
and check that the CloudFront alias matches the public domain.
The landing page uses only one request per `GET /api/v1/home`: if the backend is
automatically deployed by the push, wait for the response to include
`classificaPrevisionale` before upgrading S3.

For the multilingual release, please also wait for
`GET /api/v1/lingue` and `GET /api/v1/home?lingua=en` respond from the version
backend `1.14.0`. Only then can the frontend be published: otherwise
The selector would change the interface but would still receive Italian texts.
`AZURE_TRANSLATOR_KEY` should not be configured to Render or included in the
build Vite: Used only for local administrative script.

## Pre-Publish Checks

Before any seed, commit, or deployment, run the local check
offline. The first command should end with `0 segmenti nuovi` and `0 caratteri`:

```bash
npm run translate-data -- --rebuild-from-cache --offline
npm run verify-translations
npm run verify-data
npm run verify-docs
npm test
npm run lint:api
npm run lint
npm run build
```

The `--offline` option prevents the Azure client from initializing and terminates
with error if a cached translation is missing; this check does not consume quota
F0. For preview only, do not run `seed`, S3 syncs, or
CloudFront invalidations.

- rotate the credentials used during development;
- limit the MongoDB Atlas IP Access List to service addresses;
- assign the MongoDB user only the necessary permissions;
- use HTTPS exclusively;
- configure variables in the platform secrets manager;
- Run `npm audit`, build, lint, `npm --prefix backend test`, and verify
the endpoint `/api/v1/health`;
- Use a shared store for the rate limit if the backend will have multiple instances.

For release `1.14.0`, also verify that:

- `GET /api/v1` returns `"versione": "1.14.0"`;
- `GET /api/v1/home` exhibits Madrid as a current race and 22 participants,
including Hadjar who returned to the line-up;
- `GET /api/v1/piloti` exhibits the complete seasonal catalog of 23 drivers;
- the Red Bull and Racing Bulls cards derive their respective drivers from the
current GP grid;
- `GET /api/v1/home` include `classificaPrevisionale`, so the landing page uses a
call only;
- `GET /api/v1/home` exposes `garaAttuale.ordineCalendario` and
`metadati.totaleGareCalendario`, separated from the internal editorial sequence;
- the ranking uses the `statistico-editoriale-v2` model, with overall weights
100%: 60% car-circuit compatibility, driver performance in the
last three GPs 15%, relevant technical updates 7%, 2026 rider trend
7%, team performance in the last three GPs 5%, historical 3% and qualifying 3%.
With a penalty
confirmed, the penalty can affect up to 35% and all other factors
they are reproportioned to the remaining 65%;
- `GET /api/v1/lingue` lists the six languages exactly;
- `GET /api/v1/gare/attuale?lingua=de` returns `"lingua": "de"` and
the header `Content-Language: de`;
- `GET /api/v1/home?lingua=xx` returns HTTP `400`, code
`LINGUA_NON_SUPPORTATA` and the six codes allowed;
- `GET /api/v1/piloti/leclerc` display ISO2, ISO3, car number,
abbreviation of the name, abbreviation and color of the stable;
- the driver and team cards display `indicatori` with three percentages or
`null` if the sources have not been validated; for
wet must also be present `gareConPioggiaPositive` and
`gareConPioggiaDisputate`, which make the calculation verifiable;
- the endpoints `/api/v1/confronti/piloti/.../...` and
`/api/v1/confronti/scuderie/.../...` return exactly two cards;
- `/api/v1/openapi.json` declare the same fields without changes to routes,
HTTP parameters or methods;
- `npm run verify-db` terms with `0 differenze`.

Frontend verification must also confirm that the years of results are
that Tyre Management and Race Pace do not show the
"General", that the circuit board contains the six synthetic data provided and
that each feature occupies the entire available width. The
Almost certain but not yet official updates must report
explicitly the provisional status and remain neutral in the forecast calculation.

## Post-Race Editorial Update

The visible Grand Prix change does not require a new build. From the folder
main just run `npm run gp`: the first run prepares the module
`backend/data/aggiornamento-gp.json`, while the next one, after the
compiling and setting `"pronto": true`, updating MongoDB and moving
automatically the flag `attuale` on the following race. The file used is
kept in `backend/data/archivio-gp/` as an editorial source; do not insert
credentials.

The 2026 quantitative charts are not taken from this file: they use the
F1DB local snapshot declared in `NOTICE.md`. To include new GPs in
graphs you need to regenerate the snapshot from a new F1DB release, run
`npm run verify-data` and publish the updated code.
