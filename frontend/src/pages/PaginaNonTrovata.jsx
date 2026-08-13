import Collegamento from '../components/Collegamento.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function PaginaNonTrovata() {
  const { t } = useLingua()
  return (
    <section className="stato-pagina">
      <span className="etichetta">{t.errore404}</span>
      <h1>{t.paginaNonTrovata}</h1>
      <p>{t.indirizzoNonValido}</p>
      <Collegamento a="/" className="bottone bottone-rosso">
        {t.tornaRicerca}
      </Collegamento>
    </section>
  )
}

export default PaginaNonTrovata
