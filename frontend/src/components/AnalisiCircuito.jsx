import GraficoAndamento from './GraficoAndamento.jsx'

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

function estraiPosizione(contenuto, tipo) {
  if (/NON CORSO/i.test(contenuto)) return 'Non corso'

  const prefisso = tipo === 'gara' ? 'P' : 'Q'
  const espressione = new RegExp(
    `(?:\\b[A-Z]{3}\\s+)?${prefisso}\\d+\\b|\\b(?:DNF|DNS|DSQ|NC)\\b`,
    'g',
  )
  const posizioni = contenuto.toUpperCase().match(espressione)
  const risultato = posizioni?.join(' / ') || '—'

  return tipo === 'qualifica' ? normalizzaQualifica(risultato) : risultato
}

function leggiStorico(testo, tipo, edizioni = []) {
  const righe = [...leggiTestiAnnuali(testo)]
    .filter(([anno]) => Number.isInteger(anno))
    .map(([anno, contenuto]) => ({
      anno,
      posizione: estraiPosizione(contenuto, tipo),
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

function creaNoteAnnuali(analisi, anni) {
  const notePerAnno = leggiTestiAnnuali(analisi.notaBene)
  const storicoEdizioni = analisi.storicoEdizioni || []

  storicoEdizioni.forEach((edizione) => {
    if (edizione.notaRisultato) {
      notePerAnno.set(edizione.stagione, pulisciProsa(edizione.notaRisultato))
    }
  })

  const note = anni.map((anno) => ({
    etichetta: String(anno),
    testo: notePerAnno.get(anno) || 'Nessun evento particolare da trattare',
  }))

  if (notePerAnno.has('generale')) {
    note.push({ etichetta: 'Generale', testo: notePerAnno.get('generale') })
  }

  return note
}

function creaAndamentoAnnuale(storicoGara, storicoQualifica, noteAnnuali) {
  const notePerAnno = new Map(
    noteAnnuali.map((nota) => [Number(nota.etichetta), nota.testo]),
  )

  return storicoGara.map((gara) => {
    const qualifica = storicoQualifica.find((riga) => riga.anno === gara.anno)
    const posizioneQualifica = qualifica?.posizione || '—'
    const nonDisputata =
      gara.posizione === 'Non corso' && posizioneQualifica === 'Non corso'

    const andamento = nonDisputata
      ? 'Non ha disputato il Gran Premio di Formula 1.'
      : `In qualifica: ${posizioneQualifica}; in gara: ${gara.posizione}.`

    return {
      etichetta: String(gara.anno),
      testo: `${andamento} ${notePerAnno.get(gara.anno) || ''}`.trim(),
    }
  })
}

function creaAndamentoVisualizzato(analisi, storicoGara, storicoQualifica, noteAnnuali) {
  const andamentoPersonalizzato = leggiTestiAnnuali(analisi.andamentoPerAnno)

  if (andamentoPersonalizzato.size) {
    return [...andamentoPersonalizzato].map(([anno, testo]) => ({
      etichetta: anno === 'generale' ? 'Generale' : String(anno),
      testo,
    }))
  }

  return creaAndamentoAnnuale(storicoGara, storicoQualifica, noteAnnuali)
}

function aggiungiRiga(righe, etichetta, testo) {
  const contenuto = pulisciProsa(testo)
  if (!contenuto) return

  const esistente = righe.find((riga) => riga.etichetta === etichetta)

  if (esistente) esistente.testo = `${esistente.testo} ${contenuto}`
  else righe.push({ etichetta, testo: contenuto })
}

function creaRighePrestazioneAnnuali(testo, edizioni = [], campoEdizione) {
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
      etichetta: anno === 'generale' ? 'Generale' : String(anno),
      testo: contenuto,
    }))
}

function trovaAffidabilita(analisi) {
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
    return `I dati della stagione indicano ${ritiri[1]} ritiri o mancate partenze, quindi l'affidabilità resta un fattore da considerare.`
  }

  if (/\britir(?:o|i|ato|ata)\b|\bDNS\b/i.test(testoNotaBene)) {
    return 'Lo storico del circuito comprende ritiri o gare non completate; questi episodi devono essere separati dal passo prestazionale puro.'
  }

  return ''
}

