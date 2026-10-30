// Mai il database reale: salvaModifiche scrive solo con DATA_PROVIDER=postgres.
process.env.DATA_PROVIDER = "mongo";
const test = require("node:test");
const assert = require("node:assert/strict");
const { applicaModifiche, percentualePenalita, salvaModifiche } = require("../services/modificheDashboard");

const voce = (slug, indice, posizione) => ({ pilota: { slug, nome: slug }, indice, posizione });
const risultato = () => ({ gara: { slug: "gp-test" }, classifica: [voce("a", 80, 1), voce("b", 78, 2), voce("c", 70, 3)] });

test("scala penalità: 3→2%, 5→5%, 10→10%, dal fondo 20%, intermedi interpolati", () => {
  assert.equal(percentualePenalita(3), 2);
  assert.equal(percentualePenalita(5), 5);
  assert.equal(percentualePenalita(10), 10);
  assert.equal(percentualePenalita(20), 20);
  assert.equal(percentualePenalita(4), 3.5);
});

test("penalità e spostamenti riordinano la classifica pubblica", async () => {
  await salvaModifiche("gp-test", { penalita: { a: { posti: 10 } }, manuale: { c: 20 } });
  const { classifica } = applicaModifiche(risultato());
  assert.deepEqual(classifica.map((v) => v.pilota.slug), ["c", "b", "a"]);
  assert.equal(classifica[2].indice, 72);
  assert.equal(classifica[2].modificheDashboard.posizioneModello, 1);
  assert.deepEqual(classifica.map((v) => v.posizione), [1, 2, 3]);
});

test("modifiche di un altro GP e campi non validi vengono ignorati", async () => {
  await salvaModifiche("gp-test", { penalita: { "A B": { posti: 5 }, b: { posti: 999, dalFondo: "si" } }, manuale: { a: "x" } });
  const altro = applicaModifiche({ ...risultato(), gara: { slug: "altro" } });
  assert.equal(altro.classifica[0].indice, 80);
  const { classifica } = applicaModifiche(risultato());
  assert.equal(classifica.find((v) => v.pilota.slug === "b").modificheDashboard.penalita.posti, 20);
  assert.equal(classifica.find((v) => v.pilota.slug === "a").modificheDashboard.spostamentoManuale, 0);
});
