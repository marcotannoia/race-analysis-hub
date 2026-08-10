const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PESI,
  creaClassificaPrevisionale,
  valutaAggiornamento,
} = require("../services/classificaPrevisionale");

test("i pesi previsionali sommano a cento e privilegiano vettura e aggiornamenti", () => {
  assert.equal(
    Object.values(PESI).reduce((totale, peso) => totale + peso, 0),
    100,
  );
  assert.ok(
    PESI.compatibilitaVetturaCircuito > PESI.storicoPersonale,
  );
  assert.ok(PESI.aggiornamentiTecnici > PESI.passoGaraRecente);
});

test("gli aggiornamenti contano solo se reali e pertinenti al circuito", () => {
  const assente = valutaAggiornamento(
    "La squadra non ha annunciato aggiornamenti specifici per il circuito.",
  );
  const annunciato = valutaAggiornamento(
    "La squadra ha annunciato un pacchetto da verificare. Sarebbe utile nelle curve veloci.",
  );
  const confermato = valutaAggiornamento(
    "La squadra ha confermato per Zandvoort un pacchetto direttamente utile nelle curve in appoggio.",
  );
  const inefficace = valutaAggiornamento(
    "L'aggiornamento non ha portato vantaggi reali nelle prove.",
  );

  assert.equal(assente.valore, 50);
  assert.ok(annunciato.valore > assente.valore);
  assert.ok(confermato.valore > annunciato.valore);
  assert.ok(inefficace.valore < assente.valore);
});

test("crea una classifica spiegabile per il solo Gran Premio corrente", () => {
  const scuderie = [
    {
      slug: "team-a",
      nome: "Team A",
      classifica2026: { posizione: 1, punti: 100, vittorie: 2 },
    },
    {
      slug: "team-b",
      nome: "Team B",
      classifica2026: { posizione: 2, punti: 80, vittorie: 1 },
    },
  ];
  const piloti = [
    {
      slug: "pilota-a",
      nome: "Pilota A",
      codice: "PIA",
      numero: "1",
      scuderia: { slug: "team-a", nome: "Team A" },
      classifica2026: { posizione: 1, punti: 60, vittorie: 2 },
    },
    {
      slug: "pilota-b",
      nome: "Pilota B",
      codice: "PIB",
      numero: "2",
      scuderia: { slug: "team-b", nome: "Team B" },
      classifica2026: { posizione: 2, punti: 40, vittorie: 0 },
    },
  ];
  const analisiPiloti = piloti.map((pilota, indice) => ({
    pilota,
    scuderia: scuderie[indice],
    considerazioni: indice === 0 ? "FAVORITO — molto adatto" : "OUTSIDER — da verificare",
    posizioniStoriche: { 2025: indice === 0 ? "P1" : "P2" },
    passoGara: {},
    gomme: {},
    penalita: "Nessuna penalità confermata.",
  }));
  const analisiScuderie = scuderie.map((scuderia, indice) => ({
    scuderia,
    considerazioni: indice === 0 ? "FAVORITA — vettura adatta" : "DA VALUTARE — incerta",
    aggiornamentiInArrivo:
      indice === 0
        ? "Pacchetto confermato per il circuito e direttamente utile."
        : "Nessun aggiornamento confermato.",
    passoGara: {},
    gomme: {},
  }));
  const snapshot = {
    andamento2026: {
      aggiornatoIl: "2026-08-01T12:00:00.000Z",
      eventi: [
        {
          piloti: {
            "pilota-a": { gara: 1, qualifica: 1 },
            "pilota-b": { gara: 2, qualifica: 2 },
          },
        },
      ],
    },
  };

  const risultato = creaClassificaPrevisionale({
    gara: {
      slug: "gara-corrente",
      nome: "Gran Premio corrente",
      circuito: "Circuito",
      confidenza: "MEDIA",
    },
    piloti,
    scuderie,
    analisiPiloti,
    analisiScuderie,
    snapshot,
  });

  assert.equal(risultato.classifica.length, 2);
  assert.equal(risultato.classifica[0].pilota.slug, "pilota-a");
  assert.equal(risultato.classifica[0].posizione, 1);
  assert.equal(risultato.classifica[0].fattori.length, 10);
  assert.match(risultato.avvertenza, /possono contenere errori/i);
  assert.equal(risultato.aggiornatoIl, "2026-08-01T12:00:00.000Z");
});
