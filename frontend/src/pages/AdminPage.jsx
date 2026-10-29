import { useCallback, useEffect, useState } from 'react'
import { richiestaAdmin } from '../services/api.js'
import './AdminPage.css'

const CHIAVE_TOKEN = 'rah-admin-token'

function leggiToken() {
  try { return sessionStorage.getItem(CHIAVE_TOKEN) || '' } catch { return '' }
}

function salvaToken(valore) {
  try {
    if (valore) sessionStorage.setItem(CHIAVE_TOKEN, valore)
    else sessionStorage.removeItem(CHIAVE_TOKEN)
  } catch { /* sessione non disponibile */ }
}

const percentuale = (v) => (v === null || v === undefined ? '—' : `${Math.round(v)}%`)

function Accesso({ onAccesso, errore }) {
  const [valore, setValore] = useState('')
  return (
    <form className="admin-accesso" onSubmit={(e) => { e.preventDefault(); onAccesso(valore.trim()) }}>
      <h1>Area admin</h1>
      <label htmlFor="admin-token">Token amministratore</label>
      <input id="admin-token" type="password" autoComplete="current-password" value={valore}
        onChange={(e) => setValore(e.target.value)} />
      <button type="submit" disabled={!valore.trim()}>Entra</button>
      {errore && <p className="admin-errore">{errore}</p>}
    </form>
  )
}

function ScenarioMeteo({ scenario }) {
  if (!scenario) return null
  return (
    <div className="admin-griglia-kpi">
      <div><span>Pioggia gara</span><strong>{percentuale(scenario.probabilitaGaraPercentuale)}</strong></div>
      <div><span>Pioggia qualifica</span><strong>{percentuale(scenario.probabilitaQualificaPercentuale)}</strong></div>
      <div><span>Pioggia tutto il weekend</span><strong>{percentuale(scenario.probabilitaWeekendPercentuale)}</strong></div>
      <div className={scenario.pioggiaRiconosciuta ? 'admin-bagnato' : ''}>
        <span>Scenario</span><strong>{scenario.pioggiaRiconosciuta ? 'Bagnato' : 'Asciutto'}</strong>
        <small>meteo = {scenario.pesoMeteoNellaSomiglianzaPercentuale}% della somiglianza</small>
      </div>
    </div>
  )
}

function RigaPilota({ riga, chiavi }) {
  const [aperta, setAperta] = useState(false)
  const fattori = new Map(riga.fattori.map((f) => [f.chiave, f]))
  const d = riga.dettagliFattori || {}
  return (
    <>
      <tr className="admin-riga" onClick={() => setAperta(!aperta)} aria-expanded={aperta}>
        <td>{riga.posizione}</td>
        <td><span className="admin-colore" style={{ background: `#${String(riga.scuderia.colore || '888').replace('#', '')}` }} />{riga.pilota.nome}<small>{riga.scuderia.nome}</small></td>
        <td className="admin-num"><strong>{riga.indice}</strong></td>
        {chiavi.map((k) => {
          const f = fattori.get(k)
          return <td key={k} className="admin-num">{f ? f.valutazione.toFixed(1) : '—'}<small>{f ? `${f.pesoPercentuale}%` : ''}</small></td>
        })}
        <td>{fattori.has('penalita') ? 'Sì' : ''}</td>
      </tr>
      {aperta && (
        <tr className="admin-dettaglio"><td colSpan={chiavi.length + 4}>
          <div className="admin-dettaglio-griglia">
            {['compatibilitaVetturaCircuito', 'compatibilitaPilotaCircuito'].map((k) => (
              <div key={k}>
                <h4>{fattori.get(k)?.nome} · campione {d[k]?.campione ?? 0}</h4>
                <ul>{(d[k]?.edizioniPiuSimili || []).map((e) => (
                  <li key={`${e.gara}-${e.anno}`}>{e.anno} {e.circuitId} {e.bagnato === true ? '🌧' : e.bagnato === false ? '☀' : '?'}
                    {' · circuito '}{percentuale(e.similaritaCircuitoPercentuale)}{' · meteo '}{percentuale(e.concordanzaMeteoPercentuale)}
                    {' · voto '}{e.valutazione}</li>
                ))}</ul>
              </div>
            ))}
            <div>
              <h4>Aggiornamenti tecnici · {d.aggiornamentiTecnici?.pertinente ? 'pertinenti' : 'non pertinenti (peso redistribuito)'}</h4>
              <p>{riga.aggiornamentiTecnici?.stato}: {riga.aggiornamentiTecnici?.nota}</p>
              <ul>{(d.aggiornamentiTecnici?.criteri || []).map((c) => (
                <li key={`${c.caratteristica}-${c.criterio}`}>{c.caratteristica} → {c.criterio}: percentile {c.percentile ?? '—'} {c.rilevante ? '✓' : ''}</li>
              ))}</ul>
            </div>
          </div>
        </td></tr>
      )}
    </>
  )
}

