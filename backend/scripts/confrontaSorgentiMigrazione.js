// Confronto in sola lettura fra il seed del repository e il database MongoDB.
const path = require("node:path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const { creaDatiEffettivi } = require("../utils/datiEffettivi");
const seed = creaDatiEffettivi(require("../data/dati-iniziali.json"));

function differenze(elencoSeed, elencoMongo, chiave, campi) {
  const attesi = new Map(elencoSeed.map((voce) => [chiave(voce), voce]));
  const effettivi = new Map(elencoMongo.map((voce) => [chiave(voce), voce]));
  const mancantiInMongo = [...attesi.keys()].filter((id) => !effettivi.has(id));
  const soloInMongo = [...effettivi.keys()].filter((id) => !attesi.has(id));
  const campiDiversi = [];

  for (const [id, atteso] of attesi) {
    const effettivo = effettivi.get(id);
    if (!effettivo) continue;
    const diversi = campi.filter((campo) => {
      const normalizza = (valore) =>
        campo === "classifica2026" && valore
          ? [valore.posizione, valore.punti, valore.vittorie]
          : valore ?? null;
      return JSON.stringify(normalizza(atteso[campo])) !== JSON.stringify(normalizza(effettivo[campo]));
    });
    if (diversi.length) campiDiversi.push({ id, campi: diversi });
  }

  return {
    seed: attesi.size,
    mongo: effettivi.size,
    mancantiInMongo,
    soloInMongo,
    campiDiversi,
  };
}

async function principale() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL non configurata");
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.DATABASE_NAME || "f1_stats",
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const db = mongoose.connection.db;
    const [piloti, scuderie, gare, analisiGare, analisiScuderie] = await Promise.all(
      ["piloti", "scuderie", "gare", "analisiGare", "analisiScuderie"].map((nome) =>
        db.collection(nome).find({}).toArray(),
      ),
    );
    const pilotaPerId = new Map(piloti.map((voce) => [String(voce._id), voce.slug]));
    const scuderiaPerId = new Map(scuderie.map((voce) => [String(voce._id), voce.slug]));
    const garaPerId = new Map(gare.map((voce) => [String(voce._id), voce.slug]));

    const risultato = {
      piloti: differenze(
        seed.piloti,
        piloti.map((voce) => ({ ...voce, scuderiaSlug: scuderiaPerId.get(String(voce.scuderia)) })),
        (voce) => voce.slug,
        ["nome", "codice", "numero", "nazionalitaIso2", "nazionalitaIso3", "scuderiaSlug", "classifica2026"],
      ),
      scuderie: differenze(
        seed.scuderie,
        scuderie,
        (voce) => voce.slug,
        ["nome", "nomeClassifica", "abbreviazione", "colore", "nazionalita", "classifica2026"],
      ),
      gare: differenze(
        seed.gare,
        gare,
        (voce) => voce.slug,
        ["nome", "circuito", "paese", "stagione", "stato", "ordineAnalisi", "ordineCalendario"],
      ),
      analisiGare: differenze(
        seed.analisiGare,
        analisiGare.map((voce) => ({
          ...voce,
          pilotaSlug: pilotaPerId.get(String(voce.pilota)),
          scuderiaSlug: scuderiaPerId.get(String(voce.scuderia)),
          garaSlug: garaPerId.get(String(voce.gara)),
          considerazioniFinali: voce.considerazioni,
        })),
        (voce) => `${voce.garaSlug}/${voce.pilotaSlug}`,
        ["scuderiaSlug", "considerazioniFinali", "penalita", "aggiornamentiInArrivo", "vantaggioAggiornamentiTecnici", "statoAggiornamentiTecnici"],
      ),
      analisiScuderie: differenze(
        seed.analisiScuderie,
        analisiScuderie.map((voce) => ({
          ...voce,
          scuderiaSlug: scuderiaPerId.get(String(voce.scuderia)),
          garaSlug: garaPerId.get(String(voce.gara)),
          considerazioniFinali: voce.considerazioni,
        })),
        (voce) => `${voce.garaSlug}/${voce.scuderiaSlug}`,
        ["considerazioniFinali", "aggiornamentiInArrivo"],
      ),
    };

    const sintesi = Object.fromEntries(
      Object.entries(risultato).map(([nome, dati]) => [
        nome,
        {
          seed: dati.seed,
          mongo: dati.mongo,
          mancantiInMongo: dati.mancantiInMongo,
          soloInMongo: dati.soloInMongo,
          documentiConCampiDiversi: dati.campiDiversi.length,
          esempiCampiDiversi: dati.campiDiversi.slice(0, 5),
        },
      ]),
    );
    console.log(JSON.stringify(process.argv.includes("--details") ? risultato : sintesi, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

principale().catch((errore) => {
  console.error(`${errore.name}: ${errore.message}`);
  process.exitCode = 1;
});
