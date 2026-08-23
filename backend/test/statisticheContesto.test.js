const test = require("node:test");
const assert = require("node:assert/strict");
const statistiche = require("../data/statistiche-contesto.json");
const {
  indicatoriPilota,
  presentaIndicatori,
  sommaStatistiche,
} = require("../services/statisticheContesto");

test("la percentuale sul bagnato usa le prestazioni positive nelle gare con pioggia", () => {
  const hamilton = indicatoriPilota("hamilton");
  assert.equal(hamilton.bravuraBagnatoPercentuale, 71.4);
  assert.equal(hamilton.gareConPioggiaPositive, 35);
  assert.equal(hamilton.gareConPioggiaDisputate, 49);
  assert.equal(hamilton.erroriPilotaPercentuale, 3.8);
  assert.equal(hamilton.erroriFataliPercentuale, 1.3);
});

test("Leclerc non viene valutato soltanto in base alle vittorie sul bagnato", () => {
  const leclerc = indicatoriPilota("leclerc");

  assert.equal(statistiche.piloti.leclerc.vittorieConPioggia, 0);
  assert.equal(leclerc.gareConPioggiaPositive, 12);
  assert.equal(leclerc.gareConPioggiaDisputate, 20);
  assert.equal(leclerc.bravuraBagnatoPercentuale, 60);
});

test("gli errori fatali sono rapportati a tutte le gare e non agli errori", () => {
  const indicatori = presentaIndicatori({
    gareDisputate: 100,
    gareConPioggiaDisputate: 10,
    gareConPioggiaPositive: 6,
    vittorieConPioggia: 2,
    erroriPilota: 20,
    erroriFatali: 5,
  });

  assert.deepEqual(indicatori, {
    bravuraBagnatoPercentuale: 60,
    gareConPioggiaPositive: 6,
    gareConPioggiaDisputate: 10,
    erroriPilotaPercentuale: 20,
    erroriFataliPercentuale: 5,
  });
});

test("l'indicatore scuderia è un aggregato ponderato dei piloti attuali", () => {
  const aggregato = sommaStatistiche([
    statistiche.piloti.hamilton,
    statistiche.piloti.leclerc,
  ]);
  const indicatori = presentaIndicatori(aggregato);

  assert.equal(indicatori.bravuraBagnatoPercentuale, 68.1);
  assert.equal(indicatori.gareConPioggiaPositive, 47);
  assert.equal(indicatori.gareConPioggiaDisputate, 69);
  assert.ok(indicatori.erroriFataliPercentuale <= indicatori.erroriPilotaPercentuale);
});

test("tutti i piloti rispettano i vincoli delle percentuali", () => {
  for (const slug of Object.keys(statistiche.piloti)) {
    const indicatori = indicatoriPilota(slug);
    assert.ok(indicatori.bravuraBagnatoPercentuale >= 0, slug);
    assert.ok(indicatori.bravuraBagnatoPercentuale <= 100, slug);
    assert.ok(
      indicatori.gareConPioggiaPositive <=
        indicatori.gareConPioggiaDisputate,
      slug,
    );
    assert.ok(
      indicatori.erroriFataliPercentuale <= indicatori.erroriPilotaPercentuale,
      slug,
    );
    if (indicatori.erroriPilotaPercentuale > 0) {
      assert.ok(
        indicatori.erroriFataliPercentuale < indicatori.erroriPilotaPercentuale,
        `${slug}: gli errori fatali devono restare inferiori agli errori generali`,
      );
    }
  }
});
