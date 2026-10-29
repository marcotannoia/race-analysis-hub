// Area amministrativa: lettura completa dello stato e passaggio al prossimo GP.
// Disattivata se ADMIN_TOKEN non è configurato; richiede "Authorization: Bearer <token>".
const express = require("express");
const { timingSafeEqual, createHash } = require("node:crypto");
const gestisciFunzioneAsincrona = require("../middleware/gestisciFunzioneAsincrona");

const CHIAVE_METEO = "meteo_gare_2026";
const impronta = (v) => createHash("sha256").update(String(v)).digest();

function autenticazione(req, res, next) {
  const token = process.env.ADMIN_TOKEN?.trim();
  if (!token || token.length < 16) return res.status(503).json({ messaggio: "Area admin non configurata (ADMIN_TOKEN)" });
  const fornito = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!fornito || !timingSafeEqual(impronta(fornito), impronta(token))) {
    return res.status(401).json({ messaggio: "Token admin non valido" });
  }
  res.set("Cache-Control", "no-store");
  next();
}

const db = () => require("../config/database");

async function salvaMeteoGare(dati) {
  if (!db().usaPostgres()) return;
  await db().getPool().query(`insert into editorial.automation_state(job_name,status,checked_at) values($1,$2::jsonb,now())
    on conflict(job_name) do update set status=excluded.status,checked_at=excluded.checked_at,updated_at=now()`,
  [CHIAVE_METEO, JSON.stringify(dati)]);
}

// All'avvio riprende l'ultimo esito meteo salvato dalla dashboard.
async function ricaricaMeteoGare() {
  if (!db().usaPostgres()) return;
  const r = await db().getPool().query("select status from editorial.automation_state where job_name=$1", [CHIAVE_METEO]);
  if (r.rows[0]) require("../services/classificaDinamica").impostaMeteoGare(r.rows[0].status);
}

async function aggiornaMeteoGare(anno) {
  const dati = await require("../scripts/raccogliMeteoGare").raccogliMeteoGare(anno, { log: () => {} });
  // Non sostituire dati validi con una risposta vuota della fonte.
  if (!dati.edizioni.length) return require("../services/classificaDinamica").meteoGareCorrenti();
  require("../services/classificaDinamica").impostaMeteoGare(dati);
  await salvaMeteoGare(dati);
  return dati;
}

function svuotaCache() {
  require("../middleware/cacheApiV1").svuota?.();
  if (db().usaPostgres()) require("../repositories/postgresCompat").invalidate("Gara", "Pilota", "Scuderia", "AnalisiGara", "AnalisiScuderia");
}

async function stato(req, res) {
  const { Gara } = require("../repositories/modelli");
  const trovaGaraAttuale = require("../services/garaAttuale");
  const { costruisciClassificaPrevisionale } = require("../controllers/v1/apiController");
  const garaAttuale = await trovaGaraAttuale();
  const calendario = await Gara.find().sort({ ordineCalendario: 1 }).lean();
  let classifica = null, erroreClassifica = null;
  if (garaAttuale) {
    try { classifica = await costruisciClassificaPrevisionale(garaAttuale, "it"); }
    catch (e) { erroreClassifica = e.message; }
  }
  let automatico = null;
  if (db().usaPostgres()) {
    try { automatico = await require("../services/aggiornamentoAutomaticoGp").statoAutomatico(); }
    catch (e) { automatico = { errore: e.message }; }
  }
  res.json({
    generatoIl: new Date().toISOString(),
    garaAttuale: garaAttuale && { slug: garaAttuale.slug, nome: garaAttuale.nome, circuito: garaAttuale.circuito,
      stagione: garaAttuale.stagione, ordineCalendario: garaAttuale.ordineCalendario },
    calendario: calendario.map((g) => ({ slug: g.slug, nome: g.nome, ordineCalendario: g.ordineCalendario,
      stato: g.stato, conclusaIl: g.conclusaIl })),
    aggiornamentoAutomatico: automatico,
    meteoGare: require("../services/classificaDinamica").meteoGareCorrenti(),
    classifica, erroreClassifica,
  });
}

async function prossimoGp(req, res) {
  if (!db().usaPostgres()) return res.status(409).json({ messaggio: "Il passaggio di GP richiede il database Postgres" });
  const dryRun = req.body?.dryRun === true;
  const esito = await require("../services/aggiornamentoAutomaticoGp").controllaAggiornamentoGp({ dryRun });
  let meteo = null, avvisoMeteo = null;
  if (!dryRun) {
    try { meteo = await aggiornaMeteoGare(2026); } catch (e) { avvisoMeteo = `Meteo gare non aggiornato: ${e.message}`; }
    svuotaCache();
  }
  res.json({ dryRun, esito, edizioniMeteo: meteo?.edizioni?.length ?? null, avvisoMeteo });
}

async function meteo(req, res) {
  const dati = await aggiornaMeteoGare(2026);
  svuotaCache();
  res.json({ edizioni: dati.edizioni.length, aggiornatoIl: dati.aggiornatoIl });
}

function creaRouterAdmin() {
  const router = express.Router();
  router.use(express.json({ limit: "10kb" }));
  router.use(autenticazione);
  router.get("/stato", gestisciFunzioneAsincrona(stato));
  router.post("/prossimo-gp", gestisciFunzioneAsincrona(prossimoGp));
  router.post("/meteo-gare", gestisciFunzioneAsincrona(meteo));
  return router;
}

module.exports = { creaRouterAdmin, ricaricaMeteoGare, autenticazione };
