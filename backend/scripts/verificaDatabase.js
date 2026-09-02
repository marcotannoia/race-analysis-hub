const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

const collegaDatabase = require("../config/database");
const Pilota = require("../models/Pilota");
const Scuderia = require("../models/Scuderia");
const Gara = require("../models/Gara");
const AnalisiGara = require("../models/AnalisiGara");
const AnalisiScuderia = require("../models/AnalisiScuderia");
const datiSorgente = require("../data/dati-iniziali.json");
const {
  normalizzaNotaBene,
  normalizzaTestiAnnuali,
} = require("../utils/normalizzaNotaBene");
const {
  normalizzaTraduzioniAnalisi,
} = require("../utils/normalizzaTraduzioni");

const attesi = {
  piloti: 23,
  scuderie: 11,
  gare: 12,
  analisiGare: 264,
  analisiScuderie: 132,
};

function canonicalizza(valore) {
  if (valore instanceof Date) return valore.toISOString();
  if (Array.isArray(valore)) return valore.map(canonicalizza);
  if (!valore || typeof valore !== "object") return valore;

  return Object.fromEntries(
    Object.entries(valore)
      .filter(([chiave]) => !["_id", "createdAt", "updatedAt"].includes(chiave))
      .sort(([prima], [seconda]) => prima.localeCompare(seconda))
      .map(([chiave, contenuto]) => [chiave, canonicalizza(contenuto)]),
  );
}

function uguali(primo, secondo) {
  return JSON.stringify(canonicalizza(primo)) === JSON.stringify(canonicalizza(secondo));
}

function confrontaCampi(documento, sorgente) {
  return Object.fromEntries(
    Object.keys(sorgente).map((chiave) => [chiave, documento[chiave]]),
  );
}

async function verificaCorrispondenzaSorgente() {
  const [piloti, scuderie, gare, analisiGare, analisiScuderie] =
    await Promise.all([
      Pilota.find().populate("scuderia", "slug").lean(),
      Scuderia.find().lean(),
      Gara.find().lean(),
      AnalisiGara.find()
        .populate("pilota", "slug")
        .populate("scuderia", "slug")
        .populate("gara", "slug")
        .lean(),
      AnalisiScuderia.find()
        .populate("scuderia", "slug")
        .populate("gara", "slug")
        .lean(),
    ]);

  const differenze = [];
  const pilotaPerSlug = new Map(piloti.map((pilota) => [pilota.slug, pilota]));
  const scuderiaPerSlug = new Map(
    scuderie.map((scuderia) => [scuderia.slug, scuderia]),
  );
  const garaPerSlug = new Map(gare.map((gara) => [gara.slug, gara]));
  const analisiGaraPerChiave = new Map(
    analisiGare.map((analisi) => [
      `${analisi.pilota.slug}|${analisi.gara.slug}`,
      analisi,
    ]),
  );
  const analisiScuderiaPerChiave = new Map(
    analisiScuderie.map((analisi) => [
      `${analisi.scuderia.slug}|${analisi.gara.slug}`,
      analisi,
    ]),
  );

  for (const sorgente of datiSorgente.scuderie) {
    const documento = scuderiaPerSlug.get(sorgente.slug);
    if (!documento || !uguali(confrontaCampi(documento, sorgente), sorgente)) {
      differenze.push(`scuderia:${sorgente.slug}`);
    }
  }

  for (const sorgente of datiSorgente.piloti) {
    const documento = pilotaPerSlug.get(sorgente.slug);
    const effettivo = documento
      ? {
          slug: documento.slug,
          nome: documento.nome,
          codice: documento.codice,
          numero: documento.numero,
          nazionalita: documento.nazionalita,
          nazionalitaIso2: documento.nazionalitaIso2,
          nazionalitaIso3: documento.nazionalitaIso3,
          scuderiaSlug: documento.scuderia.slug,
          classifica2026: documento.classifica2026,
          traduzioni: documento.traduzioni || {},
        }
      : null;

    if (!effettivo || !uguali(effettivo, sorgente)) {
      differenze.push(`pilota:${sorgente.slug}`);
    }
  }

  for (const sorgente of datiSorgente.gare) {
    const documento = garaPerSlug.get(sorgente.slug);
    if (!documento || !uguali(confrontaCampi(documento, sorgente), sorgente)) {
      differenze.push(`gara:${sorgente.slug}`);
    }
  }

  for (const sorgente of datiSorgente.analisiGare) {
    const chiave = `${sorgente.pilotaSlug}|${sorgente.garaSlug}`;
    const documento = analisiGaraPerChiave.get(chiave);
    const atteso = {
      posizioniStoriche: normalizzaTestiAnnuali(sorgente.risultatiGara),
      spiegazionePosizioni: normalizzaNotaBene(sorgente.notaBene),
      qualificheStoriche: normalizzaTestiAnnuali(sorgente.risultatiQualifica),
      andamentoPerAnno: normalizzaTestiAnnuali(sorgente.andamentoPerAnno || ""),
      passoGara: normalizzaTestiAnnuali(sorgente.passoGara),
      gomme: normalizzaTestiAnnuali(sorgente.gestioneGomme),
      considerazioni: sorgente.considerazioniFinali,
      penalita: sorgente.penalita || "",
      affidabilita: sorgente.affidabilita || "",
      aggiornamentiInArrivo: sorgente.aggiornamentiInArrivo || "",
      traduzioni: normalizzaTraduzioniAnalisi(sorgente.traduzioni),
      fonti: sorgente.fonti,
    };

    if (!documento || !uguali(confrontaCampi(documento, atteso), atteso)) {
      differenze.push(`analisiPilota:${chiave}`);
    }
  }

  for (const sorgente of datiSorgente.analisiScuderie) {
    const chiave = `${sorgente.scuderiaSlug}|${sorgente.garaSlug}`;
    const documento = analisiScuderiaPerChiave.get(chiave);
    const atteso = {
      posizioniStoriche: normalizzaTestiAnnuali(sorgente.risultatiGara),
      spiegazionePosizioni: normalizzaNotaBene(sorgente.notaBene),
      qualificheStoriche: normalizzaTestiAnnuali(sorgente.risultatiQualifica),
      andamentoPerAnno: normalizzaTestiAnnuali(sorgente.andamentoPerAnno || ""),
      passoGara: normalizzaTestiAnnuali(sorgente.passoGara),
      gomme: normalizzaTestiAnnuali(sorgente.gestioneGomme),
      considerazioni: sorgente.considerazioniFinali,
      affidabilita: sorgente.affidabilita || "",
      aggiornamentiInArrivo: sorgente.aggiornamentiInArrivo || "",
      traduzioni: normalizzaTraduzioniAnalisi(sorgente.traduzioni),
      fonti: sorgente.fonti,
    };

    if (!documento || !uguali(confrontaCampi(documento, atteso), atteso)) {
      differenze.push(`analisiScuderia:${chiave}`);
    }
  }

  return differenze;
}

