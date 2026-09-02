const statistiche = require("../data/statistiche-contesto.json");

function arrotondaPercentuale(numeratore, denominatore) {
  if (!Number.isFinite(denominatore) || denominatore <= 0) return 0;
  return Math.round((numeratore / denominatore) * 1000) / 10;
}

function sommaStatistiche(voci) {
  const campi = [
    "gareDisputate",
    "gareConPioggiaDisputate",
    "gareConPioggiaPositive",
    "vittorieConPioggia",
    "erroriPilota",
    "erroriFatali",
  ];

  return Object.fromEntries(
    campi.map((campo) => [
      campo,
      voci.reduce((totale, voce) => totale + (voce?.[campo] || 0), 0),
    ]),
  );
}

function presentaIndicatori(valori) {
  if (!valori) return null;

  const percentualeErrori = arrotondaPercentuale(
    valori.erroriPilota,
    valori.gareDisputate,
  );
  const percentualeErroriFatali = Math.min(
    percentualeErrori,
    arrotondaPercentuale(valori.erroriFatali, valori.gareDisputate),
  );

  return {
    bravuraBagnatoPercentuale: arrotondaPercentuale(
      valori.gareConPioggiaPositive,
      valori.gareConPioggiaDisputate,
    ),
    gareConPioggiaPositive: valori.gareConPioggiaPositive,
    gareConPioggiaDisputate: valori.gareConPioggiaDisputate,
    erroriPilotaPercentuale: percentualeErrori,
    erroriFataliPercentuale: percentualeErroriFatali,
  };
}

function indicatoriPilota(pilotaSlug) {
  return presentaIndicatori(statistiche.piloti[pilotaSlug]);
}

function indicatoriScuderia(piloti) {
  const voci = (piloti || []).map(
    (pilota) => statistiche.piloti[pilota.slug],
  );

  return voci.length && voci.every(Boolean)
    ? presentaIndicatori(sommaStatistiche(voci))
    : null;
}

module.exports = {
  indicatoriPilota,
  indicatoriScuderia,
  presentaIndicatori,
  sommaStatistiche,
};
