import { useState } from 'react'
import Collegamento from './Collegamento.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

const NUMERO_RIGHE_INIZIALI = 10

function ClassificaPrevisionale({ previsioni }) {
  const { t } = useLingua()
  const [mostraTutti, setMostraTutti] = useState(false)

  if (!previsioni?.classifica?.length) {
    return (
      <section className="sezione-previsioni" aria-labelledby="titolo-previsioni">
        <div className="intestazione-previsioni">
          <span className="sovratitolo">{t.previsioneGp}</span>
          <h2 id="titolo-previsioni">{t.classificaPrevisionale}</h2>
          <p>{t.previsioneAggiornamento}</p>
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
        <span className="sovratitolo">{t.previsioneGp}</span>
        <h2 id="titolo-previsioni">{t.classificaPrevisionale}</h2>
        <div className="contesto-previsioni">
          <p>
            {t.favoritiPer(previsioni.gara.nome, previsioni.gara.circuito)}
          </p>
        </div>
      </div>

      <details className="metodologia-previsioni">
        <summary>{t.calcoloIndice}</summary>
        <p>{t.metodologia}</p>
        <div className="pesi-previsioni">
          {previsioni.pesi.map((fattore) => (
            <span key={fattore.chiave}>
              {fattore.nome} <strong>{fattore.pesoPercentuale}%</strong>
            </span>
          ))}
        </div>
      </details>

      <ol className="elenco-previsioni" aria-label={t.ariaClassifica}>
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
                  {t.indice} <strong>{elemento.indice}</strong>/100
                </span>
                <span className="barra-indice" aria-hidden="true">
                  <i style={{ width: `${elemento.indice}%` }} />
                </span>
              </div>

              <span className={`confidenza-previsione ${elemento.confidenzaCodice || ''}`}>
                {t.confidenza} {elemento.confidenza}
              </span>
            </div>

            <details className="dettagli-previsione">
              <summary>{t.mostraFattori}</summary>
              <p className="sintesi-previsione">{elemento.sintesi}</p>

              <div className="fattori-previsione">
                {elemento.fattori.map((fattore) => (
                  <div key={fattore.chiave}>
                    <span>{fattore.nome}</span>
                    <strong>{fattore.valutazione}/100</strong>
                    <small>
                      {t.peso} {fattore.pesoPercentuale}% · {t.contributo}{' '}
                      {fattore.contributo}
                    </small>
                  </div>
                ))}
              </div>

              <div className="nota-aggiornamenti-previsione">
                <span>{t.aggiornamentiTecnici}</span>
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
          {mostraTutti ? t.mostraPrimi : t.mostraTutti}
        </button>
      )}

      <p className="fonte-previsioni">
        {t.fontePrevisioni}
      </p>
    </section>
  )
}

export default ClassificaPrevisionale
