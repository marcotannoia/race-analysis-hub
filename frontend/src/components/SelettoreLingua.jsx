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
