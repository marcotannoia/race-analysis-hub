// Indici descrittivi dai risultati: non misurano passo, degrado o capacità tecniche.
const PESI_SEMANTICI = Object.freeze({
  rendimentoRecente: 45,
  qualificaRecente: 30,
  rendimentoScuderia: 20,
  storicoCircuito: 5,
});
const VERSIONE = "risultati-semantici-v1";
const FONTE = "https://github.com/f1db/f1db/releases/tag/v2026.16.0";
const round = (x) => Math.round(x * 10) / 10;
const media = (xs) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
const ordinaCronologicamente = (righe) => [...righe].sort((a, b) =>
  a.year - b.year || a.round - b.round || (a.positionDisplayOrder || 0) - (b.positionDisplayOrder || 0));
const regolare = (r) => Number.isInteger(r?.positionNumber) && r.positionNumber >= 1 &&
  !r.reasonRetired && !["DSQ", "EX", "DNS", "DNF", "NC"].includes(r.positionText);

function indicePosizione(posizione, partecipanti) {
  if (!Number.isInteger(posizione) || !Number.isInteger(partecipanti) || partecipanti < 2 || posizione < 1 || posizione > partecipanti) return null;
  return round(100 * (partecipanti - posizione) / (partecipanti - 1));
}

function descriviCampione(righe, tipo = "gara", numerosita = new Map()) {
  const valide = righe.filter(tipo === "gara" ? regolare : (r) =>
    Number.isInteger(r.positionNumber) && !["DSQ", "EX"].includes(r.positionText))
    .filter((r) => indicePosizione(r.positionNumber, numerosita.get(r.raceId) || 22) !== null);
  const valori = valide.map((r) => indicePosizione(r.positionNumber, numerosita.get(r.raceId) || 22))
    .filter(Number.isFinite);
  return {
    overall: valori.length ? round(media(valori)) : null,
    campione: valori.length,
    osservazioni: righe.length,
    mediaPosizione: valide.length ? round(media(valide.map((r) => r.positionNumber))) : null,
    ritiri: tipo === "gara" ? righe.filter((r) => r.reasonRetired || ["DNF", "NC"].includes(r.positionText)).length : 0,
    squalifiche: righe.filter((r) => ["DSQ", "EX"].includes(r.positionText)).length,
    fonti: [FONTE],
    stato: valori.length ? "derivato_da_risultati" : "dati_insufficienti",
    metodo: "Media di 100*(N-posizione)/(N-1); ritiri, DNS e DSQ esclusi dal rendimento. Non è passo gara.",
    ultimoDato: righe.length ? Math.max(...righe.map((r) => r.year)) : null,
  };
}

function campoNonMisurato(motivo, stato = "non_misurato", valoreEditoriale = null) {
  return { overall: null, campione: 0, stato, motivo, valoreEditoriale, utilizzabilePrevisione: false };
}

function completamento(righe) {
  const partenze = righe.filter((r) => !["DNS", "DNP", "DNQ", "DNPQ"].includes(r.positionText) &&
    (r.laps > 0 || r.reasonRetired || ["DNF", "NC", "DSQ", "EX"].includes(r.positionText) || Number.isInteger(r.positionNumber)));
  const completate = partenze.filter(regolare).length;
  return {
    overall: partenze.length ? round(100 * completate / partenze.length) : null,
    campione: partenze.length, completate,
    stato: partenze.length ? "derivato_da_risultati" : "dati_insufficienti",
    metodo: "Percentuale di partenze con esito regolare, inclusi incidenti e squalifiche fra gli esiti non regolari; NON affidabilità meccanica.",
    fonti: [FONTE],
  };
}

function trend(righe, numerosita) {
  const eventi = [...new Set(ordinaCronologicamente(righe).map((r) => r.raceId))];
  const ultimi = new Set(eventi.slice(-3)), precedenti = new Set(eventi.slice(-6, -3));
  const recente = descriviCampione(righe.filter((r) => ultimi.has(r.raceId)), "gara", numerosita);
  const prima = descriviCampione(righe.filter((r) => precedenti.has(r.raceId)), "gara", numerosita);
  return { ...recente, deltaOverall: recente.overall !== null && prima.overall !== null ?
    round(recente.overall - prima.overall) : null, confrontoPrecedente: prima,
    metodo: "Ultimi 3 GP con presenza contro i 3 precedenti; esiti regolari. Cambi di vettura e condizioni non isolati." };
}

