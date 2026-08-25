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

  const note = anni.map((anno) => ({
    etichetta: String(anno),
    testo: notePerAnno.get(anno) || t.nessunEvento,
  }))

  if (notePerAnno.has('generale')) {
    note.push({ etichetta: t.generale, testo: notePerAnno.get('generale') })
  }

  return note
}

function creaAndamentoAnnuale(storicoGara, storicoQualifica, noteAnnuali, t) {
  const notePerAnno = new Map(
    noteAnnuali.map((nota) => [Number(nota.etichetta), nota.testo]),
  )

  return storicoGara.map((gara) => {
    const qualifica = storicoQualifica.find((riga) => riga.anno === gara.anno)
    const posizioneQualifica = qualifica?.posizione || '—'
    const nonDisputata =
      gara.posizione === t.nonCorso && posizioneQualifica === t.nonCorso

    const andamento = nonDisputata
      ? t.nonDisputato
      : t.andamentoRisultato(posizioneQualifica, gara.posizione)

    return {
      etichetta: String(gara.anno),
      testo: `${andamento} ${notePerAnno.get(gara.anno) || ''}`.trim(),
    }
  })
}

function creaAndamentoVisualizzato(analisi, storicoGara, storicoQualifica, noteAnnuali, t) {
  const andamentoPersonalizzato = leggiTestiAnnuali(analisi.andamentoPerAnno)

  if (andamentoPersonalizzato.size) {
    return [...andamentoPersonalizzato].map(([anno, testo]) => ({
      etichetta: anno === 'generale' ? t.generale : String(anno),
      testo,
    }))
  }

  return creaAndamentoAnnuale(storicoGara, storicoQualifica, noteAnnuali, t)
}

