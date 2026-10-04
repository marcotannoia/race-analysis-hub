const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const mapping = require("../sincronizzaF1db");
const manifest = require("../../data/fonti-f1db-v2026.16.0.json");

function caricaFonti(cartella) {
  const hash = {};
  const leggi = (nome) => {
    const contenuto = fs.readFileSync(path.join(cartella, `f1db-${nome}.json`));
    hash[nome] = createHash("sha256").update(contenuto).digest("hex");
    if (hash[nome] !== manifest.hashFile[nome]) throw new Error(`File F1DB diverso dalla release verificata v2026.16.0: ${nome}`);
    return JSON.parse(contenuto);
  };
  const gare = leggi("races"), garePerId = new Map(gare.map((r) => [r.id, r]));
  const normalizza = (nome) => [...mapping.indicizzaRisultati(leggi(nome)).values()]
    .map((r) => ({ ...r, circuitoId: garePerId.get(r.raceId).circuitId,
      circuitId: garePerId.get(r.raceId).circuitId, data: garePerId.get(r.raceId).date }))
    .sort((a, b) => a.year - b.year || a.round - b.round || a.positionDisplayOrder - b.positionDisplayOrder);
  const risultati = normalizza("races-race-results");
  const qualifiche = normalizza("races-qualifying-results");
  const numerosita = new Map();
  for (const r of risultati) numerosita.set(r.raceId, (numerosita.get(r.raceId) || 0) + 1);
  const ultimiGp = gare.filter((g) => g.year === 2026 && numerosita.has(g.id)).sort((a, b) => a.round - b.round);
  return {
    gare, garePerId, risultati, qualifiche, numerosita, ultimiGp, hash,
    classificaPiloti: leggi("races-driver-standings"),
    classificaScuderie: leggi("races-constructor-standings"),
    piloti: leggi("drivers"), costruttori: leggi("constructors"), ...mapping,
  };
}
module.exports = { caricaFonti };