async function verificaDatabase() {
  try {
    await collegaDatabase();

    const risultati = {
      piloti: await Pilota.countDocuments(),
      scuderie: await Scuderia.countDocuments(),
      gare: await Gara.countDocuments(),
      analisiGare: await AnalisiGara.countDocuments(),
      analisiScuderie: await AnalisiScuderia.countDocuments(),
    };

    const statoGare = {
      attuali: await Gara.countDocuments({ stato: "attuale" }),
      precedenti: await Gara.countDocuments({ stato: "prossima" }),
      mancanti: await Gara.countDocuments({
        $or: [{ stato: null }, { stato: { $exists: false } }],
      }),
    };

    for (const [nome, quantita] of Object.entries(risultati)) {
      const esito = quantita === attesi[nome] ? "OK" : "ERRORE";
      console.log(`${esito} ${nome}: ${quantita}/${attesi[nome]}`);
    }

    const tuttoCorretto = Object.entries(risultati).every(
      ([nome, quantita]) => quantita === attesi[nome],
    );

    if (!tuttoCorretto) {
      process.exitCode = 1;
      return;
    }

    const statoEditorialeCorretto =
      statoGare.attuali === 1 &&
      statoGare.precedenti === 0 &&
      statoGare.mancanti === 0;

    console.log(
      `${statoEditorialeCorretto ? "OK" : "ERRORE"} stato gare: ` +
        `${statoGare.attuali} attuale, ${statoGare.precedenti} legacy, ` +
        `${statoGare.mancanti} senza stato`,
    );

    if (!statoEditorialeCorretto) {
      process.exitCode = 1;
      return;
    }

    const [analisiPerPilota, analisiPilotaPerGara, analisiPerScuderia, analisiScuderiaPerGara] =
      await Promise.all([
        AnalisiGara.aggregate([
          { $group: { _id: "$pilota", totale: { $sum: 1 } } },
        ]),
        AnalisiGara.aggregate([
          { $group: { _id: "$gara", totale: { $sum: 1 } } },
        ]),
        AnalisiScuderia.aggregate([
          { $group: { _id: "$scuderia", totale: { $sum: 1 } } },
        ]),
        AnalisiScuderia.aggregate([
          { $group: { _id: "$gara", totale: { $sum: 1 } } },
        ]),
      ]);

    const coperturaCompleta =
      analisiPerPilota.reduce((totale, gruppo) => totale + gruppo.totale, 0) ===
        attesi.analisiGare &&
      analisiPilotaPerGara.length === attesi.gare &&
      analisiPilotaPerGara.every((gruppo) => gruppo.totale === 22) &&
      analisiPerScuderia.every((gruppo) => gruppo.totale === 12) &&
      analisiScuderiaPerGara.every((gruppo) => gruppo.totale === 11);

    console.log(
      `${coperturaCompleta ? "OK" : "ERRORE"} copertura: ` +
        "22 partecipanti per gara e 12 gare per ogni scuderia",
    );

    if (!coperturaCompleta) {
      process.exitCode = 1;
      return;
    }

    const differenzeSorgente = await verificaCorrispondenzaSorgente();
    const sorgenteAllineata = differenzeSorgente.length === 0;

    console.log(
      `${sorgenteAllineata ? "OK" : "ERRORE"} corrispondenza JSON-MongoDB: ` +
        `${differenzeSorgente.length} differenze`,
    );

    if (!sorgenteAllineata) {
      for (const differenza of differenzeSorgente.slice(0, 20)) {
        console.error(`- ${differenza}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log("Database verificato correttamente.");
  } catch (errore) {
    console.error("Verifica fallita:", errore.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

verificaDatabase();
