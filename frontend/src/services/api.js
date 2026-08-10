const URL_LOCALE = 'http://127.0.0.1:5002'
const URL_PREDEFINITO = import.meta.env.PROD ? window.location.origin : URL_LOCALE
const API_URL = (import.meta.env.VITE_API_URL || URL_PREDEFINITO).replace(
  /\/+$/,
  '',
)

function rispostaJson(risposta) {
  const tipoContenuto = risposta.headers.get('content-type') || ''

  if (!tipoContenuto.toLowerCase().includes('application/json')) {
    throw new Error('Risposta del servizio non valida')
  }

  return risposta.json()
}

async function richiesta(percorso) {
  const controllo = new AbortController()
  const timeout = window.setTimeout(() => controllo.abort(), 10000)

  let risposta

  try {
    risposta = await fetch(`${API_URL}${percorso}`, {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      referrerPolicy: 'no-referrer',
      signal: controllo.signal,
    })
  } catch (errore) {
    if (errore.name === 'AbortError') {
      throw new Error('Il server sta impiegando troppo tempo a rispondere')
    }

    throw new Error('Impossibile raggiungere il server')
  } finally {
    window.clearTimeout(timeout)
  }

  if (!risposta.ok) {
    const errore = await rispostaJson(risposta).catch(() => null)
    throw new Error(
      errore?.errore?.messaggio ||
        errore?.messaggio ||
        'Impossibile recuperare i dati',
    )
  }

  return rispostaJson(risposta)
}

function adattaPilota(pilota) {
  if (!pilota) return null

  return {
    ...pilota,
    classifica2026: pilota.classifica,
  }
}

function adattaScuderia(scuderia) {
  if (!scuderia) return null

  return {
    ...scuderia,
    classifica2026: scuderia.classifica,
  }
}

function adattaAnalisi(analisi) {
  if (!analisi) return null

  const datiPerAnno = analisi.datiPerAnno || {}

  return {
    ...analisi,
    risultatiGara:
      datiPerAnno.risultatiGara ??
      analisi.risultatiGara ??
      analisi.posizioniStoriche ??
      '',
    notaBene:
      datiPerAnno.notaBene ??
      analisi.notaBene ??
      analisi.spiegazionePosizioni ??
      '',
    risultatiQualifica:
      datiPerAnno.risultatiQualifica ??
      analisi.risultatiQualifica ??
      analisi.qualificheStoriche ??
      '',
    andamentoPerAnno:
      datiPerAnno.andamento ?? analisi.andamentoPerAnno ?? '',
    passoGara:
      datiPerAnno.prestazioni?.passoGara ??
      analisi.prestazioni?.passoGara ??
      analisi.passoGara ??
      '',
    gestioneGomme:
      datiPerAnno.prestazioni?.gestioneGomme ??
      analisi.prestazioni?.gestioneGomme ??
      analisi.gomme ??
      '',
    affidabilita:
      analisi.prestazioni?.affidabilita ?? analisi.affidabilita ?? '',
    considerazioniFinali:
      analisi.considerazioniFinali ?? analisi.considerazioni ?? '',
    penalita: analisi.penalita ?? '',
    storicoEdizioni: (analisi.storicoEdizioni || []).map((edizione) => ({
      ...edizione,
      gestioneGomme: edizione.gestioneGomme ?? edizione.gomme ?? '',
    })),
  }
}

export async function caricaHome() {
  const dati = await richiesta('/api/v1/home')

  return {
    ...dati,
    piloti: dati.piloti.map(adattaPilota),
    scuderie: dati.scuderie.map(adattaScuderia),
  }
}

export async function caricaPilota(slug) {
  const dati = await richiesta(`/api/v1/piloti/${encodeURIComponent(slug)}`)

  return {
    ...dati,
    pilota: adattaPilota(dati.pilota),
    analisi: adattaAnalisi(dati.analisi),
    andamentoStagioneCorrente:
      dati.andamentoStagioneCorrente ?? dati.andamentoUltimoAnno,
  }
}

export async function caricaScuderia(slug) {
  const dati = await richiesta(`/api/v1/scuderie/${encodeURIComponent(slug)}`)

  return {
    ...dati,
    scuderia: adattaScuderia(dati.scuderia),
    piloti: dati.piloti.map(adattaPilota),
    analisi: adattaAnalisi(dati.analisi),
    andamentoStagioneCorrente:
      dati.andamentoStagioneCorrente ?? dati.andamentoUltimoAnno,
  }
}
