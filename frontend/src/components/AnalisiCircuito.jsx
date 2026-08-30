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

function creaNoteAnnuali(analisi, anni, t) {
  const notePerAnno = leggiTestiAnnuali(analisi.notaBene)
  const storicoEdizioni = analisi.storicoEdizioni || []

  storicoEdizioni.forEach((edizione) => {
    if (edizione.notaRisultato) {
      notePerAnno.set(edizione.stagione, pulisciProsa(edizione.notaRisultato))
    }
  })

  const nessunEvento = pulisciProsa(t.nessunEvento).toLocaleLowerCase()
  const notaValida = (testo) => {
    const contenuto = pulisciProsa(testo)
    const nessunaAnomalia = /^(?:nessuna anomalia|no marked anomalies|aucune anomalie|sem anomalias|no hay anomalías|keine (?:markanten|auffälligen) anomalien)/i
    return contenuto
      && contenuto.toLocaleLowerCase() !== nessunEvento
      && !nessunaAnomalia.test(contenuto)
  }
  const note = anni
    .filter((anno) => notaValida(notePerAnno.get(anno)))
    .map((anno) => ({
      etichetta: String(anno),
      testo: notePerAnno.get(anno),
    }))

  if (notaValida(notePerAnno.get('generale'))) {
    note.push({ etichetta: t.generale, testo: notePerAnno.get('generale') })
  }

  return note
}

function creaAndamentoAnnuale(storicoGara, storicoQualifica, noteAnnuali, t) {
  return noteAnnuali.map((nota) => {
    if (nota.etichetta === t.generale) return nota

    const anno = Number(nota.etichetta)
    const gara = storicoGara.find((riga) => riga.anno === anno)
    const qualifica = storicoQualifica.find((riga) => riga.anno === anno)
    const posizioneQualifica = qualifica?.posizione || '—'
    const posizioneGara = gara?.posizione || '—'
    const andamento = t.andamentoRisultato(posizioneQualifica, posizioneGara)

    return {
      etichetta: String(anno),
      testo: `${andamento} ${nota.testo}`.trim(),
    }
  })
}

function creaAndamentoVisualizzato(analisi, storicoGara, storicoQualifica, noteAnnuali, t) {
  const haPartecipato = storicoGara.some((gara) => {
    const qualifica = storicoQualifica.find((riga) => riga.anno === gara.anno)
    return gara.posizione !== t.nonCorso || qualifica?.posizione !== t.nonCorso
  })

  if (!haPartecipato) return []

  const andamentoPersonalizzato = leggiTestiAnnuali(analisi.andamentoPerAnno)

  if (andamentoPersonalizzato.size) {
    return [...andamentoPersonalizzato]
      .filter(([anno]) => {
        if (anno === 'generale') return true
        const gara = storicoGara.find((riga) => riga.anno === anno)?.posizione
        const qualifica = storicoQualifica.find((riga) => riga.anno === anno)?.posizione
        return gara !== t.nonCorso || qualifica !== t.nonCorso
      })
      .map(([anno, testo]) => ({
        etichetta: anno === 'generale' ? t.generale : String(anno),
        testo,
      }))
  }

  return creaAndamentoAnnuale(storicoGara, storicoQualifica, noteAnnuali, t)
}

