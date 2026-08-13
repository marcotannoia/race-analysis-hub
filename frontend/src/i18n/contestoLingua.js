import { createContext, useContext } from 'react'

export const LinguaContext = createContext(null)

export function useLingua() {
  const contesto = useContext(LinguaContext)
  if (!contesto) throw new Error('FornitoreLingua mancante')
  return contesto
}
