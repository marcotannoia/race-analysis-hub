const assert = require("node:assert/strict");
const test = require("node:test");
const dati = require("../data/dati-iniziali.json");
const {
  creaProfiloCircuito,
  creaProfiloScuderia,
} = require("../services/profiliTecnici");

const scuderie = dati.scuderie.map(
  ({ slug, nome, abbreviazione, colore }) => ({
    slug,
    nome,
    abbreviazione,
    colore,
  }),
);

test("espone un profilo tecnico completo per ogni scuderia", () => {
  for (const scuderia of scuderie) {
    const profilo = creaProfiloScuderia(scuderia.slug);
    assert.equal(profilo.capacita.length, 10);
    assert.equal(profilo.puntiForza.length, 3);
    assert.equal(profilo.areeSensibili.length, 2);
    assert.ok(profilo.fonti.every((fonte) => fonte.startsWith("https://")));
  }
});

test("calcola la compatibilita Monza dai requisiti tecnici e non dalla classifica", () => {
  const invertite = [...scuderie].reverse();
  const profilo = creaProfiloCircuito("italia-monza", invertite);

  assert.equal(profilo.compatibilita.length, 11);
  assert.equal(profilo.compatibilita[0].scuderia.slug, "mercedes");
  assert.ok(
    profilo.compatibilita.every(
      (voce, indice, elenco) => indice === 0 || elenco[indice - 1].indice >= voce.indice,
    ),
  );
  assert.equal(profilo.documentoCircuito, null);
});

test('localizza tutti i circuiti e i metodi senza alterare dati e indici', () => {
  const circuiti = require('../data/circuiti-tecnici-2026.json');
  for (const lingua of ['en', 'fr', 'pt', 'es', 'de']) {
    for (const slug of Object.keys(circuiti.circuiti)) {
      const italiano = creaProfiloCircuito(slug, scuderie);
      const localizzato = creaProfiloCircuito(slug, scuderie, null, lingua);
      assert.equal(localizzato.caratteristiche.length, italiano.caratteristiche.length);
      localizzato.caratteristiche.forEach((testo, indice) => assert.notEqual(testo, italiano.caratteristiche[indice]));
      assert.notEqual(localizzato.metodo, italiano.metodo);
      assert.deepEqual(localizzato.dati, italiano.dati);
      assert.deepEqual(localizzato.compatibilita, italiano.compatibilita);
      assert.deepEqual(localizzato.fonti, italiano.fonti);
    }
    assert.notEqual(creaProfiloScuderia('mercedes', lingua).metodo, creaProfiloScuderia('mercedes').metodo);
  }
  assert.deepEqual(creaProfiloCircuito('italia-monza', scuderie, null, 'en').caratteristiche, [
    'Maximum speed and minimum drag', 'Heavy braking from high speed', 'Traction and stability over chicane kerbs',
  ]);
});

test('il controllo traduzioni rileva caratteristiche assenti o rimaste in italiano', () => {
  const { verificaProfiliTecnici } = require('../i18n/verificaProfiliTecnici');
  assert.deepEqual(verificaProfiliTecnici(), []);
  const catalogo = structuredClone(require('../i18n/profiliTecnici.json'));
  delete catalogo.fr.circuiti['italia-monza'];
  catalogo.en.circuiti['italia-monza'][0] = 'Massima velocità e minimo drag';
  assert.equal(verificaProfiliTecnici(catalogo).length, 2);
});
