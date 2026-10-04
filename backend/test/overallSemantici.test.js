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
