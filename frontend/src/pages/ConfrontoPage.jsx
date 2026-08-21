import { useEffect, useMemo, useState } from 'react'
import {
  caricaConfrontoPiloti,
  caricaConfrontoScuderie,
  caricaHome,
} from '../services/api.js'
import AnalisiCircuito from '../components/AnalisiCircuito.jsx'
import Collegamento from '../components/Collegamento.jsx'
import IndicatoriProfilo from '../components/IndicatoriProfilo.jsx'
import Marchio from '../components/Marchio.jsx'
import { Caricamento, ErrorePagina } from '../components/StatoPagina.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function SelettoreEntita({ etichetta, valore, opzioni, escluso, onChange }) {
  return (
    <label className="selettore-confronto">
      <span>{etichetta}</span>
      <select value={valore} onChange={(evento) => onChange(evento.target.value)}>
        {opzioni.map((opzione) => (
          <option
            key={opzione.slug}
            value={opzione.slug}
            disabled={opzione.slug === escluso}
          >
            {opzione.nome}
          </option>
        ))}
      </select>
    </label>
  )
}

function ProfiloConfronto({ scheda, tipo }) {
  const { t } = useLingua()
  const entita = tipo === 'piloti' ? scheda.pilota : scheda.scuderia
  const sottotitolo =
    tipo === 'piloti'
      ? `${entita.scuderia.nome} · #${entita.numero} · ${entita.nazionalita}`
      : `${scheda.piloti.map((pilota) => pilota.nome).join(' · ')} · ${entita.nazionalita}`

  return (
    <article className="colonna-confronto">
      <header className="identita-confronto">
        <span className="sovratitolo">
          {tipo === 'piloti' ? t.profiloPilota : t.profiloScuderia}
        </span>
        <h2>{entita.nome}</h2>
        <p>{sottotitolo}</p>
        <div className="statistiche-confronto">
          <span>
            <small>{t.classifica2026}</small>
            <strong>P{entita.classifica2026.posizione}</strong>
          </span>
          <span>
            <small>{t.punti}</small>
            <strong>{entita.classifica2026.punti}</strong>
          </span>
        </div>
      </header>

      <IndicatoriProfilo indicatori={scheda.indicatori} compatto />
      <AnalisiCircuito
        analisi={scheda.analisi}
        andamentoStagioneCorrente={scheda.andamentoStagioneCorrente}
      />
    </article>
  )
}

function ConfrontoPage() {
  const { lingua, t } = useLingua()
  const [home, setHome] = useState(null)
  const [tipo, setTipo] = useState('piloti')
  const [primo, setPrimo] = useState('')
  const [secondo, setSecondo] = useState('')
  const [confronto, setConfronto] = useState(null)
  const [errore, setErrore] = useState('')

  useEffect(() => {
    let attivo = true
    setErrore('')
    caricaHome(lingua)
      .then((dati) => {
        if (!attivo) return
        setHome(dati)
      })
      .catch((problema) => attivo && setErrore(problema.message))
    return () => {
      attivo = false
    }
  }, [lingua])

  const opzioni = useMemo(
    () => (tipo === 'piloti' ? home?.piloti || [] : home?.scuderie || []),
    [home, tipo],
  )

  useEffect(() => {
    const primoValido = opzioni.some((opzione) => opzione.slug === primo)
    const secondoValido = opzioni.some((opzione) => opzione.slug === secondo)
    if (primoValido && secondoValido && primo !== secondo) return

    setConfronto(null)
    setPrimo(opzioni[0]?.slug || '')
    setSecondo(opzioni[1]?.slug || '')
  }, [opzioni, primo, secondo])

  useEffect(() => {
    const slugsDisponibili = new Set(opzioni.map((opzione) => opzione.slug))
    if (
      !primo ||
      !secondo ||
      primo === secondo ||
      !slugsDisponibili.has(primo) ||
      !slugsDisponibili.has(secondo)
    ) {
      return undefined
    }
    let attivo = true
    setConfronto(null)
    setErrore('')
    const carica =
      tipo === 'piloti' ? caricaConfrontoPiloti : caricaConfrontoScuderie

    carica(primo, secondo, lingua)
      .then((dati) => attivo && setConfronto(dati))
      .catch((problema) => attivo && setErrore(problema.message))
    return () => {
      attivo = false
    }
  }, [primo, secondo, tipo, lingua, opzioni])

  function cambiaTipo(nuovoTipo) {
    if (nuovoTipo === tipo) return
    const nuoveOpzioni =
      nuovoTipo === 'piloti' ? home?.piloti || [] : home?.scuderie || []
    setConfronto(null)
    setErrore('')
    setTipo(nuovoTipo)
    setPrimo(nuoveOpzioni[0]?.slug || '')
    setSecondo(nuoveOpzioni[1]?.slug || '')
  }

  if (errore && !home) return <ErrorePagina messaggio={errore} />
  if (!home) return <Caricamento />

  return (
    <div className="pagina-confronto">
      <header className="hero-confronto">
        <div className="contenitore">
          <div className="testata-dettaglio">
            <Collegamento a="/" className="link-indietro">
              <span aria-hidden="true">←</span>
              <span>{t.tornaRicerca}</span>
            </Collegamento>
            <Marchio compatto />
          </div>
          <span className="sovratitolo">{t.confrontoDiretto}</span>
          <h1>{t.confrontaTitolo}</h1>

          <div className="tipo-confronto" aria-label={t.tipoConfronto}>
            <button
              type="button"
              className={tipo === 'piloti' ? 'attivo' : ''}
              onClick={() => cambiaTipo('piloti')}
            >
              {t.piloti}
            </button>
            <button
              type="button"
              className={tipo === 'scuderie' ? 'attivo' : ''}
              onClick={() => cambiaTipo('scuderie')}
            >
              {t.scuderie}
            </button>
          </div>

          <div className="controlli-confronto">
            <SelettoreEntita
              etichetta={t.primoConfronto}
              valore={primo}
              opzioni={opzioni}
              escluso={secondo}
              onChange={setPrimo}
            />
            <span aria-hidden="true">VS</span>
            <SelettoreEntita
              etichetta={t.secondoConfronto}
              valore={secondo}
              opzioni={opzioni}
              escluso={primo}
              onChange={setSecondo}
            />
          </div>
        </div>
      </header>

      <div className="contenitore contenuto-confronto">
        {errore && <ErrorePagina messaggio={errore} />}
        {!errore && !confronto && <Caricamento />}
        {confronto?.tipo === tipo && (
          <div className="griglia-confronto">
            {confronto.elementi.map((scheda) => {
              const entita = tipo === 'piloti' ? scheda.pilota : scheda.scuderia
              return <ProfiloConfronto key={entita.slug} scheda={scheda} tipo={tipo} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfrontoPage
