const mongoose = require("mongoose");
const Gara = require("../../models/Gara");
const Pilota = require("../../models/Pilota");
const Scuderia = require("../../models/Scuderia");
const AnalisiGara = require("../../models/AnalisiGara");
const AnalisiScuderia = require("../../models/AnalisiScuderia");
const DatiLiveFia = require("../../models/DatiLiveFia");
const trovaGaraAttuale = require("../../services/garaAttuale");
const creaAndamentoAnnuale = require("../../services/andamentoAnnuale");
const {
  creaClassificaPrevisionale,
} = require("../../services/classificaPrevisionale");
const {
  indicatoriPilota,
  indicatoriScuderia,
} = require("../../services/statisticheContesto");
const {
  creaAggiornamentiLive,
  creaProfiloCircuito,
  creaProfiloScuderia,
} = require("../../services/profiliTecnici");
const { inviaErrore } = require("../../utils/rispostaApi");
const {
  LINGUA_PREDEFINITA,
  LINGUE_SUPPORTATE,
  linguaRichiesta,
  testiApi,
} = require("../../i18n/lingue");
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
const CAMPI_GARA_BREVE =
  "slug nome circuito paese stagione ordineAnalisi ordineCalendario stato traduzioni";

async function recuperaAndamentoPilota(pilota, garaAttuale, lingua) {
  return presentaAndamento(
    creaAndamentoAnnuale({
      stagione: garaAttuale.stagione,
      pilotaSlug: pilota.slug,
    }),
    lingua,
  );
}

async function recuperaAndamentoScuderia(scuderia, garaAttuale, lingua) {
  return presentaAndamento(
    creaAndamentoAnnuale({
      stagione: garaAttuale.stagione,
      scuderiaSlug: scuderia.slug,
    }),
    lingua,
  );
}

async function recuperaAnalisiPilota(pilotaId, garaId) {
  return AnalisiGara.findOne({ pilota: pilotaId, gara: garaId })
    .populate("pilota", CAMPI_PILOTA_BREVE)
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .populate("gara", CAMPI_GARA_BREVE)
    .lean();
}

async function recuperaAnalisiScuderia(scuderiaId, garaId) {
  return AnalisiScuderia.findOne({ scuderia: scuderiaId, gara: garaId })
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .populate("gara", CAMPI_GARA_BREVE)
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
  const lingua = linguaRichiesta(richiesta);
  const testi = testiApi(lingua);

  risposta.json({
    nome: "Race Analysis Hub API",
    versione: VERSIONE_API,
    descrizione: testi.descrizione,
    documentazione: "/api/docs",
    specificaOpenApi: "/api/v1/openapi.json",
    lingua,
    linguaPredefinita: LINGUA_PREDEFINITA,
    lingueSupportate: Object.values(LINGUE_SUPPORTATE),
    attribuzioneDati: attribuzioneF1db,
    endpoint: {
      home: "/api/v1/home",
      lingue: "/api/v1/lingue",
      piloti: "/api/v1/piloti",
      dettaglioPilota: "/api/v1/piloti/:pilotaSlug",
      scuderie: "/api/v1/scuderie",
      dettaglioScuderia: "/api/v1/scuderie/:scuderiaSlug",
      garaAttuale: "/api/v1/gare/attuale",
      dettaglioGaraAttuale: "/api/v1/gare/:garaSlug",
      classificaPiloti: "/api/v1/classifiche/piloti",
      classificaScuderie: "/api/v1/classifiche/scuderie",
      classificaPrevisionale: "/api/v1/previsioni/piloti",
      confrontoPiloti:
        "/api/v1/confronti/piloti/:primoPilotaSlug/:secondoPilotaSlug",
      confrontoScuderie:
        "/api/v1/confronti/scuderie/:primaScuderiaSlug/:secondaScuderiaSlug",
      analisiPilota:
        "/api/v1/gare/:garaSlug/piloti/:pilotaSlug/analisi",
      analisiScuderia:
        "/api/v1/gare/:garaSlug/scuderie/:scuderiaSlug/analisi",
    },
  });
}

