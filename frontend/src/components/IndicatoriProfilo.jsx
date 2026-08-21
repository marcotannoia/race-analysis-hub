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

  const valori = [
    {
      etichetta: t.bravuraBagnato,
      valore: indicatori.bravuraBagnatoPercentuale,
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
            <strong>{formattaPercentuale(indicatore.valore, lingua)}</strong>
            <span>{indicatore.etichetta}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default IndicatoriProfilo
