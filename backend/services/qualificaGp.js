// Classifica di qualifica del GP attuale, usata il sabato per ricalcolare la previsione.
// Fonte automatica: OpenF1 /session_result (numero vettura → pilota del catalogo).
// Riserva: ordine inserito a mano dalla dashboard o dall'area admin.
// Lo stato è salvato in editorial.automation_state e vale solo per il GP su cui è impostato.
const CHIAVE = "qualifica_gp";
const API = "https://api.openf1.org/v1";
// Peso della qualifica nella previsione del sabato: backtest 2026 round 2-20,
// vincitori indovinati 3 → 12 su 19, Spearman 0,686 → 0,718.
const PESO_QUALIFICA = 50;
const MIN_PILOTI = 10;
// Controllo automatico: dalla fine prevista della qualifica alla partenza della gara.
const DURATA_QUALIFICA_MS = 75 * 60000;
const INTERVALLO_CONTROLLO_MS = 10 * 60000;

let stato = null;
const db = () => require("../config/database");

async function leggiJson(url, fetchImpl = fetch) {
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    const risposta = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
    if (risposta.ok) return risposta.json();
    if (risposta.status !== 429) throw new Error(`OpenF1 HTTP ${risposta.status}`);
    await new Promise((r) => setTimeout(r, 3000 * (tentativo + 1)));
  }
  throw new Error("OpenF1 limite richieste");
}

const istante = (data, ora) => data && ora ? Date.parse(`${data}T${ora.length === 5 ? `${ora}:00` : ora}Z`) : NaN;

// Orari della qualifica e della gara dal calendario F1DB del runtime.
function orariGp(gara) {
  const campioni = require("./runtimeF1db").campioniCorrenti(require("../data/campioni-previsionali-2026.json"));
  const gp = campioni.gare.find((g) => g.year === gara.stagione && g.round === gara.ordineCalendario);
  if (!gp) return null;
  return { qualifica: istante(gp.qualifyingDate, gp.qualifyingTime), gara: istante(gp.date, gp.time),
    dataQualifica: gp.qualifyingDate };
}

function pilotaPerNumero(piloti) {
  const mappa = new Map();
  for (const p of piloti) if (p.numero !== undefined && p.numero !== null) mappa.set(String(p.numero), p);
  return mappa;
}

function esito(r) {
  if (r.dsq) return "DSQ";
  if (r.dns) return "DNS";
  if (r.dnf) return "DNF";
  return null;
}

// Converte le righe OpenF1 nella classifica del catalogo; gli assenti dal catalogo bloccano.
function normalizzaOpenF1(righe, piloti) {
  const perNumero = pilotaPerNumero(piloti);
  const ordinate = [...righe].sort((a, b) => (a.position ?? 99) - (b.position ?? 99) || a.driver_number - b.driver_number);
  const sconosciuti = ordinate.filter((r) => !perNumero.has(String(r.driver_number))).map((r) => r.driver_number);
  if (sconosciuti.length) throw new Error(`Numeri vettura non presenti nel catalogo: ${sconosciuti.join(", ")}`);
  return ordinate.map((r, i) => {
    const tempi = Array.isArray(r.duration) ? r.duration : [r.duration];
    return { posizione: i + 1, pilotaSlug: perNumero.get(String(r.driver_number)).slug, numero: String(r.driver_number),
      tempi: { q1: tempi[0] ?? null, q2: tempi[1] ?? null, q3: tempi[2] ?? null }, esito: esito(r) };
  });
}

// Ordine manuale: elenco di slug dal primo all'ultimo. Il corpo arriva dal browser.
function normalizzaManuale(ordine, piloti) {
  const validi = new Set(piloti.map((p) => p.slug));
  if (!Array.isArray(ordine) || ordine.length < MIN_PILOTI || ordine.length > 30) throw new Error("Ordine di qualifica non valido");
  if (new Set(ordine).size !== ordine.length || ordine.some((s) => typeof s !== "string" || !validi.has(s)))
    throw new Error("Ordine di qualifica con piloti duplicati o non iscritti");
  const perSlug = new Map(piloti.map((p) => [p.slug, p]));
  return ordine.map((slug, i) => ({ posizione: i + 1, pilotaSlug: slug, numero: String(perSlug.get(slug).numero ?? ""),
    tempi: { q1: null, q2: null, q3: null }, esito: null }));
}

async function salva(nuovo) {
  stato = nuovo;
  if (db().usaPostgres()) {
    await db().getPool().query(`insert into editorial.automation_state(job_name,status,checked_at) values($1,$2::jsonb,now())
      on conflict(job_name) do update set status=excluded.status,checked_at=excluded.checked_at,updated_at=now()`,
    [CHIAVE, JSON.stringify(stato)]);
  }
  require("../middleware/cacheApiV1").svuota?.();
  return stato;
}

async function ricaricaQualifica() {
  if (!db().usaPostgres()) return;
  const r = await db().getPool().query("select status from editorial.automation_state where job_name=$1", [CHIAVE]);
  if (r.rows[0]?.status) stato = r.rows[0].status;
}

