# Race Analysis Hub design system

## Product and experience

Race Analysis Hub is a multilingual Formula 1 analysis product. The home page leads with search and the current Grand Prix, while driver and team detail pages present circuit history, performance context, forecasts, technical updates and season trends. The experience is editorial and data-led, with concise navigation and a strong hierarchy between section numbers, racing headings and readable analysis copy.

## Visual language

- Preserve the existing black editorial canvas and restrained Formula 1-inspired red accent.
- Use only the source palette: `#030303`, `#080808`, `#0b0b0b`, `#111111`, `#252525`, `#393939`, `#ef2b24`, `#b81712`, `#f7f7f7`, `#a0a0a0`, `#dedede`.
- Use Barlow Condensed for headings, labels, scores and prominent numerals. Use the system sans-serif stack for paragraphs and controls. Do not introduce other fonts.
- Keep widgets geometric, bordered and mostly flat, with 6-8px radii and no decorative gradients. Red is an accent for active labels, rules and emphasis, not a large background fill.
- Keep the maximum content width at 1120px. Preserve generous vertical spacing on desktop and compact but readable single-column behavior on small screens.

## Content and hierarchy

- Prefer natural, discursive paragraphs with comfortable line-height and enough width to avoid fragmented reading.
- Historical years are navigation-like textual anchors: centered red text with a red underline, not filled badges.
- Performance copy for tyre management and race pace is continuous prose without a generic “General” tag.
- Circuit facts remain compact cards for laps, corners, main straight, aerodynamic load, tyre stress and brake stress. Circuit characteristics form a visibly indented full-width branch below those facts.
- Report expected but unofficial upgrades explicitly as provisional. Never style or phrase them as FIA-confirmed submissions.

## Motion and accessibility

- Keep motion restrained and functional. Respect the existing red focus outline, semantic headings, keyboard navigation and high contrast.
- At 900px and below, remove structural left offsets before they cause overflow. At 700px and below, maintain two-column compact facts where space permits; at 500px use one column only when required for legibility.
