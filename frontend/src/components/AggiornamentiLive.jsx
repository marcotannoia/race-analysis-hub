import { useLingua } from '../i18n/contestoLingua.js'

function formattaData(valore, lingua) {
  if (!valore) return null
  return new Intl.DateTimeFormat(lingua, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(valore))
}

function AggiornamentiLive({ aggiornamenti }) {
  const { lingua, t } = useLingua()
  if (!aggiornamenti) return null

  return (
    <section className="sezione-live-fia" aria-labelledby="titolo-live-fia">
      <header className="intestazione-live-fia">
        <div>
          <span className="etichetta-live"><i aria-hidden="true" /> LIVE · FIA</span>
          <h2 id="titolo-live-fia">{t.liveFia}</h2>
          <p>{t.liveUfficiale}</p>
        </div>
        <div className="metadati-live-fia">
          {aggiornamenti.pubblicatoIl && <small>{t.pubblicatoIl} {formattaData(aggiornamenti.pubblicatoIl, lingua)}</small>}
          <small>{t.acquisitoIl} {formattaData(aggiornamenti.acquisitoIl, lingua)}</small>
          <a href={aggiornamenti.documentoUrl} target="_blank" rel="noreferrer">
            {t.documentoUfficiale} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <div className="griglia-live-fia">
        {aggiornamenti.scuderie.map((voce) => (
          <article key={voce.scuderia.slug} className="scheda-live-scuderia" style={{ '--colore-scuderia': voce.scuderia.colore }}>
            <header>
              <span>{voce.scuderia.abbreviazione}</span>
              <h3>{voce.scuderia.nome}</h3>
            </header>
            {voce.nessunAggiornamento ? (
              <p className="nessun-aggiornamento-fia">{t.nessunAggiornamentoUfficiale}</p>
            ) : (
              <>
                <span className="etichetta-componenti">{t.componentiAggiornate}</span>
                <ul>
                  {voce.componenti.map((componente) => <li key={componente}>{componente}</li>)}
                </ul>
                {voce.descrizione && (
                  <details>
                    <summary>{t.testoFiaOriginale}</summary>
                    {voce.descrizione.split('\n').map((testo) => <p key={testo}>{testo}</p>)}
                  </details>
                )}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default AggiornamentiLive