function elencaLingue(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  risposta.json({
    lingua,
    linguaPredefinita: LINGUA_PREDEFINITA,
    lingue: Object.values(LINGUE_SUPPORTATE),
    utilizzo: testiApi(lingua).utilizzo,
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
  const lingua = linguaRichiesta(richiesta);
  const garaAttuale = await richiediGaraAttuale(risposta);
  if (!garaAttuale) return;

  const [
    piloti,
    scuderie,
    analisiPiloti,
    analisiScuderie,
    datiLiveFia,
    totaleGareAnalisi,
    ultimaGaraCalendario,
  ] = await Promise.all([
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
      DatiLiveFia.findOne({ garaSlug: garaAttuale.slug }).lean(),
      Gara.countDocuments({ stagione: garaAttuale.stagione }),
      Gara.findOne({ stagione: garaAttuale.stagione })
        .sort({ ordineCalendario: -1 })
        .select("ordineCalendario")
        .lean(),
    ]);

  risposta.json({
    lingua,
    garaAttuale: presentaGaraBreve(garaAttuale, lingua),
    piloti: piloti.map((pilota) => presentaPilota(pilota, lingua)),
    scuderie: scuderie.map((scuderia) =>
      presentaScuderia(scuderia, lingua),
    ),
    circuitoTecnico: creaProfiloCircuito(
      garaAttuale.slug,
      scuderie,
      datiLiveFia,
    ),
    aggiornamentiLive: creaAggiornamentiLive(datiLiveFia, scuderie),
    classificaPrevisionale: creaClassificaPrevisionale({
      gara: garaAttuale,
      piloti,
      scuderie,
      analisiPiloti,
      analisiScuderie,
      lingua,
    }),
    metadati: {
      stagione: garaAttuale.stagione,
      totalePiloti: piloti.length,
      totaleScuderie: scuderie.length,
      totaleGareAnalisi,
      totaleGareCalendario:
        ultimaGaraCalendario?.ordineCalendario || totaleGareAnalisi,
    },
  });
}

async function classificaPrevisionale(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
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
      lingua,
    }),
  );
}

async function elencaPiloti(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const piloti = await Pilota.find()
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    lingua,
    totale: piloti.length,
    piloti: piloti.map((pilota) => presentaPilota(pilota, lingua)),
  });
}

async function creaSchedaPilota(pilota, garaAttuale, lingua) {
  const [analisi, andamento] = await Promise.all([
    recuperaAnalisiPilota(pilota._id, garaAttuale._id),
    recuperaAndamentoPilota(pilota, garaAttuale, lingua),
  ]);

  return {
    pilota: presentaPilota(pilota, lingua),
    indicatori: indicatoriPilota(pilota.slug),
    analisi: presentaAnalisiPilota(analisi, lingua),
    andamentoStagioneCorrente: andamento,
  };
}

async function dettaglioPilota(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
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

  risposta.json({
    lingua,
    ...(await creaSchedaPilota(pilota, garaAttuale, lingua)),
  });
}

async function elencaScuderie(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const scuderie = await Scuderia.find()
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    lingua,
    totale: scuderie.length,
    scuderie: scuderie.map((scuderia) =>
      presentaScuderia(scuderia, lingua),
    ),
  });
}

async function creaSchedaScuderia(scuderia, garaAttuale, lingua) {
  const [piloti, analisi] = await Promise.all([
    Pilota.find({ scuderia: scuderia._id })
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .sort("classifica2026.posizione")
      .lean(),
    recuperaAnalisiScuderia(scuderia._id, garaAttuale._id),
  ]);
  const andamento = await recuperaAndamentoScuderia(
    scuderia,
    garaAttuale,
    lingua,
  );

  return {
    scuderia: presentaScuderia(scuderia, lingua),
    piloti: piloti.map((pilota) => presentaPilota(pilota, lingua)),
    indicatori: indicatoriScuderia(piloti),
    profiloTecnico: creaProfiloScuderia(scuderia.slug),
    analisi: presentaAnalisiScuderia(analisi, lingua),
    andamentoStagioneCorrente: andamento,
  };
}

async function dettaglioScuderia(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
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

  risposta.json({
    lingua,
    ...(await creaSchedaScuderia(scuderia, garaAttuale, lingua)),
  });
}

function verificaEntitaConfronto(risposta, prima, seconda, tipo) {
  if (prima === seconda) {
    inviaErrore(
      risposta,
      400,
      "CONFRONTO_IDENTICO",
      `Seleziona due ${tipo} diversi per il confronto`,
    );
    return false;
  }

  return true;
}

