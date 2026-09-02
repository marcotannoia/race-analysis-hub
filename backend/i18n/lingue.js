const LINGUA_PREDEFINITA = "it";

const LINGUE_SUPPORTATE = Object.freeze({
  it: { codice: "it", nome: "Italiano", nomeLocale: "Italiano" },
  en: { codice: "en", nome: "Inglese", nomeLocale: "English" },
  fr: { codice: "fr", nome: "Francese", nomeLocale: "Français" },
  pt: { codice: "pt", nome: "Portoghese", nomeLocale: "Português" },
  es: { codice: "es", nome: "Spagnolo", nomeLocale: "Español" },
  de: { codice: "de", nome: "Tedesco", nomeLocale: "Deutsch" },
});

const TESTI_API = Object.freeze({
  it: {
    descrizione: "API pubblica di sola lettura per il Gran Premio attuale, piloti, scuderie, indicatori, confronti e classifica previsionale",
    utilizzo: "Aggiungere ?lingua=it, en, fr, pt, es o de agli endpoint pubblici",
  },
  en: {
    descrizione: "Public read-only API for the current Grand Prix, drivers, teams, indicators, comparisons and prediction ranking",
    utilizzo: "Add ?lingua=it, en, fr, pt, es or de to public endpoints",
  },
  fr: {
    descrizione: "API publique en lecture seule pour le Grand Prix actuel, les pilotes, les écuries, les indicateurs, les comparaisons et le classement prévisionnel",
    utilizzo: "Ajouter ?lingua=it, en, fr, pt, es ou de aux endpoints publics",
  },
  pt: {
    descrizione: "API pública só de leitura para o Grande Prémio atual, pilotos, equipas, indicadores, comparações e classificação prevista",
    utilizzo: "Adicionar ?lingua=it, en, fr, pt, es ou de aos endpoints públicos",
  },
  es: {
    descrizione: "API pública de solo lectura para el Gran Premio actual, pilotos, equipos, indicadores, comparaciones y clasificación prevista",
    utilizzo: "Añadir ?lingua=it, en, fr, pt, es o de a los endpoints públicos",
  },
  de: {
    descrizione: "Öffentliche schreibgeschützte API für den aktuellen Grand Prix, Fahrer, Teams, Kennzahlen, Vergleiche und die Prognoserangliste",
    utilizzo: "?lingua=it, en, fr, pt, es oder de an öffentliche Endpunkte anhängen",
  },
});

