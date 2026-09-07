# Update after a Grand Prix

Each analysis retains an array `storicoEdizioni`. At the end of the race, this array
receives a structured record with season, race position and qualifying, note
on the result, pace, tyres and reliability. If the same update is
run again, the record for that season is replaced and not duplicated.

From the root folder of the project you always use the same command:

```bash
npm run gp
```

If `backend/data/aggiornamento-gp.json` does not exist, the command generates it for the
GP currently visible. The file already contains all the drivers, all the teams
and the current rankings. It is therefore necessary to:

1. indicate `condizioniGara` with `asciutto`, `misto` or `bagnato`;
2. insert an HTTPS URL in `fonteIndicatori` that documents races and incidents;
3. enter race position and qualifying for all drivers;
4. fill in `errorePilota` for all with `nessuno`, `non_fatale` or `fatale`;
5. update the two complete rankings;
6. add, when available, notes, race pace, tyres and reliability;
7. set `"pronto": true`;
8. relaunch `npm run gp`.

The script checks that no driver or ranking element is absent,
automatically builds team results, records history,
updates the standings, closes the current GP and publishes the next one based on
to the calendar order. Also update
`backend/data/statistiche-contesto.json` cumulatively and idempotently: a
GP already applied cannot increase percentages and counts twice.

`misto` requires a considerable part of the race on a wet track and a considerable part of the race.
after the rain has ceased; a few drops with no effect on the
Race conditions remain `asciutto`. A mistake `fatale` the race ends or
it definitively compromises the result. The general and fatal percentages
they both use all departures as the denominator.

Before writing to the database, you can perform a full check:

```bash
npm run gp -- --controlla
```

After the upgrade, the compiled file is retained in
`backend/data/archivio-gp/`. The command doesn't use external APIs: the contents
and the results entered remain those verified manually.

New editorial texts must also be provided and revised in the
published languages. The administrative procedure, free of charge within the F0 quota and
is described in
[`LOCALIZZAZIONE.md`](LOCALIZZAZIONE.md); do not publish a new Italian text
leaving translations referring to the previous version active.

This procedure does not update the 2026 quantitative charts, which come from the
local snapshot derived from F1DB. To add new GPs to the charts you need to
regenerate the snapshot from an F1DB release, run `npm run verify-data`, and
publish the updated code. Version, license and transformations of the
snapshots are documented in `NOTICE.md`.

APIs don't expose a generic last updated date. To understand if
a block has changed, you have to compare its payload or its `ETag`,
not a date shared between quantitative data and editorial content.

## Effect on the forecast ranking

The landing page ranking is generated from the backend for the GP marked
as `attuale`. After `npm run gp` then automatically moves on to the race
and use the new driver and team rankings. The answer is
isolated in `GET /api/v1/previsioni/piloti`.

Recent form and 2026 qualification also depend on the F1DB snapshot. As long as
The snapshot is not regenerated, those factors remain unchanged at the last release
documented. Track compatibility, tyre management, reliability and
Technical updates derive instead from the editorial analysis of the new tender.

Before publishing, check in particular
`aggiornamentiInArrivo`: A package that is only announced or not relevant is not
must be described as a verified benefit. The forecast reduces or
Automatically cancel the contribution when the text indicates no
confirmed components, lack of improvements, or lack of relevance to the circuit.

To voluntarily regenerate the current form:

```bash
npm run gp -- --prepara --sovrascrivi
```