function AdminPage() {
  const [token, setToken] = useState(leggiToken)
  const [dati, setDati] = useState(null)
  const [errore, setErrore] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [operazione, setOperazione] = useState('')
  const [esito, setEsito] = useState(null)

  const carica = useCallback(async (t = token) => {
    if (!t) return
    setCaricamento(true); setErrore('')
    try { setDati(await richiestaAdmin('/stato', t)) } catch (e) {
      setErrore(e.message)
      if (/token/i.test(e.message)) { salvaToken(''); setToken('') }
    } finally { setCaricamento(false) }
  }, [token])

  useEffect(() => { carica() }, [carica])

  async function esegui(percorso, corpo, conferma) {
    if (conferma && !window.confirm(conferma)) return
    setOperazione(percorso); setErrore(''); setEsito(null)
    try {
      setEsito(await richiestaAdmin(percorso, token, { metodo: 'POST', corpo }))
      await carica()
    } catch (e) { setErrore(e.message) } finally { setOperazione('') }
  }

  if (!token) return <Accesso errore={errore} onAccesso={(t) => { salvaToken(t); setToken(t) }} />

  const classifica = dati?.classifica
  const pesiAttivi = classifica?.pesi?.filter((p) => p.pesoPercentuale > 0) || []
  const chiavi = pesiAttivi.map((p) => p.chiave)
  const gara = dati?.garaAttuale
  const prossima = dati?.calendario?.find((g) => g.ordineCalendario > (gara?.ordineCalendario ?? Infinity))
  const auto = dati?.aggiornamentoAutomatico
  const occupato = Boolean(operazione)

  return (
    <div className="admin">
      <header className="admin-testata">
        <div>
          <span className="sovratitolo">Dashboard admin</span>
          <h1>{gara ? `${gara.nome}` : 'Nessun GP attuale'}</h1>
          {gara && <p>{gara.circuito} · round {gara.ordineCalendario} · stagione {gara.stagione}{prossima ? ` · poi: ${prossima.nome}` : ''}</p>}
        </div>
        <div className="admin-azioni">
          <button type="button" className="admin-primario" disabled={occupato}
            onClick={() => esegui('/prossimo-gp', { dryRun: false },
              'Sincronizzo risultati, classifiche, analisi, meteo e passo al prossimo GP se il GP attuale è concluso. Procedo?')}>
            {operazione === '/prossimo-gp' ? 'Aggiornamento…' : 'Passa al prossimo GP'}
          </button>
          <button type="button" disabled={occupato} onClick={() => esegui('/prossimo-gp', { dryRun: true })}>Simula (senza salvare)</button>
          <button type="button" disabled={occupato} onClick={() => esegui('/meteo-gare', null)}>Aggiorna meteo gare</button>
          <button type="button" disabled={occupato || caricamento} onClick={() => carica()}>{caricamento ? 'Carico…' : 'Ricarica'}</button>
          <button type="button" onClick={() => { salvaToken(''); setToken(''); setDati(null) }}>Esci</button>
        </div>
      </header>

      {errore && <p className="admin-errore" role="alert">{errore}</p>}
      {esito && (
        <section className="admin-pannello">
          <h2>Esito operazione</h2>
          <p>Stato: <strong>{esito.esito?.stato || 'completato'}</strong>
            {esito.esito?.garaAttuale ? ` · GP attuale: ${esito.esito.garaAttuale}` : ''}
            {esito.dryRun ? ' · simulazione' : ''}
            {esito.edizioniMeteo != null ? ` · meteo: ${esito.edizioniMeteo} gare` : ''}
            {esito.edizioni != null ? ` · meteo: ${esito.edizioni} gare` : ''}</p>
          {esito.avvisoMeteo && <p className="admin-errore">{esito.avvisoMeteo}</p>}
          {esito.esito?.ultimoErrore && <p className="admin-errore">{esito.esito.ultimoErrore}</p>}
        </section>
      )}

      <section className="admin-pannello">
        <h2>Aggiornamento automatico</h2>
        {auto ? (
          <div className="admin-griglia-kpi">
            <div><span>Stato</span><strong>{auto.stato || '—'}</strong></div>
            <div><span>Automatico</span><strong>{auto.abilitata ? `ogni ${auto.intervalloMinuti} min` : 'disattivato'}</strong></div>
            <div><span>Ultimo controllo</span><strong>{auto.ultimoControlloIl ? new Date(auto.ultimoControlloIl).toLocaleString('it') : '—'}</strong></div>
            <div><span>Fonte F1DB</span><strong>{auto.ultimaFonteApplicata?.split('|')[0] || auto.fonteDisponibile || '—'}</strong></div>
          </div>
        ) : <p>Disponibile solo con database Postgres.</p>}
        {auto?.ultimoErrore && <p className="admin-errore">{auto.ultimoErrore}</p>}
      </section>

      <section className="admin-pannello">
        <h2>Meteo e modello</h2>
        <ScenarioMeteo scenario={classifica?.scenarioMeteo} />
        <p className="admin-nota">Modello {classifica?.modello || '—'} · pesi base: {pesiAttivi.map((p) => `${p.nome} ${p.pesoPercentuale}%`).join(' · ')}</p>
        {dati?.meteoGare && (
          <p className="admin-nota">Esiti gare 2026 ({dati.meteoGare.aggiornatoIl}): {dati.meteoGare.edizioni.map((e) =>
            `R${e.round} ${e.circuitId}${e.pioggia ? ' 🌧' : ''}`).join(' · ')}</p>
        )}
      </section>

      <section className="admin-pannello">
        <h2>Classifica previsionale</h2>
        {dati?.erroreClassifica && <p className="admin-errore">{dati.erroreClassifica}</p>}
        {classifica && (
          <div className="admin-tabella-contenitore">
            <table className="admin-tabella">
              <thead><tr><th>#</th><th>Pilota</th><th>Indice</th>
                {pesiAttivi.map((p) => <th key={p.chiave}>{p.nome}</th>)}<th>Pen.</th></tr></thead>
              <tbody>{classifica.classifica.map((r) => <RigaPilota key={r.pilota.slug} riga={r} chiavi={chiavi} />)}</tbody>
            </table>
          </div>
        )}
        <p className="admin-nota">Clicca un pilota per vedere le gare più simili usate e la pertinenza degli aggiornamenti.</p>
      </section>

      <section className="admin-pannello">
        <h2>Circuiti più simili a questo GP</h2>
        <div className="admin-tabella-contenitore">
          <table className="admin-tabella">
            <thead><tr><th>Circuito</th><th>Somiglianza</th>
              {classifica?.confrontoCircuiti?.criteri?.map((c) => <th key={c.chiave}>{c.nome}</th>)}</tr></thead>
            <tbody>{classifica?.confrontoCircuiti?.confronti?.map((c) => (
              <tr key={c.slug}><td>{c.nome}</td><td className="admin-num"><strong>{percentuale(c.similaritaPercentuale)}</strong></td>
                {c.dettagli.map((d) => <td key={d.chiave} className="admin-num">{percentuale(d.similaritaPercentuale)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="admin-pannello">
        <h2>Calendario</h2>
        <ol className="admin-calendario">
          {dati?.calendario?.map((g) => (
            <li key={g.slug} className={`admin-stato-${g.stato}`}><span>R{g.ordineCalendario}</span>{g.nome}<small>{g.stato}</small></li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default AdminPage
