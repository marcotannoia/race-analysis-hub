# Extractable components

## AppShell
- Source: `frontend/src/App.jsx`
- Category: layout
- Description: Shared application shell with language toolbar, route content and footer.
- Extractable props: none; route state remains outside the visual template.
- Hardcoded: shell classes and semantic main/footer structure.

## Footer
- Source: `frontend/src/components/Footer.jsx`
- Category: layout
- Description: Shared brand, contact and legal footer.
- Extractable props: none.
- Hardcoded: brand text, contact links, SVG icons and CSS classes.

## Marchio
- Source: `frontend/src/components/Marchio.jsx`
- Category: basic
- Description: Race Analysis Hub feat GPK wordmark.
- Extractable props: compatto (boolean, default false).
- Hardcoded: wordmark copy and collaboration label.

## SelettoreLingua
- Source: `frontend/src/components/SelettoreLingua.jsx`
- Category: basic
- Description: Accessible language selection control.
- Extractable props: active language for visual state.
- Hardcoded: globe and chevron SVGs, option styling.

## IntestazioneDettaglio
- Source: `frontend/src/components/IntestazioneDettaglio.jsx`
- Category: layout
- Description: Shared driver/team detail header with navigation and identity.
- Extractable props: tipo, nome, descrizione, numero.
- Hardcoded: Marchio placement, back control and CSS classes.
