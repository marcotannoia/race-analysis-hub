import { useLingua } from '../i18n/contestoLingua.js'

function Footer() {
  const { lingua, t } = useLingua()
  return (
    <footer className="footer">
      <div className="contenitore footer-contenuto">
        <span>Race <i>Analysis</i> <strong>Hub</strong></span>
        <div className="footer-note">
          <p>{t.progettoIndipendente}</p>
          <p lang={lingua}>{t.avvertenzaMarchi}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
