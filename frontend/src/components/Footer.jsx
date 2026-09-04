import { useLingua } from '../i18n/contestoLingua.js'

function Footer() {
  const { lingua, t } = useLingua()
  return (
    <footer className="footer">
      <div className="contenitore footer-contenuto">
        <div className="footer-identita">
          <span>Race <i>Analysis</i> <strong>Hub</strong></span>
          <div className="footer-contatti" aria-label="Contatti Marco Tannoia">
            <a href="/assistenza.html" aria-label="Assistenza FantaStats GP" title="Assistenza FantaStats GP">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 14v-2a8 8 0 0 1 16 0v2M4 12H2v7h4v-7H4Zm16 0h2v7h-4v-7h2ZM20 19v2h-8" />
              </svg>
            </a>
            <a
              href="mailto:marco.tannoia@gmail.com"
              aria-label="Invia una email a Marco Tannoia"
              title="marco.tannoia@gmail.com"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 6.5h18v11H3z" />
                <path d="m3.5 7 8.5 7 8.5-7" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/marco-tannoia-6b87361ba?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
              aria-label="Profilo LinkedIn di Marco Tannoia"
              rel="noreferrer"
              target="_blank"
              title="LinkedIn - Marco Tannoia"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6.5 9.5v8" />
                <path d="M6.5 6.5v.01" />
                <path d="M10.5 17.5v-8" />
                <path d="M10.5 13c0-2 1.25-3.5 3.5-3.5 2 0 3.5 1.25 3.5 4v4" />
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-note">
          <p>{t.progettoIndipendente}</p>
          <p lang={lingua}>{t.avvertenzaMarchi}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
