const test = require("node:test");
const assert = require("node:assert/strict");
const {
  verificaAggiornamento,
} = require("../scripts/registraGpConcluso");

const gara = { stagione: 2026, slug: "canada" };
const piloti = [{ slug: "hamilton" }];
const scuderie = [{ slug: "ferrari" }];

function creaAggiornamento() {
  return {
    stagione: 2026,
    garaConclusaSlug: "canada",
    conclusaIl: "2026-06-14T20:00:00.000Z",
    condizioniGara: "misto",
    fonteIndicatori: "https://www.formula1.com/risultato-verificato",
    risultatiPiloti: [
      {
        pilotaSlug: "hamilton",
        posizioneGara: "P1",
        posizioneQualifica: "Q2",
        errorePilota: "nessuno",
      },
    ],
    risultatiScuderie: [{ scuderiaSlug: "ferrari" }],
    classificaPiloti: [
      { pilotaSlug: "hamilton", posizione: 1, punti: 100, vittorie: 2 },
    ],
    classificaScuderie: [
      { scuderiaSlug: "ferrari", posizione: 1, punti: 180, vittorie: 3 },
    ],
  };
}

test("l'aggiornamento post-GP richiede condizioni, fonte ed errore pilota validi", () => {
  assert.doesNotThrow(() =>
    verificaAggiornamento(creaAggiornamento(), gara, piloti, scuderie),
  );
});

test("l'aggiornamento post-GP rifiuta una classificazione meteo sconosciuta", () => {
  const aggiornamento = creaAggiornamento();
  aggiornamento.condizioniGara = "variabile";

  assert.throws(
    () => verificaAggiornamento(aggiornamento, gara, piloti, scuderie),
    /condizioniGara deve essere asciutto, misto o bagnato/,
  );
});

test("un DNS non può incrementare le statistiche degli errori in gara", () => {
  const aggiornamento = creaAggiornamento();
  aggiornamento.risultatiPiloti[0].posizioneGara = "DNS";
  aggiornamento.risultatiPiloti[0].errorePilota = "fatale";

  assert.throws(
    () => verificaAggiornamento(aggiornamento, gara, piloti, scuderie),
    /non ha preso il via non può avere un errore di gara/,
  );
});
