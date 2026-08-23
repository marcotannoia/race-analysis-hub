const test = require("node:test");
const assert = require("node:assert/strict");
const {
  presentaAnalisiPilota,
  presentaGara,
  presentaPilota,
} = require("../presenters/apiV1");

test("il presentatore del pilota non espone identificativi MongoDB", () => {
  const pilota = presentaPilota({
    _id: "interno",
    slug: "leclerc",
    nome: "Charles Leclerc",
    codice: "LEC",
    numero: "16",
    nazionalita: "Monegasca",
    nazionalitaIso2: "MC",
    nazionalitaIso3: "MCO",
    scuderia: {
      _id: "interno",
      slug: "ferrari",
      nome: "Ferrari",
      abbreviazione: "FER",
      colore: "#E8002D",
    },
    classifica2026: { posizione: 3, punti: 100, vittorie: 1 },
  });

  assert.equal(pilota.slug, "leclerc");
  assert.deepEqual(pilota.classifica, {
    posizione: 3,
    punti: 100,
    vittorie: 1,
  });
  assert.equal(pilota.abbreviazioneNome, "LEC");
  assert.equal(pilota.numeroVettura, "16");
  assert.equal(pilota.nazionalitaIso2, "MC");
  assert.equal(pilota.nazionalitaIso3, "MCO");
  assert.deepEqual(pilota.scuderia, {
    slug: "ferrari",
    nome: "Ferrari",
    abbreviazione: "FER",
    colore: "#E8002D",
  });
  assert.equal(JSON.stringify(pilota).includes("_id"), false);
  assert.equal("classifica2026" in pilota, false);
});

test("la gara pubblica e sempre marcata come attuale", () => {
  const gara = presentaGara({
    _id: "interno",
    slug: "olanda-zandvoort",
    nome: "Gran Premio d'Olanda",
    circuito: "Zandvoort",
    paese: "Olanda",
    stagione: 2026,
    ordineAnalisi: 1,
    stato: "prossima",
    etichettaExcel: "CAMPO INTERNO",
    contestoStorico: "Contesto",
    pilotiFavoriti: "Piloti",
    scuderieFavorite: "Scuderie",
    outsider: "Outsider",
    potenzialiDifficolta: "Difficolta",
    gommeStrategia: "Gomme",
    rischi: "Rischi",
    confidenza: "Media",
    fonti: [],
  });

  assert.equal(gara.stato, "attuale");
  assert.equal("etichettaExcel" in gara, false);
  assert.equal(JSON.stringify(gara).includes("_id"), false);
});

test("i presentatori selezionano la traduzione senza esporre il catalogo", () => {
  const pilota = presentaPilota(
    {
      slug: "leclerc",
      nome: "Charles Leclerc",
      nazionalita: "Monegasque",
      traduzioni: {
        it: { nazionalita: "Monegasca" },
        fr: { nazionalita: "Monégasque" },
      },
    },
    "fr",
  );

  assert.equal(pilota.nazionalita, "Monégasque");
  assert.equal("traduzioni" in pilota, false);
});

test("l'analisi raggruppa le prestazioni senza perdere i contenuti", () => {
  const analisi = presentaAnalisiPilota({
    pilota: {
      slug: "leclerc",
      nome: "Charles Leclerc",
      codice: "LEC",
      numero: "16",
      nazionalitaIso2: "MC",
      nazionalitaIso3: "MCO",
    },
    scuderia: {
      slug: "ferrari",
      nome: "Ferrari",
      abbreviazione: "FER",
      colore: "#E8002D",
    },
    gara: {
      slug: "olanda-zandvoort",
      nome: "Gran Premio d'Olanda",
      circuito: "Zandvoort",
      paese: "Olanda",
      stagione: 2026,
      ordineAnalisi: 1,
    },
    posizioniStoriche: "2025: P3",
    spiegazionePosizioni: "2025: Nota",
    qualificheStoriche: "2025: Q2",
    andamentoPerAnno: "2025: Prestazione solida.",
    passoGara: "2025: Competitivo",
    gomme: "2025: Buona gestione",
    affidabilita: "Alta",
    considerazioni: "Favorito",
    penalita: "Nessuna penalita confermata.",
    aggiornamentiInArrivo: "",
    storicoEdizioni: [],
    fonti: ["https://example.com"],
  });

  assert.deepEqual(analisi.prestazioni, {
    passoGara: "2025: Competitivo",
    gestioneGomme: "2025: Buona gestione",
    affidabilita: "Alta",
  });
  assert.equal(analisi.risultatiGara, "2025: P3");
  assert.equal(analisi.notaBene, "2025: Nota");
  assert.equal(analisi.risultatiQualifica, "2025: Q2");
  assert.equal(analisi.andamentoPerAnno, "2025: Prestazione solida.");
  assert.deepEqual(analisi.datiPerAnno, {
    risultatiGara: { 2025: "P3" },
    spiegazioneRisultatiPassati: { 2025: "Nota" },
    notaBene: { 2025: "Nota" },
    risultatiQualifica: { 2025: "Q2" },
    andamento: { 2025: "Prestazione solida." },
    prestazioni: {
      passoGara: { 2025: "Competitivo" },
      gestioneGomme: { 2025: "Buona gestione" },
    },
  });
  assert.equal(analisi.considerazioniFinali, "Favorito");
  assert.equal(analisi.penalita, "Nessuna penalita confermata.");
  assert.equal(analisi.gara.stato, "attuale");
  assert.equal(analisi.pilota.nazionalitaIso3, "MCO");
  assert.equal(analisi.scuderia.colore, "#E8002D");
});