async function confrontoPiloti(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const { primoPilotaSlug, secondoPilotaSlug } = richiesta.params;
  if (
    !verificaEntitaConfronto(
      risposta,
      primoPilotaSlug,
      secondoPilotaSlug,
      "piloti",
    )
  ) {
    return;
  }

  const [garaAttuale, piloti] = await Promise.all([
    trovaGaraAttuale(),
    Pilota.find({ slug: { $in: [primoPilotaSlug, secondoPilotaSlug] } })
      .populate("scuderia", CAMPI_SCUDERIA_BREVE)
      .lean(),
  ]);

  if (piloti.length !== 2) {
    return inviaErrore(
      risposta,
      404,
      "PILOTA_NON_TROVATO",
      "Uno dei piloti richiesti non esiste",
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

  const pilotaPerSlug = new Map(piloti.map((pilota) => [pilota.slug, pilota]));
  const elementi = await Promise.all(
    [primoPilotaSlug, secondoPilotaSlug].map((slug) =>
      creaSchedaPilota(pilotaPerSlug.get(slug), garaAttuale, lingua),
    ),
  );

  risposta.json({ lingua, tipo: "piloti", elementi });
}

async function confrontoScuderie(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const { primaScuderiaSlug, secondaScuderiaSlug } = richiesta.params;
  if (
    !verificaEntitaConfronto(
      risposta,
      primaScuderiaSlug,
      secondaScuderiaSlug,
      "scuderie",
    )
  ) {
    return;
  }

  const [garaAttuale, scuderie] = await Promise.all([
    trovaGaraAttuale(),
    Scuderia.find({
      slug: { $in: [primaScuderiaSlug, secondaScuderiaSlug] },
    }).lean(),
  ]);

  if (scuderie.length !== 2) {
    return inviaErrore(
      risposta,
      404,
      "SCUDERIA_NON_TROVATA",
      "Una delle scuderie richieste non esiste",
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

  const scuderiaPerSlug = new Map(
    scuderie.map((scuderia) => [scuderia.slug, scuderia]),
  );
  const elementi = await Promise.all(
    [primaScuderiaSlug, secondaScuderiaSlug].map((slug) =>
      creaSchedaScuderia(scuderiaPerSlug.get(slug), garaAttuale, lingua),
    ),
  );

  risposta.json({ lingua, tipo: "scuderie", elementi });
}

async function elencaGare(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const garaAttuale = await richiediGaraAttuale(risposta);
  if (!garaAttuale) return;

  risposta.json({
    lingua,
    totale: 1,
    gare: [presentaGaraBreve(garaAttuale, lingua)],
  });
}

async function garaAttuale(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  risposta.json({ lingua, gara: presentaGara(gara, lingua) });
}

async function dettaglioGara(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
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
      .populate("gara", CAMPI_GARA_BREVE)
      .lean(),
    AnalisiScuderia.find({ gara: gara._id })
      .populate("scuderia", `${CAMPI_SCUDERIA_BREVE} classifica2026`)
      .populate("gara", CAMPI_GARA_BREVE)
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
    lingua,
    gara: presentaGara(gara, lingua),
    analisiPiloti: analisiPiloti.map((analisi) =>
      presentaAnalisiPilota(analisi, lingua),
    ),
    analisiScuderie: analisiScuderie.map((analisi) =>
      presentaAnalisiScuderia(analisi, lingua),
    ),
  });
}

async function classificaPiloti(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  const piloti = await Pilota.find()
    .populate("scuderia", CAMPI_SCUDERIA_BREVE)
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    lingua,
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
  const lingua = linguaRichiesta(richiesta);
  const gara = await richiediGaraAttuale(risposta);
  if (!gara) return;

  const scuderie = await Scuderia.find()
    .sort("classifica2026.posizione")
    .lean();

  risposta.json({
    lingua,
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
  const lingua = linguaRichiesta(richiesta);
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

  risposta.json({ lingua, analisi: presentaAnalisiPilota(analisi, lingua) });
}

async function analisiScuderiaPerGara(richiesta, risposta) {
  const lingua = linguaRichiesta(richiesta);
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

  risposta.json({
    lingua,
    analisi: presentaAnalisiScuderia(analisi, lingua),
  });
}

module.exports = {
  analisiPilotaPerGara,
  analisiScuderiaPerGara,
  classificaPrevisionale,
  classificaPiloti,
  classificaScuderie,
  confrontoPiloti,
  confrontoScuderie,
  descrizioneApi,
  dettaglioGara,
  dettaglioPilota,
  dettaglioScuderia,
  elencaGare,
  elencaLingue,
  elencaPiloti,
  elencaScuderie,
  garaAttuale,
  home,
  statoServizio,
};
