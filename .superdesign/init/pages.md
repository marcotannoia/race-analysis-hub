# Page dependency trees

## / (Home Page)
Entry: `frontend/src/pages/HomePage.jsx`
Dependencies:
- frontend/src/pages/HomePage.jsx
  - frontend/src/services/api.js
  - frontend/src/components/Collegamento.jsx
    - frontend/src/navigation.js
  - frontend/src/components/ClassificaPrevisionale.jsx
    - frontend/src/components/Collegamento.jsx
    - frontend/src/i18n/contestoLingua.js
  - frontend/src/components/AggiornamentiLive.jsx
    - frontend/src/i18n/contestoLingua.js
  - frontend/src/components/DatiTecniciCircuito.jsx
    - frontend/src/i18n/contestoLingua.js
  - frontend/src/components/Marchio.jsx
  - frontend/src/components/StatoPagina.jsx
    - frontend/src/components/Collegamento.jsx
    - frontend/src/i18n/contestoLingua.js
  - frontend/src/i18n/contestoLingua.js
- frontend/src/App.jsx
  - frontend/src/components/SelettoreLingua.jsx
  - frontend/src/components/Footer.jsx
  - frontend/src/i18n/LinguaContext.jsx
    - frontend/src/i18n/contestoLingua.js
    - frontend/src/i18n/traduzioniInterfaccia.js
- frontend/src/index.css
- frontend/src/App.css

## /piloti/:slug (Driver Detail)
Entry: `frontend/src/pages/PilotaPage.jsx`
Dependencies:
- frontend/src/pages/PilotaPage.jsx
  - frontend/src/services/api.js
  - frontend/src/components/StatoPagina.jsx
  - frontend/src/components/IntestazioneDettaglio.jsx
    - frontend/src/components/Collegamento.jsx
    - frontend/src/components/Marchio.jsx
    - frontend/src/i18n/contestoLingua.js
  - frontend/src/components/AnalisiCircuito.jsx
    - frontend/src/components/GraficoAndamento.jsx
      - frontend/src/i18n/contestoLingua.js
    - frontend/src/i18n/contestoLingua.js
  - frontend/src/components/IndicatoriProfilo.jsx
    - frontend/src/i18n/contestoLingua.js
- frontend/src/App.jsx
- frontend/src/index.css
- frontend/src/App.css

## /scuderie/:slug (Team Detail)
Entry: `frontend/src/pages/ScuderiaPage.jsx`
Dependencies:
- frontend/src/pages/ScuderiaPage.jsx
  - frontend/src/services/api.js
  - frontend/src/components/StatoPagina.jsx
  - frontend/src/components/IntestazioneDettaglio.jsx
  - frontend/src/components/AnalisiCircuito.jsx
    - frontend/src/components/GraficoAndamento.jsx
  - frontend/src/components/IndicatoriProfilo.jsx
  - frontend/src/components/ProfiloTecnicoScuderia.jsx
  - frontend/src/i18n/contestoLingua.js
- frontend/src/App.jsx
- frontend/src/index.css
- frontend/src/App.css

## /confronto (Comparison)
Entry: `frontend/src/pages/ConfrontoPage.jsx`
Dependencies:
- frontend/src/pages/ConfrontoPage.jsx
  - frontend/src/services/api.js
  - frontend/src/components/AnalisiCircuito.jsx
  - frontend/src/components/Collegamento.jsx
  - frontend/src/components/IndicatoriProfilo.jsx
  - frontend/src/components/Marchio.jsx
  - frontend/src/components/StatoPagina.jsx
  - frontend/src/i18n/contestoLingua.js
- frontend/src/App.jsx
- frontend/src/index.css
- frontend/src/App.css