test("le note annuali vuote usano il fallback della lingua richiesta", () => {
  const analisi = presentaAnalisiPilota(
    {
      gara: { nome: "Gran Premio", circuito: "Circuito", paese: "Italia" },
      posizioniStoriche: { 2025: "P1" },
      spiegazionePosizioni: { 2025: "" },
      qualificheStoriche: { 2025: "Q1" },
      passoGara: { 2025: "Passo" },
      gomme: { 2025: "Gomme" },
      traduzioni: {
        de: {
          risultatiGara: { 2025: "P1" },
          notaBene: { 2025: "" },
          risultatiQualifica: { 2025: "Q1" },
          passoGara: { 2025: "Tempo" },
          gestioneGomme: { 2025: "Reifen" },
        },
      },
    },
    "de",
  );

  assert.equal(
    analisi.datiPerAnno.notaBene[2025],
    "Kein besonderes Ereignis zu berichten",
  );
});

test("la penalita appartiene solo all'analisi del pilota", () => {
  const { presentaAnalisiScuderia } = require("../presenters/apiV1");
  const base = {
    gara: { slug: "olanda-zandvoort", nome: "GP Olanda" },
    posizioniStoriche: "2025: P1",
    spiegazionePosizioni: "2025: Nota",
    qualificheStoriche: "2025: Q1",
    passoGara: "2025: Competitivo",
    gomme: "2025: Regolare",
    considerazioni: "Favorita",
    penalita: "Nessuna penalita confermata.",
    fonti: [],
  };

  const pilota = presentaAnalisiPilota({
    ...base,
    pilota: { slug: "leclerc", nome: "Charles Leclerc" },
    scuderia: { slug: "ferrari", nome: "Ferrari" },
  });
  const scuderia = presentaAnalisiScuderia({
    ...base,
    scuderia: { slug: "ferrari", nome: "Ferrari" },
  });

  assert.equal(pilota.penalita, "Nessuna penalita confermata.");
  assert.equal("penalita" in scuderia, false);
});

test("l'andamento espone la provenienza dei risultati", () => {
  const { presentaAndamento } = require("../presenters/apiV1");
  const andamento = presentaAndamento({
    stagione: 2026,
    etichette: ["Melbourne"],
    qualifica: [{ nome: "LEC", valori: [3] }],
    gara: [{ nome: "LEC", valori: [2] }],
    fonte: {
      nome: "F1DB",
      url: "https://github.com/f1db/f1db/releases/tag/v2026.11.0",
      licenza: "CC BY 4.0",
      licenzaUrl: "https://creativecommons.org/licenses/by/4.0/",
      versione: "v2026.11.0",
      modifiche: "Dati filtrati e normalizzati.",
    },
    aggiornatoIl: "2026-08-06T12:00:00.000Z",
  });

  assert.deepEqual(andamento.fonte, {
    nome: "F1DB",
    url: "https://github.com/f1db/f1db/releases/tag/v2026.11.0",
    licenza: "CC BY 4.0",
    licenzaUrl: "https://creativecommons.org/licenses/by/4.0/",
    versione: "v2026.11.0",
    modifiche: "Dati filtrati e normalizzati.",
  });
  assert.equal(andamento.aggiornatoIl, "2026-08-06T12:00:00.000Z");
});

test("le fonti pubbliche accettano esclusivamente URL HTTPS validi", () => {
  const gara = presentaGara({
    slug: "olanda-zandvoort",
    fonti: [
      "https://example.com/fonte",
      "http://example.com/non-sicura",
      "javascript:alert(1)",
      "non-e-un-url",
    ],
  });

  assert.deepEqual(gara.fonti, ["https://example.com/fonte"]);
});

test("la fonte dell'andamento rimuove URL non HTTPS", () => {
  const { presentaAndamento } = require("../presenters/apiV1");
  const andamento = presentaAndamento({
    stagione: 2026,
    fonte: { nome: "Fonte non sicura", url: "javascript:alert(1)" },
  });

  assert.deepEqual(andamento.fonte, {
    nome: "Fonte non sicura",
    url: null,
  });
});