const MESSAGGI_ERRORE = Object.freeze({
  it: {
    METODO_NON_CONSENTITO:
      "Questa API pubblica consente esclusivamente operazioni di lettura",
    ENDPOINT_NON_TROVATO: "L'endpoint API v1 richiesto non esiste",
    GARA_ATTUALE_NON_DISPONIBILE:
      "Il Gran Premio attuale non è ancora stato pubblicato",
    PILOTA_NON_TROVATO: "Il pilota richiesto non esiste",
    SCUDERIA_NON_TROVATA: "La scuderia richiesta non esiste",
    CONFRONTO_IDENTICO: "Seleziona due profili diversi per il confronto",
    GARA_NON_ACCESSIBILE:
      "È disponibile esclusivamente il Gran Premio attuale",
    ANALISI_NON_TROVATA: "L'analisi richiesta non è disponibile",
    LINGUA_NON_SUPPORTATA: ({ lingua }) =>
      `Lingua non supportata: ${lingua}`,
    PARAMETRO_QUERY_NON_VALIDO: ({ parametri }) =>
      `Parametri non supportati: ${parametri}`,
    IDENTIFICATORE_NON_VALIDO: ({ parametro }) =>
      `Il parametro ${parametro} non è valido`,
    RICHIESTA_NON_VALIDA: "Richiesta non valida",
    ERRORE_INTERNO: "Si è verificato un errore interno al server",
    LIMITE_RICHIESTE_SUPERATO:
      "Troppe richieste. Riprova tra qualche minuto",
    VERSIONE_API_OBSOLETA:
      "Questo endpoint è stato sostituito dalla versione /api/v1",
  },
  en: {
    METODO_NON_CONSENTITO:
      "This public API only allows read operations",
    ENDPOINT_NON_TROVATO: "The requested API v1 endpoint does not exist",
    GARA_ATTUALE_NON_DISPONIBILE:
      "The current Grand Prix has not been published yet",
    PILOTA_NON_TROVATO: "The requested driver does not exist",
    SCUDERIA_NON_TROVATA: "The requested team does not exist",
    CONFRONTO_IDENTICO: "Select two different profiles to compare",
    GARA_NON_ACCESSIBILE: "Only the current Grand Prix is available",
    ANALISI_NON_TROVATA: "The requested analysis is not available",
    LINGUA_NON_SUPPORTATA: ({ lingua }) =>
      `Unsupported language: ${lingua}`,
    PARAMETRO_QUERY_NON_VALIDO: ({ parametri }) =>
      `Unsupported query parameters: ${parametri}`,
    IDENTIFICATORE_NON_VALIDO: ({ parametro }) =>
      `The ${parametro} parameter is invalid`,
    RICHIESTA_NON_VALIDA: "Invalid request",
    ERRORE_INTERNO: "An internal server error occurred",
    LIMITE_RICHIESTE_SUPERATO:
      "Too many requests. Please try again in a few minutes",
    VERSIONE_API_OBSOLETA:
      "This endpoint has been replaced by the /api/v1 version",
  },
  fr: {
    METODO_NON_CONSENTITO:
      "Cette API publique autorise uniquement les opérations de lecture",
    ENDPOINT_NON_TROVATO: "L'endpoint API v1 demandé n'existe pas",
    GARA_ATTUALE_NON_DISPONIBILE:
      "Le Grand Prix actuel n'a pas encore été publié",
    PILOTA_NON_TROVATO: "Le pilote demandé n'existe pas",
    SCUDERIA_NON_TROVATA: "L'écurie demandée n'existe pas",
    CONFRONTO_IDENTICO: "Sélectionnez deux profils différents à comparer",
    GARA_NON_ACCESSIBILE: "Seul le Grand Prix actuel est disponible",
    ANALISI_NON_TROVATA: "L'analyse demandée n'est pas disponible",
    LINGUA_NON_SUPPORTATA: ({ lingua }) =>
      `Langue non prise en charge : ${lingua}`,
    PARAMETRO_QUERY_NON_VALIDO: ({ parametri }) =>
      `Paramètres de requête non pris en charge : ${parametri}`,
    IDENTIFICATORE_NON_VALIDO: ({ parametro }) =>
      `Le paramètre ${parametro} n'est pas valide`,
    RICHIESTA_NON_VALIDA: "Requête non valide",
    ERRORE_INTERNO: "Une erreur interne du serveur s'est produite",
    LIMITE_RICHIESTE_SUPERATO:
      "Trop de requêtes. Réessayez dans quelques minutes",
    VERSIONE_API_OBSOLETA:
      "Cet endpoint a été remplacé par la version /api/v1",
  },
  pt: {
    METODO_NON_CONSENTITO:
      "Esta API pública permite apenas operações de leitura",
    ENDPOINT_NON_TROVATO: "O endpoint API v1 solicitado não existe",
    GARA_ATTUALE_NON_DISPONIBILE:
      "O Grande Prémio atual ainda não foi publicado",
    PILOTA_NON_TROVATO: "O piloto solicitado não existe",
    SCUDERIA_NON_TROVATA: "A equipa solicitada não existe",
    CONFRONTO_IDENTICO: "Selecione dois perfis diferentes para comparar",
    GARA_NON_ACCESSIBILE: "Apenas o Grande Prémio atual está disponível",
    ANALISI_NON_TROVATA: "A análise solicitada não está disponível",
    LINGUA_NON_SUPPORTATA: ({ lingua }) =>
      `Idioma não suportado: ${lingua}`,
    PARAMETRO_QUERY_NON_VALIDO: ({ parametri }) =>
      `Parâmetros de consulta não suportados: ${parametri}`,
    IDENTIFICATORE_NON_VALIDO: ({ parametro }) =>
      `O parâmetro ${parametro} não é válido`,
    RICHIESTA_NON_VALIDA: "Pedido inválido",
    ERRORE_INTERNO: "Ocorreu um erro interno no servidor",
    LIMITE_RICHIESTE_SUPERATO:
      "Demasiados pedidos. Tente novamente dentro de alguns minutos",
    VERSIONE_API_OBSOLETA:
      "Este endpoint foi substituído pela versão /api/v1",
  },
  es: {
    METODO_NON_CONSENTITO:
      "Esta API pública solo permite operaciones de lectura",
    ENDPOINT_NON_TROVATO: "El endpoint API v1 solicitado no existe",
    GARA_ATTUALE_NON_DISPONIBILE:
      "El Gran Premio actual aún no se ha publicado",
    PILOTA_NON_TROVATO: "El piloto solicitado no existe",
    SCUDERIA_NON_TROVATA: "El equipo solicitado no existe",
    CONFRONTO_IDENTICO: "Selecciona dos perfiles diferentes para comparar",
    GARA_NON_ACCESSIBILE: "Solo está disponible el Gran Premio actual",
    ANALISI_NON_TROVATA: "El análisis solicitado no está disponible",
    LINGUA_NON_SUPPORTATA: ({ lingua }) =>
      `Idioma no compatible: ${lingua}`,
    PARAMETRO_QUERY_NON_VALIDO: ({ parametri }) =>
      `Parámetros de consulta no compatibles: ${parametri}`,
    IDENTIFICATORE_NON_VALIDO: ({ parametro }) =>
      `El parámetro ${parametro} no es válido`,
    RICHIESTA_NON_VALIDA: "Solicitud no válida",
    ERRORE_INTERNO: "Se ha producido un error interno del servidor",
    LIMITE_RICHIESTE_SUPERATO:
      "Demasiadas solicitudes. Inténtalo de nuevo dentro de unos minutos",
    VERSIONE_API_OBSOLETA:
      "Este endpoint se ha sustituido por la versión /api/v1",
  },
  de: {
    METODO_NON_CONSENTITO:
      "Diese öffentliche API erlaubt ausschließlich Lesezugriffe",
    ENDPOINT_NON_TROVATO: "Der angeforderte API-v1-Endpunkt existiert nicht",
    GARA_ATTUALE_NON_DISPONIBILE:
      "Der aktuelle Grand Prix wurde noch nicht veröffentlicht",
    PILOTA_NON_TROVATO: "Der angeforderte Fahrer existiert nicht",
    SCUDERIA_NON_TROVATA: "Das angeforderte Team existiert nicht",
    CONFRONTO_IDENTICO: "Wähle zwei verschiedene Profile für den Vergleich aus",
    GARA_NON_ACCESSIBILE: "Es ist nur der aktuelle Grand Prix verfügbar",
    ANALISI_NON_TROVATA: "Die angeforderte Analyse ist nicht verfügbar",
    LINGUA_NON_SUPPORTATA: ({ lingua }) =>
      `Nicht unterstützte Sprache: ${lingua}`,
    PARAMETRO_QUERY_NON_VALIDO: ({ parametri }) =>
      `Nicht unterstützte Abfrageparameter: ${parametri}`,
    IDENTIFICATORE_NON_VALIDO: ({ parametro }) =>
      `Der Parameter ${parametro} ist ungültig`,
    RICHIESTA_NON_VALIDA: "Ungültige Anfrage",
    ERRORE_INTERNO: "Ein interner Serverfehler ist aufgetreten",
    LIMITE_RICHIESTE_SUPERATO:
      "Zu viele Anfragen. Bitte versuche es in einigen Minuten erneut",
    VERSIONE_API_OBSOLETA:
      "Dieser Endpunkt wurde durch die Version /api/v1 ersetzt",
  },
});

