const test = require("node:test");
const assert = require("node:assert/strict");
const creaAndamentoAnnuale = require("../services/andamentoAnnuale");

const snapshot = {
  metadati: {
    fonte: "F1DB",
    releaseUrl: "https://github.com/f1db/f1db/releases/tag/v2026.12.0",
    licenza: "CC BY 4.0",
    licenzaUrl: "https://creativecommons.org/licenses/by/4.0/",
    versione: "v2026.12.0",
    trasformazioni: "Dati filtrati e normalizzati.",
  },
  andamento2026: {
    stagione: 2026,
    eventi: [
      {
        etichetta: "Australia",
        piloti: {
          leclerc: { codice: "LEC", gara: 3, qualifica: 2 },
        },
        scuderie: {
          ferrari: {
            gara: { LEC: 3, HAM: 4 },
            qualifica: { LEC: 2, HAM: 5 },
          },
        },
      },
      {
        etichetta: "Cina",
        piloti: {
          leclerc: { codice: "LEC", gara: null, qualifica: 5 },
        },
        scuderie: {
          ferrari: {
            gara: { LEC: null, HAM: 3 },
            qualifica: { LEC: 5, HAM: 1 },
          },
        },
      },
    ],
  },
};

test("crea il grafico pilota dai risultati F1DB", () => {
  const andamento = creaAndamentoAnnuale({
    stagione: 2026,
    pilotaSlug: "leclerc",
    snapshot,
  });

  assert.deepEqual(andamento.etichette, ["Australia", "Cina"]);
  assert.deepEqual(andamento.qualifica, [
    { nome: "LEC", valori: [2, 5] },
  ]);
  assert.deepEqual(andamento.gara, [
    { nome: "LEC", valori: [3, null] },
  ]);
  assert.deepEqual(andamento.fonte, {
    nome: "F1DB",
    url: "https://github.com/f1db/f1db/releases/tag/v2026.12.0",
    licenza: "CC BY 4.0",
    licenzaUrl: "https://creativecommons.org/licenses/by/4.0/",
    versione: "v2026.12.0",
    modifiche: "Dati filtrati e normalizzati.",
  });
});

test("crea le serie di tutti i piloti della scuderia", () => {
  const andamento = creaAndamentoAnnuale({
    stagione: 2026,
    scuderiaSlug: "ferrari",
    snapshot,
  });

  assert.deepEqual(andamento.qualifica, [
    { nome: "LEC", valori: [2, 5] },
    { nome: "HAM", valori: [5, 1] },
  ]);
  assert.deepEqual(andamento.gara, [
    { nome: "LEC", valori: [3, null] },
    { nome: "HAM", valori: [4, 3] },
  ]);
});

test("non usa lo snapshot per una stagione diversa", () => {
  const andamento = creaAndamentoAnnuale({
    stagione: 2025,
    pilotaSlug: "leclerc",
    snapshot,
  });

  assert.deepEqual(andamento.etichette, []);
  assert.deepEqual(andamento.qualifica, []);
  assert.deepEqual(andamento.gara, []);
  assert.equal(andamento.fonte, null);
});
