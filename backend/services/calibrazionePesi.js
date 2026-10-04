const { ordinaSemantico, attenua, indicePosizione, metricheOrdine, regolare } = require("./overallSemantici");

// Solo fattori ricostruibili prima di ogni weekend, su una scala comune 0–100.
const CHIAVI = Object.freeze(["passoGaraRecente", "qualifica2026", "andamentoScuderiaRecente", "storicoPersonale", "andamento2026"]);
const CORRISPONDENZE = ["rendimentoRecente", "qualificaRecente", "rendimentoScuderia", "storicoCircuito"];
const PESI_INIZIALI = Object.freeze([45, 30, 20, 5, 0]);

function verificaPesi(pesi) {
  if (!Array.isArray(pesi) || pesi.length !== CHIAVI.length ||
    pesi.some((p) => !Number.isFinite(p) || p < 0 || p > 100) ||
    Math.abs(pesi.reduce((s, p) => s + p, 0) - 100) > 1e-8) throw new Error("Pesi non validi: cinque valori non negativi con somma 100");
}

function creaFattori({ gara, partecipanti, risultati, qualifiche, numerosita, classificaPiloti, gare }) {
  const campioni = ordinaSemantico({ gara, partecipanti, risultati, qualifiche, numerosita });
  const ultimoGp = gare.filter((g) => g.year === gara.year && g.round < gara.round &&
    classificaPiloti.some((r) => r.raceId === g.id)).sort((a, b) => b.round - a.round)[0];
  const mondiale = new Map(classificaPiloti.filter((r) => r.raceId === ultimoGp?.id && Number.isInteger(r.positionNumber) && r.positionNumber > 0).map((r) => [r.driverId, r.positionNumber]));
  const ordinati = [...partecipanti].sort((a, b) => (mondiale.get(a.driverId) ?? 999) -
    (mondiale.get(b.driverId) ?? 999) || a.driverId.localeCompare(b.driverId));
  const posizione = new Map(ordinati.map((p, i) => [p.driverId, i + 1]));
  return campioni.map((p) => {
    const campi = Object.fromEntries(CORRISPONDENZE.map((k, i) => [CHIAVI[i], p.campi[k]]));
    campi.andamento2026 = {
      overall: mondiale.has(p.driverId) ? indicePosizione(posizione.get(p.driverId), partecipanti.length) : null,
      campione: mondiale.has(p.driverId) ? 1 : 0,
      roundFonte: ultimoGp?.round ?? null,
      metodo: "Ordine mondiale precedente fra i partecipanti del weekend, normalizzato 0–100; assenza neutra.",
    };
    // Il mondiale è già un aggregato della stagione: nessuna attenuazione ulteriore.
    const valori = CORRISPONDENZE.map((k) => attenua(p.campi[k]));
    valori.push(campi.andamento2026.overall ?? 50);
    return { ...p, campi, valori };
  }).sort((a, b) => a.driverId.localeCompare(b.driverId));
}

function ordinaFattori(fattori, pesi) {
  verificaPesi(pesi);
  return fattori.map((p) => ({ ...p, indice: (p.valori[0]*pesi[0] + p.valori[1]*pesi[1] + p.valori[2]*pesi[2] + p.valori[3]*pesi[3] + p.valori[4]*pesi[4]) / 100 }))
    .sort((a, b) => b.indice - a.indice || a.driverId.localeCompare(b.driverId))
    .map((p, i) => ({ ...p, posizione: i + 1 }));
}

function creaScenario(args) {
  const reali = args.risultati.filter((r) => r.raceId === args.gara.id).sort((a, b) => a.positionDisplayOrder - b.positionDisplayOrder);
  const fattori = creaFattori(args);
  const regolari = new Set(reali.filter(regolare).map((r) => r.driverId));
  if (regolari.size < 2) throw new Error(`GP ${args.gara.round}: campione regolare insufficiente`);
  return { gara: args.gara, fattori, reali, regolari,
    esclusi: reali.filter((r) => !regolare(r)).map((r) => ({ driverId: r.driverId,
      stato: r.positionText, posizione: r.positionNumber, causa: r.reasonRetired || "Esito non regolare senza causa dettagliata" })) };
}

function valutaScenario(scenario, pesi) {
  const classifica = ordinaFattori(scenario.fattori, pesi);
  const ids = scenario.regolari;
  return { classifica, completa: metricheOrdine(classifica, scenario.reali),
    regolari: metricheOrdine(classifica.filter((p) => ids.has(p.driverId)), scenario.reali.filter((p) => ids.has(p.driverId))) };
}