function linguaSupportata(codice) {
  return Object.hasOwn(LINGUE_SUPPORTATE, codice);
}

function linguaRichiesta(richiesta) {
  return linguaSupportata(richiesta?.query?.lingua)
    ? richiesta.query.lingua
    : LINGUA_PREDEFINITA;
}

function traduzioneDocumento(documento, lingua) {
  if (!documento) return {};
  return documento.traduzioni?.[lingua] || {};
}

function valoreLocalizzato(documento, campo, lingua, fallback = "") {
  const traduzione = traduzioneDocumento(documento, lingua)[campo];
  return traduzione ?? documento?.[campo] ?? fallback;
}

function testiApi(lingua) {
  return TESTI_API[lingua] || TESTI_API[LINGUA_PREDEFINITA];
}

function messaggioErrore(codice, lingua, valori = {}) {
  const catalogo = MESSAGGI_ERRORE[lingua] || MESSAGGI_ERRORE.it;
  const messaggio = catalogo[codice] || MESSAGGI_ERRORE.it[codice] || codice;
  return typeof messaggio === "function" ? messaggio(valori) : messaggio;
}

function convalidaLingua(richiesta, risposta, next) {
  const lingua = richiesta.query.lingua;
  const linguaEffettiva = linguaSupportata(lingua)
    ? lingua
    : LINGUA_PREDEFINITA;

  risposta.locals.lingua = linguaEffettiva;
  risposta.set("Content-Language", linguaEffettiva);

  if (lingua !== undefined && !linguaSupportata(lingua)) {
    return risposta.status(400).set("Cache-Control", "no-store").json({
      errore: {
        codice: "LINGUA_NON_SUPPORTATA",
        messaggio: messaggioErrore(
          "LINGUA_NON_SUPPORTATA",
          LINGUA_PREDEFINITA,
          { lingua },
        ),
        lingueSupportate: Object.keys(LINGUE_SUPPORTATE),
        requestId: risposta.locals.requestId,
      },
    });
  }

  next();
}

module.exports = {
  LINGUA_PREDEFINITA,
  LINGUE_SUPPORTATE,
  convalidaLingua,
  linguaRichiesta,
  linguaSupportata,
  messaggioErrore,
  traduzioneDocumento,
  testiApi,
  valoreLocalizzato,
};