function segmentaConsiderazioni(analisi) {
  const righe = []
  const frasi = pulisciProsa(analisi.considerazioniFinali)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  frasi.forEach((frase, indice) => {
    let corrispondenza

    if (indice === 0) {
      aggiungiRiga(righe, 'Valutazione', frase)
    } else if ((corrispondenza = frase.match(/^Forma 2026\s*:\s*(.*)$/i))) {
      aggiungiRiga(righe, 'Forma 2026', corrispondenza[1])
    } else if ((corrispondenza = frase.match(/^Riferimento 2026\s*:\s*(.*)$/i))) {
      aggiungiRiga(righe, '2026', corrispondenza[1])
    } else if ((corrispondenza = frase.match(/^Fit pista\s*:\s*(.*)$/i))) {
      aggiungiRiga(righe, 'Circuito', corrispondenza[1])
    } else if (/^Il circuito\b/i.test(frase)) {
      aggiungiRiga(righe, 'Circuito', frase)
    } else if ((corrispondenza = frase.match(/^Confidenza\s*([^.:]*)[.:]?\s*(.*)$/i))) {
      const livello = corrispondenza[1].trim()
      const spiegazione = corrispondenza[2].trim()
      aggiungiRiga(
        righe,
        'Confidenza',
        [livello, spiegazione].filter(Boolean).join(': '),
      )
    } else if (/\b2026\b/.test(frase)) {
      aggiungiRiga(righe, '2026', frase)
    } else if (righe.length) {
      righe[righe.length - 1].testo += ` ${frase}`
    } else {
      aggiungiRiga(righe, 'Analisi', frase)
    }
  })

  aggiungiRiga(righe, 'Affidabilità', trovaAffidabilita(analisi))
  aggiungiRiga(righe, 'Penalità', analisi.penalita)

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

function AnalisiCircuito({ analisi, andamentoStagioneCorrente }) {
  if (!analisi) {
    return (
      <section className="analisi-non-disponibile">
        <span className="sovratitolo">Circuito attuale</span>
        <h2>Analisi in preparazione</h2>
        <p>I dati del Gran Premio attuale saranno pubblicati qui.</p>
      </section>
    )
  }

  const storicoGara = leggiStorico(
    analisi.risultatiGara,
    'gara',
    analisi.storicoEdizioni,
  )
  const storicoQualifica = leggiStorico(
    analisi.risultatiQualifica,
    'qualifica',
    analisi.storicoEdizioni,
  )
  const anni = [...new Set([...storicoGara, ...storicoQualifica].map((riga) => riga.anno))]
  const noteAnnuali = creaNoteAnnuali(analisi, anni)
  const andamentoAnnuale = creaAndamentoVisualizzato(
    analisi,
    storicoGara,
    storicoQualifica,
    noteAnnuali,
  )

  return (
    <>
      <section className="introduzione-circuito">
        <span className="sovratitolo">Circuito attuale</span>
        <h2>{analisi.gara.nome}</h2>
        <p>
          {analisi.gara.circuito} · {analisi.gara.paese}
        </p>
      </section>

      <section className="sezione-analisi storico-circuito">
        <div className="intestazione-sezione">
          <span>01</span>
          <div>
            <p>Storico essenziale</p>
            <h2>Risultati sul circuito</h2>
          </div>
        </div>

        <div className="griglia-risultati-storici">
          <RisultatiStorici titolo="Gara" righe={storicoGara} />
          <RisultatiStorici titolo="Qualifica" righe={storicoQualifica} />
        </div>

        <aside className="nota-bene">
          <h3>N.B.</h3>
          <RigheEtichettate righe={noteAnnuali} />
        </aside>
      </section>

      <section className="sezione-analisi performance-circuito">
        <div className="intestazione-sezione">
          <span>02</span>
          <div>
            <p>Lettura storica</p>
            <h2>Prestazioni e performance</h2>
          </div>
        </div>

        <div className="blocchi-performance">
          <article className="blocco-performance">
            <h3>Andamento per anno</h3>
            <RigheEtichettate righe={andamentoAnnuale} />
          </article>

          <article className="blocco-performance">
            <h3>Gestione gomme</h3>
            <RigheEtichettate
              righe={creaRighePrestazioneAnnuali(
                analisi.gestioneGomme,
                analisi.storicoEdizioni,
                'gestioneGomme',
              )}
            />
          </article>

          <article className="blocco-performance">
            <h3>Passo gara</h3>
            <RigheEtichettate
              righe={creaRighePrestazioneAnnuali(
                analisi.passoGara,
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
            <p>Sintesi</p>
            <h2>Considerazioni finali</h2>
          </div>
        </div>
        <RigheEtichettate
          righe={segmentaConsiderazioni(analisi)}
          classe="righe-finali"
        />
      </section>

      <section className="sezione-analisi aggiornamenti-futuri">
        <div className="intestazione-sezione">
          <span>04</span>
          <div>
            <p>Da compilare</p>
            <h2>Aggiornamenti in arrivo</h2>
          </div>
        </div>
        <div className="spazio-aggiornamenti" aria-label="Sezione vuota">
          {analisi.aggiornamentiInArrivo || null}
        </div>
      </section>

      {andamentoStagioneCorrente && (
        <section id="andamento" className="sezione-analisi sezione-grafici">
          <div className="intestazione-sezione">
            <span>05</span>
            <div>
              <p>Gran Premio dopo Gran Premio</p>
              <h2>Andamento {andamentoStagioneCorrente.stagione}</h2>
            </div>
          </div>

          {andamentoStagioneCorrente.fonte && (
            <p className="fonte-andamento">
              Dati gara e qualifica:{' '}
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
                titolo="Andamento in qualifica"
                descrizione="Posizione ottenuta nei GP registrati della stagione corrente."
                etichette={andamentoStagioneCorrente.etichette}
                serie={andamentoStagioneCorrente.qualifica}
              />
              <GraficoAndamento
                titolo="Andamento in gara"
                descrizione="Posizione finale nei GP registrati fino al Gran Premio corrente."
                etichette={andamentoStagioneCorrente.etichette}
                serie={andamentoStagioneCorrente.gara}
              />
            </div>
          ) : (
            <p className="grafici-senza-risultati">
              Nessun risultato {andamentoStagioneCorrente.stagione} è stato
              ancora registrato. I grafici si aggiorneranno dopo la chiusura
              del primo GP tramite il comando di aggiornamento.
            </p>
          )}
        </section>
      )}

      {analisi.fonti?.length > 0 && (
        <details className="fonti">
          <summary>Fonti consultate</summary>
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