function creaRighePrestazioneAnnuali(testo, t, edizioni = [], campoEdizione) {
  const testiPerAnno = leggiTestiAnnuali(testo)

  edizioni.forEach((edizione) => {
    if (edizione[campoEdizione]) {
      testiPerAnno.set(
        edizione.stagione,
        pulisciProsa(edizione[campoEdizione]),
      )
    }
  })

  return [...testiPerAnno]
    .sort(([primoAnno], [secondoAnno]) => {
      if (primoAnno === 'generale') return 1
      if (secondoAnno === 'generale') return -1
      return primoAnno - secondoAnno
    })
    .map(([anno, contenuto]) => ({
      etichetta: anno === 'generale' ? t.generale : String(anno),
      testo: contenuto,
    }))
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

function RigheEtichettate({ righe, classe = '' }) {
  return (
    <div className={`righe-etichettate ${classe}`.trim()}>
      {righe.map((riga, indice) => (
        <div
          className="riga-etichettata"
          key={`${riga.etichetta}-${indice}`}
        >
          <span>{riga.etichetta}</span>
          <p>{riga.testo}</p>
        </div>
      ))}
    </div>
  )
}

function ProsaPrestazione({ righe, t }) {
  const testo = righe
    .map((riga) => (
      riga.etichetta === t.generale
        ? riga.testo
        : `${riga.etichetta}: ${riga.testo}`
    ))
    .join(' ')

  return <p className="prosa-performance">{testo}</p>
}

function creaPenalitaWidget(testo) {
  const contenuto = pulisciProsa(testo)
  const posizioni = contenuto.match(/\b(\d{1,2})\s+(?:posizion|place|places|lugares|startpl[aä]tz)/i)
  const primaFrase = contenuto.split(/(?<=[.!?])\s+/)[0]
  const causa = primaFrase
    .replace(/^[^:]+:\s*/, '')
    .replace(/^.*?\b(?:per la|because of a|en raison du|devido à|por la|wegen des)\s+/i, '')
    .replace(/^./, (carattere) => carattere.toUpperCase())

  return {
    posizioni: posizioni?.[1] || '—',
    spiegazione: causa,
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
  const anni = [...new Set([...storicoGara, ...storicoQualifica].map((riga) => riga.anno))]
  const noteAnnuali = creaNoteAnnuali(analisi, anni, t)
  const andamentoAnnuale = creaAndamentoVisualizzato(
    analisi,
    storicoGara,
    storicoQualifica,
    noteAnnuali,
    t,
  )
  const penalitaWidget = analisi.penalita
    ? creaPenalitaWidget(analisi.penalita)
    : null
  const righeGestioneGomme = creaRighePrestazioneAnnuali(
    analisi.gestioneGomme,
    t,
    analisi.storicoEdizioni,
    'gestioneGomme',
  )
  const righePassoGara = creaRighePrestazioneAnnuali(
    analisi.passoGara,
    t,
    analisi.storicoEdizioni,
    'passoGara',
  )
  const mostraPrestazioni = righeGestioneGomme.length > 0 || righePassoGara.length > 0
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

        {andamentoAnnuale.length > 0 && (
          <div className="ramo-analisi">
            <h3 className="titolo-ramo"><span>↳</span>{t.analisi}</h3>
            <RigheEtichettate righe={andamentoAnnuale} classe="righe-anni" />
          </div>
        )}
      </section>

      {mostraPrestazioni && (
        <section className="sezione-analisi performance-circuito">
        <div className="intestazione-sezione">
          <span>02</span>
          <div>
            <p>{t.letturaStorica}</p>
            <h2>{t.prestazioni}</h2>
          </div>
        </div>

        <div className="albero-performance">
          {righeGestioneGomme.length > 0 && (
            <article className="ramo-performance">
              <h3 className="titolo-ramo"><span>↳</span>{t.gestioneGomme}</h3>
              <ProsaPrestazione righe={righeGestioneGomme} t={t} />
            </article>
          )}

          {righePassoGara.length > 0 && (
            <article className="ramo-performance">
              <h3 className="titolo-ramo"><span>↳</span>{t.passoGara}</h3>
              <ProsaPrestazione righe={righePassoGara} t={t} />
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
            <h2>{t.aggiornamentiArrivo}</h2>
          </div>
        </div>
        <AggiornamentiWidget testo={analisi.aggiornamentiInArrivo} t={t} />
      </section>

      {analisi.penalita && (
        <section className="sezione-analisi penalita-future">
          <div className="intestazione-sezione">
            <span>{numeroPenalita}</span>
            <div>
              <p>{t.soloSeConfermate}</p>
              <h2>{t.penalitaArrivo}</h2>
            </div>
          </div>
          <div className="penalita-widget">
            <div className="penalita-posizioni">
              <strong>{penalitaWidget.posizioni}</strong>
              <span>POS.</span>
            </div>
            <p>{penalitaWidget.spiegazione}</p>
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
