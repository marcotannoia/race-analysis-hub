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
