const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PESI,
  PESO_PENALITA,
  creaClassificaPrevisionale,
  valutaAggiornamento,
  valutaCompatibilitaVettura,
  valutaPenalita,
} = require("../services/classificaPrevisionale");

test("i pesi previsionali sommano a cento e valorizzano gli ultimi tre GP", () => {
  assert.equal(
    Object.values(PESI).reduce((totale, peso) => totale + peso, 0),
    100,
  );
  assert.ok(
    PESI.compatibilitaVetturaCircuito > PESI.storicoPersonale,
  );
  assert.equal(PESI.passoGaraRecente, 25);
  assert.equal(PESI.compatibilitaVetturaCircuito, 25);
  assert.equal(PESI.aggiornamentiTecnici, 10);
  assert.equal(PESI.qualifica2026, 3);
  assert.equal(PESI.affidabilitaERischi, 2);
  assert.equal(PESI.gestioneGomme, 1);
});

test("una penalità confermata pesa il 50% e dimezza gli altri fattori", () => {
  const penalita = valutaPenalita(
    "Penalità confermata: arretramento di almeno 10 posizioni sulla griglia.",
  );

  assert.equal(PESO_PENALITA, 50);
  assert.deepEqual(penalita, { posizioni: 10, valore: 0 });
  assert.equal(valutaPenalita("Nessuna penalità confermata."), null);
});

test("una buona affinità con la pista non nasconde una scuderia debole", () => {
  const compatibilita = valutaCompatibilitaVettura(10, 92);

  assert.equal(compatibilita, 38.7);
  assert.ok(compatibilita < 50);
});

test("gli aggiornamenti contano solo se reali e pertinenti al circuito", () => {
  const assente = valutaAggiornamento(
    "La squadra non ha ancora comunicato aggiornamenti specifici per il circuito.",
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
  const solaAffidabilita = valutaAggiornamento(
    "Intervento esclusivamente di affidabilità che non cerca un vantaggio aerodinamico.",
  );
  const mirato = valutaAggiornamento(
    "La squadra ha confermato per Zandvoort un intervento mirato direttamente utile nelle curve veloci.",
  );
  const ampio = valutaAggiornamento(
    "La squadra ha confermato per Zandvoort un ampio pacchetto direttamente utile nelle curve veloci.",
  );

  assert.equal(assente.valore, 50);
  assert.ok(annunciato.valore > assente.valore);
  assert.ok(confermato.valore > annunciato.valore);
  assert.ok(inefficace.valore < assente.valore);
  assert.equal(solaAffidabilita.valore, assente.valore);
  assert.match(solaAffidabilita.stato, /affidabilità/i);
  assert.ok(ampio.valore > mirato.valore);
});

test("crea una classifica spiegabile per il solo Gran Premio corrente", () => {
  const scuderie = [
    {
      slug: "team-a",
      nome: "Team A",
      abbreviazione: "TMA",
      colore: "#112233",
      classifica2026: { posizione: 1, punti: 100, vittorie: 2 },
    },
    {
      slug: "team-b",
      nome: "Team B",
      abbreviazione: "TMB",
      colore: "#445566",
      classifica2026: { posizione: 2, punti: 80, vittorie: 1 },
    },
  ];
  const piloti = [
    {
      slug: "pilota-a",
      nome: "Pilota A",
      codice: "PIA",
      numero: "1",
      nazionalitaIso2: "IT",
      nazionalitaIso3: "ITA",
      scuderia: scuderie[0],
      classifica2026: { posizione: 1, punti: 60, vittorie: 2 },
    },
    {
      slug: "pilota-b",
      nome: "Pilota B",
      codice: "PIB",
      numero: "2",
      nazionalitaIso2: "FR",
      nazionalitaIso3: "FRA",
      scuderia: scuderie[1],
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
  assert.equal(
    risultato.classifica[0].pilota.abbreviazioneNome,
    "PIA",
  );
  assert.equal(risultato.classifica[0].pilota.numeroVettura, "1");
  assert.equal(
    risultato.classifica[0].pilota.nazionalitaIso3,
    "ITA",
  );
  assert.equal(
    risultato.classifica[0].scuderia.abbreviazione,
    "TMA",
  );
  assert.equal(risultato.classifica[0].scuderia.colore, "#112233");
  assert.equal(risultato.classifica[0].fattori.length, 9);
  assert.equal(risultato.modello, "statistico-editoriale-v2");
  assert.equal("avvertenza" in risultato, false);
  assert.equal(risultato.aggiornatoIl, "2026-08-01T12:00:00.000Z");
});

test("la classifica applica i pesi condizionali al pilota penalizzato", () => {
  const scuderia = {
    slug: "team-a",
    nome: "Team A",
    abbreviazione: "TMA",
    colore: "#112233",
    classifica2026: { posizione: 1, punti: 100, vittorie: 2 },
  };
  const pilota = {
    slug: "pilota-a",
    nome: "Pilota A",
    codice: "PIA",
    numero: "1",
    nazionalitaIso2: "IT",
    nazionalitaIso3: "ITA",
    scuderia,
    classifica2026: { posizione: 1, punti: 100, vittorie: 2 },
  };
  const baseAnalisi = {
    pilota,
    scuderia,
    considerazioni: "FAVORITO — molto adatto",
    posizioniStoriche: { 2025: "P1" },
    passoGara: {},
    gomme: {},
  };
  const parametri = {
    gara: { slug: "gara", nome: "Gara", circuito: "Circuito", confidenza: "MEDIA" },
    piloti: [pilota],
    scuderie: [scuderia],
    analisiScuderie: [{
      scuderia,
      considerazioni: "FAVORITA — vettura adatta",
      aggiornamentiInArrivo: "Nessun aggiornamento confermato.",
      passoGara: {},
      gomme: {},
    }],
    snapshot: { andamento2026: { eventi: [{ piloti: { "pilota-a": { gara: 1, qualifica: 1 } } }] } },
  };
  const senzaPenalita = creaClassificaPrevisionale({
    ...parametri,
    analisiPiloti: [{ ...baseAnalisi, penalita: "Nessuna penalità confermata." }],
  }).classifica[0];
  const conPenalita = creaClassificaPrevisionale({
    ...parametri,
    analisiPiloti: [{
      ...baseAnalisi,
      penalita: "Penalità confermata: arretramento di almeno 10 posizioni sulla griglia.",
    }],
  }).classifica[0];

  assert.equal(conPenalita.fattori.length, 10);
  assert.equal(
    conPenalita.fattori.reduce((totale, fattore) => totale + fattore.pesoPercentuale, 0),
    100,
  );
  assert.equal(conPenalita.fattori.at(-1).pesoPercentuale, 50);
  assert.equal(conPenalita.fattori.at(-1).valutazione, 0);
  assert.equal(conPenalita.indice, Math.round((senzaPenalita.indice / 2) * 10) / 10);
});
