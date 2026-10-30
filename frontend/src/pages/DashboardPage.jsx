import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  accediDashboard,
  aggiornaMeteoDashboard,
  caricaPrevisioniDashboard,
  esciDashboard,
  verificaSessioneDashboard,
} from '../services/api.js'
import { useLingua } from '../i18n/contestoLingua.js'
import './DashboardPage.css'

// Punti indice massimi spostati dal bagnato: gara pesa più della qualifica.
const PESO_PIOGGIA_GARA = 10
const PESO_PIOGGIA_QUALIFICA = 4
const SOGLIA_PIOGGIA = 50
// Posti di penalità → % di indice tolta; valori intermedi interpolati, partenza dal fondo = 20%.
const SCALA_PENALITA = [[0, 0], [3, 2], [5, 5], [10, 10], [20, 20]]
const PENALITA_PER_SECONDO = 0.15
const POSTI_PIT_LANE = 20

const statoVuoto = { penalita: {}, manuale: {} }

function leggiStato(chiave) {
  try {
    return { ...statoVuoto, ...JSON.parse(localStorage.getItem(chiave) || '{}') }
  } catch {
    return statoVuoto
  }
}

function effettoPioggia(bagnato, meteo) {
  if (!meteo || bagnato == null) return 0
  const gara = meteo.probabilitaPioggiaPercentuale || 0
  const qualifica = meteo.probabilitaPioggiaQualificaPercentuale || 0
  return ((bagnato - 50) / 50) * (PESO_PIOGGIA_GARA * gara + PESO_PIOGGIA_QUALIFICA * qualifica) / 100
}

function percentualePenalita(posti) {
  for (let i = 1; i < SCALA_PENALITA.length; i += 1) {
    const [x0, y0] = SCALA_PENALITA[i - 1]
    const [x1, y1] = SCALA_PENALITA[i]
    if (posti <= x1) return y0 + (y1 - y0) * (posti - x0) / (x1 - x0)
  }
  return SCALA_PENALITA.at(-1)[1]
}

function applicaPenalita(indice, penalita) {
  if (!penalita) return indice
  const posti = penalita.pitLane ? POSTI_PIT_LANE : Math.min(Number(penalita.posti) || 0, POSTI_PIT_LANE)
  return indice * (1 - percentualePenalita(Math.max(posti, 0)) / 100) - (Number(penalita.secondi) || 0) * PENALITA_PER_SECONDO
}

