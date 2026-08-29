import { useLingua } from '../i18n/contestoLingua.js'

function ElencoDimensioni({ titolo, voci, etichetta }) {
  return (
    <section className="sintesi-profilo-tecnico">
      <h3>{titolo}</h3>
      <ul>
        {voci.map((voce) => (
          <li key={voce.dimensione}>
            <span>{etichetta(voce.dimensione)}</span>
            <strong>{voce.valore}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ProfiloTecnicoScuderia({ profilo }) {
  const { t } = useLingua()
  if (!profilo) return null

  const etichetta = (dimensione) => t.dimensioniTecniche?.[dimensione] || dimensione

  return (
    <section className="profilo-tecnico-scuderia" aria-labelledby="titolo-profilo-tecnico">
      <header>
        <span className="sovratitolo">{t.identitaTecnica}</span>
        <h2 id="titolo-profilo-tecnico">{t.profiloTecnicoAuto}</h2>
        <p>{t.valori0a100}</p>
      </header>

      <div className="riassunto-profilo-tecnico">
        <ElencoDimensioni titolo={t.puntiForza} voci={profilo.puntiForza} etichetta={etichetta} />
        <ElencoDimensioni titolo={t.areeSensibili} voci={profilo.areeSensibili} etichetta={etichetta} />
      </div>

      <div className="griglia-capacita-tecniche">
        {profilo.capacita.map((voce) => (
          <div key={voce.dimensione} className="capacita-tecnica">
            <span>{etichetta(voce.dimensione)}</span>
            <div><i style={{ width: `${voce.valore}%` }} /></div>
            <strong>{voce.valore}</strong>
          </div>
        ))}
      </div>

      <footer className="fonti-tecniche">
        {profilo.fonti.map((fonte, indice) => (
          <a key={fonte} href={fonte} target="_blank" rel="noreferrer">{t.fontiConsultate} {indice + 1}</a>
        ))}
      </footer>
    </section>
  )
}

export default ProfiloTecnicoScuderia
