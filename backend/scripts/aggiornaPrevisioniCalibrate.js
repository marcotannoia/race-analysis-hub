const fs = require("node:fs");
const path = require("node:path");
const { creaClassificaCalibrata } = require("../services/classificaCalibrata");
const { creaDatiEffettivi } = require("../utils/datiEffettivi");
const calibrazione = require("../data/calibrazione-pesi-2026-10-05.json");
function aggiorna() {
  const file = path.join(__dirname, "../data/dati-iniziali.json");
  const base = JSON.parse(fs.readFileSync(file));
  const d = creaDatiEffettivi(base);
  const scuderie = d.scuderie, tm = new Map(scuderie.map((s) => [s.slug, s]));
  const piloti = d.piloti.map((p) => ({ ...p, scuderia: tm.get(p.scuderiaSlug) }));
  const pm = new Map(piloti.map((p) => [p.slug, p]));
  for (const g of base.gare) {
    const analisiPiloti = d.analisiGare.filter((a) => a.garaSlug === g.slug).map((a) => ({
      ...a, pilota: pm.get(a.pilotaSlug), scuderia: tm.get(a.scuderiaSlug) }));
    const args = { gara: g, piloti, scuderie, analisiPiloti };
    const ufficiale = creaClassificaCalibrata(args);
    const candidata = creaClassificaCalibrata({ ...args, pesi: calibrazione.pesiOttimiInteraStagione });
    const compatta = (output) => output.classifica.map((p) => ({ pilota: p.pilota.slug, scuderia: p.scuderia.slug,
      posizione: p.posizione, indice: p.indice, fattori: p.fattori }));
    g.previsioneCalibrata = { versione: calibrazione.versione, calcolatoIl: calibrazione.calcolatoIl,
      stato: calibrazione.stato, limiteRoundEsclusivoInput: g.ordineCalendario,
      roundTrainingPesi: 16, retrospettivo: g.ordineCalendario <= 16,
      pesi: calibrazione.pesi, pesiCandidata: calibrazione.pesiOttimiInteraStagione,
      classifica: compatta(ufficiale), candidataNonPromossa: calibrazione.stato === "riferimento_mondiale" ? compatta(candidata) : null,
      limite: "Selezione del metodo ricostruita dopo round 16; non previsione originale per gli eventi passati. Il candidato ottimizza gli esiti regolari ma non supera il controllo cronologico fisso." };
  }
  fs.writeFileSync(file, JSON.stringify(base, null, 2) + "\n");
  console.log(`Previsioni e candidato calibrato salvati per ${base.gare.length} GP`);
}
if (require.main === module) aggiorna();
module.exports = { aggiorna };
