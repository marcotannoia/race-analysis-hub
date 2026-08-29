import { useLingua } from '../i18n/contestoLingua.js'

function formattaNumero(valore, lingua, cifre = 0) {
  return new Intl.NumberFormat(lingua, {
    minimumFractionDigits: cifre,
    maximumFractionDigits: cifre,
  }).format(valore)
}

function Dato({ etichetta, valore, unita = '' }) {
  if (valore === null || valore === undefined || valore === '') return null

  return (
    <article className="dato-circuito">
      <strong>{valore}{unita}</strong>
      <span>{etichetta}</span>
    </article>
  )
}

function DatiTecniciCircuito({ profilo }) {
  const { lingua, t } = useLingua()
  if (!profilo) return null

  const { dati } = profilo
  const valoreTecnico = (valore) => t.valoriTecnici?.[valore] || valore
  const dimensione = (chiave) => t.dimensioniTecniche?.[chiave] || chiave
  const requisiti = [...profilo.richieste]
    .sort((primo, secondo) => secondo.valore - primo.valore)
    .slice(0, 5)

  return (
    <div className="tecnica-circuito-home">
      <header className="intestazione-tecnica-circuito">
        <div>
          <span className="sovratitolo">{t.datiCircuito}</span>
          <h3>{t.tecnicaCircuito}</h3>
        </div>
      </header>

      <div className="griglia-dati-circuito">
        <Dato etichetta={t.lunghezza} valore={formattaNumero(dati.lunghezzaKm, lingua, 3)} unita=" km" />
        <Dato etichetta={t.giri} valore={dati.giri} />
        <Dato etichetta={t.curve} valore={dati.curve} />
        <Dato etichetta={t.distanza} valore={formattaNumero(dati.distanzaKm, lingua, 3)} unita=" km" />
        <Dato etichetta={t.rettilineoPrincipale} valore={dati.rettilineoPrincipaleKm ? formattaNumero(dati.rettilineoPrincipaleKm, lingua, 3) : null} unita=" km" />
        <Dato etichetta={t.pienoGas} valore={dati.percentualePienoGas} unita="%" />
        <Dato etichetta={t.quota} valore={dati.quotaMetri ? formattaNumero(dati.quotaMetri, lingua) : null} unita=" m" />
        <Dato etichetta={t.velocitaMassimaStimata} valore={dati.velocitaMassimaStimataKmh} unita=" km/h" />
        <Dato etichetta={t.direzione} valore={valoreTecnico(dati.direzione)} />
        <Dato etichetta={t.tipologia} valore={valoreTecnico(dati.tipologia)} />
        <Dato etichetta={t.caricoAerodinamico} valore={valoreTecnico(dati.livelloCarico)} />
        <Dato etichetta={t.stressFreni} valore={valoreTecnico(dati.stressFreni)} />
        <Dato etichetta={t.stressGomme} valore={valoreTecnico(dati.stressGomme)} />
        <Dato etichetta={t.puntiSorpasso} valore={profilo.puntiSorpassoPrincipali} />
        {profilo.documentoCircuito && (
          <>
            <Dato etichetta={t.zoneStraightMode} valore={profilo.documentoCircuito.zoneStraightMode} />
            <Dato etichetta={t.rilevamentiOvertakeMode} valore={profilo.documentoCircuito.rilevamentiOvertakeMode} />
          </>
        )}
      </div>

      <div className="tratti-circuito" aria-label={t.tecnicaCircuito}>
        {profilo.caratteristiche.map((caratteristica) => (
          <article key={caratteristica}>
            <strong>{caratteristica}</strong>
            <span>{t.caratteristicaCircuito}</span>
          </article>
        ))}
      </div>

      <div className="lettura-tecnica-circuito">
        <section>
          <h4>{t.requisitiPrincipali}</h4>
          <div className="barre-tecniche">
            {requisiti.map((requisito) => (
              <div key={requisito.dimensione} className="barra-tecnica">
                <span>{dimensione(requisito.dimensione)}</span>
                <div><i style={{ width: `${requisito.valore}%` }} /></div>
                <strong>{requisito.valore}</strong>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4>{t.aderenzaTecnica}</h4>
          <ol className="classifica-aderenza-tecnica">
            {profilo.compatibilita.map((voce, indice) => (
              <li key={voce.scuderia.slug} style={{ '--colore-scuderia': voce.scuderia.colore }}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{voce.scuderia.nome}</strong>
                  <small>{voce.corrispondenze.map(dimensione).join(' · ')}</small>
                </div>
                <b aria-label={`${t.indiceTecnico} ${voce.indice}`}>{voce.indice}%</b>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="fonti-tecniche">
        {profilo.fonti.map((fonte, indice) => (
          <a key={fonte} href={fonte} target="_blank" rel="noreferrer">Fonte {indice + 1}</a>
        ))}
        {profilo.documentoCircuito && (
          <a href={profilo.documentoCircuito.documentoUrl} target="_blank" rel="noreferrer">FIA · Circuit map</a>
        )}
      </footer>
    </div>
  )
}

export default DatiTecniciCircuito