function qualificaCorrente(garaSlug) {
  return stato?.garaSlug === garaSlug ? stato : null;
}

// Scarica da OpenF1 la qualifica conclusa del GP; non sovrascrive un inserimento manuale
// salvo forza=true.
async function aggiornaDaOpenF1(gara, piloti, { forza = false, adesso = Date.now(), fetchImpl = fetch } = {}) {
  const corrente = qualificaCorrente(gara.slug);
  if (corrente?.fonte === "manuale" && !forza) return { aggiornato: false, motivo: "inserimento_manuale_presente", qualifica: corrente };
  const orari = orariGp(gara);
  if (!orari || !Number.isFinite(orari.qualifica)) return { aggiornato: false, motivo: "orario_qualifica_sconosciuto" };
  if (adesso < orari.qualifica + DURATA_QUALIFICA_MS) return { aggiornato: false, motivo: "qualifica_non_conclusa" };
  const sessioni = await leggiJson(`${API}/sessions?year=${gara.stagione}&session_name=Qualifying`, fetchImpl);
  const sessione = sessioni.find((s) => s.date_start?.slice(0, 10) === orari.dataQualifica);
  if (!sessione) return { aggiornato: false, motivo: "sessione_openf1_assente" };
  const url = `${API}/session_result?session_key=${sessione.session_key}`;
  const righe = await leggiJson(url, fetchImpl);
  if (!Array.isArray(righe) || righe.length < MIN_PILOTI) return { aggiornato: false, motivo: "risultati_openf1_incompleti" };
  const classifica = normalizzaOpenF1(righe, piloti);
  if (corrente?.fonte === "openf1" && JSON.stringify(corrente.classifica) === JSON.stringify(classifica))
    return { aggiornato: false, motivo: "invariata", qualifica: corrente };
  const salvata = await salva({ garaSlug: gara.slug, fonte: "openf1", sessionKey: sessione.session_key, url,
    aggiornatoIl: new Date(adesso).toISOString(), classifica });
  return { aggiornato: true, qualifica: salvata };
}

async function impostaManuale(gara, piloti, ordine) {
  return salva({ garaSlug: gara.slug, fonte: "manuale", sessionKey: null, url: null,
    aggiornatoIl: new Date().toISOString(), classifica: normalizzaManuale(ordine, piloti) });
}

async function cancella(gara) {
  if (!qualificaCorrente(gara.slug)) return null;
  return salva({ garaSlug: null, fonte: null, classifica: [], aggiornatoIl: new Date().toISOString() });
}

// Piloti iscritti al GP attuale, con numero vettura, dal catalogo.
async function iscrittiGaraAttuale() {
  const garaAttuale = await require("./garaAttuale")();
  if (!garaAttuale) return { garaAttuale: null, piloti: [] };
  const { Pilota, AnalisiGara } = require("../repositories/modelli");
  const [piloti, analisi] = await Promise.all([Pilota.find().lean(), AnalisiGara.find({ gara: garaAttuale._id }).lean()]);
  const iscritti = new Set(analisi.map((a) => String(a.pilota?._id ?? a.pilota)));
  return { garaAttuale, piloti: piloti.filter((p) => iscritti.has(String(p._id))) };
}

// Indice 0-100 dalla posizione in qualifica, sulla stessa scala dei fattori del modello.
function indiciQualifica(qualifica) {
  if (!qualifica?.classifica?.length) return null;
  const n = qualifica.classifica.length;
  return new Map(qualifica.classifica.map((r) => [r.pilotaSlug, n > 1 ? 100 * (n - r.posizione) / (n - 1) : 50]));
}

function avviaAggiornamentoQualifica() {
  if (!require("../config/ambiente").aggiornamentoGpAutomatico || !db().usaPostgres()) return () => {};
  let attivo = true, inCorso = false;
  const controlla = async () => {
    if (!attivo || inCorso) return;
    inCorso = true;
    try {
      const { garaAttuale, piloti } = await iscrittiGaraAttuale();
      const orari = garaAttuale && orariGp(garaAttuale);
      const adesso = Date.now();
      if (orari && adesso >= orari.qualifica + DURATA_QUALIFICA_MS && adesso < orari.gara) {
        const esito = await aggiornaDaOpenF1(garaAttuale, piloti, { adesso });
        if (esito.aggiornato) console.log(`Qualifica ${garaAttuale.slug} acquisita da OpenF1 (${esito.qualifica.classifica.length} piloti)`);
      }
    } catch (e) { console.error("Qualifica non aggiornata:", e.message); }
    finally { inCorso = false; }
  };
  const timer = setInterval(controlla, INTERVALLO_CONTROLLO_MS);
  timer.unref?.();
  setTimeout(controlla, 30000).unref?.();
  return () => { attivo = false; clearInterval(timer); };
}

module.exports = { CHIAVE, PESO_QUALIFICA, qualificaCorrente, ricaricaQualifica, aggiornaDaOpenF1, impostaManuale, cancella,
  iscrittiGaraAttuale, indiciQualifica, normalizzaOpenF1, normalizzaManuale, orariGp, avviaAggiornamentoQualifica,
  _imposta: (valore) => { stato = valore; } };
