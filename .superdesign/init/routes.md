# Routes

- `/` -> `frontend/src/pages/HomePage.jsx` through `frontend/src/App.jsx`
- `/piloti/:slug` -> `frontend/src/pages/PilotaPage.jsx` through `frontend/src/App.jsx`
- `/scuderie/:slug` -> `frontend/src/pages/ScuderiaPage.jsx` through `frontend/src/App.jsx`
- `/confronto` -> `frontend/src/pages/ConfrontoPage.jsx` through `frontend/src/App.jsx`
- all other paths -> `frontend/src/pages/PaginaNonTrovata.jsx`

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
## `frontend/src/hooks/usePercorso.js`

```js
import { useEffect, useState } from 'react'

function usePercorso() {
  const [percorso, setPercorso] = useState(window.location.pathname)

  useEffect(() => {
    function aggiornaPercorso() {
      setPercorso(window.location.pathname)
    }

    window.addEventListener('popstate', aggiornaPercorso)

    return () => window.removeEventListener('popstate', aggiornaPercorso)
  }, [])

  return percorso
}

export default usePercorso

```
