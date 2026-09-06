const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PESI,
  PESO_PENALITA,
  creaClassificaPrevisionale,
  valutaAggiornamento,
  valutaAndamentoScuderia,
  valutaCompatibilitaVettura,
  valutaPenalita,
} = require("../services/classificaPrevisionale");

test("i pesi previsionali sommano a cento e valorizzano gli ultimi tre GP", () => {
  assert.equal(
    Object.values(PESI).reduce((totale, peso) => totale + peso, 0),
    100,
  );
  assert.deepEqual(PESI, {
    compatibilitaVetturaCircuito: 60, qualifica2026: 3, storicoPersonale: 3,
    aggiornamentiTecnici: 7, andamento2026: 7, passoGaraRecente: 15,
    andamentoScuderiaRecente: 5,
  });
});

test("una penalità confermata incide fino al 35% e lascia il 65% agli altri fattori", () => {
  const penalita = valutaPenalita(
    "Penalità confermata: arretramento di almeno 10 posizioni sulla griglia.",
  );

  assert.equal(PESO_PENALITA, 35);
  assert.deepEqual(penalita, { posizioni: 10, valore: 0 });
  assert.equal(valutaPenalita("Nessuna penalità confermata."), null);
});

test("il fondo griglia non diventa una penalità lieve quando manca il numero di posizioni", () => {
  assert.deepEqual(
    valutaPenalita("Penalità confermata: partenza dal fondo della griglia a Monza."),
    { posizioni: null, valore: 0 },
  );
  assert.equal(valutaPenalita("Nessuna penalità da scontare a Monza confermata al 4 settembre 2026."), null);
  assert.deepEqual(valutaPenalita("Penalità confermata: 3 posizioni in griglia."), { posizioni: 3, valore: 70 });
});

test("una buona affinità con la pista non nasconde una scuderia debole", () => {
  const compatibilita = valutaCompatibilitaVettura(10, 92);

  assert.equal(compatibilita, 38.7);
  assert.ok(compatibilita < 50);
});

test("gli aggiornamenti contano solo se reali e pertinenti al circuito", () => {
  const assente = valutaAggiornamento(
    "La squadra non ha ancora comunicato aggiornamenti specifici per il circuito.", "it", { curvaVeloce: 96 },
  );
  const annunciato = valutaAggiornamento(
    "La squadra ha annunciato un pacchetto da verificare. Sarebbe utile nelle curve veloci.", "it", { curvaVeloce: 96 },
  );
  const confermato = valutaAggiornamento(
    "La squadra ha confermato per Zandvoort un pacchetto direttamente utile nelle curve in appoggio.", "it", { curvaVeloce: 96 },
  );
  const inefficace = valutaAggiornamento(
    "Intervento sulle curve veloci. L'aggiornamento non ha portato vantaggi reali nelle prove.", "it", { curvaVeloce: 96 },
  );
  const solaAffidabilita = valutaAggiornamento(
    "Intervento esclusivamente di affidabilità che non cerca un vantaggio aerodinamico.", "it", { curvaVeloce: 96 },
  );
  const mirato = valutaAggiornamento(
    "La squadra ha confermato per Zandvoort un intervento mirato direttamente utile nelle curve veloci.", "it", { curvaVeloce: 96 },
  );
  const ampio = valutaAggiornamento(
    "La squadra ha confermato per Zandvoort un ampio pacchetto direttamente utile nelle curve veloci.", "it", { curvaVeloce: 96 },
  );
  const quasiCertoMaNonUfficiale = valutaAggiornamento(
    "Non è ancora una presentazione ufficiale FIA, ma la squadra ha preparato i componenti.", "it", { curvaVeloce: 96 },
  );

  assert.equal(assente.valore, 50);
  assert.ok(annunciato.valore > assente.valore);
  assert.ok(confermato.valore > annunciato.valore);
  assert.ok(inefficace.valore < assente.valore);
  assert.equal(solaAffidabilita.valore, assente.valore);
  assert.match(solaAffidabilita.stato, /affidabilità/i);
  assert.ok(ampio.valore > mirato.valore);
  assert.equal(quasiCertoMaNonUfficiale.valore, assente.valore);
  assert.equal(quasiCertoMaNonUfficiale.evidenza, 0);
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
  assert.equal(risultato.classifica[0].fattori.length, 7);
  assert.equal(risultato.modello, "statistico-editoriale-v2");
  assert.equal("avvertenza" in risultato, false);
  assert.equal("aggiornatoIl" in risultato, false);
});

