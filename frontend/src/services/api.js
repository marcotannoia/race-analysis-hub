import { TRADUZIONI_INTERFACCIA } from '../i18n/traduzioniInterfaccia.js'

const URL_LOCALE = 'http://127.0.0.1:5002'
const URL_PREDEFINITO = import.meta.env.PROD ? window.location.origin : URL_LOCALE
const API_URL = (import.meta.env.VITE_API_URL || URL_PREDEFINITO).replace(
  /\/+$/,
  '',
)

function rispostaJson(risposta, messaggioErrore) {
  const tipoContenuto = risposta.headers.get('content-type') || ''

  if (!tipoContenuto.toLowerCase().includes('application/json')) {
    throw new Error(messaggioErrore)
  }

  return risposta.json()
}

async function richiesta(percorso, lingua = 'it') {
  const t = TRADUZIONI_INTERFACCIA[lingua] || TRADUZIONI_INTERFACCIA.it
  const controllo = new AbortController()
  const timeout = window.setTimeout(() => controllo.abort(), 10000)

  let risposta

  try {
    const url = new URL(`${API_URL}${percorso}`)
    url.searchParams.set('lingua', lingua)
    risposta = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      referrerPolicy: 'no-referrer',
      signal: controllo.signal,
    })
  } catch (errore) {
    if (errore.name === 'AbortError') {
      throw new Error(t.timeout)
    }

    throw new Error(t.serverIrraggiungibile)
  } finally {
    window.clearTimeout(timeout)
  }

  if (!risposta.ok) {
    const corpo = await rispostaJson(risposta, t.erroreRisposta).catch(
      () => null,
    )
    const messaggio = corpo?.errore?.messaggio ||
      (typeof corpo?.errore === 'string' ? corpo.errore : t.datiNonRecuperabili)
    throw new Error(messaggio)
  }

  return rispostaJson(risposta, t.erroreRisposta)
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
      datiPerAnno.spiegazioneRisultatiPassati ??
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

function creaValutazioneFinale(home, scuderiaSlug, pilotaSlug = null) {
  const compatibilita = home.circuitoTecnico?.compatibilita?.find(
    (voce) => voce.scuderia.slug === scuderiaSlug,
  )
  const previsioni = (home.classificaPrevisionale?.classifica || [])
    .filter((voce) =>
      pilotaSlug
        ? voce.pilota.slug === pilotaSlug
        : voce.scuderia.slug === scuderiaSlug,
    )
    .map((voce) => ({
      posizione: voce.posizione,
      indice: voce.indice,
      pilota: voce.pilota,
    }))

  if (!compatibilita && !previsioni.length) return null

  return {
    compatibilita: compatibilita || null,
    previsioni,
  }
}

export async function caricaHome(lingua) {
  const dati = await richiesta('/api/v2/home', lingua)

  return {
    ...dati,
    piloti: dati.piloti.map(adattaPilota),
    scuderie: dati.scuderie.map(adattaScuderia),
  }
}

export async function caricaPilota(slug, lingua) {
  const [dati, home] = await Promise.all([
    richiesta(`/api/v2/piloti/${encodeURIComponent(slug)}`, lingua),
    richiesta('/api/v2/home', lingua),
  ])

  return {
    ...dati,
    pilota: adattaPilota(dati.pilota),
    analisi: adattaAnalisi(dati.analisi),
    andamentoStagioneCorrente:
      dati.andamentoStagioneCorrente ?? dati.andamentoUltimoAnno,
    valutazioneFinale: creaValutazioneFinale(
      home,
      dati.pilota.scuderia.slug,
      dati.pilota.slug,
    ),
  }
}

export async function caricaScuderia(slug, lingua) {
  const [dati, home] = await Promise.all([
    richiesta(`/api/v2/scuderie/${encodeURIComponent(slug)}`, lingua),
    richiesta('/api/v2/home', lingua),
  ])

  return {
    ...dati,
    scuderia: adattaScuderia(dati.scuderia),
    piloti: dati.piloti.map(adattaPilota),
    analisi: adattaAnalisi(dati.analisi),
    andamentoStagioneCorrente:
      dati.andamentoStagioneCorrente ?? dati.andamentoUltimoAnno,
    valutazioneFinale: creaValutazioneFinale(home, dati.scuderia.slug),
  }
}

function adattaSchedaPilota(scheda) {
  return {
    ...scheda,
    pilota: adattaPilota(scheda.pilota),
    analisi: adattaAnalisi(scheda.analisi),
    andamentoStagioneCorrente:
      scheda.andamentoStagioneCorrente ?? scheda.andamentoUltimoAnno,
  }
}

function adattaSchedaScuderia(scheda) {
  return {
    ...scheda,
    scuderia: adattaScuderia(scheda.scuderia),
    piloti: scheda.piloti.map(adattaPilota),
    analisi: adattaAnalisi(scheda.analisi),
    andamentoStagioneCorrente:
      scheda.andamentoStagioneCorrente ?? scheda.andamentoUltimoAnno,
  }
}

export async function caricaConfrontoPiloti(primoSlug, secondoSlug, lingua) {
  const dati = await richiesta(
    `/api/v2/confronti/piloti/${encodeURIComponent(primoSlug)}/${encodeURIComponent(secondoSlug)}`,
    lingua,
  )
  return { ...dati, elementi: dati.elementi.map(adattaSchedaPilota) }
}

export async function caricaConfrontoScuderie(primoSlug, secondoSlug, lingua) {
  const dati = await richiesta(
    `/api/v2/confronti/scuderie/${encodeURIComponent(primoSlug)}/${encodeURIComponent(secondoSlug)}`,
    lingua,
  )
  return { ...dati, elementi: dati.elementi.map(adattaSchedaScuderia) }
}

// Area admin: token conservato solo nella sessione del browser.
export async function richiestaAdmin(percorso, token, { metodo = 'GET', corpo } = {}) {
  const risposta = await fetch(`${API_URL}/api/admin${percorso}`, {
    method: metodo,
    credentials: 'omit',
    cache: 'no-store',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`,
      ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dati = await risposta.json().catch(() => null)
  if (!risposta.ok) throw new Error(dati?.messaggio || dati?.errore?.messaggio || `Errore ${risposta.status}`)
  return dati
}

async function richiestaDashboard(percorso, { metodo = 'GET', corpo } = {}) {
  const risposta = await fetch(`${API_URL}/api/dashboard${percorso}`, {
    method: metodo,
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dati = await risposta.json().catch(() => null)
  if (!risposta.ok) {
    const errore = new Error(dati?.messaggio || `Errore ${risposta.status}`)
    errore.stato = risposta.status
    throw errore
  }
  return dati
}

export const verificaSessioneDashboard = () => richiestaDashboard('/sessione')
export const accediDashboard = (utente, password) =>
  richiestaDashboard('/accesso', { metodo: 'POST', corpo: { utente, password } })
export const esciDashboard = () => richiestaDashboard('/uscita', { metodo: 'POST' })
export const aggiornaMeteoDashboard = () => richiestaDashboard('/meteo')
export const caricaPrevisioniDashboard = () => richiestaDashboard('/previsioni')
export const salvaModificheDashboard = (modifiche) =>
  richiestaDashboard('/modifiche', { metodo: 'POST', corpo: modifiche })