function Dashboard({ onSessioneScaduta, onEsci }) {
  const { lingua } = useLingua()
  const [previsioni, setPrevisioni] = useState(null)
  const [meteoNuovo, setMeteoNuovo] = useState(null)
  const [bagnato, setBagnato] = useState({})
  const [stato, setStato] = useState(statoVuoto)
  const [errore, setErrore] = useState('')
  const [aggiornamento, setAggiornamento] = useState(false)
  const [trascinato, setTrascinato] = useState(null)
  const [sopra, setSopra] = useState(null)

  const chiave = previsioni ? `dashboard-${previsioni.gara.slug}` : null

  useEffect(() => {
    caricaPrevisioniDashboard(lingua)
      .then((dati) => {
        setPrevisioni(dati)
        setStato(leggiStato(`dashboard-${dati.gara.slug}`))
      })
      .catch((e) => setErrore(e.message))
  }, [lingua])

  useEffect(() => {
    if (!chiave) return
    try { localStorage.setItem(chiave, JSON.stringify(stato)) } catch { /* storage non disponibile */ }
  }, [chiave, stato])

  const aggiornaMeteo = useCallback(async () => {
    setAggiornamento(true)
    setErrore('')
    try {
      const dati = await aggiornaMeteoDashboard()
      setMeteoNuovo(dati.meteo)
      setBagnato(dati.bagnatoPiloti || {})
      if (!dati.meteo) setErrore('Previsione meteo non disponibile per questo weekend.')
    } catch (e) {
      if (e.stato === 401) onSessioneScaduta()
      else setErrore(e.message)
    } finally {
      setAggiornamento(false)
    }
  }, [onSessioneScaduta])

  // Senza manuale: base API + delta meteo rispetto a quello già usato dal modello + penalità.
  const calcolate = useMemo(() => {
    if (!previsioni) return []
    const meteoBase = previsioni.meteo
    return previsioni.classifica.map((elemento) => {
      const slug = elemento.pilota.slug
      const valoreBagnato = bagnato[slug]?.valutazione
      const deltaMeteo = meteoNuovo && valoreBagnato != null
        ? effettoPioggia(valoreBagnato, meteoNuovo) - effettoPioggia(valoreBagnato, meteoBase)
        : 0
      const conPenalita = applicaPenalita(elemento.indice + deltaMeteo, stato.penalita[slug])
      return { ...elemento, deltaMeteo, indiceCalcolato: conPenalita }
    })
  }, [previsioni, meteoNuovo, bagnato, stato.penalita])

  const classifica = useMemo(() => {
    const posizioneBase = new Map(previsioni?.classifica.map((e, i) => [e.pilota.slug, i + 1]) || [])
    return calcolate
      .map((e) => ({ ...e, indiceFinale: e.indiceCalcolato + (stato.manuale[e.pilota.slug] || 0) }))
      .sort((a, b) => b.indiceFinale - a.indiceFinale)
      .map((e, i) => ({ ...e, posizione: i + 1, variazione: posizioneBase.get(e.pilota.slug) - (i + 1) }))
  }, [calcolate, stato.manuale, previsioni])

  // Il trascinamento diventa un bonus: il pilota si colloca tra i due vicini e segue poi penalità e meteo.
  function sposta(slug, destinazione) {
    const altri = classifica.filter((e) => e.pilota.slug !== slug)
    const pilota = classifica.find((e) => e.pilota.slug === slug)
    if (!pilota) return
    const indice = Math.max(0, Math.min(destinazione, altri.length))
    const sopraPilota = altri[indice - 1]?.indiceFinale
    const sottoPilota = altri[indice]?.indiceFinale
    const obiettivo = sopraPilota == null ? sottoPilota + 0.5
      : sottoPilota == null ? sopraPilota - 0.5
        : (sopraPilota + sottoPilota) / 2
    setStato((s) => ({ ...s, manuale: { ...s.manuale, [slug]: obiettivo - pilota.indiceCalcolato } }))
  }

  function impostaPenalita(slug, campo, valore) {
    setStato((s) => ({
      ...s,
      penalita: { ...s.penalita, [slug]: { ...s.penalita[slug], [campo]: valore } },
    }))
  }

  if (errore && !previsioni) return <section className="dashboard"><p className="dashboard-errore">{errore}</p></section>
  if (!previsioni) return <section className="dashboard"><p>Caricamento…</p></section>

  const meteo = meteoNuovo || previsioni.meteo
  const pioggiaGara = meteo?.probabilitaPioggiaPercentuale ?? null
  const pioggiaQualifica = meteo?.probabilitaPioggiaQualificaPercentuale ?? null

  return (
    <section className="dashboard">
      <header className="dashboard-intestazione">
        <span className="sovratitolo">Dashboard previsionale</span>
        <h1>{previsioni.gara.nome}</h1>
        <p>{previsioni.gara.circuito}</p>
      </header>

      <div className="dashboard-meteo">
        <div className={`meteo-scheda ${pioggiaQualifica >= SOGLIA_PIOGGIA ? 'meteo-pioggia' : ''}`}>
          <span>Qualifica</span>
          <strong>{pioggiaQualifica == null ? '—' : `${pioggiaQualifica}%`}</strong>
          <small>{pioggiaQualifica >= SOGLIA_PIOGGIA ? 'Pioggia prevista' : 'Asciutto'}</small>
        </div>
        <div className={`meteo-scheda ${pioggiaGara >= SOGLIA_PIOGGIA ? 'meteo-pioggia' : ''}`}>
          <span>Gara</span>
          <strong>{pioggiaGara == null ? '—' : `${pioggiaGara}%`}</strong>
          <small>{pioggiaGara >= SOGLIA_PIOGGIA ? 'Pioggia prevista' : 'Asciutto'}</small>
        </div>
        <div className="meteo-azioni">
          <button type="button" className="pulsante-aggiorna" onClick={aggiornaMeteo} disabled={aggiornamento}>
            {aggiornamento ? 'Aggiorno…' : 'AGGIORNA'}
          </button>
          <small>
            {meteo ? `Rilevato ${new Date(meteo.rilevatoIl).toLocaleString(lingua)} · ${meteo.fonte}` : 'Meteo non disponibile'}
            {meteoNuovo ? ' · applicato alla classifica' : ''}
          </small>
        </div>
      </div>

      {errore && <p className="dashboard-errore">{errore}</p>}

      <div className="dashboard-strumenti">
        <p>Trascina i piloti per cambiare posizione. Penalità e meteo continuano ad aggiornare la classifica.</p>
        <button type="button" onClick={() => setStato((s) => ({ ...s, manuale: {} }))}>Annulla spostamenti</button>
        <button type="button" onClick={() => setStato((s) => ({ ...s, penalita: {} }))}>Azzera penalità</button>
        <button type="button" onClick={onEsci}>Esci</button>
      </div>

      <ol className="dashboard-classifica">
        <li className="dashboard-riga dashboard-titoli" aria-hidden="true">
          <span>Pos</span><span>Pilota</span><span>Indice</span><span>Penalità griglia</span><span>Sec.</span><span>Dal fondo</span><span />
        </li>
        {classifica.map((e, i) => {
          const slug = e.pilota.slug
          const penalita = stato.penalita[slug] || {}
          return (
            <li
              key={slug}
              className={`dashboard-riga ${trascinato === slug ? 'in-trascinamento' : ''} ${sopra === i ? 'bersaglio' : ''}`}
              draggable
              onDragStart={(ev) => { setTrascinato(slug); ev.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(ev) => { ev.preventDefault(); setSopra(i) }}
              onDragEnd={() => { setTrascinato(null); setSopra(null) }}
              onDrop={(ev) => {
                ev.preventDefault()
                if (trascinato && trascinato !== slug) sposta(trascinato, i)
                setTrascinato(null)
                setSopra(null)
              }}
              style={{ '--colore-scuderia': e.scuderia.colore }}
            >
              <span className="dashboard-posizione">
                <b>{String(e.posizione).padStart(2, '0')}</b>
                {e.variazione !== 0 && (
                  <small className={e.variazione > 0 ? 'su' : 'giu'}>
                    {e.variazione > 0 ? '▲' : '▼'}{Math.abs(e.variazione)}
                  </small>
                )}
              </span>
              <span className="dashboard-pilota">
                <span className="maniglia" aria-hidden="true">⋮⋮</span>
                <span>
                  <strong>{e.pilota.nome}</strong>
                  <small>{e.pilota.codice} · {e.scuderia.nome}</small>
                </span>
              </span>
              <span className="dashboard-indice">
                <strong>{e.indiceFinale.toFixed(1)}</strong>
                {Math.abs(e.deltaMeteo) >= 0.05 && (
                  <small title="Effetto meteo">☔ {e.deltaMeteo > 0 ? '+' : ''}{e.deltaMeteo.toFixed(1)}</small>
                )}
                {stato.manuale[slug] ? <small title="Spostamento manuale">✋</small> : null}
              </span>
              <label className="dashboard-campo">
                <span className="solo-mobile">Posti</span>
                <input type="number" min="0" max="20" value={penalita.posti ?? ''} disabled={penalita.pitLane}
                  aria-label={`Posti di penalità per ${e.pilota.nome}`}
                  onChange={(ev) => impostaPenalita(slug, 'posti', ev.target.value)} />
              </label>
              <label className="dashboard-campo">
                <span className="solo-mobile">Secondi</span>
                <input type="number" min="0" max="60" value={penalita.secondi ?? ''}
                  aria-label={`Secondi di penalità per ${e.pilota.nome}`}
                  onChange={(ev) => impostaPenalita(slug, 'secondi', ev.target.value)} />
              </label>
              <label className="dashboard-campo dashboard-check">
                <input type="checkbox" checked={!!penalita.pitLane}
                  onChange={(ev) => impostaPenalita(slug, 'pitLane', ev.target.checked)} />
                <span className="solo-mobile">Dal fondo</span>
              </label>
              <span className="dashboard-frecce">
                <button type="button" aria-label="Sali" disabled={i === 0} onClick={() => sposta(slug, i - 1)}>▲</button>
                <button type="button" aria-label="Scendi" disabled={i === classifica.length - 1} onClick={() => sposta(slug, i + 1)}>▼</button>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Accesso({ onAccesso }) {
  const [utente, setUtente] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [invio, setInvio] = useState(false)

  async function invia(ev) {
    ev.preventDefault()
    setInvio(true)
    setErrore('')
    try {
      await accediDashboard(utente, password)
      setPassword('')
      onAccesso()
    } catch (e) {
      setErrore(e.message)
    } finally {
      setInvio(false)
    }
  }

  return (
    <section className="dashboard dashboard-accesso">
      <form onSubmit={invia}>
        <span className="sovratitolo">Dashboard previsionale</span>
        <h1>Accesso</h1>
        <label>Utente
          <input autoComplete="username" value={utente} onChange={(ev) => setUtente(ev.target.value)} required />
        </label>
        <label>Password
          <input type="password" autoComplete="current-password" value={password}
            onChange={(ev) => setPassword(ev.target.value)} required />
        </label>
        {errore && <p className="dashboard-errore">{errore}</p>}
        <button type="submit" className="pulsante-aggiorna" disabled={invio}>{invio ? 'Verifico…' : 'ENTRA'}</button>
      </form>
    </section>
  )
}

function DashboardPage() {
  const [autenticato, setAutenticato] = useState(null)

  useEffect(() => {
    verificaSessioneDashboard().then(() => setAutenticato(true)).catch(() => setAutenticato(false))
  }, [])

  const scaduta = useCallback(() => setAutenticato(false), [])
  const esci = useCallback(() => {
    esciDashboard().catch(() => {}).finally(() => setAutenticato(false))
  }, [])

  if (autenticato === null) return <section className="dashboard"><p>Caricamento…</p></section>
  if (!autenticato) return <Accesso onAccesso={() => setAutenticato(true)} />
  return <Dashboard onSessioneScaduta={scaduta} onEsci={esci} />
}

export default DashboardPage
