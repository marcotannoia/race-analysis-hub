const express = require("express");
const controller = require("../../controllers/v1/apiController");
const gestisciFunzioneAsincrona = require("../../middleware/gestisciFunzioneAsincrona");
const convalidaParametriSlug = require("../../middleware/convalidaParametriSlug");
const convalidaQuery = require("../../middleware/convalidaQuery");
const cachePubblica = require("../../middleware/cachePubblica");
const { inviaErrore } = require("../../utils/rispostaApi");

const router = express.Router();
const senzaQuery = convalidaQuery();

router.use((richiesta, risposta, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(richiesta.method)) {
    return next();
  }

  risposta.set("Allow", "GET, HEAD, OPTIONS");
  return inviaErrore(
    risposta,
    405,
    "METODO_NON_CONSENTITO",
    "Questa API pubblica consente esclusivamente operazioni di lettura",
  );
});

router.use(cachePubblica(60));

router.get("/", senzaQuery, controller.descrizioneApi);
router.get("/health", senzaQuery, controller.statoServizio);
router.get("/home", senzaQuery, gestisciFunzioneAsincrona(controller.home));
router.get(
  "/previsioni/piloti",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.classificaPrevisionale),
);

router.get(
  "/piloti",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.elencaPiloti),
);
router.get(
  "/piloti/:pilotaSlug",
  convalidaParametriSlug("pilotaSlug"),
  senzaQuery,
  gestisciFunzioneAsincrona(controller.dettaglioPilota),
);

router.get(
  "/scuderie",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.elencaScuderie),
);
router.get(
  "/scuderie/:scuderiaSlug",
  convalidaParametriSlug("scuderiaSlug"),
  senzaQuery,
  gestisciFunzioneAsincrona(controller.dettaglioScuderia),
);

router.get(
  "/gare",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.elencaGare),
);
router.get(
  "/gare/attuale",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.garaAttuale),
);
router.get(
  "/gare/:garaSlug/piloti/:pilotaSlug/analisi",
  convalidaParametriSlug("garaSlug", "pilotaSlug"),
  senzaQuery,
  gestisciFunzioneAsincrona(controller.analisiPilotaPerGara),
);
router.get(
  "/gare/:garaSlug/scuderie/:scuderiaSlug/analisi",
  convalidaParametriSlug("garaSlug", "scuderiaSlug"),
  senzaQuery,
  gestisciFunzioneAsincrona(controller.analisiScuderiaPerGara),
);
router.get(
  "/gare/:garaSlug",
  convalidaParametriSlug("garaSlug"),
  senzaQuery,
  gestisciFunzioneAsincrona(controller.dettaglioGara),
);

router.get(
  "/classifiche/piloti",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.classificaPiloti),
);
router.get(
  "/classifiche/scuderie",
  senzaQuery,
  gestisciFunzioneAsincrona(controller.classificaScuderie),
);

router.use((richiesta, risposta) => {
  inviaErrore(
    risposta,
    404,
    "ENDPOINT_NON_TROVATO",
    "L'endpoint API v1 richiesto non esiste",
  );
});

module.exports = router;
