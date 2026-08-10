import { useState } from 'react'
import Collegamento from './Collegamento.jsx'

const NUMERO_RIGHE_INIZIALI = 10

function formattaData(valore) {
  if (!valore) return 'dato non disponibile'

  const data = new Date(valore)
  if (Number.isNaN(data.getTime())) return 'dato non disponibile'

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(data)
}

function ClassificaPrevisionale({ previsioni }) {
  const [mostraTutti, setMostraTutti] = useState(false)

  if (!previsioni?.classifica?.length) {
    return (
      <section className="sezione-previsioni" aria-labelledby="titolo-previsioni">
        <div className="intestazione-previsioni">
          <span className="sovratitolo">Previsione per questo GP</span>
          <h2 id="titolo-previsioni">Classifica previsionale</h2>
          <p>La classifica del Gran Premio attuale è in aggiornamento.</p>
        </div>
      </section>
    )
  }

  const classificaVisibile = mostraTutti
    ? previsioni.classifica
    : previsioni.classifica.slice(0, NUMERO_RIGHE_INIZIALI)

  return (
    <section className="sezione-previsioni" aria-labelledby="titolo-previsioni">
      <div className="intestazione-previsioni">
        <span className="sovratitolo">Previsione per questo GP</span>
        <h2 id="titolo-previsioni">Classifica previsionale</h2>
        <div className="contesto-previsioni">
          <p>
            Favoriti per {previsioni.gara.nome} · {previsioni.gara.circuito}
          </p>
          <p>{previsioni.avvertenza}</p>
        </div>
      </div>

      <details className="metodologia-previsioni">
        <summary>Come viene calcolato l’indice</summary>
        <p>
          Ogni pilota riceve un indice da 0 a 100. La forza reale di pilota e
          scuderia nel 2026 ha il peso maggiore. La compatibilità con la pista è
          corretta usando la competitività attuale della vettura, mentre gli
          aggiornamenti contano soltanto quando sono pertinenti e verificabili.
        </p>
        <div className="pesi-previsioni">
          {previsioni.pesi.map((fattore) => (
            <span key={fattore.chiave}>
              {fattore.nome} <strong>{fattore.pesoPercentuale}%</strong>
            </span>
          ))}
        </div>
      </details>

      <ol className="elenco-previsioni" aria-label="Classifica dei piloti favoriti">
        {classificaVisibile.map((elemento) => (
          <li
            key={elemento.pilota.slug}
            className={elemento.posizione <= 3 ? 'previsione-podio' : ''}
          >
            <div className="riga-previsione">
              <span className="posizione-previsione">
                {String(elemento.posizione).padStart(2, '0')}
              </span>

              <div className="identita-previsione">
                <Collegamento a={`/piloti/${elemento.pilota.slug}`}>
                  <strong>{elemento.pilota.nome}</strong>
                </Collegamento>
                <span>
                  {elemento.pilota.codice} · {elemento.scuderia.nome}
                </span>
              </div>

              <div className="indice-previsione">
                <span>
                  Indice <strong>{elemento.indice}</strong>/100
                </span>
                <span className="barra-indice" aria-hidden="true">
                  <i style={{ width: `${elemento.indice}%` }} />
                </span>
              </div>

              <span className={`confidenza-previsione ${elemento.confidenza}`}>
                Confidenza {elemento.confidenza}
              </span>
            </div>

            <details className="dettagli-previsione">
              <summary>Mostra fattori e aggiornamenti</summary>
              <p className="sintesi-previsione">{elemento.sintesi}</p>

              <div className="fattori-previsione">
                {elemento.fattori.map((fattore) => (
                  <div key={fattore.chiave}>
                    <span>{fattore.nome}</span>
                    <strong>{fattore.valutazione}/100</strong>
                    <small>
                      Peso {fattore.pesoPercentuale}% · contributo{' '}
                      {fattore.contributo}
                    </small>
                  </div>
                ))}
              </div>

              <div className="nota-aggiornamenti-previsione">
                <span>Aggiornamenti tecnici</span>
                <strong>{elemento.aggiornamentiTecnici.stato}</strong>
                <p>{elemento.aggiornamentiTecnici.nota}</p>
              </div>
            </details>
          </li>
        ))}
      </ol>

      {previsioni.classifica.length > NUMERO_RIGHE_INIZIALI && (
        <button
          type="button"
          className="bottone bottone-classifica"
          onClick={() => setMostraTutti((valore) => !valore)}
        >
          {mostraTutti ? 'Mostra i primi 10' : 'Mostra tutti i piloti'}
        </button>
      )}

      <p className="fonte-previsioni">
        Risultati quantitativi aggiornati al {formattaData(previsioni.aggiornatoIl)}.
        Valutazioni tecniche ed editoriali: Race Analysis Hub.
      </p>
    </section>
  )
}

export default ClassificaPrevisionale
