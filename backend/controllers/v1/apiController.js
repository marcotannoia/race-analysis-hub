const mongoose = require("mongoose");
const Pilota = require("../../models/Pilota");
const Scuderia = require("../../models/Scuderia");
const AnalisiGara = require("../../models/AnalisiGara");
const AnalisiScuderia = require("../../models/AnalisiScuderia");
const trovaGaraAttuale = require("../../services/garaAttuale");
const creaAndamentoAnnuale = require("../../services/andamentoAnnuale");
const {
  creaClassificaPrevisionale,
} = require("../../services/classificaPrevisionale");
const { inviaErrore } = require("../../utils/rispostaApi");
const {
  presentaAnalisiPilota,
  presentaAnalisiScuderia,
  presentaAndamento,
  presentaGara,
  presentaGaraBreve,
  presentaPilota,
  presentaPilotaBreve,
  presentaScuderia,
  presentaScuderiaBreve,
} = require("../../presenters/apiV1");
const { metadati: metadatiF1db } = require("../../data/f1db-v2026.11.0-derivato.json");
const { version: VERSIONE_API } = require("../../package.json");

const attribuzioneF1db = {
  nome: metadatiF1db.fonte,
  url: metadatiF1db.releaseUrl,
  licenza: metadatiF1db.licenza,
  licenzaUrl: metadatiF1db.licenzaUrl,
  versione: metadatiF1db.versione,
  modifiche: metadatiF1db.trasformazioni,
};

const CAMPI_PILOTA_BREVE =
  "slug nome codice numero nazionalitaIso2 nazionalitaIso3";
const CAMPI_SCUDERIA_BREVE = "slug nome abbreviazione colore";

async function recuperaAndamentoPilota(pilota, garaAttuale) {
  return presentaAndamento(
    creaAndamentoAnnuale({
      stagione: garaAttuale.stagione,
      pilotaSlug: pilota.slug,
    }),
  );
}

async function recuperaAndamentoScuderia(scuderia, garaAttuale) {
  return presentaAndamento(
    creaAndamentoAnnuale({
      stagione: garaAttuale.stagione,
      scuderiaSlug: scuderia.slug,
    }),
  );
}

async function recuperaAnalisiPilota(pilotaId, garaId) {
  return AnalisiGara.findOne({ pilota: pilotaId, gara: garaId })
    .populate("pilota", CAMPI_PILOTA_BREVE)
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .populate("gara", "slug nome circuito paese stagione ordineAnalisi stato")
    .lean();
}

async function recuperaAnalisiScuderia(scuderiaId, garaId) {
  return AnalisiScuderia.findOne({ scuderia: scuderiaId, gara: garaId })
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .populate("gara", "slug nome circuito paese stagione ordineAnalisi stato")
    .lean();
}

async function richiediGaraAttuale(risposta) {
  const gara = await trovaGaraAttuale();

  if (!gara) {
    inviaErrore(
      risposta,
      404,
      "GARA_ATTUALE_NON_DISPONIBILE",
      "Il Gran Premio attuale non e ancora stato pubblicato",
    );
    return null;
  }

  return gara;
}

function descrizioneApi(richiesta, risposta) {
  risposta.json({
    nome: "Race Analysis Hub API",
    versione: VERSIONE_API,
    descrizione:
      "API pubblica di sola lettura per il Gran Premio attuale, i piloti, " +
      "le scuderie e la classifica previsionale",
    documentazione: "/api/docs",
    specificaOpenApi: "/api/v1/openapi.json",
    attribuzioneDati: attribuzioneF1db,
    endpoint: {
      home: "/api/v1/home",
      piloti: "/api/v1/piloti",
      dettaglioPilota: "/api/v1/piloti/:pilotaSlug",
      scuderie: "/api/v1/scuderie",
      dettaglioScuderia: "/api/v1/scuderie/:scuderiaSlug",
      garaAttuale: "/api/v1/gare/attuale",
      dettaglioGaraAttuale: "/api/v1/gare/:garaSlug",
      classificaPiloti: "/api/v1/classifiche/piloti",
      classificaScuderie: "/api/v1/classifiche/scuderie",
      classificaPrevisionale: "/api/v1/previsioni/piloti",
      analisiPilota:
        "/api/v1/gare/:garaSlug/piloti/:pilotaSlug/analisi",
      analisiScuderia:
        "/api/v1/gare/:garaSlug/scuderie/:scuderiaSlug/analisi",
    },
  });
}

function statoServizio(richiesta, risposta) {
  const databaseConnesso = mongoose.connection.readyState === 1;

  risposta
    .status(databaseConnesso ? 200 : 503)
    .set("Cache-Control", "no-store")
    .json({
      stato: databaseConnesso ? "ok" : "non_disponibile",
      servizio: "race-analysis-hub-api",
      versione: VERSIONE_API,
      requestId: risposta.locals.requestId,
    });
}

