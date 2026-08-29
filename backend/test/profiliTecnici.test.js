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
