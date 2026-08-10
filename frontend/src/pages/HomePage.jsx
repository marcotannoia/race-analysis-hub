import { useEffect, useMemo, useState } from 'react'
import { caricaHome } from '../services/api.js'
import Collegamento from '../components/Collegamento.jsx'
import ClassificaPrevisionale from '../components/ClassificaPrevisionale.jsx'
import Marchio from '../components/Marchio.jsx'
import { Caricamento, ErrorePagina } from '../components/StatoPagina.jsx'

function normalizza(testo) {
  return testo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function HomePage() {
  const [dati, setDati] = useState(null)
  const [errore, setErrore] = useState('')
  const [ricerca, setRicerca] = useState('')

  useEffect(() => {
    let componenteAttivo = true

    caricaHome()
      .then((home) => {
        if (componenteAttivo) {
          setDati({
            piloti: home.piloti,
            scuderie: home.scuderie,
            garaAttuale: home.garaAttuale,
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
  }, [])

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
      descrizione: 'Scuderia',
    }))

    return [...piloti, ...scuderie]
      .filter((elemento) =>
        normalizza(
          `${elemento.nome} ${elemento.sigla} ${elemento.descrizione}`,
        ).includes(termine),
      )
      .slice(0, 8)
  }, [dati, ricerca])

  if (errore) return <ErrorePagina messaggio={errore} />
  if (!dati) return <Caricamento />

  return (
    <section className="home">
      <div className="contenitore home-contenuto">
        <Marchio />

        <div className="introduzione-home">
          <span className="sovratitolo">Analisi del Gran Premio in Arrivo</span>
          <h1>Cerca il pilota o la scuderia</h1>
        </div>

        <div className="ricerca-home">
          <label className="barra-ricerca">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <span className="solo-screen-reader">
              Cerca un pilota o una scuderia
            </span>
            <input
              type="search"
              value={ricerca}
              onChange={(evento) => setRicerca(evento.target.value)}
              placeholder="Es. Leclerc, Ferrari, ANT…"
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
                <p className="ricerca-vuota">Nessun pilota o scuderia trovata.</p>
              )}
            </div>
          )}
        </div>

        <div className="prossimo-gp-home">
          <div>
            <span className="sovratitolo">GP attuale</span>
            {dati.garaAttuale ? (
              <>
                <h2>{dati.garaAttuale.nome}</h2>
                <p>
                  {dati.garaAttuale.circuito} · {dati.garaAttuale.paese}
                </p>
              </>
            ) : (
              <p>Il Gran Premio attuale sarà pubblicato a breve.</p>
            )}
          </div>
          {dati.garaAttuale && (
            <span className="numero-gp" aria-label="Numero analisi">
              {String(dati.garaAttuale.ordineAnalisi).padStart(2, '0')}
            </span>
          )}
        </div>

        <ClassificaPrevisionale previsioni={dati.classificaPrevisionale} />
      </div>
    </section>
  )
}

export default HomePage
