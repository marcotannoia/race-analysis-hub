import './App.css'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import PilotaPage from './pages/PilotaPage.jsx'
import ScuderiaPage from './pages/ScuderiaPage.jsx'
import PaginaNonTrovata from './pages/PaginaNonTrovata.jsx'
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