async function home(richiesta, risposta) {
  const garaAttuale = await richiediGaraAttuale(risposta);
  if (!garaAttuale) return;

  const [piloti, scuderie] = await Promise.all([
    Pilota.find()
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .sort("classifica2026.posizione")
      .lean(),
    Scuderia.find().sort("classifica2026.posizione").lean(),
  ]);

  risposta.json({
    garaAttuale: presentaGaraBreve(garaAttuale),
    piloti: piloti.map(presentaPilota),
    scuderie: scuderie.map(presentaScuderia),
    metadati: {
      stagione: garaAttuale.stagione,
      totalePiloti: piloti.length,
      totaleScuderie: scuderie.length,
    },
  });
}

async function classificaPrevisionale(richiesta, risposta) {
  const garaAttuale = await richiediGaraAttuale(risposta);
  if (!garaAttuale) return;

  const [piloti, scuderie, analisiPiloti, analisiScuderie] = await Promise.all([
    Pilota.find()
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .sort("classifica2026.posizione")
      .lean(),
    Scuderia.find().sort("classifica2026.posizione").lean(),
    AnalisiGara.find({ gara: garaAttuale._id })
      .populate("pilota", `${CAMPI_PILOTA_BREVE} classifica2026`)
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .lean(),
    AnalisiScuderia.find({ gara: garaAttuale._id })
      .populate("scuderia", `${CAMPI_SCUDERIA_BREVE} classifica2026`)
      .lean(),
  ]);

  risposta.json(
    creaClassificaPrevisionale({
      gara: garaAttuale,
      piloti,
      scuderie,
      analisiPiloti,
      analisiScuderie,
    }),
  );
}

async function elencaPiloti(richiesta, risposta) {
  const piloti = await Pilota.find()
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    totale: piloti.length,
    piloti: piloti.map(presentaPilota),
  });
}

async function dettaglioPilota(richiesta, risposta) {
  const [garaAttuale, pilota] = await Promise.all([
    trovaGaraAttuale(),
    Pilota.findOne({ slug: richiesta.params.pilotaSlug })
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .lean(),
  ]);

  if (!pilota) {
    return inviaErrore(
      risposta,
      404,
      "PILOTA_NON_TROVATO",
      "Il pilota richiesto non esiste",
    );
  }

  if (!garaAttuale) {
    return inviaErrore(
      risposta,
      404,
      "GARA_ATTUALE_NON_DISPONIBILE",
      "Il Gran Premio attuale non e ancora stato pubblicato",
    );
  }

  const [analisi, andamento] = await Promise.all([
    recuperaAnalisiPilota(pilota._id, garaAttuale._id),
    recuperaAndamentoPilota(pilota, garaAttuale),
  ]);

  risposta.json({
    pilota: presentaPilota(pilota),
    analisi: presentaAnalisiPilota(analisi),
    andamentoStagioneCorrente: andamento,
  });
}

async function elencaScuderie(richiesta, risposta) {
  const scuderie = await Scuderia.find()
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    totale: scuderie.length,
    scuderie: scuderie.map(presentaScuderia),
  });
}

async function dettaglioScuderia(richiesta, risposta) {
  const [garaAttuale, scuderia] = await Promise.all([
    trovaGaraAttuale(),
    Scuderia.findOne({ slug: richiesta.params.scuderiaSlug }).lean(),
  ]);

  if (!scuderia) {
    return inviaErrore(
      risposta,
      404,
      "SCUDERIA_NON_TROVATA",
      "La scuderia richiesta non esiste",
    );
  }

  if (!garaAttuale) {
    return inviaErrore(
      risposta,
      404,
      "GARA_ATTUALE_NON_DISPONIBILE",
      "Il Gran Premio attuale non e ancora stato pubblicato",
    );
  }

  const [piloti, analisi] = await Promise.all([
    Pilota.find({ scuderia: scuderia._id })
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .sort("classifica2026.posizione")
      .lean(),
    recuperaAnalisiScuderia(scuderia._id, garaAttuale._id),
  ]);
  const andamento = await recuperaAndamentoScuderia(scuderia, garaAttuale);

  risposta.json({
    scuderia: presentaScuderia(scuderia),
    piloti: piloti.map(presentaPilota),
    analisi: presentaAnalisiScuderia(analisi),
    andamentoStagioneCorrente: andamento,
  });
}

async function elencaGare(richiesta, risposta) {
  const garaAttuale = await richiediGaraAttuale(risposta);
  if (!garaAttuale) return;

  risposta.json({
    totale: 1,
    gare: [presentaGaraBreve(garaAttuale)],
  });
}

async function garaAttuale(richiesta, risposta) {
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  risposta.json({ gara: presentaGara(gara) });
}

async function dettaglioGara(richiesta, risposta) {
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  if (gara.slug !== richiesta.params.garaSlug) {
    return inviaErrore(
      risposta,
      404,
      "GARA_NON_ACCESSIBILE",
      "E disponibile esclusivamente il Gran Premio attuale",
    );
  }

  const [analisiPiloti, analisiScuderie] = await Promise.all([
    AnalisiGara.find({ gara: gara._id })
      .populate("pilota", `${CAMPI_PILOTA_BREVE} classifica2026`)
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .populate("gara", "slug nome circuito paese stagione ordineAnalisi stato")
      .lean(),
    AnalisiScuderia.find({ gara: gara._id })
      .populate("scuderia", `${CAMPI_SCUDERIA_BREVE} classifica2026`)
      .populate("gara", "slug nome circuito paese stagione ordineAnalisi stato")
      .lean(),
  ]);

  analisiPiloti.sort(
    (prima, seconda) =>
      prima.pilota.classifica2026.posizione -
      seconda.pilota.classifica2026.posizione,
  );
  analisiScuderie.sort(
    (prima, seconda) =>
      prima.scuderia.classifica2026.posizione -
      seconda.scuderia.classifica2026.posizione,
  );

  risposta.json({
    gara: presentaGara(gara),
    analisiPiloti: analisiPiloti.map(presentaAnalisiPilota),
    analisiScuderie: analisiScuderie.map(presentaAnalisiScuderia),
  });
}

async function classificaPiloti(richiesta, risposta) {
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  const piloti = await Pilota.find()
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    stagione: gara.stagione,
    tipo: "piloti",
    totale: piloti.length,
    classifica: piloti.map((pilota) => ({
      posizione: pilota.classifica2026.posizione,
      pilota: presentaPilotaBreve(pilota),
      scuderia: presentaScuderiaBreve(pilota.scuderia),
      punti: pilota.classifica2026.punti,
      vittorie: pilota.classifica2026.vittorie,
    })),
  });
}

async function classificaScuderie(richiesta, risposta) {
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  const scuderie = await Scuderia.find()
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    stagione: gara.stagione,
    tipo: "scuderie",
    totale: scuderie.length,
    classifica: scuderie.map((scuderia) => ({
      posizione: scuderia.classifica2026.posizione,
      scuderia: presentaScuderiaBreve(scuderia),
      punti: scuderia.classifica2026.punti,
      vittorie: scuderia.classifica2026.vittorie,
    })),
  });
}

async function analisiPilotaPerGara(richiesta, risposta) {
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  if (gara.slug !== richiesta.params.garaSlug) {
    return inviaErrore(
      risposta,
      404,
      "GARA_NON_ACCESSIBILE",
      "E disponibile esclusivamente il Gran Premio attuale",
    );
  }

  const pilota = await Pilota.findOne({ slug: richiesta.params.pilotaSlug })
    .select("_id")
    .lean();

  if (!pilota) {
    return inviaErrore(
      risposta,
      404,
      "PILOTA_NON_TROVATO",
      "Il pilota richiesto non esiste",
    );
  }

  const analisi = await recuperaAnalisiPilota(pilota._id, gara._id);

  if (!analisi) {
    return inviaErrore(
      risposta,
      404,
      "ANALISI_NON_TROVATA",
      "L'analisi richiesta non e disponibile",
    );
  }

  risposta.json({ analisi: presentaAnalisiPilota(analisi) });
}

async function analisiScuderiaPerGara(richiesta, risposta) {
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  if (gara.slug !== richiesta.params.garaSlug) {
    return inviaErrore(
      risposta,
      404,
      "GARA_NON_ACCESSIBILE",
      "E disponibile esclusivamente il Gran Premio attuale",
    );
  }

  const scuderia = await Scuderia.findOne({
    slug: richiesta.params.scuderiaSlug,
  })
    .select("_id")
    .lean();

  if (!scuderia) {
    return inviaErrore(
      risposta,
      404,
      "SCUDERIA_NON_TROVATA",
      "La scuderia richiesta non esiste",
    );
  }

  const analisi = await recuperaAnalisiScuderia(scuderia._id, gara._id);

  if (!analisi) {
    return inviaErrore(
      risposta,
      404,
      "ANALISI_NON_TROVATA",
      "L'analisi richiesta non e disponibile",
    );
  }

  risposta.json({ analisi: presentaAnalisiScuderia(analisi) });
}

module.exports = {
  analisiPilotaPerGara,
  analisiScuderiaPerGara,
  classificaPrevisionale,
  classificaPiloti,
  classificaScuderie,
  descrizioneApi,
  dettaglioGara,
  dettaglioPilota,
  dettaglioScuderia,
  elencaGare,
  elencaPiloti,
  elencaScuderie,
  garaAttuale,
  home,
  statoServizio,
};
