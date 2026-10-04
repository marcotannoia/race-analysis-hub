const test = require("node:test");
const assert = require("node:assert/strict");
const { probabilitaNellaFascia } = require("../services/meteoGp");

test("seleziona il picco orario solo nella fascia della gara", () => {
  const hourly = {
    time: ["2026-10-11T11:00", "2026-10-11T12:00", "2026-10-11T13:00", "2026-10-11T14:00", "2026-10-11T15:00"],
    precipitation_probability: [100, 95, 72, 61, 99],
  };
  assert.equal(
    probabilitaNellaFascia(hourly, Date.parse("2026-10-11T12:00Z"), Date.parse("2026-10-11T14:00Z")),
    72,
  );
  assert.equal(probabilitaNellaFascia(hourly, Date.parse("2026-10-12T12:00Z"), Date.parse("2026-10-12T14:00Z")), null);
});


test("timestamp UTC espliciti e probabilità fuori intervallo non alterano il picco", () => {
  const hourly = { time: ["2026-10-11T13:00Z", "2026-10-11T14:00+00:00"], precipitation_probability: [72, 101] };
  assert.equal(probabilitaNellaFascia(hourly, Date.parse("2026-10-11T12:00Z"), Date.parse("2026-10-11T14:00Z")), 72);
});
