import GraficoAndamento from './GraficoAndamento.jsx'
import { useLingua } from '../i18n/contestoLingua.js'

function pulisciProsa(testo) {
  return String(testo || '')
    .replace(/\s*[•·]\s*/g, ', ')
    .replace(/\s*\r?\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function normalizzaQualifica(testo) {
  return String(testo || '').replace(/\bQ(?=\d)/gi, 'P')
}

function estraiPosizione(contenuto, tipo, t) {
  const statoNonCorso = /NON CORSO|DID NOT RACE|N['’]A PAS COURU|NÃO CORREU|NO COMPITIÓ|NICHT (?:IN DER F1 )?ANGETRETEN/i
  if (statoNonCorso.test(contenuto)) return t.nonCorso

  const prefisso = tipo === 'gara' ? 'P' : 'Q'
  const espressione = new RegExp(
    `(?:\\b[A-Z]{3}\\s+)?${prefisso}\\d+\\b|\\b(?:DNF|DNS|DSQ|NC)\\b`,
    'g',
  )
  const posizioni = contenuto.toUpperCase().match(espressione)
  const risultato = posizioni?.join(' / ') || '—'

  return tipo === 'qualifica' ? normalizzaQualifica(risultato) : risultato
}

function leggiStorico(testo, tipo, t, edizioni = []) {
  const righe = [...leggiTestiAnnuali(testo)]
    .filter(([anno]) => Number.isInteger(anno))
    .map(([anno, contenuto]) => ({
      anno,
      posizione: estraiPosizione(contenuto, tipo, t),
    }))

  edizioni.forEach((edizione) => {
    const campo = tipo === 'gara' ? 'posizioneGara' : 'posizioneQualifica'
    let posizione = edizione[campo]

    if (!posizione) return
    if (tipo === 'qualifica') posizione = normalizzaQualifica(posizione)

    const indice = righe.findIndex((riga) => riga.anno === edizione.stagione)
    const nuovaRiga = { anno: edizione.stagione, posizione }

    if (indice >= 0) righe[indice] = nuovaRiga
    else righe.push(nuovaRiga)
  })

  return righe.sort((prima, seconda) => prima.anno - seconda.anno)
}

function leggiTestiAnnuali(testo) {
  const testi = new Map()

  if (testo && typeof testo === 'object' && !Array.isArray(testo)) {
    Object.entries(testo).forEach(([anno, contenuto]) => {
      if (/^\d{4}$/.test(anno)) {
        testi.set(Number(anno), pulisciProsa(contenuto))
      } else if (anno === 'generale') {
        testi.set('generale', pulisciProsa(contenuto))
      }
    })

    return testi
  }

  const espressione = /(?:^|\s)(\d{4})\s*:\s*([\s\S]*?)(?=\s+\d{4}\s*:|$)/g

  for (const corrispondenza of String(testo || '').matchAll(espressione)) {
    testi.set(Number(corrispondenza[1]), pulisciProsa(corrispondenza[2]))
  }

  if (!testi.size && String(testo || '').trim()) {
    testi.set('generale', pulisciProsa(testo))
  }

  return testi
}

function RisultatiStorici({ titolo, righe, t }) {
  return (
    <article className="colonna-risultati">
      <h3>{titolo}</h3>
      <div>
        {righe.map((riga) => (
          <p key={`${titolo}-${riga.anno}`}>
            <span>{riga.anno}</span>
            <strong
              className="risultato-posizione"
              title={riga.posizione === t.nonCorso ? t.dnpDescrizione : undefined}
            >
              {riga.posizione}
            </strong>
          </p>
        ))}
      </div>
    </article>
  )
}

function ValutazioneFinale({ valutazione, t }) {
  if (!valutazione) return null

  const compatibilita = valutazione.compatibilita
  const previsioni = valutazione.previsioni || []

  if (!compatibilita && !previsioni.length) return null

  return (
    <div className="griglia-valutazione-finale">
      {compatibilita && (
        <article className="widget-valutazione compatibilita-finale">
          <span>{t.compatibilitaCircuito}</span>
          <div>
            <strong>{compatibilita.scuderia.nome}</strong>
            <b>{compatibilita.indice}%</b>
          </div>
          <i aria-hidden="true">
            <span style={{ width: `${compatibilita.indice}%` }} />
          </i>
        </article>
      )}

      {previsioni.length > 0 && (
        <article className="widget-valutazione classifica-finale">
          <span>{t.classificaPrevisionale}</span>
          <ol>
            {previsioni.map((voce) => (
              <li key={voce.pilota.slug}>
                <b>P{voce.posizione}</b>
                <strong>{voce.pilota.nome}</strong>
                <small>{voce.indice}/100</small>
              </li>
            ))}
          </ol>
        </article>
      )}
    </div>
  )
}

function AggiornamentiWidget({ testo, t }) {
  const contenuto = pulisciProsa(testo)

  if (!contenuto) {
    return (
      <div className="griglia-aggiornamenti">
        <article className="widget-aggiornamento">
          <span>{t.tipoAggiornamento}</span>
          <strong>{t.nessunAggiornamentoConfermato}</strong>
        </article>
        <article className="widget-aggiornamento">
          <span>{t.beneficiAggiornamento}</span>
          <ul>
            <li>{t.nessunBeneficioConfermato}</li>
          </ul>
        </article>
      </div>
    )
  }

  const frasi = contenuto.split(/(?<=[.!?])\s+/).filter(Boolean)
  const benefici = frasi.slice(1)
  const nonUfficiale = /(?:non (?:è|e) ancora|not yet|pas encore|ainda não|todavía no|noch nicht).*ufficial|(?:non ufficial|unofficial|non officiel|não oficial|no oficial|inoffiziell)/i
    .test(contenuto)

  return (
    <div className="griglia-aggiornamenti">
      <article className="widget-aggiornamento">
        <span>{t.tipoAggiornamento}</span>
        {nonUfficiale && (
          <strong className="stato-aggiornamento">
            {t.aggiornamentoNonUfficiale}
          </strong>
        )}
        <p>{frasi[0]}</p>
      </article>
      <article className="widget-aggiornamento">
        <span>{t.beneficiAggiornamento}</span>
        <p>
          {(benefici.length ? benefici : [t.beneficioDaVerificare]).join(' ')}
        </p>
      </article>
    </div>
  )
}

function PunteggiSintesi({ analisi, t }) {
  const campi = [['rendimento', t.gara], ['qualifica', t.qualifica], ['formaRecente', t.forma2026]]
  return <dl className="punteggi-sintesi">{campi.map(([campo, nome]) => {
    const valore = analisi.valutazioni?.[campo]
    return <div key={campo}>
      <dt>{nome}</dt>
      <dd>{Number.isFinite(valore) ? <><strong>{valore}</strong><span> / 100</span></> : <span>{t.datoNonDisponibile}</span>}</dd>
    </div>
  })}</dl>
}

function PunteggiPrestazione({ analisi, metrica, t }) {
  const righe = Object.entries(analisi.valutazioniPerAnno || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([anno, valori]) => ({ anno, valore: valori[metrica] }))
  righe.push({ anno: analisi.gara.stagione, valore: analisi.valutazioni?.[metrica] })
  return <dl className="punteggi-prestazione">{righe.map(({ anno, valore }) => {
    const disponibile = Number.isFinite(valore) && valore >= 0 && valore <= 100
    return <div key={anno} className="punteggio-prestazione">
      <dt>{anno}</dt>
      <dd><strong>{disponibile ? valore : '—'}</strong>{disponibile ? <span> / 100</span> : <span> {t.datoNonDisponibile}</span>}</dd>
      {disponibile && <meter min="0" max="100" value={valore} aria-label={`${anno}: ${valore}/100`} />}
    </div>
  })}</dl>
}

function creaPenalitaWidget(testo) {
  const contenuto = pulisciProsa(testo)
  const posizioni = contenuto.match(/\b(\d{1,2})\s+(?:posizion|place|places|lugares|startpl[aä]tz)/i)
  return {
    posizioni: posizioni?.[1] || null,
    spiegazione: contenuto,
  }
}

function AnalisiCircuito({
  analisi,
  andamentoStagioneCorrente,
  valutazioneFinale = null,
}) {
  const { t } = useLingua()
  if (!analisi) {
    return (
      <section className="analisi-non-disponibile">
        <span className="sovratitolo">{t.circuitoAttuale}</span>
        <h2>{t.analisiPreparazione}</h2>
        <p>{t.datiGpQui}</p>
      </section>
    )
  }

  const storicoGara = leggiStorico(
    analisi.risultatiGara,
    'gara',
    t,
    analisi.storicoEdizioni,
  )
  const storicoQualifica = leggiStorico(
    analisi.risultatiQualifica,
    'qualifica',
    t,
    analisi.storicoEdizioni,
  )
  const penalitaWidget = analisi.penalita
    ? creaPenalitaWidget(analisi.penalita)
    : null
  const mostraValutazioneFinale = Boolean(
    valutazioneFinale?.compatibilita || valutazioneFinale?.previsioni?.length,
  )
  const numeroAggiornamenti = mostraValutazioneFinale ? '04' : '03'
  const numeroPenalita = mostraValutazioneFinale ? '05' : '04'
  const numeroAndamento = mostraValutazioneFinale
    ? (analisi.penalita ? '06' : '05')
    : (analisi.penalita ? '05' : '04')

  return (
    <>
      <section className="introduzione-circuito">
        <span className="sovratitolo">{t.circuitoAttuale}</span>
        <h2>{analisi.gara.nome}</h2>
        <p>
          {analisi.gara.circuito} · {analisi.gara.paese}
        </p>
      </section>

      <section className="sezione-analisi storico-circuito">
        <div className="intestazione-sezione">
          <span>01</span>
          <div>
            <p>{t.storicoEssenziale}</p>
            <h2>{t.risultatiCircuito}</h2>
          </div>
        </div>

        <div className="griglia-risultati-storici">
          <RisultatiStorici titolo={t.gara} righe={storicoGara} t={t} />
          <RisultatiStorici titolo={t.qualifica} righe={storicoQualifica} t={t} />
        </div>

        <div className="ramo-analisi">
          <h3 className="titolo-ramo"><span>↳</span>{t.analisi}</h3>
          <PunteggiSintesi analisi={analisi} t={t} />
        </div>
      </section>

      {(
        <section className="sezione-analisi performance-circuito">
        <div className="intestazione-sezione">
          <span>02</span>
          <div>
            <p>{t.letturaStorica}</p>
            <h2>{t.prestazioni}</h2>
          </div>
        </div>

        <div className="albero-performance">
          {(
            <article className="ramo-performance">
              <h3 className="titolo-ramo"><span>↳</span>{t.gestioneGomme}</h3>
              <PunteggiPrestazione analisi={analisi} metrica="gestioneGomme" t={t} />
            </article>
          )}

          {(
            <article className="ramo-performance">
              <h3 className="titolo-ramo"><span>↳</span>{t.passoGara}</h3>
              <PunteggiPrestazione analisi={analisi} metrica="passoGara" t={t} />
            </article>
          )}
        </div>
      </section>
      )}

      {mostraValutazioneFinale && (
        <section className="sezione-analisi considerazioni-finali">
        <div className="intestazione-sezione">
          <span>03</span>
          <div>
            <p>{t.sintesi}</p>
            <h2>{t.considerazioniFinali}</h2>
          </div>
        </div>
        <ValutazioneFinale valutazione={valutazioneFinale} t={t} />
      </section>
      )}

      <section className="sezione-analisi aggiornamenti-futuri">
        <div className="intestazione-sezione">
          <span>{numeroAggiornamenti}</span>
          <div>
            <p>{t.quadroTecnico}</p>
            <h2>{t.aggiornamentiTecnici}</h2>
          </div>
        </div>
        <AggiornamentiWidget testo={analisi.aggiornamentiInArrivo} t={t} />
      </section>

      {analisi.penalita && (
        <section className="sezione-analisi penalita-future">
          <div className="intestazione-sezione">
            <span>{numeroPenalita}</span>
            <div>
              <h2>{t.penalita}</h2>
            </div>
          </div>
          <div className="penalita-widget">
            {penalitaWidget.posizioni && <div className="penalita-posizioni">
              <strong>{penalitaWidget.posizioni}</strong>
              <span>{t.posizioneAbbreviata}</span>
            </div>}
            <p style={penalitaWidget.posizioni ? undefined : { gridColumn: '1 / -1' }}>
              {penalitaWidget.spiegazione}
            </p>
          </div>
        </section>
      )}

      {andamentoStagioneCorrente && (
        <section id="andamento" className="sezione-analisi sezione-grafici">
          <div className="intestazione-sezione">
            <span>{numeroAndamento}</span>
            <div>
              <p>{t.gpDopoGp}</p>
              <h2>{t.andamento} {andamentoStagioneCorrente.stagione}</h2>
            </div>
          </div>

          {andamentoStagioneCorrente.fonte && (
            <p className="fonte-andamento">
              {t.datiGaraQualifica}{' '}
              {andamentoStagioneCorrente.fonte.url ? (
                <a
                  href={andamentoStagioneCorrente.fonte.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {andamentoStagioneCorrente.fonte.nome}
                </a>
              ) : (
                andamentoStagioneCorrente.fonte.nome
              )}
              {andamentoStagioneCorrente.fonte.versione &&
                ` ${andamentoStagioneCorrente.fonte.versione}`}
              {andamentoStagioneCorrente.fonte.licenza && (
                <>
                  {' — '}
                  {andamentoStagioneCorrente.fonte.licenzaUrl ? (
                    <a
                      href={andamentoStagioneCorrente.fonte.licenzaUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {andamentoStagioneCorrente.fonte.licenza}
                    </a>
                  ) : (
                    andamentoStagioneCorrente.fonte.licenza
                  )}
                </>
              )}
            </p>
          )}

          {andamentoStagioneCorrente.etichette.length > 0 ? (
            <div className="griglia-grafici">
              <GraficoAndamento
                titolo={t.andamentoQualifica}
                descrizione={t.descrizioneQualifica}
                etichette={andamentoStagioneCorrente.etichette}
                serie={andamentoStagioneCorrente.qualifica}
              />
              <GraficoAndamento
                titolo={t.andamentoGara}
                descrizione={t.descrizioneGara}
                etichette={andamentoStagioneCorrente.etichette}
                serie={andamentoStagioneCorrente.gara}
              />
            </div>
          ) : (
            <p className="grafici-senza-risultati">
              {t.nessunRisultatoStagione(andamentoStagioneCorrente.stagione)}
            </p>
          )}
        </section>
      )}

      {analisi.fonti?.length > 0 && (
        <details className="fonti">
          <summary>{t.fontiConsultate}</summary>
          <ul>
            {analisi.fonti.map((fonte) => (
              <li key={fonte}>
                <a href={fonte} target="_blank" rel="noreferrer">
                  {fonte}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

export default AnalisiCircuito
