# Editorial Content Guide

## Files to edit

The editorial analyses can be found in:

```text
backend/data/dati-iniziali.json
```

- `analisiGare`: analysis of individual pilots;
- `analisiScuderie`: analysis of the teams.


## Matching JSON to page

| JSON Field | Text Visible on Page | Direct Edit |
|---|---|---|
| `risultatiGara` | Essential Race → History | Yes |
| `risultatiQualifica` | Essential History → Qualification | Yes |
| `notaBene` | Results on the circuit ↳ Analysis | Yes; the block does not appear if there are no events |
| `andamentoPerAnno` | Results on the circuit ↳ Analysis | Yes, if filled in |
| `gestioneGomme` | Performance & Performance ↳ Tire Management | Yes |
| `passoGara` | Performance & Performance ↳ Race Pace | Yes |
| Team Compatibility | Final Thoughts → Circuit Compatibility | Calculated in Home |
| Forecast Ranking | Final Thoughts → Forecast Ranking | Calculated in Home |
| `aggiornamentiInArrivo` | Upcoming Updates → Type and Expected Benefits | Yes |
| `fonti` | Sources associated with the analysis | Yes |

The fields `considerazioniFinali`, `passoGara`, `gestioneGomme`, `affidabilita`,
`penalita` and `aggiornamentiInArrivo` also feed the forecast ranking
of the landing page. The changes must therefore describe real evidence and not
hypothetical advantages presented as certain.

## Master data exposed by APIs

The personal data can be found in sections `piloti` and `scuderie` of
`backend/data/dati-iniziali.json`. The `1.5.0` version also shows:

| JSON Field | Location in API Response | Rule |
|---|---|---|
| `nazionalitaIso2` | `pilota.nazionalitaIso2` | ISO 3166-1 alpha-2, two capital letters |
| `nazionalitaIso3` | `pilota.nazionalitaIso3` | ISO 3166-1 alpha-3, three capital letters |
| `abbreviazione` of the team | `pilota.scuderia.abbreviazione` | stable editorial identifier |
| `colore` of the stable | `pilota.scuderia.colore` | Hexadecimal RGB `#RRGGBB` |

`abbreviazioneNome` and `numeroVettura` are explicit public names derived from
historic `codice` and `numero` fields. Do not remove the latter: they guarantee the
compatibility with those who already use the API.

`andamentoPerAnno` is a particular field:

- if it contains text, the page shows exactly the content entered;
- if it is empty, the page builds the analysis using `risultatiGara`,
`risultatiQualifica` and only the notes actually present in the `notaBene`;
- phrases equivalent to "no events to report" do not generate a widget;
- when the driver has not participated, the Race and Qualifying tabs will show
only `DNP` (*Did Not Participate*) and that year does not generate an analysis.

## Final Thoughts

The frontend no longer derives this section from editorial labels such as
`FAVORITO`, `PODIO` or `PUNTI`. Driver and team load their own in parallel
Sheet and `/api/v1/home`: the conclusion shows the real compatibility of the
team with the circuit and the forecast standings already calculated for the GP.

His position appears in the driver profile; in the team profile you will see the
positions of both drivers. In this way, the values remain identical to the
home and are not duplicated or recalculated in the browser.

## Updates and forecast index

The model distinguishes four cases:

| Update Status | Treatment |
|---|---|
| No confirmed packages | No additional benefits |
| Almost certain but not yet official | Shown as provisional, with no forecast bonus |
| Announced but not verified | Reduced benefit |
| Already introduced or confirmed | Evaluated according to relevance to the track |
| No real improvement or little relevance | Reduced score |

In the text, always indicate what has been confirmed, if the component has already been
used and what characteristics of the circuit it can improve. The hypotheses of the type
"would be useful" are not treated as actually available components.
The declared compatibility is also corrected using the 2026 competitiveness
A positive label cannot hide a weak car.

