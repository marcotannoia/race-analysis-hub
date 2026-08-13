import { useEffect, useMemo, useState } from 'react'
import { LINGUE, TRADUZIONI_INTERFACCIA } from './traduzioniInterfaccia.js'
import { LinguaContext } from './contestoLingua.js'

const CODICI = new Set(LINGUE.map((lingua) => lingua.codice))

function linguaIniziale() {
  const salvata = window.localStorage.getItem('race-hub-lingua')
  if (CODICI.has(salvata)) return salvata

  const preferita = navigator.languages
    ?.map((lingua) => lingua.toLowerCase().split('-')[0])
    .find((lingua) => CODICI.has(lingua))

  return preferita || 'it'
}

export function FornitoreLingua({ children }) {
  const [lingua, setLingua] = useState(linguaIniziale)

  useEffect(() => {
    document.documentElement.lang = lingua
    window.localStorage.setItem('race-hub-lingua', lingua)
  }, [lingua])

  const valore = useMemo(
    () => ({
      lingua,
      lingue: LINGUE,
      cambiaLingua: setLingua,
      t: TRADUZIONI_INTERFACCIA[lingua],
    }),
    [lingua],
  )

  return <LinguaContext.Provider value={valore}>{children}</LinguaContext.Provider>
}
