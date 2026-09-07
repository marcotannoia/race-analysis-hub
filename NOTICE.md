# Legal and operational notices

Race Analysis Hub is an independent and unofficial project.

This website is unofficial and is not associated in any way with the Formula 1
companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP,
GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.

References to the championship, races, drivers and teams have a
descriptive and editorial. The project does not use official logos and does not state
endorsement, sponsorship or affiliation with Formula One Licensing B.V.,
Formula One World Championship Limited, the FIA, the teams or the drivers.

The 2026 standings, 2023-2025 race and qualifying results and graphs
2026 quantities derive from F1DB `v2026.12.0`, distributed by Marcel Overdijk
and F1DB contributors licensed under the Creative Commons Attribution 4.0 license
International (CC BY 4.0):

- Original design: https://github.com/f1db/f1db
- Release used: https://github.com/f1db/f1db/releases/tag/v2026.12.0
- License: https://creativecommons.org/licenses/by/4.0/

Race Analysis Hub has filtered, renamed, and normalized a subset of the
F1DB data. These transformations do not imply approval by the
authors of F1DB. CC BY 4.0 also allows commercial use, but those who share
or show derived data must maintain proper attribution, the reference
to the license and the indication of the changes.

## Driver and team master data

Car numbers, sporting codes and driver nationalities are retained
by Race Analysis Hub and also verified with the FIA documentation of the
2026 season:

- https://www.fia.com/sites/default/files/guide_media_2026_2_0.pdf

The `nazionalitaIso2` and `nazionalitaIso3` fields are a normalization of Race
Analysis Hub according to ISO 3166-1 alpha-2 and alpha-3:

- https://www.iso.org/iso-3166-country-codes.html

The hexadecimal colors of the stables correspond to the identifying colors
published on the Formula 1 page dedicated to teams, verified on 11 August 2026:

- https://www.formula1.com/en/teams

The abbreviations of the stables (`MER`, `FER`, `MCL` and similar) are
stable editorial identifiers defined by the Race Analysis Hub. They are not
presented as official codes of Formula 1, FIA or individual teams. I
names, colors and other references to the teams have exclusively
descriptive function and do not imply affiliation or endorsement.

The forecast ranking is not from F1DB. It is an original processing of
Race Analysis Hub that combines the quantitative results attributed above with
Editorial evaluations on track, car, tyres, reliability and updates
technical estimates. The index is an estimate subject to error, not an official result nor
a guarantee of future performance.

The order and total of the 2026 Grands Prix shown in the home page are verified
on the official Formula 1 calendar:

- https://www.formula1.com/en/racing/2026

Technical updates that are not yet official are identified as such,
linked to the relevant public source and kept neutral in the calculation until
are not confirmed.

## Wet indicators and errors

Career starts, results and retirement statuses used for
percentage indicators are derived from F1DB `v2026.12.0`. Races with up to
by 2025 have been rechecked using also the historical list published by
Tudo Sobre Fórmula 1:

- https://www.tudosobreformula1.com.br/corridas-com-pista-molhada-ou-%C3%BAmida

Mixed conditions and the 2026 Canadian GP are verified on the race reports
of Formula 1. Race Analysis Hub considers `mista` a race with phases
both on wet and dry tracks; light rain that
does not substantially change the track is not enough.

Canada 2026 Non-Fatal Penalties Were Double-Checked in the
FIA official report:

- https://www.fia.com/news/f1-antonelli-wins-thrilling-canadian-grand-prix-ahead-hamilton-and-verstappen-russell-retires

The percentage of proficiency in the wet is the ratio between positive races and races
wet or mixed actually held. The victories and the races are positive
finished ahead of his classmate or at least half of his direct rivals
classified. The error percentages adopt a criterion
conservative: documented individual exits and recorded race penalties. The
fatal errors are a subset and are divided by all starts, not
for overall errors; on the published profiles, the relative percentage remains
lower than the general one. Support counts remain internal; the API
it only shows the three percentages.

For a team, the percentages represent the weighted aggregate of the
careers of the riders lined up in the current GP, not the entire sporting history of the
previous designations of the manufacturer. A profile or aggregate remains `null`
when the necessary sources have not yet been validated.

## Translations

The English, French, European Portuguese, Spanish, and German versions of the content
Editorial data are initially generated with Azure Translator and then saved in the
project database. Azure isn't called by the public APIs or the
frontend. Procedure, translation memory, and checks are documented in
`LOCALIZZAZIONE.md`.

The administrative key and cache are not included in the repository or the
service in production. APIs only read translations that have already been saved
in the database; do not send the texts to external services during the requests of the
users. The public code `pt` identifies the `pt-PT` catalog.

Race Analysis Hub's public responses, including editorial texts
returned from the API, are reusable according to the license described
in `LICENSE.md`. The reuser can adapt them in his own software, also for
commercial use, without obtaining write access to the official database.
When publishing a modified version you must cite Race Analysis Hub, keep
attribution to F1DB for quantitative data and report changes.

Recommended synthetic attribution:

> Content adapted from Race Analysis Hub — quantitative data derived from F1DB
> v2026.12.0 — reuser changes — CC BY 4.0.

The extraordinary inclusion of the Bahrain Grand Prix in Sepang on the calendar
2026 is documented separately from the official Formula 1 communication of the
July 26, 2026, because it was not yet included in the F1DB release used:
https://www.formula1.com/en/latest/article/formula-1-and-fia-confirm-malaysia-will-join-2026-calendar-as-host-venue-for-bahrain-grand-prix.6lL7vjFEM2VVynRHvg1TCf

APIs are public and provided with no guarantee of continuous availability or
error-free. Any additional service, support,
continuity or access must be agreed separately.

Contact person: Marco Tannoia, `marco.tannoia@gmail.com`.
