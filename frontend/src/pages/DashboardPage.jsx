import { useCallback, useEffect, useRef, useState } from 'react'
import {
  accediDashboard,
  aggiornaMeteoDashboard,
  caricaPrevisioniDashboard,
  esciDashboard,
  salvaModificheDashboard,
  verificaSessioneDashboard,
} from '../services/api.js'
import { useLingua } from '../i18n/contestoLingua.js'
import './DashboardPage.css'

const SOGLIA_PIOGGIA = 50
const statoVuoto = { penalita: {}, manuale: {} }

// La classifica è calcolata dal server: le modifiche salvate valgono per tutte le API pubbliche.
function Dashboard({ onSessioneScaduta, onEsci }) {
  const { lingua } = useLingua()
  const [previsioni, setPrevisioni] = useState(null)
  const [modifiche, setModifiche] = useState(statoVuoto)
  const [errore, setErrore] = useState('')
  const [aggiornamento, setAggiornamento] = useState(false)
  const [salvataggio, setSalvataggio] = useState('')
  const [trascinato, setTrascinato] = useState(null)
  const [sopra, setSopra] = useState(null)
  const timerSalvataggio = useRef(null)

  const gestisciErrore = useCallback((e) => {
    if (e.stato === 401) onSessioneScaduta()
    else setErrore(e.message)
  }, [onSessioneScaduta])

  const applicaRisposta = useCallback((dati) => {
    setPrevisioni(dati.previsioni)
    setModifiche({ penalita: dati.modifiche?.penalita || {}, manuale: dati.modifiche?.manuale || {} })
  }, [])

  useEffect(() => {
    caricaPrevisioniDashboard().then(applicaRisposta).catch(gestisciErrore)
  }, [applicaRisposta, gestisciErrore])

  useEffect(() => () => window.clearTimeout(timerSalvataggio.current), [])

  // Salva sul server; i campi numerici attendono una breve pausa nella digitazione.
  function salva(nuove, attesa = 0) {
    setModifiche(nuove)
    setSalvataggio('In salvataggio…')
    window.clearTimeout(timerSalvataggio.current)
    timerSalvataggio.current = window.setTimeout(() => {
      salvaModificheDashboard(nuove)
        .then((dati) => {
          setPrevisioni(dati.previsioni)
          setSalvataggio(`Pubblicato alle ${new Date().toLocaleTimeString(lingua)}`)
          setErrore('')
        })
        .catch((e) => { setSalvataggio(''); gestisciErrore(e) })
    }, attesa)
  }

  async function aggiornaMeteo() {
    setAggiornamento(true)
    setErrore('')
    try {
      const dati = await aggiornaMeteoDashboard()
      if (!dati.meteo) setErrore('Previsione meteo non disponibile per questo weekend.')
      applicaRisposta(await caricaPrevisioniDashboard())
    } catch (e) {
      gestisciErrore(e)
    } finally {
      setAggiornamento(false)
    }
  }

  // Lo spostamento diventa un bonus: il pilota si colloca tra i due vicini e segue poi penalità e meteo.
  function sposta(slug, destinazione) {
    const classifica = previsioni.classifica
    const altri = classifica.filter((e) => e.pilota.slug !== slug)
    const pilota = classifica.find((e) => e.pilota.slug === slug)
    if (!pilota) return
    const indice = Math.max(0, Math.min(destinazione, altri.length))
    const sopraPilota = altri[indice - 1]?.indice
    const sottoPilota = altri[indice]?.indice
    const obiettivo = sopraPilota == null ? sottoPilota + 0.5
      : sottoPilota == null ? sopraPilota - 0.5
        : (sopraPilota + sottoPilota) / 2
    const bonusAttuale = modifiche.manuale[slug] || 0
    salva({ ...modifiche, manuale: { ...modifiche.manuale, [slug]: bonusAttuale + obiettivo - pilota.indice } })
  }

  function impostaPenalita(slug, campo, valore) {
    const voce = { ...modifiche.penalita[slug], [campo]: valore }
    salva({ ...modifiche, penalita: { ...modifiche.penalita, [slug]: voce } }, campo === 'dalFondo' ? 0 : 600)
  }

  if (errore && !previsioni) return <section className="dashboard"><p className="dashboard-errore">{errore}</p></section>
  if (!previsioni) return <section className="dashboard"><p>Caricamento…</p></section>

  const meteo = previsioni.meteo
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
          </small>
        </div>
      </div>

      {errore && <p className="dashboard-errore">{errore}</p>}

      <div className="dashboard-strumenti">
        <p>
          Trascina i piloti per cambiare posizione. Ogni modifica viene pubblicata su sito e API.
          {salvataggio && <strong className="dashboard-salvataggio"> {salvataggio}</strong>}
        </p>
        <button type="button" onClick={() => salva({ ...modifiche, manuale: {} })}>Annulla spostamenti</button>
        <button type="button" onClick={() => salva({ ...modifiche, penalita: {} })}>Azzera penalità</button>
        <button type="button" onClick={onEsci}>Esci</button>
      </div>

      <ol className="dashboard-classifica">
        <li className="dashboard-riga dashboard-titoli" aria-hidden="true">
          <span>Pos</span><span>Pilota</span><span>Indice</span><span>Penalità griglia</span><span>Sec.</span><span>Dal fondo</span><span />
        </li>
        {previsioni.classifica.map((e, i) => {
          const slug = e.pilota.slug
          const penalita = modifiche.penalita[slug] || {}
          const posizioneModello = e.modificheDashboard?.posizioneModello ?? e.posizione
          const variazione = posizioneModello - e.posizione
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
                {variazione !== 0 && (
                  <small className={variazione > 0 ? 'su' : 'giu'}>
                    {variazione > 0 ? '▲' : '▼'}{Math.abs(variazione)}
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
                <strong>{e.indice.toFixed(1)}</strong>
                {modifiche.manuale[slug] ? <small title="Spostamento manuale">✋</small> : null}
              </span>
              <label className="dashboard-campo">
                <span className="solo-mobile">Posti</span>
                <input type="number" min="0" max="20" value={penalita.posti || ''} disabled={penalita.dalFondo}
                  aria-label={`Posti di penalità per ${e.pilota.nome}`}
                  onChange={(ev) => impostaPenalita(slug, 'posti', ev.target.value)} />
              </label>
              <label className="dashboard-campo">
                <span className="solo-mobile">Secondi</span>
                <input type="number" min="0" max="60" value={penalita.secondi || ''}
                  aria-label={`Secondi di penalità per ${e.pilota.nome}`}
                  onChange={(ev) => impostaPenalita(slug, 'secondi', ev.target.value)} />
              </label>
              <label className="dashboard-campo dashboard-check">
                <input type="checkbox" checked={!!penalita.dalFondo}
                  onChange={(ev) => impostaPenalita(slug, 'dalFondo', ev.target.checked)} />
                <span className="solo-mobile">Dal fondo</span>
              </label>
              <span className="dashboard-frecce">
                <button type="button" aria-label="Sali" disabled={i === 0} onClick={() => sposta(slug, i - 1)}>▲</button>
                <button type="button" aria-label="Scendi" disabled={i === previsioni.classifica.length - 1} onClick={() => sposta(slug, i + 1)}>▼</button>
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
