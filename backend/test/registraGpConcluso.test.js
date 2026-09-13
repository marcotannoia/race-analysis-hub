const test = require("node:test");
const assert = require("node:assert/strict");
const {
  creaRisultatiScuderie,
  prestazionePioggiaPositiva,
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

test("la prestazione con pioggia confronta compagno e rivali di top 10", () => {
  const grigliaPiloti = [
    { slug: "leclerc", scuderia: "ferrari" },
    { slug: "hamilton", scuderia: "ferrari" },
    { slug: "norris", scuderia: "mclaren" },
    { slug: "verstappen", scuderia: "red-bull" },
    { slug: "russell", scuderia: "mercedes" },
    { slug: "fondo-classifica", scuderia: "alpine" },
  ];
  const risultati = new Map([
    ["leclerc", { posizioneGara: "P4" }],
    ["hamilton", { posizioneGara: "P2" }],
    ["norris", { posizioneGara: "P6" }],
    ["verstappen", { posizioneGara: "P3" }],
    ["russell", { posizioneGara: "P7" }],
    ["fondo-classifica", { posizioneGara: "P20" }],
  ]);
  const classifica = [
    { pilotaSlug: "leclerc", posizione: 4 },
    { pilotaSlug: "hamilton", posizione: 3 },
    { pilotaSlug: "norris", posizione: 2 },
    { pilotaSlug: "verstappen", posizione: 1 },
    { pilotaSlug: "russell", posizione: 5 },
    { pilotaSlug: "fondo-classifica", posizione: 18 },
  ];

  assert.equal(
    prestazionePioggiaPositiva(
      grigliaPiloti[0],
      grigliaPiloti,
      risultati,
      classifica,
    ),
    true,
  );

  risultati.set("norris", { posizioneGara: "P3" });
  risultati.set("verstappen", { posizioneGara: "P5" });
  risultati.set("russell", { posizioneGara: "P2" });
  assert.equal(
    prestazionePioggiaPositiva(
      grigliaPiloti[0],
      grigliaPiloti,
      risultati,
      classifica,
    ),
    false,
    "battere un solo rivale di top 10 e un pilota di bassa classifica non basta",
  );
});

test("un compagno ritirato non rende positiva la gara con pioggia", () => {
  const grigliaPiloti = [
    { slug: "leclerc", scuderia: "ferrari" },
    { slug: "hamilton", scuderia: "ferrari" },
    { slug: "norris", scuderia: "mclaren" },
    { slug: "verstappen", scuderia: "red-bull" },
  ];
  const risultati = new Map([
    ["leclerc", { posizioneGara: "P8" }],
    ["hamilton", { posizioneGara: "DNF" }],
    ["norris", { posizioneGara: "P2" }],
    ["verstappen", { posizioneGara: "P3" }],
  ]);
  const classifica = grigliaPiloti.map((voce, indice) => ({
    pilotaSlug: voce.slug,
    posizione: indice + 1,
  }));

  assert.equal(
    prestazionePioggiaPositiva(
      grigliaPiloti[0],
      grigliaPiloti,
      risultati,
      classifica,
    ),
    false,
  );
});

test("i risultati scuderia rispettano l'associazione specifica del GP", () => {
  const pilotiEvento = [
    { _id: "pilota-lawson", slug: "lawson", codice: "LAW", scuderia: "rb" },
    { _id: "pilota-tsunoda", slug: "tsunoda", codice: "TSU", scuderia: "rb" },
  ];
  const scuderieEvento = [
    { _id: "red-bull", slug: "red_bull" },
    { _id: "rb", slug: "rb" },
  ];
  const risultati = new Map([
    ["lawson", { posizioneGara: "P6", posizioneQualifica: "Q3" }],
    ["tsunoda", { posizioneGara: "P14", posizioneQualifica: "Q2" }],
  ]);
  const associazioniEvento = new Map([
    ["pilota-lawson", "red-bull"],
    ["pilota-tsunoda", "rb"],
  ]);

  const aggregati = creaRisultatiScuderie(
    { risultatiScuderie: [] },
    pilotiEvento,
    scuderieEvento,
    risultati,
    associazioniEvento,
  );

  assert.equal(aggregati[0].posizioneGara, "LAW P6");
  assert.equal(aggregati[1].posizioneGara, "TSU P14");
});
