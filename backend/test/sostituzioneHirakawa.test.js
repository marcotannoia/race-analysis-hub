const test = require('node:test');
const assert = require('node:assert/strict');
const { preparaSostituzione } = require('../scripts/configuraHirakawaFuturi');

test('sostituzione futura: usa solo i dati personali di Hirakawa e conserva lo storico di Ocon', () => {
  const doc = (collection_name, payload) => ({ collection_name, mongo_id: payload._id, payload });
  const documents = [doc('piloti', { _id: 'o', slug: 'ocon', scuderia: 'h' }),
    doc('piloti', { _id: 'r', slug: 'hirakawa', scuderia: 'h' }),
    doc('gare', { _id: 'passata', slug: 'messico', stagione: 2026, ordineCalendario: 19, stato: 'conclusa' }),
    doc('gare', { _id: 'futura', slug: 'usa-las-vegas', stagione: 2026, ordineCalendario: 21, stato: 'attuale' }),
    doc('analisiGare', { _id: 'old', gara: 'passata', pilota: 'o', scuderia: 'h', storicoEdizioni: [{ stagione: 2026, posizioneGara: 'P1' }] }),
    doc('analisiGare', { _id: 'new', gara: 'futura', pilota: 'o', scuderia: 'h', penalita: 'Penalità personale Ocon',
      storicoEdizioni: [{ stagione: 2025, posizioneGara: 'P1' }], overallSemantici: { campi: { risultatiGara: { overall: 100 } } } })];
  const runtime = { campioni: { fonte: 'https://example.com/release', ultimoRoundIncluso: 20, mappingPiloti: { hirakawa: 'ryo-hirakawa' },
    numerosita: { 19: 22 }, risultati: [
      { driverId: 'ryo-hirakawa', year: 2026, round: 19, raceId: 19, positionNumber: 10, positionText: '10' },
      { driverId: 'esteban-ocon', year: 2026, round: 18, raceId: 18, positionNumber: 1, positionText: '1' },
      { driverId: 'ryo-hirakawa', year: 2026, round: 22, raceId: 22, positionNumber: 1, positionText: '1' }],
    qualifiche: [{ driverId: 'ryo-hirakawa', year: 2026, round: 19, raceId: 19, positionNumber: 18, positionText: '18' }] },
    evidenze: { versione: 'test', sessioni: [], metodo: { limiti: [] } } };
  const prima = structuredClone(documents), piano = preparaSostituzione(documents, runtime);
  assert.deepEqual(documents, prima);
  assert.equal(piano.modifiche.length, 1);
  const a = piano.modifiche[0].payload, o = a.overallSemantici;
  assert.equal(a._id, 'new'); assert.equal(a.pilota, 'r');
  assert.equal(a.penalita, ''); assert.deepEqual(a.storicoEdizioni, []);
  assert.equal(o.stagioneCorrente.rendimento.campione, 1);
  assert.equal(o.stagioneCorrente.rendimento.mediaPosizione, 10);
  assert.equal(o.stagioneCorrente.qualifica.mediaPosizione, 18);
  assert.equal(o.campi.risultatiGara.overall, null);
  assert.equal(o.campi.risultatiQualifica.overall, null);
  assert.equal(o.campi.passoGara.overall, null);
  assert.equal(a.partecipazione.confermaUfficiale, false);
  for (const lang of ['it', 'en', 'fr', 'pt', 'es', 'de']) assert.ok(a.traduzioni[lang].spiegazionePosizioni[2026].length);
  const aggiornati = documents.map(d => d.mongo_id === 'new' ? piano.modifiche[0] : d);
  assert.equal(preparaSostituzione(aggiornati, runtime).modifiche.length, 0);
});
