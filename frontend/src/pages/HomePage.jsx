import { useEffect, useMemo, useState } from 'react'
import { caricaHome } from '../services/api.js'
import Collegamento from '../components/Collegamento.jsx'
import ClassificaPrevisionale from '../components/ClassificaPrevisionale.jsx'
import AggiornamentiLive from '../components/AggiornamentiLive.jsx'
import DatiTecniciCircuito from '../components/DatiTecniciCircuito.jsx'
import Marchio from '../components/Marchio.jsx'
import { Caricamento, ErrorePagina } from '../components/StatoPagina.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function normalizza(testo) {
  return testo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function HomePage() {
  const { lingua, t } = useLingua()
  const [dati, setDati] = useState(null)
  const [errore, setErrore] = useState('')
  const [ricerca, setRicerca] = useState('')

  useEffect(() => {
    let componenteAttivo = true
    setDati(null)
    setErrore('')

    caricaHome(lingua)
      .then((home) => {
        if (componenteAttivo) {
          setDati({
            piloti: home.piloti,
            scuderie: home.scuderie,
            garaAttuale: home.garaAttuale,
            circuitoTecnico: home.circuitoTecnico,
            aggiornamentiLive: home.aggiornamentiLive,
            classificaPrevisionale: home.classificaPrevisionale,
          })
        }
      })
      .catch((problema) => {
        if (componenteAttivo) setErrore(problema.message)
      })

    return () => {
      componenteAttivo = false
    }
  }, [lingua])

  const risultati = useMemo(() => {
    const termine = normalizza(ricerca.trim())

    if (!dati || !termine) return []

    const piloti = dati.piloti.map((pilota) => ({
      tipo: 'pilota',
      slug: pilota.slug,
      nome: pilota.nome,
      sigla: pilota.codice,
      descrizione: pilota.scuderia.nome,
    }))

    const scuderie = dati.scuderie.map((scuderia) => ({
      tipo: 'scuderia',
      slug: scuderia.slug,
      nome: scuderia.nome,
      sigla: scuderia.classifica?.posizione
        ? `P${scuderia.classifica.posizione}`
        : '—',
      descrizione: t.scuderia,
    }))

    return [...piloti, ...scuderie]
      .filter((elemento) =>
        normalizza(
          `${elemento.nome} ${elemento.sigla} ${elemento.descrizione}`,
        ).includes(termine),
      )
      .slice(0, 8)
  }, [dati, ricerca, t.scuderia])

  if (errore) return <ErrorePagina messaggio={errore} />
  if (!dati) return <Caricamento />

  return (
    <section className="home">
      <div className="contenitore home-contenuto">
        <Marchio />

        <div className="introduzione-home">
          <span className="sovratitolo">{t.analisiGp}</span>
          <h1>{t.cercaTitolo}</h1>
        </div>

        <div className="ricerca-home">
          <label className="barra-ricerca">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <span className="solo-screen-reader">
              {t.cercaEtichetta}
            </span>
            <input
              type="search"
              value={ricerca}
              onChange={(evento) => setRicerca(evento.target.value)}
              placeholder={t.cercaPlaceholder}
              autoComplete="off"
            />
          </label>

          {ricerca.trim() && (
            <div className="risultati-ricerca" aria-live="polite">
              {risultati.length > 0 ? (
                risultati.map((elemento) => (
                  <Collegamento
                    key={`${elemento.tipo}-${elemento.slug}`}
                    a={`/${elemento.tipo === 'pilota' ? 'piloti' : 'scuderie'}/${elemento.slug}`}
                    className="risultato-ricerca"
                  >
                    <span className="sigla-risultato">{elemento.sigla}</span>
                    <span>
                      <strong>{elemento.nome}</strong>
                      <small>{elemento.descrizione}</small>
                    </span>
                    <i aria-hidden="true">→</i>
                  </Collegamento>
                ))
              ) : (
                <p className="ricerca-vuota">{t.nessunRisultato}</p>
              )}
            </div>
          )}
        </div>

        <section className="prossimo-gp-home">
          <div className="testata-gp-home">
            <div>
              <span className="sovratitolo">{t.gpAttuale}</span>
              {dati.garaAttuale ? (
                <>
                  <h2>{dati.garaAttuale.nome}</h2>
                  <p>
                    {dati.garaAttuale.circuito} · {dati.garaAttuale.paese}
                  </p>
                </>
              ) : (
                <p>{t.gpNonDisponibile}</p>
              )}
            </div>
            {dati.garaAttuale && (
              <span className="numero-gp" aria-label={t.numeroAnalisi}>
                {String(dati.garaAttuale.ordineAnalisi).padStart(2, '0')}
              </span>
            )}
          </div>
          <DatiTecniciCircuito profilo={dati.circuitoTecnico} />
        </section>

        {dati.aggiornamentiLive && (
          <AggiornamentiLive aggiornamenti={dati.aggiornamentiLive} />
        )}

        <section className="invito-confronto">
          <div>
            <span className="sovratitolo">{t.confrontoDiretto}</span>
            <h2>{t.confrontaTitolo}</h2>
            <p>{t.confrontaDescrizione}</p>
          </div>
          <Collegamento a="/confronto" className="link-confronto">
            {t.apriConfronto}
            <span aria-hidden="true">→</span>
          </Collegamento>
        </section>

        <ClassificaPrevisionale previsioni={dati.classificaPrevisionale} />
      </div>
    </section>
  )
}

export default HomePage
