# Shared layouts

## App shell

The application shell provides the language selector, route content and shared footer.

## `frontend/src/App.jsx`

```jsx
import './App.css'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import PilotaPage from './pages/PilotaPage.jsx'
import ScuderiaPage from './pages/ScuderiaPage.jsx'
import PaginaNonTrovata from './pages/PaginaNonTrovata.jsx'
import ConfrontoPage from './pages/ConfrontoPage.jsx'
import usePercorso from './hooks/usePercorso.js'
import SelettoreLingua from './components/SelettoreLingua.jsx'
import { FornitoreLingua } from './i18n/LinguaContext.jsx'

function ContenutoApp() {
  const percorso = usePercorso()
  const pilota = percorso.match(/^\/piloti\/([^/]+)$/)
  const scuderia = percorso.match(/^\/scuderie\/([^/]+)$/)

  let pagina = <PaginaNonTrovata />

  if (percorso === '/') {
    pagina = <HomePage />
  } else if (pilota) {
    pagina = <PilotaPage slug={decodeURIComponent(pilota[1])} />
  } else if (scuderia) {
    pagina = <ScuderiaPage slug={decodeURIComponent(scuderia[1])} />
  } else if (percorso === '/confronto') {
    pagina = <ConfrontoPage />
  }

  return (
    <div className="app-shell">
      <div className="barra-lingua contenitore">
        <SelettoreLingua />
      </div>
      <main>{pagina}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <FornitoreLingua>
      <ContenutoApp />
    </FornitoreLingua>
  )
}

export default App

```
## Footer

Shared footer shown on every route.

## `frontend/src/components/Footer.jsx`

```jsx
import { useLingua } from '../i18n/contestoLingua.js'

function Footer() {
  const { lingua, t } = useLingua()
  return (
    <footer className="footer">
      <div className="contenitore footer-contenuto">
        <div className="footer-identita">
          <span>Race <i>Analysis</i> <strong>Hub</strong></span>
          <div className="footer-contatti" aria-label="Contatti Marco Tannoia">
            <a
              href="mailto:marco.tannoia@gmail.com"
              aria-label="Invia una email a Marco Tannoia"
              title="marco.tannoia@gmail.com"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 6.5h18v11H3z" />
                <path d="m3.5 7 8.5 7 8.5-7" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/marco-tannoia-6b87361ba?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
              aria-label="Profilo LinkedIn di Marco Tannoia"
              rel="noreferrer"
              target="_blank"
              title="LinkedIn - Marco Tannoia"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6.5 9.5v8" />
                <path d="M6.5 6.5v.01" />
                <path d="M10.5 17.5v-8" />
                <path d="M10.5 13c0-2 1.25-3.5 3.5-3.5 2 0 3.5 1.25 3.5 4v4" />
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-note">
          <p>{t.progettoIndipendente}</p>
          <p lang={lingua}>{t.avvertenzaMarchi}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

```
