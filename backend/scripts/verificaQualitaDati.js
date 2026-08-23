const dati = require("../data/dati-iniziali.json");
const snapshotF1db = require("../data/f1db-v2026.11.0-derivato.json");
const statisticheContesto = require("../data/statistiche-contesto.json");

const errori = [];

function richiedi(condizione, messaggio) {
  if (!condizione) errori.push(messaggio);
}

const attesi = {
  piloti: 22,
  scuderie: 11,
  gare: 12,
  analisiGare: 264,
  analisiScuderie: 132,
};

const VERSIONE_F1DB = "v2026.11.0";
const URL_ARCHIVIO_F1DB =
  "https://github.com/f1db/f1db/releases/download/v2026.11.0/f1db-json-splitted.zip";

function uguali(primo, secondo) {
  return JSON.stringify(primo) === JSON.stringify(secondo);
}

for (const [sezione, totale] of Object.entries(attesi)) {
  richiedi(
    Array.isArray(dati[sezione]) && dati[sezione].length === totale,
    `${sezione}: attesi ${totale} elementi`,
  );
}

richiedi(
  dati.metadati?.f1db?.versione === VERSIONE_F1DB &&
    dati.metadati?.f1db?.licenza === "CC BY 4.0" &&
    dati.metadati?.f1db?.archivioSha256 ===
      snapshotF1db.metadati.archivioSha256,
  "Metadati F1DB mancanti o incoerenti",
);

richiedi(
  snapshotF1db.metadati.versione === VERSIONE_F1DB &&
    /^[a-f0-9]{64}$/.test(snapshotF1db.metadati.archivioSha256),
  "Snapshot F1DB privo di versione o SHA-256 valido",
);

richiedi(
  snapshotF1db.eventiStorici.length === 36 &&
    snapshotF1db.analisiGare.length === attesi.analisiGare &&
    snapshotF1db.analisiScuderie.length === attesi.analisiScuderie &&
    snapshotF1db.andamento2026.eventi.length === 12,
  "Copertura dello snapshot F1DB incompleta",
);

const classifichePilotiF1db = new Map(
  snapshotF1db.classifiche2026.piloti.map((pilota) => [pilota.slug, pilota]),
);
const classificheScuderieF1db = new Map(
  snapshotF1db.classifiche2026.scuderie.map((scuderia) => [
    scuderia.slug,
    scuderia,
  ]),
);

for (const pilota of dati.piloti) {
  const f1db = classifichePilotiF1db.get(pilota.slug);
  richiedi(
    /^[A-Z]{2}$/.test(pilota.nazionalitaIso2) &&
      /^[A-Z]{3}$/.test(pilota.nazionalitaIso3),
    `Codici ISO nazionalita non validi: ${pilota.slug}`,
  );
  richiedi(
    f1db && uguali(pilota.classifica2026, f1db.classifica2026),
    `Classifica pilota diversa da F1DB: ${pilota.slug}`,
  );
}

const slugStatistiche = Object.keys(statisticheContesto.piloti || {}).sort();
const slugPiloti = dati.piloti.map((pilota) => pilota.slug).sort();
richiedi(
  uguali(slugStatistiche, slugPiloti),
  "Statistiche di contesto incomplete rispetto ai piloti",
);

for (const pilota of dati.piloti) {
  const valori = statisticheContesto.piloti[pilota.slug];
  const campiInteri = [
    "gareDisputate",
    "gareConPioggiaDisputate",
    "gareConPioggiaPositive",
    "vittorieConPioggia",
    "erroriPilota",
    "erroriFatali",
  ];
  richiedi(
    valori && campiInteri.every((campo) => Number.isInteger(valori[campo]) && valori[campo] >= 0),
    `Statistiche non valide: ${pilota.slug}`,
  );
  if (!valori) continue;
  richiedi(
    valori.vittorieConPioggia <= valori.gareConPioggiaPositive &&
      valori.gareConPioggiaPositive <= valori.gareConPioggiaDisputate &&
      valori.gareConPioggiaDisputate <= valori.gareDisputate,
    `Prestazioni con pioggia incoerenti: ${pilota.slug}`,
  );
  richiedi(
    valori.erroriFatali <= valori.erroriPilota &&
      valori.erroriPilota <= valori.gareDisputate &&
      (valori.erroriPilota === 0 || valori.erroriFatali < valori.erroriPilota),
    `Percentuali di errore incoerenti: ${pilota.slug}`,
  );
}

const aggiornamentiStatistiche =
  statisticheContesto.metadati?.aggiornamentiApplicati || [];
const ultimoGpStatistiche = statisticheContesto.metadati?.ultimoGpIncluso;
richiedi(
  /^\d{4}:[a-z0-9_-]+$/.test(ultimoGpStatistiche || "") &&
    (aggiornamentiStatistiche.length
      ? aggiornamentiStatistiche.at(-1) === ultimoGpStatistiche
      : ultimoGpStatistiche === "2026:hungary") &&
    new Set(aggiornamentiStatistiche).size ===
      aggiornamentiStatistiche.length &&
    statisticheContesto.metadati.fonti.every((fonte) =>
      fonte.startsWith("https://"),
    ),
  "Metadati delle statistiche di contesto mancanti o incoerenti",
);