// Stesso ordinamento di ordinaFattori, senza allocare oggetti nel ciclo di ricerca.
function erroreVeloce(scenario, pesi) {
  const righe = scenario.fattori.filter((p) => scenario.regolari.has(p.driverId));
  const reali = new Map(scenario.reali.filter((p) => scenario.regolari.has(p.driverId)).map((p, i) => [p.driverId, i]));
  const valori = righe.map((p) => p.valori), posizioni = righe.map((p) => reali.get(p.driverId));
  return creaValutatore(valori, posizioni)(pesi);
}

function creaValutatore(valori, posizioni) {
  const scores = new Float64Array(valori.length), ordine = new Int16Array(valori.length);
  return (pesi) => {
    for (let i = 0; i < valori.length; i++) {
      const v = valori[i];
      scores[i] = (v[0]*pesi[0] + v[1]*pesi[1] + v[2]*pesi[2] + v[3]*pesi[3] + v[4]*pesi[4]) / 100;
      // Insertion sort stabile: righe già in ordine driverId per gli indici uguali.
      let j = i - 1;
      while (j >= 0 && (scores[ordine[j]] < scores[i] || (scores[ordine[j]] === scores[i] && ordine[j] > i))) {
        ordine[j + 1] = ordine[j]; j--;
      }
      ordine[j + 1] = i;
    }
    let errore = 0;
    for (let i = 0; i < ordine.length; i++) errore += Math.abs(i - posizioni[ordine[i]]);
    return errore;
  };
}

function cercaPesi(scenari, passo = 1, avanza = () => {}) {
  if (!scenari.length) throw new Error("Nessuno scenario da calibrare");
  if (!Number.isInteger(passo) || passo < 1 || 100 % passo) throw new Error("Passo non valido");
  const valutatori = scenari.map((s) => {
    const righe = s.fattori.filter((p) => s.regolari.has(p.driverId));
    const reali = new Map(s.reali.filter((p) => s.regolari.has(p.driverId)).map((p, i) => [p.driverId, i]));
    return creaValutatore(righe.map((p) => p.valori), righe.map((p) => reali.get(p.driverId)));
  });
  const migliore = (n) => ({ errore: Infinity, distanza: Infinity, pesi: null, gp: n });
  const singoli = scenari.map(() => migliore(1));
  const cumulativi = scenari.map((_, i) => migliore(i + 1));
  const scelta = (best, errore, distanza, pesi) => {
    if (errore < best.errore || (errore === best.errore && distanza < best.distanza)) {
      best.errore = errore; best.distanza = distanza; best.pesi = [...pesi];
    }
  };
  let combinazioni = 0;
  const pesi = [0, 0, 0, 0, 0];
  function esplora(i, rimasti) {
    if (i < 4) {
      for (let v = 0; v <= rimasti; v += passo) { pesi[i] = v; esplora(i + 1, rimasti - v); }
      return;
    }
    pesi[4] = rimasti;
    const distanza = pesi.reduce((s, p, k) => s + Math.abs(p - PESI_INIZIALI[k]), 0);
    let cumulativo = 0;
    for (let g = 0; g < scenari.length; g++) {
      const errore = valutatori[g](pesi);
      cumulativo += errore;
      scelta(singoli[g], errore, distanza, pesi);
      scelta(cumulativi[g], cumulativo, distanza, pesi);
    }
    combinazioni++;
    if (combinazioni % 250000 === 0) avanza(combinazioni);
  }
  esplora(0, 100);
  return { passoPercentuale: passo, combinazioni, singoli, cumulativi };
}

function aggrega(valutazioni, campo) {
  const ms = valutazioni.map((v) => v[campo]);
  const piloti = ms.reduce((s, m) => s + m.piloti, 0);
  return { gp: ms.length, piloti,
    erroreAssolutoMedio: Math.round(ms.reduce((s, m) => s + m.sommaErroriAssoluti, 0) / piloti * 1000) / 1000,
    vincitoriIndovinati: ms.filter((m) => m.vincitoreCorretto).length,
    podiIndovinati: ms.reduce((s, m) => s + m.podioIndovinati, 0),
    postiPodioTotali: ms.reduce((s, m) => s + Math.min(m.piloti, 3), 0) };
}

module.exports = { CHIAVI, PESI_INIZIALI, verificaPesi, creaFattori, ordinaFattori, creaScenario, valutaScenario, cercaPesi, aggrega, erroreVeloce };
