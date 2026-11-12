const test = require("node:test");
const assert = require("node:assert/strict");
const { indicePosizione, descriviCampione, campoNonMisurato, completamento,
  ordinaSemantico, metricheOrdine, trend } = require("../services/overallSemantici");

const risultato = (driverId, round, positionNumber, extra = {}) => ({
  driverId, constructorId: "team", raceId: round, round, year: 2026,
  circuitId: "circuit", positionNumber, positionText: String(positionNumber), laps: 50, reasonRetired: null, ...extra,
});

test("gli overall assenti restano null e non vengono inventati come 50", () => {
  assert.equal(descriviCampione([]).overall, null);
  assert.equal(campoNonMisurato("Stint assenti").overall, null);
  assert.equal(campoNonMisurato("Stint assenti").utilizzabilePrevisione, false);
  assert.equal(indicePosizione(null, 22), null);
  assert.equal(indicePosizione(1, 22), 100);
  assert.equal(indicePosizione(22, 22), 0);
});

test("P20 con ritiro tecnico resta classificato ma non misura il rendimento sul giro", () => {
  const r = risultato("russell", 16, 20, { reasonRetired: "Power loss" });
  assert.equal(descriviCampione([r]).overall, null);
  assert.equal(descriviCampione([r]).ritiri, 1);
  assert.equal(completamento([r]).overall, 0);
  assert.match(completamento([r]).metodo, /NON affidabilità meccanica/);
});

test("DNS e squalifiche non diventano risultati regolari", () => {
  const rows = [risultato("a", 1, null, { positionText: "DNS", laps: 0 }),
    risultato("a", 2, null, { positionText: "DSQ" }), risultato("a", 3, 4)];
  assert.equal(completamento(rows).campione, 2);
  assert.equal(completamento(rows).overall, 50);
  assert.equal(descriviCampione(rows).campione, 1);
  assert.equal(descriviCampione(rows).squalifiche, 1);
});

test("risultati e qualifiche del GP target o successivi non contaminano il calcolo", () => {
  const partecipanti = [{ driverId: "a", constructorId: "team" }, { driverId: "b", constructorId: "team" }];
  const risultati = [risultato("a", 1, 1), risultato("b", 1, 2), risultato("a", 2, 1), risultato("b", 2, 2)];
  const args = { gara: { year: 2026, round: 3, circuitId: "circuit" }, partecipanti,
    risultati, qualifiche: risultati, numerosita: new Map([[1, 2], [2, 2]]) };
  const prima = ordinaSemantico(args);
  const dopo = ordinaSemantico({ ...args, risultati: [...risultati, risultato("a", 3, 22), risultato("b", 4, 1)],
    qualifiche: [...risultati, risultato("b", 3, 1)] });
  assert.deepEqual(dopo, prima);
  assert.equal(prima[0].driverId, "a");
});

test("i confronti misurano ordine, podio e vincitore separatamente", () => {
  const reale = ["a", "b", "c", "d"].map((driverId) => ({ driverId }));
  const previsto = ["b", "a", "d", "c"].map((driverId) => ({ driverId }));
  const m = metricheOrdine(previsto, reale);
  assert.equal(m.erroreAssolutoMedio, 1);
  assert.equal(m.vincitoreCorretto, false);
  assert.equal(m.podioIndovinati, 2);
  assert.equal(m.spearman, 0.6);
  assert.throws(() => metricheOrdine(previsto.slice(1), reale), /Partecipanti/);
});


test("ritiro al primo giro senza giri completati conta come partenza", () => {
  const r = risultato("a", 1, null, { laps: 0, positionText: "DNF", reasonRetired: "Collision" });
  assert.equal(completamento([r]).campione, 1);
  assert.equal(completamento([r]).overall, 0);
});

test("confronti vuoti e piloti duplicati non producono metriche valide", () => {
  assert.throws(() => metricheOrdine([], []), /Partecipanti/);
  assert.throws(() => metricheOrdine([{ driverId: "a" }, { driverId: "a" }], [{ driverId: "a" }, { driverId: "b" }]), /Partecipanti/);
  assert.throws(() => metricheOrdine([{ driverId: "a" }, { driverId: "b" }], [{ driverId: "a" }, { driverId: "a" }]), /Partecipanti/);
});

test("trend e previsioni sono indipendenti dall'ordine delle righe sorgenti", () => {
  const risultati = Array.from({ length: 6 }, (_, i) => risultato("a", i + 1, i + 1));
  const args = { gara: { year: 2026, round: 7, circuitId: "circuit" },
    partecipanti: [{ driverId: "a", constructorId: "team" }], risultati,
    qualifiche: risultati, numerosita: new Map() };
  assert.deepEqual(trend([...risultati].reverse()), trend(risultati));
  assert.deepEqual(ordinaSemantico({ ...args, risultati: [...risultati].reverse(), qualifiche: [...risultati].reverse() }), ordinaSemantico(args));
});

test("storico sul circuito v2: una sola edizione viene attirata verso la stagione, in modo idempotente", () => {
  const { attenuaStorico, attenuaStoriciAnalisi } = require("../services/overallSemantici");
  const una = attenuaStorico({ overall: 100, campione: 1, metodo: "m" }, { overall: 50 });
  assert.equal(una.overall, 62.5);
  assert.equal(una.overallOsservato, 100);
  assert.deepEqual(attenuaStorico(una, { overall: 50 }), una);
  assert.equal(attenuaStorico(una, null).overall, 100);
  assert.equal(attenuaStorico({ overall: null, campione: 0 }, { overall: 70 }).overall, null);
  const molte = attenuaStorico({ overall: 80, campione: 30 }, { overall: 20 });
  assert.ok(molte.overall > 74 && molte.overall < 80);
  const analisi = attenuaStoriciAnalisi({ overallSemantici: { stagioneCorrente: { rendimento: { overall: 40 }, qualifica: { overall: 60 } },
    campi: { risultatiGara: { overall: 0, campione: 1 }, risultatiQualifica: { overall: 100, campione: 2 } } } });
  assert.equal(analisi.overallSemantici.campi.risultatiGara.overall, 30);
  assert.equal(analisi.overallSemantici.campi.risultatiQualifica.overall, 76);
});

test("stima v2 di passo e gomme: niente 0 o 100 da una sola gara, recenza sul passo", () => {
  const { stimaEvidenze } = require("../services/evidenzePrestazioni");
  const sessione = (round, passo, gomme, giri = 20) => ({ year: 2026, round, circuitId: "c", sessionKey: round,
    fonti: { laps: { url: "l" }, stints: { url: "s" } },
    piloti: [{ driverId: "x", passo: { overall: passo, campione: giri, deltaMedianoPercentuale: 0 },
      gomme: { overall: gomme, stint: [], stintComparabili: [], pendenzaRelativaPercentualePerGiro: 0 } }] });
  const una = [sessione(5, 100, 0)];
  assert.equal(stimaEvidenze(una, "passo", 6).overall, 75);
  assert.equal(stimaEvidenze(una, "passo", 6).overallOsservato, 100);
  assert.ok(stimaEvidenze(una, "gomme", 6).overall > 0);
  const vecchiaBuona = [sessione(1, 100, 50), sessione(10, 0, 50)];
  assert.ok(stimaEvidenze(vecchiaBuona, "passo", 11).overall < 50, "la gara recente pesa di più");
  const pochiGiri = stimaEvidenze([sessione(5, 100, 50, 5)], "passo", 6).overall;
  assert.ok(pochiGiri < 75, "pochi giri comparabili pesano meno");
  assert.equal(stimaEvidenze([], "passo", 6).overall, null);
});