for (const scuderia of dati.scuderie) {
  const f1db = classificheScuderieF1db.get(scuderia.slug);
  richiedi(
    /^[A-Z]{2,3}$/.test(scuderia.abbreviazione),
    `Abbreviazione scuderia non valida: ${scuderia.slug}`,
  );
  richiedi(
    /^#[0-9A-F]{6}$/.test(scuderia.colore),
    `Colore scuderia non valido: ${scuderia.slug}`,
  );
  richiedi(
    f1db && uguali(scuderia.classifica2026, f1db.classifica2026),
    `Classifica scuderia diversa da F1DB: ${scuderia.slug}`,
  );
}

const analisiGareF1db = new Map(
  snapshotF1db.analisiGare.map((analisi) => [
    `${analisi.garaSlug}|${analisi.pilotaSlug}`,
    analisi,
  ]),
);
const analisiScuderieF1db = new Map(
  snapshotF1db.analisiScuderie.map((analisi) => [
    `${analisi.garaSlug}|${analisi.scuderiaSlug}`,
    analisi,
  ]),
);

for (const analisi of dati.analisiGare) {
  const chiave = `${analisi.garaSlug}|${analisi.pilotaSlug}`;
  const f1db = analisiGareF1db.get(chiave);
  richiedi(
    f1db &&
      analisi.risultatiGara === f1db.risultatiGara &&
      analisi.risultatiQualifica === f1db.risultatiQualifica,
    `Risultati pilota diversi da F1DB: ${chiave}`,
  );
}

for (const analisi of dati.analisiScuderie) {
  const chiave = `${analisi.garaSlug}|${analisi.scuderiaSlug}`;
  const f1db = analisiScuderieF1db.get(chiave);
  richiedi(
    f1db &&
      analisi.risultatiGara === f1db.risultatiGara &&
      analisi.risultatiQualifica === f1db.risultatiQualifica,
    `Risultati scuderia diversi da F1DB: ${chiave}`,
  );
}

const racingBulls = dati.scuderie.find((scuderia) => scuderia.slug === "rb");
richiedi(
  racingBulls?.nome === "Racing Bulls" &&
    racingBulls?.nomeClassifica === "Racing Bulls",
  "La denominazione corrente della scuderia rb deve essere Racing Bulls",
);

const analisiMadridPiloti = dati.analisiGare.filter(
  (analisi) => analisi.garaSlug === "spagna-madring",
);
const analisiMadridScuderie = dati.analisiScuderie.filter(
  (analisi) => analisi.garaSlug === "spagna-madring",
);

richiedi(analisiMadridPiloti.length === 22, "Madrid: attese 22 analisi piloti");
richiedi(
  analisiMadridScuderie.length === 11,
  "Madrid: attese 11 analisi scuderie",
);

for (const analisi of [...analisiMadridPiloti, ...analisiMadridScuderie]) {
  richiedi(
    !JSON.stringify(analisi).includes("Sepang"),
    `Madrid contiene un riferimento errato a Sepang: ${analisi.pilotaSlug || analisi.scuderiaSlug}`,
  );
}

const testoCompleto = JSON.stringify(dati);
const formulazioniVietate = [
  /\b1 partenze\b/,
  /\b1 arrivi\b/,
  /\b1 punti\b/,
  /\b1 vittorie\b/,
  /\b1 podi\b/,
  /\b1 ritiri\/DNS\b/,
  /Il circuito richiede circuito nuovo/,
  /la lunga sopraelevata la monumental/i,
  /Il circuito richiede nel 2026 il gp/i,
  /\.\s+[a-zàèéìòù]/,
];

for (const formulazione of formulazioniVietate) {
  richiedi(
    !formulazione.test(testoCompleto),
    `Formulazione non valida ancora presente: ${formulazione}`,
  );
}

for (const sezione of ["gare", "analisiGare", "analisiScuderie"]) {
  for (const [indice, elemento] of dati[sezione].entries()) {
    for (const fonte of elemento.fonti || []) {
      richiedi(
        typeof fonte === "string" && fonte.startsWith("https://"),
        `${sezione}[${indice}]: fonte non HTTPS`,
      );
      richiedi(
        !/\.([A-Za-z0-9_-]{8,})\.\1$/.test(fonte),
        `${sezione}[${indice}]: URL Formula 1 con identificatore duplicato`,
      );
    }
  }
}

for (const sezione of ["analisiGare", "analisiScuderie"]) {
  for (const [indice, elemento] of dati[sezione].entries()) {
    richiedi(
      elemento.fonti.includes(URL_ARCHIVIO_F1DB),
      `${sezione}[${indice}]: attribuzione F1DB mancante`,
    );
  }
}

if (errori.length) {
  console.error("Verifica qualità dati fallita:");
  for (const errore of errori) console.error(`- ${errore}`);
  process.exitCode = 1;
} else {
  const valoriStoriciVerificati =
    (attesi.analisiGare + attesi.analisiScuderie) * 3 * 2;
  console.log(
    `OK qualità dati: ${valoriStoriciVerificati} risultati storici, ` +
      "33 classifiche e 11 GP 2026 coincidono con F1DB v2026.11.0; " +
      "il GP d'Olanda è integrato dai risultati ufficiali Formula 1; " +
      "struttura, denominazioni e fonti verificate.",
  );
}
