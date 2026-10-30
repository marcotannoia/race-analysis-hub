// Modifiche della dashboard (penalità e spostamenti manuali) applicate a tutte le previsioni pubbliche.
// Valgono solo per il GP su cui sono state impostate e sono salvate in editorial.automation_state.
const CHIAVE = "dashboard_modifiche";

// Posti di penalità → % di indice tolta; valori intermedi interpolati, partenza dal fondo = 20%.
const SCALA_PENALITA = [[0, 0], [3, 2], [5, 5], [10, 10], [20, 20]];
const PENALITA_PER_SECONDO = 0.15;
const POSTI_DAL_FONDO = 20;

let modifiche = { garaSlug: null, penalita: {}, manuale: {}, aggiornatoIl: null };

const db = () => require("../config/database");
const arrotonda = (v, cifre = 1) => Math.round(v * 10 ** cifre) / 10 ** cifre;

function percentualePenalita(posti) {
  for (let i = 1; i < SCALA_PENALITA.length; i += 1) {
    const [x0, y0] = SCALA_PENALITA[i - 1];
    const [x1, y1] = SCALA_PENALITA[i];
    if (posti <= x1) return y0 + (y1 - y0) * (posti - x0) / (x1 - x0);
  }
  return SCALA_PENALITA.at(-1)[1];
}

const numero = (v, max) => Math.min(Math.max(Number(v) || 0, 0), max);

// Accetta solo slug e campi noti, con limiti: il corpo arriva dal browser.
function normalizza(garaSlug, { penalita = {}, manuale = {} } = {}) {
  const slugValido = (s) => /^[a-z0-9-]{1,60}$/.test(s);
  const pulitePenalita = {};
  for (const [slug, p] of Object.entries(penalita || {}).slice(0, 40)) {
    if (!slugValido(slug) || !p) continue;
    const voce = { posti: numero(p.posti, POSTI_DAL_FONDO), secondi: numero(p.secondi, 60), dalFondo: p.dalFondo === true };
    if (voce.posti || voce.secondi || voce.dalFondo) pulitePenalita[slug] = voce;
  }
  const puliteManuale = {};
  for (const [slug, v] of Object.entries(manuale || {}).slice(0, 40)) {
    const bonus = Number(v);
    if (slugValido(slug) && Number.isFinite(bonus) && bonus !== 0) puliteManuale[slug] = Math.max(-100, Math.min(100, bonus));
  }
  return { garaSlug, penalita: pulitePenalita, manuale: puliteManuale, aggiornatoIl: new Date().toISOString() };
}

function modificheCorrenti(garaSlug) {
  return modifiche.garaSlug === garaSlug ? modifiche : { garaSlug, penalita: {}, manuale: {}, aggiornatoIl: null };
}

async function salvaModifiche(garaSlug, dati) {
  modifiche = normalizza(garaSlug, dati);
  if (db().usaPostgres()) {
    await db().getPool().query(`insert into editorial.automation_state(job_name,status,checked_at) values($1,$2::jsonb,now())
      on conflict(job_name) do update set status=excluded.status,checked_at=excluded.checked_at,updated_at=now()`,
    [CHIAVE, JSON.stringify(modifiche)]);
  }
  require("../middleware/cacheApiV1").svuota?.();
  return modifiche;
}

async function ricaricaModifiche() {
  if (!db().usaPostgres()) return;
  const r = await db().getPool().query("select status from editorial.automation_state where job_name=$1", [CHIAVE]);
  if (r.rows[0]?.status) modifiche = r.rows[0].status;
}

// Riordina la classifica del modello: penalità sull'indice, poi bonus manuale della dashboard.
function applicaModifiche(risultato) {
  const correnti = modificheCorrenti(risultato?.gara?.slug);
  if (!risultato?.classifica || !correnti.aggiornatoIl) return risultato;
  const classifica = risultato.classifica.map((voce) => {
    const slug = voce.pilota.slug;
    const p = correnti.penalita[slug];
    const posti = p?.dalFondo ? POSTI_DAL_FONDO : p?.posti || 0;
    const percentuale = percentualePenalita(posti);
    const bonus = correnti.manuale[slug] || 0;
    const indice = voce.indice * (1 - percentuale / 100) - (p?.secondi || 0) * PENALITA_PER_SECONDO + bonus;
    return {
      ...voce,
      indice: arrotonda(indice),
      modificheDashboard: {
        indiceModello: voce.indice,
        posizioneModello: voce.posizione,
        penalita: p ? { ...p, percentualeIndice: arrotonda(percentuale) } : null,
        spostamentoManuale: arrotonda(bonus, 3),
      },
    };
  }).sort((a, b) => b.indice - a.indice || a.pilota.nome.localeCompare(b.pilota.nome, "it"))
    .map((voce, i) => ({ ...voce, posizione: i + 1 }));
  return { ...risultato, classifica, modificheDashboard: { aggiornatoIl: correnti.aggiornatoIl } };
}

module.exports = { applicaModifiche, modificheCorrenti, salvaModifiche, ricaricaModifiche, percentualePenalita };
