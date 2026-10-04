const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { caricaFonti } = require("./lib/caricaFontiSemantiche");
const { CHIAVI, PESI_INIZIALI, creaScenario, valutaScenario, cercaPesi, aggrega } = require("../services/calibrazionePesi");
const VERSIONE = "risultati-calibrati-v1";

function calibra(cartella, passo = 1) {
  const f = caricaFonti(cartella);
  const circuiti = new Set(f.gare.filter((g) => g.year === 2026).map((g) => g.circuitId));
  const campioni = {
    versione: VERSIONE, fonte: "https://github.com/f1db/f1db/releases/tag/v2026.16.0", hashFonti: f.hash,
    ultimoRoundIncluso: f.ultimiGp.at(-1).round,
    gare: f.gare.filter((g) => g.year === 2026),
    risultati: f.risultati.filter((r) => r.year >= 2023 && r.year <= 2026 && circuiti.has(r.circuitId)).map((r) => ({
      raceId: r.raceId, year: r.year, round: r.round, circuitId: r.circuitId, driverId: r.driverId,
      constructorId: r.constructorId, positionNumber: r.positionNumber, positionText: r.positionText,
      positionDisplayOrder: r.positionDisplayOrder, reasonRetired: r.reasonRetired, laps: r.laps })),
    qualifiche: f.qualifiche.filter((r) => r.year === 2026).map((r) => ({
      raceId: r.raceId, year: r.year, round: r.round, circuitId: r.circuitId, driverId: r.driverId,
      constructorId: r.constructorId, positionNumber: r.positionNumber, positionText: r.positionText })),
    classificaPiloti: f.classificaPiloti.filter((r) => r.year === 2026).map((r) => ({ raceId: r.raceId,
      driverId: r.driverId, positionNumber: r.positionNumber })),
    numerosita: Object.fromEntries([...f.numerosita].filter(([id]) => campioneId(id, f.garePerId, circuiti))),
    mappingPiloti: f.pilotiF1db, mappingScuderie: f.scuderieF1db2026, mappingCircuiti: f.circuitiStorici,
  };
  function campioneId(id, gare, circuiti) {
    const g = gare.get(id); return g.year >= 2023 && g.year <= 2026 && circuiti.has(g.circuitId);
  }
  const args = { ...campioni, numerosita: new Map(Object.entries(campioni.numerosita).map(([id, n]) => [Number(id), n])) };
  const scenari = f.ultimiGp.map((gara) => creaScenario({ ...args, gara,
    partecipanti: campioni.risultati.filter((r) => r.raceId === gara.id).map(({ driverId, constructorId }) => ({ driverId, constructorId })) }));
  const avvio = Date.now();
  const ricerca = cercaPesi(scenari, passo, (n) => console.log(`Ricerca: ${n.toLocaleString("it-IT")} combinazioni; ${Math.round((Date.now()-avvio)/1000)} s`));
  const globale = ricerca.cumulativi.at(-1).pesi;
  const trainCount = 12;
  const congelati = ricerca.cumulativi[trainCount - 1].pesi;
  const mondo = [0, 0, 0, 0, 100];
  const report = scenari.map((s, i) => {
    const progressivi = i >= 3 ? ricerca.cumulativi[i - 1].pesi : PESI_INIZIALI;
    const varianti = { ottimoWeekend: ricerca.singoli[i].pesi, globale, iniziali: PESI_INIZIALI,
      mondiale: mondo, progressivo: progressivi, congelatoHoldout: congelati };
    const valutazioni = Object.fromEntries(Object.entries(varianti).map(([k, p]) => {
      const v = valutaScenario(s, p);
      return [k, { ...v, classifica: v.classifica.map(({ driverId, constructorId, posizione, indice }) =>
        ({ driverId, constructorId, posizione, indice })) }];
    }));
    if (valutazioni.ottimoWeekend.regolari.sommaErroriAssoluti !== ricerca.singoli[i].errore)
      throw new Error(`Ricerca e classifica non coincidono al round ${s.gara.round}`);
    return { round: s.gara.round, circuito: s.gara.circuitId, data: s.gara.date,
      limiteRoundEsclusivoInput: s.gara.round,
      limiteRoundEsclusivoTrainingProgressivo: s.gara.round,
      pesiOttimoWeekend: Object.fromEntries(CHIAVI.map((k, j) => [k, varianti.ottimoWeekend[j]])),
      pesiProgressivi: Object.fromEntries(CHIAVI.map((k, j) => [k, progressivi[j]])),
      esclusi: s.esclusi, classificazioneReale: s.reali.map(({ driverId, constructorId, positionDisplayOrder, positionNumber, positionText, reasonRetired }) =>
        ({ driverId, constructorId, posizioneOrdine: positionDisplayOrder, posizione: positionNumber, stato: positionText, causaRitiro: reasonRetired })), valutazioni,
      fattoriPrimaGara: s.fattori.map(({ driverId, constructorId, campi, valori }) => ({ driverId, constructorId, campi, valori })) };
  });
  const sintetizza = (elenco, k) => ({ regolari: aggrega(elenco.map((g) => g.valutazioni[k]), "regolari"),
    completa: aggrega(elenco.map((g) => g.valutazioni[k]), "completa") });
  const riepilogo = (elenco, nomi) => Object.fromEntries(nomi.map((k) => [k, sintetizza(elenco, k)]));
  const holdout = riepilogo(report.slice(trainCount), ["congelatoHoldout", "iniziali", "mondiale"]);
  const progressivo = riepilogo(report.slice(3), ["progressivo", "iniziali", "mondiale"]);
  const complessivo = riepilogo(report, ["ottimoWeekend", "globale", "iniziali", "mondiale"]);
  const miglioreSulTest = holdout.congelatoHoldout.regolari.erroreAssolutoMedio < holdout.mondiale.regolari.erroreAssolutoMedio;
  const miglioreProgressivo = progressivo.progressivo.regolari.erroreAssolutoMedio < progressivo.mondiale.regolari.erroreAssolutoMedio;
  // Regola di adozione fissata nel codice prima della ricerca; il test non sceglie i pesi.
  const adotta = miglioreSulTest && miglioreProgressivo;
  const adottati = adotta ? globale : mondo;
  const pesi = Object.fromEntries(CHIAVI.map((k, i) => [k, adottati[i]]));
  const campioniJson = JSON.stringify(campioni, null, 2) + "\n";
  const risultato = {
    versione: VERSIONE, stato: adotta ? "calibrato_retrospettivo" : "riferimento_mondiale",
    calcolatoIl: "2026-10-05", fonte: campioni.fonte, hashFonti: f.hash,
    sha256Campioni: createHash("sha256").update(campioniJson).digest("hex"),
    ricerca: { passoPercentuale: passo, combinazioni: ricerca.combinazioni, pareggi: "Minima distanza L1 dai pesi iniziali; poi ordine deterministico della griglia" },
    pesi, pesiOttimiInteraStagione: Object.fromEntries(CHIAVI.map((k, i) => [k, globale[i]])),
    pesiCongelatiTrainingRound1a12: Object.fromEntries(CHIAVI.map((k, i) => [k, congelati[i]])),
    protocollo: {
      obiettivo: "Minimizzare la somma degli errori assoluti di posizione tra gli esiti regolari; classifiche ristrette agli stessi piloti. Media aggregata pesata sul numero di esiti.",
      outlier: "Esclusione uniforme per cause di ritiro documentate o DSQ/EX/DNS/DNF/NC, indipendente dal favorito o dall'errore del modello. Cause non specificate non vengono attribuite a guasti. Incidenti inclusi nelle esclusioni, responsabilità non dedotta.",
      limiti: "Filtro degli esiti noto dopo la gara: valuta il rendimento condizionato a esiti regolari, non l'accuratezza della classifica integrale. Danni, errori o penalità di piloti classificati senza causa documentata non sono esclusi arbitrariamente.",
      riferimento: "Mondiale precedente fra i presenti; piloti senza un dato mondiale ricevono la prior neutra 50. Non è una probabilità né il punteggio mondiale.",
      primaGara: "Tutti i fattori usano soltanto round precedenti e storico dei 3 anni precedenti. Nel primo GP i fattori 2026 restano neutri.",
      verificaTemporale: "Walk-forward round 4–16: training soltanto sulle gare precedenti. Holdout fisso round 13–16: pesi congelati dopo round 12. La calibrazione finale su tutti i 16 GP è in-sample.",
      adozione: "Calibrazione finale adottata soltanto se sia holdout fisso sia walk-forward migliorano la MAE regolare rispetto al mondiale. Altrimenti adottato il mondiale, candidato conservato come sperimentale. Nessuna prova di significatività con questo piccolo campione.",
      datiEsclusi: ["compatibilità tecnica editoriale senza snapshot pre-gara", "similarità tecnica senza snapshot pre-gara", "meteo storico non archiviato", "beneficio upgrade non misurato", "passo cronometrico", "degrado gomme", "penalità non archiviate prima della gara"],
      caveat: "Release F1DB revisionata dopo gli eventi ed entry list finale utilizzate per ricostruire lo scenario; nessuna affermazione di previsione originale salvata nel weekend.",
    },
    complessivo, holdout, progressivo, gp: report,
  };
  fs.writeFileSync(path.join(__dirname, "../data/campioni-previsionali-2026.json"), campioniJson);
  fs.writeFileSync(path.join(__dirname, "../data/calibrazione-pesi-2026-10-05.json"), JSON.stringify(risultato, null, 2) + "\n");
  console.log(JSON.stringify({ ricerca: risultato.ricerca, pesi: risultato.pesi, globale: risultato.pesiOttimiInteraStagione,
    stato: risultato.stato, complessivo, holdout, progressivo, durataSecondi: (Date.now()-avvio)/1000 }, null, 2));
  return risultato;
}
if (require.main === module) {
  try { calibra(process.argv[2], Number(process.argv[3] || 1)); } catch (e) { console.error(e.stack); process.exitCode = 1; }
}
module.exports = { calibra };
