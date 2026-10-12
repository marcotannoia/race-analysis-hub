const mongoose = require("mongoose");
const { normalizzaTestiAnnuali, normalizzaNotaBene } = require("./normalizzaNotaBene");
const { normalizzaTraduzioniAnalisi } = require("./normalizzaTraduzioni");

function canon(v) {
  if (v instanceof Date) return v.toISOString();
  if (v instanceof mongoose.Types.ObjectId) return v.toString();
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}

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

module.exports = { canon, documentoAnalisi };
