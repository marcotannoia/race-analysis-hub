// Migrazione mirata: backup, confronto campo per campo, guardia updatedAt,
// transazione atomica. Non esegue seed globale, cancellazioni o deployment.
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });
const collega = require("../config/database");
const { creaDatiEffettivi } = require("../utils/datiEffettivi");
const { normalizzaTestiAnnuali, normalizzaNotaBene } = require("../utils/normalizzaNotaBene");
const { normalizzaTraduzioniAnalisi } = require("../utils/normalizzaTraduzioni");
const dati = creaDatiEffettivi(require("../data/dati-iniziali.json"));
const backtest = require("../data/backtest-semantico-2026-10-05.json");
const calibrazione = require("../data/calibrazione-pesi-2026-10-05.json");
const models = Object.fromEntries(["Pilota", "Scuderia", "Gara", "AnalisiGara", "AnalisiScuderia", "MetodoPrevisionale"]
  .map((n) => [n, require(`../models/${n}`)]));

function canon(v) {
  if (v instanceof Date) return v.toISOString();
  if (v instanceof mongoose.Types.ObjectId) return v.toString();
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}
const uguali = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

function documentoAnalisi(a, refs, team) {
  const doc = {
    gara: refs.gare.get(a.garaSlug)._id, scuderia: refs.scuderie.get(a.scuderiaSlug)._id,
    posizioniStoriche: normalizzaTestiAnnuali(a.risultatiGara),
    spiegazionePosizioni: normalizzaNotaBene(a.notaBene),
    qualificheStoriche: normalizzaTestiAnnuali(a.risultatiQualifica),
    andamentoPerAnno: normalizzaTestiAnnuali(a.andamentoPerAnno || ""),
    passoGara: normalizzaTestiAnnuali(a.passoGara), gomme: normalizzaTestiAnnuali(a.gestioneGomme),
    considerazioni: a.considerazioniFinali, affidabilita: a.affidabilita || "",
    aggiornamentiInArrivo: a.aggiornamentiInArrivo || "", traduzioni: normalizzaTraduzioniAnalisi(a.traduzioni),
    fonti: a.fonti, storicoEdizioni: a.storicoEdizioni || [], overallSemantici: a.overallSemantici,
  };
  if (!team) Object.assign(doc, { pilota: refs.piloti.get(a.pilotaSlug)._id, penalita: a.penalita || "",
    vantaggioAggiornamentiTecnici: a.vantaggioAggiornamentiTecnici ?? 50,
    statoAggiornamentiTecnici: a.statoAggiornamentiTecnici || "" });
  return doc;
}

