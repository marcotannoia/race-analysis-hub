// Dashboard previsionale: accesso solo con utente "admin" e password ADMIN_PW.
// La sessione è un cookie httpOnly firmato (HMAC) con scadenza; senza ADMIN_PW l'area resta chiusa.
const express = require("express");
const { createHash, createHmac, randomBytes, timingSafeEqual } = require("node:crypto");
const { rateLimit } = require("express-rate-limit");
const ambiente = require("../config/ambiente");
const gestisciFunzioneAsincrona = require("../middleware/gestisciFunzioneAsincrona");

const UTENTE = "admin";
const COOKIE = "dashboard_sessione";
const DURATA_SESSIONE = 8 * 60 * 60 * 1000;
// Chiave per processo: un riavvio invalida tutte le sessioni aperte.
const CHIAVE_FIRMA = randomBytes(32);

const impronta = (v) => createHash("sha256").update(String(v)).digest();
const uguali = (a, b) => timingSafeEqual(impronta(a), impronta(b));
const firma = (dati) => createHmac("sha256", CHIAVE_FIRMA).update(dati).digest("base64url");

function passwordConfigurata() {
  const password = process.env.ADMIN_PW;
  return password && password.length >= 8 ? password : null;
}

function creaSessione() {
  const dati = `${UTENTE}.${Date.now() + DURATA_SESSIONE}.${randomBytes(16).toString("base64url")}`;
  return `${dati}.${firma(dati)}`;
}

function sessioneValida(valore) {
  const parti = String(valore || "").split(".");
  if (parti.length !== 4) return false;
  const dati = parti.slice(0, 3).join(".");
  return uguali(parti[3], firma(dati)) && parti[0] === UTENTE && Number(parti[1]) > Date.now();
}

function leggiCookie(req) {
  const voce = (req.get("cookie") || "").split(";").map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  return voce ? decodeURIComponent(voce.slice(COOKIE.length + 1)) : null;
}

const opzioniCookie = () => ({
  httpOnly: true,
  secure: ambiente.produzione,
  sameSite: "strict",
  path: "/api/dashboard",
});

function richiediSessione(req, res, next) {
  if (!passwordConfigurata()) return res.status(503).json({ messaggio: "Dashboard non configurata (ADMIN_PW)" });
  if (!sessioneValida(leggiCookie(req))) return res.status(401).json({ messaggio: "Accesso richiesto" });
  next();
}

// Massimo 5 tentativi falliti ogni 15 minuti per IP.
const limiteAccessi = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { messaggio: "Troppi tentativi, riprova tra 15 minuti" },
});

function accedi(req, res) {
  const password = passwordConfigurata();
  if (!password) return res.status(503).json({ messaggio: "Dashboard non configurata (ADMIN_PW)" });
  const { utente, password: fornita } = req.body || {};
  // Entrambi i confronti vengono sempre eseguiti, per non rivelare quale campo è errato.
  const utenteOk = uguali(String(utente ?? ""), UTENTE);
  const passwordOk = uguali(String(fornita ?? ""), password);
  if (!utenteOk || !passwordOk) return res.status(401).json({ messaggio: "Credenziali non valide" });
  res.cookie(COOKIE, creaSessione(), { ...opzioniCookie(), maxAge: DURATA_SESSIONE });
  res.json({ autenticato: true });
}

async function previsioni(req, res) {
  const trovaGaraAttuale = require("../services/garaAttuale");
  const { costruisciClassificaPrevisionale } = require("../controllers/v1/apiController");
  const { modificheCorrenti } = require("../services/modificheDashboard");
  const garaAttuale = await trovaGaraAttuale();
  if (!garaAttuale) return res.status(404).json({ messaggio: "Nessun GP attuale" });
  res.json({
    previsioni: await costruisciClassificaPrevisionale(garaAttuale, "it"),
    modifiche: modificheCorrenti(garaAttuale.slug),
  });
}

async function salva(req, res) {
  const trovaGaraAttuale = require("../services/garaAttuale");
  const garaAttuale = await trovaGaraAttuale();
  if (!garaAttuale) return res.status(404).json({ messaggio: "Nessun GP attuale" });
  await require("../services/modificheDashboard").salvaModifiche(garaAttuale.slug, req.body);
  return previsioni(req, res);
}

async function meteo(req, res) {
  const { previsioneMeteo } = require("../services/meteoGp");
  const { valutaEsperienzaBagnato } = require("../services/classificaPrevisionale");
  const trovaGaraAttuale = require("../services/garaAttuale");
  const statistiche = require("../data/statistiche-contesto.json").piloti;
  const garaAttuale = await trovaGaraAttuale();
  if (!garaAttuale) return res.status(404).json({ messaggio: "Nessun GP attuale" });
  const meteoAggiornato = await previsioneMeteo(garaAttuale.slug, { forza: true });
  // Il nuovo meteo entra subito nelle previsioni pubbliche.
  require("../middleware/cacheApiV1").svuota?.();
  res.json({
    gara: { slug: garaAttuale.slug },
    meteo: meteoAggiornato,
    bagnatoPiloti: Object.fromEntries(Object.entries(statistiche).map(([slug, valori]) => [slug, {
      valutazione: Math.round(valutaEsperienzaBagnato(valori) * 10) / 10,
      gareConPioggiaDisputate: valori?.gareConPioggiaDisputate || 0,
      gareConPioggiaPositive: valori?.gareConPioggiaPositive || 0,
    }])),
  });
}

function creaRouterDashboard() {
  const router = express.Router();
  router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  router.use(express.json({ limit: "16kb" }));
  router.post("/accesso", limiteAccessi, accedi);
  router.post("/uscita", (req, res) => { res.clearCookie(COOKIE, opzioniCookie()); res.json({ autenticato: false }); });
  router.get("/sessione", richiediSessione, (req, res) => res.json({ autenticato: true }));
  router.get("/meteo", richiediSessione, gestisciFunzioneAsincrona(meteo));
  router.get("/previsioni", richiediSessione, gestisciFunzioneAsincrona(previsioni));
  router.post("/modifiche", richiediSessione, gestisciFunzioneAsincrona(salva));
  return router;
}

module.exports = { creaRouterDashboard, sessioneValida };
