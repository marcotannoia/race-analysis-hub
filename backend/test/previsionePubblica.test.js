const { test } = require('node:test');
const assert = require('node:assert/strict');
const pubblica = require('../presenters/previsionePubblica');

test('public forecasts hide model weights for drivers and constructors without changing scores', () => {
  const row = { indice: 84, posizione: 1, fattori: [{ pesoPercentuale: 60, contributo: 50 }], dettagliFattori: { campione: 10 } };
  const forecast = { pesi: [{ pesoPercentuale: 60 }], classifica: [row], classificaScuderie: [row], meteo: { probabilitaPioggiaPercentuale: 40 } };
  const result = pubblica(forecast);
  assert.deepEqual(result, { classifica: [{ indice: 84, posizione: 1 }], classificaScuderie: [{ indice: 84, posizione: 1 }], meteo: { probabilitaPioggiaPercentuale: 40 } });
  assert.equal(forecast.classifica[0].fattori[0].pesoPercentuale, 60);
});