async function main() {
  const applica = process.argv.includes("--applica");
  const directoryBackup = process.argv.find((s) => s.startsWith("--backup="))?.slice(9);
  if (!directoryBackup) throw new Error("Specificare --backup=/cartella/privata");
  fs.mkdirSync(directoryBackup, { recursive: true, mode: 0o700 });
  const reportPath = process.argv.find((s) => s.startsWith("--report="))?.slice(9) ||
    path.join(__dirname, "../../docs/verifica-gp-2026-10-04/migrazione-database-2026-10-05.json");
  await collega();
  const letti = {};
  for (const [nome, Modello] of Object.entries(models)) letti[nome] = await Modello.find().lean();
  const backupFile = path.join(directoryBackup, `atlas-prima-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(canon(letti), null, 2), { mode: 0o600 });
  const refs = {
    piloti: new Map(letti.Pilota.map((x) => [x.slug, x])),
    scuderie: new Map(letti.Scuderia.map((x) => [x.slug, x])),
    gare: new Map(letti.Gara.map((x) => [x.slug, x])),
  };
  const pilotaSlug = new Map(letti.Pilota.map((p) => [String(p._id), p.slug]));
  const garaSlug = new Map(letti.Gara.map((g) => [String(g._id), g.slug]));
  const scuderiaSlug = new Map(letti.Scuderia.map((s) => [String(s._id), s.slug]));
  const pilotiAnalisi = new Map(letti.AnalisiGara.map((a) => [`${garaSlug.get(String(a.gara))}|${pilotaSlug.get(String(a.pilota))}`, a]));
  const teamAnalisi = new Map(letti.AnalisiScuderia.map((a) => [`${garaSlug.get(String(a.gara))}|${scuderiaSlug.get(String(a.scuderia))}`, a]));
  const pianificate = [], aspettative = [];
  async function prepara(nome, chiave, prima, atteso) {
    if (!prima) throw new Error(`Documento mancante: ${nome}/${chiave}; creazione implicita vietata`);
    const candidato = new models[nome]({ ...prima, ...atteso });
    await candidato.validate();
    // Cast dei sottoschemi e relativi default, senza mutare il documento originale.
    const cast = candidato.toObject();
    const completo = Object.fromEntries(Object.keys(atteso).map((k) => [k, cast[k]]));
    const set = Object.fromEntries(Object.entries(completo).filter(([k, v]) => !uguali(prima[k], v)));
    aspettative.push({ nome, id: prima._id, chiave, campi: completo });
    if (!Object.keys(set).length) return;
    pianificate.push({ nome, chiave, prima, set });
  }
  for (const s of dati.scuderie) await prepara("Scuderia", s.slug, refs.scuderie.get(s.slug), s);
  for (const p of dati.piloti) {
    const { scuderiaSlug: squadra, ...campi } = p;
    await prepara("Pilota", p.slug, refs.piloti.get(p.slug), { ...campi, scuderia: refs.scuderie.get(squadra)._id });
  }
  for (const g of dati.gare) await prepara("Gara", g.slug, refs.gare.get(g.slug), g);
  for (const a of dati.analisiGare) {
    const key = `${a.garaSlug}|${a.pilotaSlug}`;
    // Correzione circoscritta dello schieramento storico a Zandvoort: Tsunoda al posto di Hadjar.
    const prima = pilotiAnalisi.get(key) || (key === "olanda-zandvoort|tsunoda" ? pilotiAnalisi.get("olanda-zandvoort|hadjar") : null);
    await prepara("AnalisiGara", key, prima, documentoAnalisi(a, refs, false));
  }
  for (const a of dati.analisiScuderie) {
    const key = `${a.garaSlug}|${a.scuderiaSlug}`;
    await prepara("AnalisiScuderia", key, teamAnalisi.get(key), documentoAnalisi(a, refs, true));
  }
  const metodo = { versione: backtest.versione, stato: "sperimentale_non_promosso", pesi: backtest.pesi,
    protocollo: backtest.protocollo, backtest, fonti: [backtest.fonte] };
  const metodi = [metodo, { versione: calibrazione.versione, stato: calibrazione.stato, pesi: calibrazione.pesi,
    protocollo: calibrazione.protocollo, backtest: calibrazione, fonti: [calibrazione.fonte] }];
  const report = {
    generatoAlleUTC: new Date().toISOString(), database: mongoose.connection.name,
    modalita: applica ? "applicazione" : "anteprima", backup: backupFile,
    documenti: pianificate.length,
    perCollezione: pianificate.reduce((m, x) => (m[x.nome] = (m[x.nome] || 0) + 1, m), {}),
    modifiche: pianificate.map((x) => ({ modello: x.nome, chiave: x.chiave, campi: Object.keys(x.set) })),
    nuovoMetodo: metodo.versione, metodi: metodi.map((m) => m.versione), stato: "preparato",
  };
  if (applica) {
    const sessione = await mongoose.startSession();
    try {
      await sessione.withTransaction(async () => {
        for (const nome of Object.keys(models).filter((n) => n !== "MetodoPrevisionale")) {
          const elenco = pianificate.filter((x) => x.nome === nome);
          if (!elenco.length) continue;
          const result = await models[nome].bulkWrite(elenco.map((x) => ({ updateOne: {
            filter: { _id: x.prima._id, updatedAt: x.prima.updatedAt ?? { $exists: false } },
            update: { $set: x.set }, upsert: false,
          } })), { session: sessione });
          if (result.matchedCount !== elenco.length) throw new Error(`Conflitto concorrente: ${nome}; transazione annullata`);
        }
        for (const m of metodi) await models.MetodoPrevisionale.updateOne({ versione: m.versione }, { $set: m },
          { upsert: true, runValidators: true, session: sessione });
      });
    } finally { await sessione.endSession(); }
    const differenze = [];
    for (const nome of Object.keys(models).filter((n) => n !== "MetodoPrevisionale")) {
      const docs = new Map((await models[nome].find().lean()).map((x) => [String(x._id), x]));
      for (const e of aspettative.filter((x) => x.nome === nome)) {
        const letto = docs.get(String(e.id));
        for (const [k, v] of Object.entries(e.campi)) if (!uguali(letto?.[k], v)) differenze.push(`${nome}/${e.chiave}/${k}`);
      }
    }
    for (const m of metodi) {
      const lettoMetodo = await models.MetodoPrevisionale.findOne({ versione: m.versione }).lean();
      for (const [k, v] of Object.entries(m)) if (!uguali(lettoMetodo?.[k], v)) differenze.push(`MetodoPrevisionale/${m.versione}/${k}`);
    }
    report.differenzeDopo = differenze;
    report.stato = differenze.length ? "verifica_fallita" : "applicato_e_verificato";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
    if (differenze.length) throw new Error(`Verifica dopo aggiornamento: ${differenze.length} differenze`);
  } else fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ documenti: report.documenti, perCollezione: report.perCollezione,
    stato: report.stato, differenzeDopo: report.differenzeDopo?.length ?? null, report: reportPath }, null, 2));
}
if (require.main === module) {
  main().catch((e) => { console.error(`Aggiornamento non completato: ${e.message}`); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
module.exports = { canon, documentoAnalisi };
