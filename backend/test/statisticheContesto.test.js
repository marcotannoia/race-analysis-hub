const test = require("node:test");
const assert = require("node:assert/strict");
const statistiche = require("../data/statistiche-contesto.json");
const {
  indicatoriPilota,
  presentaIndicatori,
  sommaStatistiche,
} = require("../services/statisticheContesto");

test("la bravura sul bagnato usa solo le gare bagnate o miste disputate", () => {
  const hamilton = indicatoriPilota("hamilton");
  assert.equal(hamilton.bravuraBagnatoPercentuale, 34);
  assert.equal(hamilton.erroriPilotaPercentuale, 3.8);
  assert.equal(hamilton.erroriFataliPercentuale, 1.3);
});

test("gli errori fatali sono rapportati a tutte le gare e non agli errori", () => {
  const indicatori = presentaIndicatori({
    gareDisputate: 100,
    gareBagnateDisputate: 5,
    gareMisteDisputate: 5,
    vittorieBagnato: 1,
    vittorieMiste: 1,
    erroriPilota: 20,
    erroriFatali: 5,
  });

  assert.deepEqual(indicatori, {
    bravuraBagnatoPercentuale: 20,
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

  assert.equal(indicatori.bravuraBagnatoPercentuale, 24.2);
  assert.ok(indicatori.erroriFataliPercentuale <= indicatori.erroriPilotaPercentuale);
});

test("tutti i piloti rispettano i vincoli delle percentuali", () => {
  for (const slug of Object.keys(statistiche.piloti)) {
    const indicatori = indicatoriPilota(slug);
    assert.ok(indicatori.bravuraBagnatoPercentuale >= 0, slug);
    assert.ok(indicatori.bravuraBagnatoPercentuale <= 100, slug);
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