// Ammorbidisce campioni piccoli verso 50 con due osservazioni convenzionali.
// Il 50 è una prior del modello, non un valore osservato salvato nei campi mancanti.
function attenua(campo) {
  return campo.overall === null ? 50 : (campo.overall * campo.campione + 50 * 2) / (campo.campione + 2);
}

function ordinaSemantico({ gara, partecipanti, risultati, qualifiche, numerosita }) {
  const passati = ordinaCronologicamente(risultati.filter((r) => r.year === gara.year && r.round < gara.round));
  const ultimeGare = [...new Set(passati.map((r) => r.raceId))].slice(-3);
  const recenti = new Set(ultimeGare);
  const qualPrima = qualifiche.filter((r) => r.year === gara.year && r.round < gara.round && recenti.has(r.raceId));
  // Indicizza una sola volta; evita scansioni dell'intero storico per ogni pilota.
  const indicizza = (righe, chiave) => {
    const mappa = new Map();
    for (const r of righe) {
      if (!mappa.has(r[chiave])) mappa.set(r[chiave], []);
      mappa.get(r[chiave]).push(r);
    }
    return mappa;
  };
  const recentiPilota = indicizza(passati.filter((r) => recenti.has(r.raceId)), "driverId");
  const recentiTeam = indicizza(passati.filter((r) => recenti.has(r.raceId)), "constructorId");
  const qualifichePilota = indicizza(qualPrima, "driverId");
  const storiciPilota = indicizza(risultati.filter((r) => r.circuitId === gara.circuitId &&
    r.year >= gara.year - 3 && r.year < gara.year), "driverId");
  const valutati = partecipanti.map((p) => {
    const campi = {
      rendimentoRecente: descriviCampione(recentiPilota.get(p.driverId) || [], "gara", numerosita),
      qualificaRecente: descriviCampione(qualifichePilota.get(p.driverId) || [], "qualifica", numerosita),
      rendimentoScuderia: descriviCampione(recentiTeam.get(p.constructorId) || [], "gara", numerosita),
      storicoCircuito: descriviCampione(storiciPilota.get(p.driverId) || [], "gara", numerosita),
    };
    const indice = Object.entries(PESI_SEMANTICI).reduce((s, [k, peso]) => s + attenua(campi[k]) * peso / 100, 0);
    return { ...p, indice, campi, coperturaPesi: Object.entries(PESI_SEMANTICI)
      .reduce((s, [k, peso]) => s + (campi[k].campione ? peso : 0), 0) };
  }).sort((a, b) => b.indice - a.indice || a.driverId.localeCompare(b.driverId));
  return valutati.map((p, i) => ({ posizione: i + 1, ...p, indice: round(p.indice) }));
}

function metricheOrdine(previsione, reale) {
  const pos = new Map(reale.map((p, i) => [p.driverId, i + 1]));
  const n = previsione.length;
  if (!n || n !== reale.length || pos.size !== n ||
    new Set(previsione.map((p) => p.driverId)).size !== n ||
    reale.some((p) => typeof p.driverId !== "string" || !p.driverId) ||
    previsione.some((p) => !pos.has(p.driverId))) throw new Error("Partecipanti del confronto diversi");
  const delta = previsione.map((p, i) => i + 1 - pos.get(p.driverId));
  return {
    piloti: n,
    sommaErroriAssoluti: delta.reduce((s, d) => s + Math.abs(d), 0),
    erroreAssolutoMedio: Math.round(media(delta.map(Math.abs)) * 1000) / 1000,
    spearman: n > 1 ? Math.round((1 - 6 * delta.reduce((s, d) => s + d*d, 0) / (n * (n*n - 1))) * 1000) / 1000 : null,
    vincitoreCorretto: previsione[0]?.driverId === reale[0]?.driverId,
    podioIndovinati: previsione.slice(0, 3).filter((p) => pos.get(p.driverId) <= 3).length,
    top10Indovinati: previsione.slice(0, 10).filter((p) => pos.get(p.driverId) <= 10).length,
  };
}

module.exports = {
  PESI_SEMANTICI, VERSIONE, FONTE, media, regolare, round, indicePosizione,
  descriviCampione, attenua, campoNonMisurato, completamento, trend, ordinaSemantico, metricheOrdine,
};
