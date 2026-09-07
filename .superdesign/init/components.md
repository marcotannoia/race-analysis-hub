# Shared UI components

## `frontend/src/components/Collegamento.jsx`

```jsx
import { vaiA } from '../navigation.js'

function Collegamento({ a, children, ...proprieta }) {
  function naviga(evento) {
    const nuovaScheda =
      evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey

    if (evento.button === 0 && !nuovaScheda) {
      evento.preventDefault()
      vaiA(a)
    }
  }

  return (
    <a href={a} onClick={naviga} {...proprieta}>
      {children}
    </a>
  )
}

export default Collegamento

```
## `frontend/src/components/Marchio.jsx`

```jsx
function Marchio({ compatto = false }) {
  return (
    <div
      className={compatto ? 'marchio marchio-compatto' : 'marchio'}
      aria-label="Race Analysis Hub feat GPK"
    >
      <span className="marchio-nome">
        <span>Race</span>
        <span>Analysis</span>
        <strong>Hub</strong>
      </span>
      <span className="marchio-collaborazione">
        <small>feat</small>
        <strong>GPK</strong>
      </span>
    </div>
  )
}

export default Marchio

```
## `frontend/src/components/SelettoreLingua.jsx`

```jsx
import { useLingua } from '../i18n/contestoLingua.js'

function SelettoreLingua() {
  const { lingua, lingue, cambiaLingua, t } = useLingua()
  const opzioneAttiva = lingue.find((opzione) => opzione.codice === lingua)
  const localeAttivo = lingua === 'pt' ? 'pt-PT' : lingua

  return (
    <label className="selettore-lingua">
      <span className="selettore-lingua-etichetta">{t.lingua}</span>
      <span className="selettore-lingua-controllo">
        <svg
          className="selettore-lingua-icona"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c2.3 2.2 3.6 5.2 3.6 8.5S14.3 18.3 12 20.5M12 3.5C9.7 5.7 8.4 8.7 8.4 12s1.3 6.3 3.6 8.5" />
        </svg>

        <span className="selettore-lingua-valore" aria-hidden="true">
          <strong lang={localeAttivo}>{opzioneAttiva?.nome}</strong>
          <small>{lingua.toUpperCase()}</small>
        </span>

        <svg
          className="selettore-lingua-freccia"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>

        <select
          value={lingua}
          onChange={(evento) => cambiaLingua(evento.target.value)}
          aria-label={t.selezionaLingua}
          title={t.selezionaLingua}
        >
          {lingue.map((opzione) => (
            <option
              key={opzione.codice}
              value={opzione.codice}
              lang={opzione.codice === 'pt' ? 'pt-PT' : opzione.codice}
            >
              {opzione.nome}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

export default SelettoreLingua

```
## `frontend/src/components/StatoPagina.jsx`

```jsx
import Collegamento from './Collegamento.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

export function Caricamento() {
  const { t } = useLingua()
  return (
    <div className="stato-pagina" role="status">
      <span className="indicatore-caricamento" aria-hidden="true" />
      <p>{t.caricamento}</p>
    </div>
  )
}

export function ErrorePagina({ messaggio }) {
  const { t } = useLingua()
  return (
    <div className="stato-pagina stato-errore" role="alert">
      <span className="etichetta">{t.connessioneAssente}</span>
      <h1>{t.datiIlleggibili}</h1>
      <p>{messaggio}</p>
      {import.meta.env.DEV && (
        <p className="testo-secondario">
          {t.verificaBackend}
        </p>
      )}
      <Collegamento a="/" className="bottone bottone-rosso">
        {t.tornaHome}
      </Collegamento>
    </div>
  )
}

```
## `frontend/src/components/IndicatoriProfilo.jsx`

```jsx
import { useLingua } from '../i18n/contestoLingua.js'

function formattaPercentuale(valore, lingua) {
  return `${new Intl.NumberFormat(lingua, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(valore || 0)}%`
}

function IndicatoriProfilo({ indicatori, compatto = false }) {
  const { lingua, t } = useLingua()
  if (!indicatori) return null

  const haGareConPioggia = indicatori.gareConPioggiaDisputate > 0

  const valori = [
    {
      etichetta: t.bravuraBagnato,
      valore: haGareConPioggia
        ? indicatori.bravuraBagnatoPercentuale
        : null,
      dettaglio: haGareConPioggia
        ? t.garePositivePioggia(
            indicatori.gareConPioggiaPositive,
            indicatori.gareConPioggiaDisputate,
          )
        : t.nessunaGaraPioggia,
    },
    {
      etichetta: t.erroriPilota,
      valore: indicatori.erroriPilotaPercentuale,
    },
    {
      etichetta: t.erroriFatali,
      valore: indicatori.erroriFataliPercentuale,
    },
  ]

  return (
    <section
      className={`indicatori-profilo${compatto ? ' indicatori-profilo-compatti' : ''}`}
      aria-label={t.indicatoriCarriera}
    >
      {!compatto && (
        <div className="intestazione-indicatori">
          <span className="sovratitolo">{t.letturaPercentuale}</span>
          <h2>{t.indicatoriCarriera}</h2>
        </div>
      )}
      <div className="griglia-indicatori">
        {valori.map((indicatore) => (
          <article key={indicatore.etichetta} className="indicatore-profilo">
            <strong>
              {indicatore.valore === null
                ? '—'
                : formattaPercentuale(indicatore.valore, lingua)}
            </strong>
            <span>{indicatore.etichetta}</span>
            {indicatore.dettaglio && <small>{indicatore.dettaglio}</small>}
          </article>
        ))}
      </div>
    </section>
  )
}

export default IndicatoriProfilo

```