test("usa lo schieramento della gara e ignora i piloti senza analisi corrente", () => {
  const redBull = {
    slug: "red_bull",
    nome: "Red Bull Racing",
    abbreviazione: "RBR",
    colore: "#3671C6",
    classifica2026: { posizione: 4, punti: 100, vittorie: 0 },
  };
  const racingBulls = {
    slug: "rb",
    nome: "Racing Bulls",
    abbreviazione: "RB",
    colore: "#6692FF",
    classifica2026: { posizione: 5, punti: 70, vittorie: 0 },
  };
  const lawson = {
    slug: "lawson",
    nome: "Liam Lawson",
    codice: "LAW",
    numero: "30",
    nazionalitaIso2: "NZ",
    nazionalitaIso3: "NZL",
    scuderia: racingBulls,
    classifica2026: { posizione: 9, punti: 49, vittorie: 0 },
  };
  const hadjar = {
    slug: "hadjar",
    nome: "Isack Hadjar",
    codice: "HAD",
    numero: "6",
    nazionalitaIso2: "FR",
    nazionalitaIso3: "FRA",
    scuderia: redBull,
    classifica2026: { posizione: 8, punti: 68, vittorie: 0 },
  };
  const analisiLawson = {
    pilota: lawson,
    scuderia: redBull,
    considerazioni: "TOP 10 — sostituto",
    posizioniStoriche: { 2025: "P14" },
    passoGara: {},
    gomme: {},
  };

  const risultato = creaClassificaPrevisionale({
    gara: { slug: "italia-monza", nome: "GP Italia", circuito: "Monza", confidenza: "MEDIA" },
    piloti: [lawson, hadjar],
    scuderie: [redBull, racingBulls],
    analisiPiloti: [analisiLawson],
    analisiScuderie: [
      { scuderia: redBull, considerazioni: "TOP 10", passoGara: {}, gomme: {} },
      { scuderia: racingBulls, considerazioni: "DA VALUTARE", passoGara: {}, gomme: {} },
    ],
    snapshot: { andamento2026: { eventi: [] } },
  });

  assert.equal(risultato.classifica.length, 1);
  assert.equal(risultato.classifica[0].pilota.slug, "lawson");
  assert.equal(risultato.classifica[0].scuderia.slug, "red_bull");
  const { creaProfiloCircuito } = require("../services/profiliTecnici");
  const indiceTecnico = creaProfiloCircuito("italia-monza", [redBull, racingBulls])
    .compatibilita.find(({ scuderia }) => scuderia.slug === "red_bull").indice;
  assert.equal(
    risultato.classifica[0].fattori.find(({ chiave }) => chiave === "compatibilitaVetturaCircuito").valutazione,
    indiceTecnico,
  );
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

  assert.equal(conPenalita.fattori.length, 8);
  assert.equal(
    conPenalita.fattori.reduce((totale, fattore) => totale + fattore.pesoPercentuale, 0),
    100,
  );
  assert.equal(conPenalita.fattori.at(-1).pesoPercentuale, 35);
  assert.equal(conPenalita.fattori.at(-1).valutazione, 0);
  assert.equal(conPenalita.indice, Math.round((senzaPenalita.indice * 0.65) * 10) / 10);
});

test("gli aggiornamenti generici o estranei alle richieste non danno bonus", () => {
  const testo = "La squadra ha confermato per il circuito un intervento direttamente utile nelle curve lente.";
  assert.equal(valutaAggiornamento(testo, "it", { curvaLenta: 50 }).valore, 50);
  assert.ok(valutaAggiornamento(testo, "it", { curvaLenta: 100 }).valore > 50);
  assert.equal(valutaAggiornamento(testo).valore, 50);
  assert.equal(valutaAggiornamento("La squadra ha confermato per il circuito un ampio pacchetto.", "it", { curvaLenta: 100 }).valore, 50);
  assert.equal(valutaAggiornamento("Il nuovo fondo non migliora la trazione.", "it", { trazione: 100 }).valore, 50);
});

test("la forma scuderia usa le due vetture storiche e soltanto gli ultimi tre GP", () => {
  const evento = (gara) => ({ scuderie: { team: { gara } }, piloti: {} });
  const ultimi = [evento({ A: 1, B: 1 }), evento({ A: 12, B: 12 }), evento({ SOSTITUTO: null, B: null })];
  // P1=100, P12=50, ritiri=15; pesi temporali 1,2,3.
  assert.equal(valutaAndamentoScuderia(ultimi, "team"), 245 / 6);
  assert.equal(valutaAndamentoScuderia([evento({ A: 22, B: 22 }), ...ultimi], "team"), 245 / 6);
  assert.equal(valutaAndamentoScuderia([], "team"), 40);
  assert.equal(valutaAndamentoScuderia([{}], "team"), 40);
});