The page automatically divides the content into two widgets: the first sentence
describes the type or package, and subsequent sentences make up an explanation
discursive of the expected benefits. If the field is empty, the page declares
explicitly that there are no confirmed upgrades or benefits.

## Progressive Circuit

The home shows `ordineCalendario/totaleGareCalendario` next to the GP. Both
values follow the official calendar of the season and remain distinct from
`ordineAnalisi` and `totaleGareAnalisi`, which describe only the sequence
internal editorial.

## Check that the JSON is valid
```bash
node -e "JSON.parse(require('fs').readFileSync('backend/data/dati-iniziali.json')); console.log('JSON valido')"
```

## Apply changes to the database

Before seeding, regenerate and check the translations of the edited texts,
following [`LOCALIZZAZIONE.md`](LOCALIZZAZIONE.md):

```bash
npm run translate-data -- --dry-run
npm run translate-data
npm run verify-translations
```

From the root folder:

```bash
cd backend
npm run seed
```

The command updates the database indicated by `backend/.env`.

- If `MONGO_URL` points to the production database, the change becomes visible
in the official APIs.
- If it points to a local or personal database, only that copy changes.
- Pushing to GitHub is not required to update MongoDB, but it is useful for
Keep `dati-iniziali.json` changes in the repository.

## Update after a GP

To record the results of the GP that has just ended, the following is used instead:

```text
backend/data/aggiornamento-gp.json
```

The main fields are:

```json
{
  "posizioneGara": "P4",
  "posizioneQualifica": "Q6",
  "notaRisultato": "Rimonta pulita e senza contatti.",
  "passoGara": "Ritmo costante nel secondo stint.",
  "gestioneGomme": "Degrado controllato sulle medie.",
  "affidabilita": "Nessun problema tecnico."
}
```

Before writing to the database:

```bash
npm run gp -- --controlla
```

When the file is complete, set `"pronto": true` and run:

```bash
npm run gp
```

## Current Season Charts

The `Andamento in qualifica` and `Andamento in gara` graphs show exclusively
the season indicated by the current Grand Prix, for example 2026.

The locations are from the local snapshot derived from F1DB
`v2026.12.0`. The frontend does not query external providers: the backend reads the
snapshot, prepares the numerical series and returns together with the data the source, the
version, license and transformations applied.

The 2026 standings and the numerical results of the 2023-2025 race and qualifying
present in the database also derive from F1DB. The texts `notaBene`,
`passoGara`, `gestioneGomme`, `considerazioniFinali` and other content
editorial ones remain those manually modified in the JSON.

The trend response indicates where it came from:

```json
"fonte": {
  "nome": "F1DB",
  "url": "https://github.com/f1db/f1db/releases/tag/v2026.12.0",
  "licenza": "CC BY 4.0",
  "licenzaUrl": "https://creativecommons.org/licenses/by/4.0/",
  "versione": "v2026.12.0"
}
```

The snapshot contains only the completed GPs included in the F1DB release
declared. The results `DNF`, `DNS`, `DSQ` and `NC` remain missing and not
are converted into invented positions.

The `npm run gp` command updates MongoDB and the publishing history, but does not modify
automatically takes the snapshot of the charts. To update the charts:

```bash
npm run sync-f1db -- /percorso/alla/distribuzione-f1db
npm run verify-data
```

The full attribution and conditions of reuse are set out in
`NOTICE.md` and in the Swagger documentation.

## Customization by API users

Public APIs do not allow you to modify the official database. A
However, the reuser can save or transform the answer in his own software
and customize fields such as `aggiornamentiInArrivo`, `considerazioniFinali`, or
`passoGara`.

If personalized content is displayed or distributed, it must be
the powers provided for by `LICENSE.md` and `NOTICE.md` and must be
indicated that the text has been changed. To preserve your changes
independent, the reuser must use his own backend or database: his
customization does not change the official Race Analysis Hub APIs.
