import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LINGUE,
  TRADUZIONI_INTERFACCIA,
} from '../src/i18n/traduzioniInterfaccia.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const percorsoCatalogo = path.join(
  __dirname,
  '../src/i18n/traduzioniInterfaccia.js',
)
const CODICI_ATTESI = ['it', 'en', 'fr', 'pt', 'es', 'de']
const VALORI_INVARIANTI = new Set(['DNP', 'F1', 'FIA', 'App Store', 'POS.'])
const TRADUZIONI_LEGITTIMAMENTE_IDENTICHE = new Set([
  'fr.indice',
  'pt.circuito',
  'pt.contributo',
  'pt.fonteTecnica',
  'pt.peso',
  'pt.valoriTecnici.alto',
  'pt.valoriTecnici.permanente',
  'es.circuito',
  'es.peso',
  'es.valoriTecnici.alto',
  'es.valoriTecnici.medio',
  'es.valoriTecnici.medio-alto',
  'es.valoriTecnici.permanente',
])
const errori = []
let campiVerificati = 0

function segnala(condizione, messaggio) {
  if (!condizione) errori.push(messaggio)
}

function tipoValore(valore) {
  if (Array.isArray(valore)) return 'array'
  if (valore === null) return 'null'
  return typeof valore
}

function verificaStruttura(base, traduzione, lingua, percorso = '') {
  const tipoBase = tipoValore(base)
  const tipoTraduzione = tipoValore(traduzione)
  segnala(
    tipoBase === tipoTraduzione,
    `${lingua}.${percorso}: tipo ${tipoTraduzione}, atteso ${tipoBase}`,
  )
  if (tipoBase !== tipoTraduzione) return

  if (tipoBase === 'object') {
    const chiaviBase = Object.keys(base).sort()
    const chiaviTraduzione = Object.keys(traduzione).sort()
    segnala(
      JSON.stringify(chiaviBase) === JSON.stringify(chiaviTraduzione),
      `${lingua}.${percorso}: chiavi mancanti o aggiuntive`,
    )
    for (const chiave of chiaviBase) {
      verificaStruttura(
        base[chiave],
        traduzione[chiave],
        lingua,
        percorso ? `${percorso}.${chiave}` : chiave,
      )
    }
    return
  }

  campiVerificati += 1
  if (tipoBase === 'string') {
    segnala(
      traduzione.trim().length > 0,
      `${lingua}.${percorso}: testo vuoto`,
    )
    if (
      lingua !== 'it' &&
      base === traduzione &&
      !VALORI_INVARIANTI.has(base) &&
      !TRADUZIONI_LEGITTIMAMENTE_IDENTICHE.has(`${lingua}.${percorso}`)
    ) {
      errori.push(`${lingua}.${percorso}: testo identico all'italiano`)
    }
  }

  if (tipoBase === 'function') {
    const argomenti = ['7', '11'].slice(0, base.length)
    const risultatoBase = base(...argomenti)
    const risultatoTradotto = traduzione(...argomenti)
    segnala(
      typeof risultatoTradotto === 'string' && risultatoTradotto.trim(),
      `${lingua}.${percorso}: funzione senza testo`,
    )
    segnala(
      lingua === 'it' || risultatoBase !== risultatoTradotto,
      `${lingua}.${percorso}: funzione rimasta in italiano`,
    )
    for (const argomento of argomenti) {
      segnala(
        risultatoTradotto.includes(argomento),
        `${lingua}.${percorso}: parametro ${argomento} perso`,
      )
    }
  }
}

segnala(
  JSON.stringify(LINGUE.map(({ codice }) => codice)) ===
    JSON.stringify(CODICI_ATTESI),
  'Elenco delle lingue non valido',
)
segnala(
  JSON.stringify(Object.keys(TRADUZIONI_INTERFACCIA)) ===
    JSON.stringify(CODICI_ATTESI),
  'Cataloghi dell’interfaccia mancanti o in ordine non valido',
)

const sorgente = fs.readFileSync(percorsoCatalogo, 'utf8')
segnala(
  !/\.\.\.(?:it|en|fr|pt|es|de)\b/.test(sorgente),
  'I cataloghi non possono ereditare un’altra lingua tramite spread',
)

const italiano = TRADUZIONI_INTERFACCIA.it
for (const lingua of CODICI_ATTESI) {
  verificaStruttura(
    italiano,
    TRADUZIONI_INTERFACCIA[lingua],
    lingua,
  )
}

if (errori.length) {
  console.error(`Verifica interfaccia fallita: ${errori.length} errori`)
  for (const errore of errori) console.error(`- ${errore}`)
  process.exitCode = 1
} else {
  console.log(
    `OK interfaccia: ${campiVerificati} campi verificati in ` +
      `${CODICI_ATTESI.length} lingue, senza fallback tra cataloghi.`,
  )
}