function aggiungiRiga(righe, etichetta, testo) {
  const contenuto = pulisciProsa(testo)
  if (!contenuto) return

  const esistente = righe.find((riga) => riga.etichetta === etichetta)

  if (esistente) esistente.testo = `${esistente.testo} ${contenuto}`
  else righe.push({ etichetta, testo: contenuto })
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

function trovaAffidabilita(analisi, t) {
  if (analisi.affidabilita) return pulisciProsa(analisi.affidabilita)

  const ultimaAffidabilita = [...(analisi.storicoEdizioni || [])]
    .reverse()
    .find((edizione) => edizione.affidabilita)?.affidabilita

  if (ultimaAffidabilita) return pulisciProsa(ultimaAffidabilita)

  const testoPassoGara = [...leggiTestiAnnuali(analisi.passoGara).values()].join(
    ' ',
  )
  const testoNotaBene = [...leggiTestiAnnuali(analisi.notaBene).values()].join(
    ' ',
  )
  const ritiri = testoPassoGara.match(/(\d+)\s+ritiri?\/DNS/i)

  if (ritiri && Number(ritiri[1]) > 0) {
    return t.ritiriStagione(ritiri[1])
  }

  if (/\britir(?:o|i|ato|ata)\b|\bDNS\b/i.test(testoNotaBene)) {
    return t.ritiriStorici
  }

  return ''
}

function segmentaConsiderazioni(analisi, t) {
  const righe = []
  const forma = /^(?:Forma|Forme|Form)\s+2026\s*:\s*(.*)$/i
  const riferimento = /^(?:Riferimento|Reference|Référence|Referência|Referencia|Referenz)\s+2026\s*:\s*(.*)$/i
  const aderenzaPista = /^(?:Fit pista|Track fit|Adéquation à la piste|Adequação à pista|Adaptación a la pista|Streckeneignung|Strecken-Eignung)\s*:\s*(.*)$/i
  const confidenza = /^(?:Confidenza|Confidence|Confiance|Confiança|Confianza|Konfidenz|Vertrauen)\s*([^.:]*)[.:]?\s*(.*)$/i
  const frasi = pulisciProsa(analisi.considerazioniFinali)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  frasi.forEach((frase, indice) => {
    let corrispondenza

    if (indice === 0) {
      aggiungiRiga(righe, t.valutazione, frase)
    } else if ((corrispondenza = frase.match(forma))) {
      aggiungiRiga(righe, t.forma2026, corrispondenza[1])
    } else if ((corrispondenza = frase.match(riferimento))) {
      aggiungiRiga(righe, '2026', corrispondenza[1])
    } else if ((corrispondenza = frase.match(aderenzaPista))) {
      aggiungiRiga(righe, t.circuito, corrispondenza[1])
    } else if (/^(?:Il circuito|The circuit|Le circuit|O circuito|El circuito|Die Strecke)\b/i.test(frase)) {
      aggiungiRiga(righe, t.circuito, frase)
    } else if ((corrispondenza = frase.match(confidenza))) {
      const livello = corrispondenza[1].trim()
      const spiegazione = corrispondenza[2].trim()
      aggiungiRiga(
        righe,
        t.confidenza,
        [livello, spiegazione].filter(Boolean).join(': '),
      )
    } else if (/\b2026\b/.test(frase)) {
      aggiungiRiga(righe, '2026', frase)
    } else if (righe.length) {
      righe[righe.length - 1].testo += ` ${frase}`
    } else {
      aggiungiRiga(righe, t.analisi, frase)
    }
  })

  aggiungiRiga(righe, t.affidabilita, trovaAffidabilita(analisi, t))

  return righe
}

function RisultatiStorici({ titolo, righe }) {
  return (
    <article className="colonna-risultati">
      <h3>{titolo}</h3>
      <div>
        {righe.map((riga) => (
          <p key={`${titolo}-${riga.anno}`}>
            <span>{riga.anno}</span>
            <strong>{riga.posizione}</strong>
          </p>
        ))}
      </div>
    </article>
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

function AnalisiCircuito({ analisi, andamentoStagioneCorrente }) {
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
          <RisultatiStorici titolo={t.gara} righe={storicoGara} />
          <RisultatiStorici titolo={t.qualifica} righe={storicoQualifica} />
        </div>

        <aside className="nota-bene">
          <h3>{t.spiegazioneRisultatiPassati}</h3>
          <RigheEtichettate righe={noteAnnuali} classe="righe-anni" />
        </aside>
      </section>

      <section className="sezione-analisi performance-circuito">
        <div className="intestazione-sezione">
          <span>02</span>
          <div>
            <p>{t.letturaStorica}</p>
            <h2>{t.prestazioni}</h2>
          </div>
        </div>

        <div className="blocchi-performance">
          <article className="blocco-performance">
            <h3>{t.andamentoAnno}</h3>
            <RigheEtichettate righe={andamentoAnnuale} classe="righe-anni" />
          </article>

          <article className="blocco-performance">
            <h3>{t.gestioneGomme}</h3>
            <RigheEtichettate
              classe="righe-anni"
              righe={creaRighePrestazioneAnnuali(
                analisi.gestioneGomme,
                t,
                analisi.storicoEdizioni,
                'gestioneGomme',
              )}
            />
          </article>

          <article className="blocco-performance">
            <h3>{t.passoGara}</h3>
            <RigheEtichettate
              classe="righe-anni"
              righe={creaRighePrestazioneAnnuali(
                analisi.passoGara,
                t,
                analisi.storicoEdizioni,
                'passoGara',
              )}
            />
          </article>
        </div>
      </section>

      <section className="sezione-analisi considerazioni-finali">
        <div className="intestazione-sezione">
          <span>03</span>
          <div>
            <p>{t.sintesi}</p>
            <h2>{t.considerazioniFinali}</h2>
          </div>
        </div>
        <RigheEtichettate
          righe={segmentaConsiderazioni(analisi, t)}
          classe="righe-finali"
        />
      </section>

      <section className="sezione-analisi aggiornamenti-futuri">
        <div className="intestazione-sezione">
          <span>04</span>
          <div>
            <p>{t.daCompilare}</p>
            <h2>{t.aggiornamentiArrivo}</h2>
          </div>
        </div>
        <div className="spazio-aggiornamenti" aria-label={t.sezioneVuota}>
          {analisi.aggiornamentiInArrivo || null}
        </div>
      </section>

      {analisi.penalita && (
        <section className="sezione-analisi penalita-future">
          <div className="intestazione-sezione">
            <span>05</span>
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
            <span>{analisi.penalita ? '06' : '05'}</span>
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
