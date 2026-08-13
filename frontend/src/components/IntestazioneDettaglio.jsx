import Collegamento from './Collegamento.jsx'
import Marchio from './Marchio.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function IntestazioneDettaglio({ etichetta, titolo, sottotitolo, sigla, statistiche }) {
  const { t } = useLingua()
  return (
    <header className="hero-dettaglio">
      <div className="contenitore">
        <div className="testata-dettaglio">
          <Collegamento a="/" className="link-indietro">
            <span aria-hidden="true">←</span>
            <span>{t.tornaRicerca}</span>
          </Collegamento>

          <Marchio compatto />

          <div className="numero-profilo" aria-label={`${t.sigla} ${sigla}`}>
            <small>{t.profilo}</small>
            <strong>{sigla}</strong>
          </div>
        </div>

        <div className="identita-dettaglio">
          <span className="sovratitolo">{etichetta}</span>
          <h1>{titolo}</h1>
          <p>{sottotitolo}</p>
        </div>

        <div className="statistiche" aria-label={t.statisticheAttuali}>
          {statistiche.map((statistica) => (
            <div key={statistica.etichetta} className="statistica">
              <span>{statistica.etichetta}</span>
              <strong>{statistica.valore}</strong>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

export default IntestazioneDettaglio
