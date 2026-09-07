import './App.css'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import PilotaPage from './pages/PilotaPage.jsx'
import ScuderiaPage from './pages/ScuderiaPage.jsx'
import PaginaNonTrovata from './pages/PaginaNonTrovata.jsx'
import ConfrontoPage from './pages/ConfrontoPage.jsx'
import usePercorso from './hooks/usePercorso.js'
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
      <div className="racing-sparks" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <i key={i} style={{ '--x': `${(i * 37 + 9) % 100}%`, '--delay': `${-i * 0.73}s`, '--duration': `${12 + i % 9}s` }} />
        ))}
      </div>
      <header className="site-header">
        <a href="/" aria-label="FantaStats GP — homepage">FANTASTATS GP</a>
      </header>
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
