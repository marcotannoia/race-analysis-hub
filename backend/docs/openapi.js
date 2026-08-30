const { version: versioneApi } = require("../package.json");

const intestazioneRequestId = {
  "X-Request-ID": { $ref: "#/components/headers/RequestId" },
  "Content-Language": { $ref: "#/components/headers/ContentLanguage" },
  "X-App-Cache": { $ref: "#/components/headers/XAppCache" },
};
const parametroLingua = { $ref: "#/components/parameters/Lingua" };
const parametroSlugConfronto = (nome, descrizione, esempio) => ({
  name: nome,
  in: "path",
  required: true,
  description: descrizione,
  schema: {
    type: "string",
    minLength: 1,
    maxLength: 80,
    pattern: "^[a-z0-9]+(?:[-_][a-z0-9]+)*$",
  },
  example: esempio,
});

const esempioPesiPrevisionali = [
  ["andamento2026", "Andamento 2026", 10],
  ["compatibilitaVetturaCircuito", "Compatibilità vettura-circuito", 25],
  ["aggiornamentiTecnici", "Aggiornamenti tecnici pertinenti", 10],
  ["qualifica2026", "Qualifica 2026", 3],
  ["scuderia2026", "Andamento scuderia 2026", 18],
  ["storicoPersonale", "Storico personale", 6],
  ["passoGaraRecente", "Andamento negli ultimi 3 GP", 25],
  ["gestioneGomme", "Gestione gomme", 1],
  ["affidabilitaERischi", "Affidabilità e rischi", 2],
].map(([chiave, nome, pesoPercentuale]) => ({
  chiave,
  nome,
  pesoPercentuale,
}));

const esempioFattoriPrevisionali = esempioPesiPrevisionali.map((peso) => ({
  ...peso,
  valutazione: 50,
  contributo: peso.pesoPercentuale / 2,
}));

function rispostaJson(descrizione, riferimentoSchema, esempio) {
  const contenuto = {
    schema: { $ref: riferimentoSchema },
  };

  if (esempio) contenuto.example = esempio;

  return {
    description: descrizione,
    headers: intestazioneRequestId,
    content: { "application/json": contenuto },
  };
}

const risposteComuni = {
  400: { $ref: "#/components/responses/RichiestaNonValida" },
  429: { $ref: "#/components/responses/LimiteRichiesteSuperato" },
  500: { $ref: "#/components/responses/ErroreInterno" },
};

const documentoOpenApi = {
  openapi: "3.1.0",
  info: {
    title: "Race Analysis Hub API",
    version: versioneApi,
    description:
      "API REST pubblica, anonima e di sola lettura. Non richiede autenticazione e " +
      "consente esclusivamente GET, HEAD e OPTIONS. Le analisi editoriali sono " +
      "pubblicate soltanto per il Gran Premio attuale; gare future e relative " +
      "analisi non vengono esposte. Classifiche e risultati quantitativi provengono " +
      "da uno snapshot locale derivato da F1DB v2026.11.0 (CC BY 4.0), senza " +
      "chiamate esterne a runtime, e sono visualizzati con Chart.js. " +
      "Le risposte pubbliche possono essere copiate, mostrate e adattate nel software " +
      "del riutilizzatore, anche per uso commerciale, secondo la CC BY 4.0. " +
      "La personalizzazione di campi come aggiornamentiInArrivo modifica soltanto la " +
      "copia del riutilizzatore e non il database ufficiale. Occorre attribuire " +
      "Race Analysis Hub — Marco Tannoia, mantenere l'attribuzione a F1DB per i dati " +
      "quantitativi e indicare le modifiche effettuate. " +
      "Le anagrafiche dei piloti includono codici ISO 3166-1 alpha-2 e alpha-3, " +
      "numero vettura, abbreviazione del nome, abbreviazione della scuderia e " +
      "colore identificativo in formato esadecimale. I campi codice e numero " +
      "restano disponibili per compatibilità con le integrazioni esistenti. " +
      "La home include la classifica previsionale per evitare una seconda chiamata; " +
      "l'endpoint dedicato /previsioni/piloti resta disponibile per compatibilità. " +
      "L'indice e i singoli fattori sono stime " +
      "soggette a errore e non rappresentano risultati sportivi certi. " +
      "Le schede includono percentuali di rendimento sul bagnato e di errori " +
      "normalizzate sulle gare effettivamente disputate, senza esporre i conteggi grezzi. " +
      "Gli endpoint di confronto restituiscono due schede complete nello stesso ordine richiesto. " +
      "La home espone il profilo tecnico del circuito e un indice editoriale di " +
      "aderenza per scuderia, distinto dalla probabilità di vittoria e dalla classifica. " +
      "Un monitor acquisisce i documenti evento dal sito FIA ogni cinque minuti nelle " +
      "ore precedenti le FP1: aggiornamentiLive resta null finché il documento Car " +
      "Presentation Submissions non è disponibile e validato per tutte le 11 scuderie. " +
      "In produzione si applicano una cache browser di 60 secondi, una cache " +
      "condivisa configurabile di 300 secondi e un limite di " +
      "1000 richieste ogni 15 minuti per indirizzo IP. I testi editoriali sono " +
      "disponibili in italiano, inglese, francese, portoghese europeo, spagnolo e tedesco: " +
      "aggiungere il parametro opzionale ?lingua=it|en|fr|pt|es|de. In assenza " +
      "del parametro viene usato l'italiano. I cataloghi tradotti sono salvati e " +
      "selezionati dal backend: nessun endpoint pubblico inoltra testi ad Azure o " +
      "espone credenziali del servizio di traduzione. Slug, codici, nomi propri, " +
      "numeri e URL restano invariati in tutte le lingue.",
    termsOfService:
      "https://github.com/marcotannoia/race-analysis-hub/blob/master/LICENSE.md",
    contact: {
      name: "Marco Tannoia",
      email: "marco.tannoia@gmail.com",
    },
    license: {
      name: "CC BY 4.0 per le risposte API; codice sorgente riservato",
      url: "https://github.com/marcotannoia/race-analysis-hub/blob/master/LICENSE.md",
    },
  },
  externalDocs: {
    description: "Repository e guida operativa di Race Analysis Hub",
    url: "https://github.com/marcotannoia/race-analysis-hub",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Host corrente della documentazione",
    },
  ],
  security: [],
  tags: [
    {
      name: "Servizio",
      description: "Informazioni generali, stato del servizio e dati per la home.",
    },
    {
      name: "Piloti",
      description: "Elenco pubblico e schede complete dei piloti.",
    },
    {
      name: "Scuderie",
      description: "Elenco pubblico e schede complete delle scuderie.",
    },
    {
      name: "Gare",
      description: "Gran Premio attualmente pubblicato e relativo dettaglio.",
    },
    {
      name: "Classifiche",
      description: "Classifiche piloti e scuderie della stagione attuale.",
    },
    {
      name: "Previsioni",
      description: "Classifica previsionale spiegabile del Gran Premio attuale.",
    },
    {
      name: "Confronti",
      description:
        "Confronto affiancato tra due piloti o due scuderie con schede complete.",
    },
    {
      name: "Analisi",
      description: "Analisi editoriali del Gran Premio attuale.",
    },
    {
      name: "Localizzazione",
      description:
        "Selezione dei cataloghi testuali pre-generati. Italiano predefinito; " +
        "portoghese in variante europea (pt-PT, esposta con il codice API pt).",
    },
  ],
  paths: {
    "/": {
      get: {
        operationId: "descriviApi",
        tags: ["Servizio"],
        summary: "Descrizione e indice dell'API",
        description:
          "Restituisce versione, collegamenti alla documentazione e indice degli endpoint pubblici.",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Indice degli endpoint",
            "#/components/schemas/IndiceApi",
          ),
          ...risposteComuni,
        },
      },
    },
    "/health": {
      get: {
        operationId: "verificaStatoServizio",
        tags: ["Servizio"],
        summary: "Stato del servizio e del database",
        description:
          "Endpoint non memorizzato in cache e non conteggiato nel rate limit. " +
          "Il parametro lingua determina l'header Content-Language, ma i valori " +
          "tecnici di stato non vengono tradotti.",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Servizio e database disponibili",
            "#/components/schemas/StatoServizio",
            {
              stato: "ok",
              servizio: "race-analysis-hub-api",
              versione: versioneApi,
              requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
            },
          ),
          400: { $ref: "#/components/responses/RichiestaNonValida" },
          500: { $ref: "#/components/responses/ErroreInterno" },
          503: { $ref: "#/components/responses/ServizioNonDisponibile" },
        },
      },
    },
    "/home": {
      get: {
        operationId: "recuperaHome",
        tags: ["Servizio"],
        summary: "Dati aggregati per la home",
        description:
          "Restituisce il Gran Premio attuale, i piloti e le scuderie. La previsione è isolata nel proprio endpoint.",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson("Contenuto della home", "#/components/schemas/Home"),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/lingue": {
      get: {
        operationId: "elencaLingue",
        tags: ["Localizzazione"],
        summary: "Lingue supportate",
        description:
          "Restituisce i sei codici accettati dal parametro query lingua, la lingua " +
          "predefinita e il nome nativo di ciascuna lingua. Il parametro lingua " +
          "localizza il testo utilizzo della risposta.",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Elenco delle lingue disponibili",
            "#/components/schemas/RispostaLingue",
            {
              lingua: "en",
              linguaPredefinita: "it",
              lingue: [
                { codice: "it", nome: "Italiano", nomeLocale: "Italiano" },
                { codice: "en", nome: "Inglese", nomeLocale: "English" },
                { codice: "fr", nome: "Francese", nomeLocale: "Français" },
                { codice: "pt", nome: "Portoghese", nomeLocale: "Português" },
                { codice: "es", nome: "Spagnolo", nomeLocale: "Español" },
                { codice: "de", nome: "Tedesco", nomeLocale: "Deutsch" },
              ],
              utilizzo:
                "Add ?lingua=it, en, fr, pt, es or de to public endpoints",
            },
          ),
          ...risposteComuni,
        },
      },
    },
    "/previsioni/piloti": {
      get: {
        operationId: "recuperaClassificaPrevisionalePiloti",
        tags: ["Previsioni"],
        summary: "Classifica previsionale dei piloti",
        description:
          "Calcola la previsione spiegabile esclusivamente per il Gran Premio attuale.",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Classifica previsionale del Gran Premio attuale",
            "#/components/schemas/ClassificaPrevisionale",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/confronti/piloti/{primoPilotaSlug}/{secondoPilotaSlug}": {
      get: {
        operationId: "confrontaPiloti",
        tags: ["Confronti"],
        summary: "Confronto tra due piloti",
        description:
          "Restituisce, nell'ordine richiesto, le stesse informazioni disponibili nelle due schede pilota singole.",
        parameters: [
          parametroSlugConfronto(
            "primoPilotaSlug",
            "Identificatore del primo pilota.",
            "leclerc",
          ),
          parametroSlugConfronto(
            "secondoPilotaSlug",
            "Identificatore del secondo pilota.",
            "hamilton",
          ),
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Confronto completo tra due piloti",
            "#/components/schemas/ConfrontoPiloti",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/confronti/scuderie/{primaScuderiaSlug}/{secondaScuderiaSlug}": {
      get: {
        operationId: "confrontaScuderie",
        tags: ["Confronti"],
        summary: "Confronto tra due scuderie",
        description:
          "Restituisce, nell'ordine richiesto, le stesse informazioni disponibili nelle due schede scuderia singole.",
        parameters: [
          parametroSlugConfronto(
            "primaScuderiaSlug",
            "Identificatore della prima scuderia.",
            "ferrari",
          ),
          parametroSlugConfronto(
            "secondaScuderiaSlug",
            "Identificatore della seconda scuderia.",
            "mercedes",
          ),
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Confronto completo tra due scuderie",
            "#/components/schemas/ConfrontoScuderie",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/piloti": {
      get: {
        operationId: "elencaPiloti",
        tags: ["Piloti"],
        summary: "Elenco dei piloti",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Piloti ordinati per posizione in classifica",
            "#/components/schemas/ElencoPiloti",
          ),
          ...risposteComuni,
        },
      },
    },
    "/piloti/{pilotaSlug}": {
      get: {
        operationId: "recuperaPilota",
        tags: ["Piloti"],
        summary: "Scheda completa di un pilota",
        description:
          "Restituisce profilo, analisi del Gran Premio attuale e andamento della stagione corrente fino ai GP registrati.",
        parameters: [
          { $ref: "#/components/parameters/PilotaSlug" },
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Scheda del pilota",
            "#/components/schemas/DettaglioPilota",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/scuderie": {
      get: {
        operationId: "elencaScuderie",
        tags: ["Scuderie"],
        summary: "Elenco delle scuderie",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Scuderie ordinate per posizione in classifica",
            "#/components/schemas/ElencoScuderie",
          ),
          ...risposteComuni,
        },
      },
    },
    "/scuderie/{scuderiaSlug}": {
      get: {
        operationId: "recuperaScuderia",
        tags: ["Scuderie"],
        summary: "Scheda completa di una scuderia",
        description:
          "Restituisce profilo, piloti, analisi del Gran Premio attuale e andamento della stagione corrente.",
        parameters: [
          { $ref: "#/components/parameters/ScuderiaSlug" },
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Scheda della scuderia",
            "#/components/schemas/DettaglioScuderia",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/gare": {
      get: {
        operationId: "elencaGarePubbliche",
        tags: ["Gare"],
        summary: "Elenco delle gare pubblicamente disponibili",
        description:
          "Restituisce sempre e soltanto il Gran Premio attuale. Non espone calendario futuro o analisi future.",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Elenco contenente la gara attuale",
            "#/components/schemas/ElencoGare",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/gare/attuale": {
      get: {
        operationId: "recuperaGaraAttuale",
        tags: ["Gare"],
        summary: "Gran Premio attuale",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Contenuto completo della gara attuale",
            "#/components/schemas/RispostaGara",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/gare/{garaSlug}": {
      get: {
        operationId: "recuperaDettaglioGara",
        tags: ["Gare"],
        summary: "Dettaglio della gara attuale",
        description:
          "Lo slug deve appartenere al Gran Premio attuale. Qualsiasi altra gara restituisce 404.",
        parameters: [
          { $ref: "#/components/parameters/GaraSlug" },
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Gara con analisi dei piloti e delle scuderie",
            "#/components/schemas/DettaglioGara",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/classifiche/piloti": {
      get: {
        operationId: "recuperaClassificaPiloti",
        tags: ["Classifiche"],
        summary: "Classifica piloti della stagione attuale",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Classifica piloti",
            "#/components/schemas/ClassificaPiloti",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/classifiche/scuderie": {
      get: {
        operationId: "recuperaClassificaScuderie",
        tags: ["Classifiche"],
        summary: "Classifica scuderie della stagione attuale",
        parameters: [parametroLingua],
        responses: {
          200: rispostaJson(
            "Classifica scuderie",
            "#/components/schemas/ClassificaScuderie",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/gare/{garaSlug}/piloti/{pilotaSlug}/analisi": {
      get: {
        operationId: "recuperaAnalisiPilota",
        tags: ["Analisi"],
        summary: "Analisi di un pilota per il Gran Premio attuale",
        parameters: [
          { $ref: "#/components/parameters/GaraSlug" },
          { $ref: "#/components/parameters/PilotaSlug" },
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Analisi completa del pilota",
            "#/components/schemas/RispostaAnalisiPilota",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
    "/gare/{garaSlug}/scuderie/{scuderiaSlug}/analisi": {
      get: {
        operationId: "recuperaAnalisiScuderia",
        tags: ["Analisi"],
        summary: "Analisi di una scuderia per il Gran Premio attuale",
        parameters: [
          { $ref: "#/components/parameters/GaraSlug" },
          { $ref: "#/components/parameters/ScuderiaSlug" },
          parametroLingua,
        ],
        responses: {
          200: rispostaJson(
            "Analisi completa della scuderia",
            "#/components/schemas/RispostaAnalisiScuderia",
          ),
          404: { $ref: "#/components/responses/RisorsaNonTrovata" },
          ...risposteComuni,
        },
      },
    },
  },
  components: {
    headers: {
      ContentLanguage: {
        description:
          "Lingua effettiva selezionata per la risposta. È presente anche sugli " +
          "endpoint tecnici, i cui codici di stato restano invariati.",
        schema: { $ref: "#/components/schemas/CodiceLingua" },
      },
      RequestId: {
        description:
          "Identificatore univoco della richiesta, utile per assistenza e analisi dei log.",
        schema: { type: "string", format: "uuid" },
      },
      XAppCache: {
        description:
          "Stato della cache applicativa: MISS per la prima elaborazione, HIT per " +
          "una risposta già disponibile, COALESCED per richieste simultanee " +
          "accorpate. È distinto dall'header X-Cache generato da CloudFront.",
        schema: {
          type: "string",
          enum: ["MISS", "HIT", "COALESCED"],
        },
      },
    },
    parameters: {
      Lingua: {
        name: "lingua",
        in: "query",
        required: false,
        description:
          "Seleziona il catalogo dei campi testuali: it italiano, en inglese, fr " +
          "francese, pt portoghese europeo (pt-PT), es spagnolo, de tedesco. " +
          "Il valore predefinito è it. Codici, slug, nomi propri, numeri e URL non " +
          "vengono modificati. Un codice non supportato restituisce HTTP 400 con " +
          "codice errore LINGUA_NON_SUPPORTATA.",
        schema: {
          type: "string",
          enum: ["it", "en", "fr", "pt", "es", "de"],
          default: "it",
        },
        example: "en",
      },
      GaraSlug: {
        name: "garaSlug",
        in: "path",
        required: true,
        description: "Identificatore pubblico del Gran Premio attuale.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 80,
          pattern: "^[a-z0-9]+(?:[-_][a-z0-9]+)*$",
        },
        example: "olanda-zandvoort",
      },
      PilotaSlug: {
        name: "pilotaSlug",
        in: "path",
        required: true,
        description: "Identificatore pubblico del pilota.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 80,
          pattern: "^[a-z0-9]+(?:[-_][a-z0-9]+)*$",
        },
        example: "leclerc",
      },
      ScuderiaSlug: {
        name: "scuderiaSlug",
        in: "path",
        required: true,
        description: "Identificatore pubblico della scuderia.",
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 80,
          pattern: "^[a-z0-9]+(?:[-_][a-z0-9]+)*$",
        },
        example: "ferrari",
      },
    },
    responses: {
      RichiestaNonValida: {
        description: "Parametri, query o identificatori non validi",
        headers: intestazioneRequestId,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Errore" },
            examples: {
              queryNonValida: {
                summary: "Parametro query non previsto",
                value: {
                  errore: {
                    codice: "PARAMETRO_QUERY_NON_VALIDO",
                    messaggio: "Parametri non supportati: pagina",
                    requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
                  },
                },
              },
              linguaNonSupportata: {
                summary: "Codice lingua non supportato",
                value: {
                  errore: {
                    codice: "LINGUA_NON_SUPPORTATA",
                    messaggio: "Lingua non supportata: xx",
                    lingueSupportate: ["it", "en", "fr", "pt", "es", "de"],
                    requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
                  },
                },
              },
            },
          },
        },
      },
      RisorsaNonTrovata: {
        description: "Risorsa inesistente o non pubblicamente disponibile",
        headers: intestazioneRequestId,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Errore" },
            example: {
              errore: {
                codice: "GARA_ATTUALE_NON_DISPONIBILE",
                messaggio: "Il Gran Premio attuale non e ancora stato pubblicato",
                requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
              },
            },
          },
        },
      },
      LimiteRichiesteSuperato: {
        description: "Limite di richieste superato",
        headers: intestazioneRequestId,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Errore" },
            example: {
              errore: {
                codice: "LIMITE_RICHIESTE_SUPERATO",
                messaggio: "Troppe richieste. Riprova tra qualche minuto",
                requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
              },
            },
          },
        },
      },
      ErroreInterno: {
        description: "Errore interno non previsto",
        headers: intestazioneRequestId,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Errore" },
            example: {
              errore: {
                codice: "ERRORE_INTERNO",
                messaggio: "Si è verificato un errore interno al server",
                requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
              },
            },
          },
        },
      },
      ServizioNonDisponibile: rispostaJson(
        "Database non disponibile",
        "#/components/schemas/StatoServizio",
        {
          stato: "non_disponibile",
          servizio: "race-analysis-hub-api",
          versione: versioneApi,
          requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
        },
      ),
    },
    schemas: {
      IndiceEndpoint: {
        type: "object",
        required: [
          "home",
          "lingue",
          "piloti",
          "dettaglioPilota",
          "scuderie",
          "dettaglioScuderia",
          "garaAttuale",
          "dettaglioGaraAttuale",
          "classificaPiloti",
          "classificaScuderie",
          "classificaPrevisionale",
          "confrontoPiloti",
          "confrontoScuderie",
          "analisiPilota",
          "analisiScuderia",
        ],
        properties: {
          home: { type: "string", example: "/api/v1/home" },
          lingue: { type: "string", example: "/api/v1/lingue" },
          piloti: { type: "string", example: "/api/v1/piloti" },
          dettaglioPilota: {
            type: "string",
            example: "/api/v1/piloti/:pilotaSlug",
          },
          scuderie: { type: "string", example: "/api/v1/scuderie" },
          dettaglioScuderia: {
            type: "string",
            example: "/api/v1/scuderie/:scuderiaSlug",
          },
          garaAttuale: {
            type: "string",
            example: "/api/v1/gare/attuale",
          },
          dettaglioGaraAttuale: {
            type: "string",
            example: "/api/v1/gare/:garaSlug",
          },
          classificaPiloti: {
            type: "string",
            example: "/api/v1/classifiche/piloti",
          },
          classificaScuderie: {
            type: "string",
            example: "/api/v1/classifiche/scuderie",
          },
          classificaPrevisionale: {
            type: "string",
            example: "/api/v1/previsioni/piloti",
          },
          confrontoPiloti: {
            type: "string",
            example:
              "/api/v1/confronti/piloti/:primoPilotaSlug/:secondoPilotaSlug",
          },
          confrontoScuderie: {
            type: "string",
            example:
              "/api/v1/confronti/scuderie/:primaScuderiaSlug/:secondaScuderiaSlug",
          },
          analisiPilota: {
            type: "string",
            example: "/api/v1/gare/:garaSlug/piloti/:pilotaSlug/analisi",
          },
          analisiScuderia: {
            type: "string",
            example:
              "/api/v1/gare/:garaSlug/scuderie/:scuderiaSlug/analisi",
          },
        },
      },
      IndiceApi: {
        type: "object",
        required: [
          "nome",
          "versione",
          "descrizione",
          "documentazione",
          "specificaOpenApi",
          "lingua",
          "linguaPredefinita",
          "lingueSupportate",
          "attribuzioneDati",
          "endpoint",
        ],
        properties: {
          nome: { type: "string", const: "Race Analysis Hub API" },
          versione: { type: "string", example: versioneApi },
          descrizione: { type: "string" },
          documentazione: { type: "string", example: "/api/docs" },
          specificaOpenApi: {
            type: "string",
            example: "/api/v1/openapi.json",
          },
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          linguaPredefinita: {
            $ref: "#/components/schemas/CodiceLingua",
          },
          lingueSupportate: {
            type: "array",
            minItems: 6,
            maxItems: 6,
            items: { $ref: "#/components/schemas/LinguaDisponibile" },
          },
          attribuzioneDati: {
            $ref: "#/components/schemas/FonteAndamento",
          },
          endpoint: { $ref: "#/components/schemas/IndiceEndpoint" },
        },
      },
      CodiceLingua: {
        type: "string",
        description:
          "Codice lingua pubblico. pt identifica il catalogo portoghese europeo (pt-PT).",
        enum: ["it", "en", "fr", "pt", "es", "de"],
        example: "it",
      },
      LinguaDisponibile: {
        type: "object",
        required: ["codice", "nome", "nomeLocale"],
        properties: {
          codice: { $ref: "#/components/schemas/CodiceLingua" },
          nome: {
            type: "string",
            description: "Nome della lingua in italiano.",
            example: "Inglese",
          },
          nomeLocale: {
            type: "string",
            description: "Nome della lingua nella lingua stessa.",
            example: "English",
          },
        },
      },
      RispostaLingue: {
        type: "object",
        required: ["lingua", "linguaPredefinita", "lingue", "utilizzo"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          linguaPredefinita: {
            $ref: "#/components/schemas/CodiceLingua",
          },
          lingue: {
            type: "array",
            minItems: 6,
            maxItems: 6,
            items: { $ref: "#/components/schemas/LinguaDisponibile" },
          },
          utilizzo: {
            type: "string",
            description: "Istruzione d'uso localizzata nella lingua richiesta.",
          },
        },
      },
      StatoServizio: {
        type: "object",
        required: ["stato", "servizio", "versione", "requestId"],
        properties: {
          stato: {
            type: "string",
            enum: ["ok", "non_disponibile"],
          },
          servizio: { type: "string", const: "race-analysis-hub-api" },
          versione: { type: "string", example: versioneApi },
          requestId: { type: "string", format: "uuid" },
        },
      },
      Classifica: {
        type: "object",
        required: ["posizione", "punti", "vittorie"],
        properties: {
          posizione: { type: "integer", minimum: 1 },
          punti: { type: "number", minimum: 0 },
          vittorie: { type: "integer", minimum: 0 },
        },
      },
      ScuderiaBreve: {
        type: "object",
        required: ["slug", "nome", "abbreviazione", "colore"],
        properties: {
          slug: { type: "string", example: "ferrari" },
          nome: { type: "string", example: "Ferrari" },
          abbreviazione: {
            type: "string",
            pattern: "^[A-Z]{2,3}$",
            example: "FER",
            description:
              "Codice breve e stabile della scuderia usato nelle integrazioni.",
          },
          colore: {
            type: "string",
            pattern: "^#[0-9A-F]{6}$",
            example: "#E8002D",
            description:
              "Colore identificativo della scuderia in formato RGB esadecimale.",
          },
        },
      },
      PilotaBreve: {
        type: "object",
        required: [
          "slug",
          "nome",
          "codice",
          "numero",
          "abbreviazioneNome",
          "numeroVettura",
          "nazionalitaIso2",
          "nazionalitaIso3",
        ],
        properties: {
          slug: { type: "string", example: "leclerc" },
          nome: { type: "string", example: "Charles Leclerc" },
          codice: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            example: "LEC",
            description:
              "Codice sportivo del pilota mantenuto per compatibilità.",
          },
          numero: {
            type: "string",
            pattern: "^[0-9]{1,2}$",
            example: "16",
            description:
              "Numero della vettura mantenuto per compatibilità.",
          },
          abbreviazioneNome: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            example: "LEC",
            description: "Abbreviazione sportiva del nome del pilota.",
          },
          numeroVettura: {
            type: "string",
            pattern: "^[0-9]{1,2}$",
            example: "16",
            description: "Numero ufficiale della vettura del pilota.",
          },
          nazionalitaIso2: {
            type: "string",
            pattern: "^[A-Z]{2}$",
            example: "MC",
            description: "Codice paese ISO 3166-1 alpha-2.",
          },
          nazionalitaIso3: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            example: "MCO",
            description: "Codice paese ISO 3166-1 alpha-3.",
          },
        },
      },
      Pilota: {
        allOf: [
          { $ref: "#/components/schemas/PilotaBreve" },
          {
            type: "object",
            required: [
              "nazionalita",
              "scuderia",
              "classifica",
              "aggiornatoIl",
            ],
            properties: {
              nazionalita: { type: "string", example: "Monegasque" },
              scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
              classifica: { $ref: "#/components/schemas/Classifica" },
              aggiornatoIl: {
                type: ["string", "null"],
                format: "date-time",
              },
            },
          },
        ],
      },
      Scuderia: {
        allOf: [
          { $ref: "#/components/schemas/ScuderiaBreve" },
          {
            type: "object",
            required: [
              "nomeClassifica",
              "nazionalita",
              "denominazioniStoriche",
              "classifica",
              "aggiornatoIl",
            ],
            properties: {
              nomeClassifica: { type: "string", example: "Ferrari" },
              nazionalita: { type: "string", example: "Italian" },
              denominazioniStoriche: {
                type: "object",
                propertyNames: { pattern: "^\\d{4}$" },
                additionalProperties: { type: ["string", "null"] },
              },
              classifica: { $ref: "#/components/schemas/Classifica" },
              aggiornatoIl: {
                type: ["string", "null"],
                format: "date-time",
              },
            },
          },
        ],
      },
      GaraBreve: {
        type: "object",
        required: [
          "slug",
          "nome",
          "circuito",
          "paese",
          "stagione",
          "ordineAnalisi",
          "ordineCalendario",
          "stato",
        ],
        properties: {
          slug: { type: "string", example: "olanda-zandvoort" },
          nome: { type: "string", example: "Gran Premio d'Olanda" },
          circuito: { type: "string", example: "Circuit Zandvoort" },
          paese: { type: "string", example: "Olanda" },
          stagione: { type: "integer", minimum: 2026, example: 2026 },
          ordineAnalisi: { type: "integer", minimum: 1 },
          ordineCalendario: {
            type: "integer",
            minimum: 1,
            description: "Posizione del Gran Premio nel calendario ufficiale della stagione.",
          },
          stato: { type: "string", const: "attuale" },
        },
      },
      Gara: {
        allOf: [
          { $ref: "#/components/schemas/GaraBreve" },
          {
            type: "object",
            required: [
              "contestoStorico",
              "pilotiFavoriti",
              "scuderieFavorite",
              "outsider",
              "potenzialiDifficolta",
              "gommeStrategia",
              "rischi",
              "confidenza",
              "fonti",
              "aggiornatoIl",
            ],
            properties: {
              contestoStorico: { type: "string" },
              pilotiFavoriti: { type: "string" },
              scuderieFavorite: { type: "string" },
              outsider: { type: "string" },
              potenzialiDifficolta: { type: "string" },
              gommeStrategia: { type: "string" },
              rischi: { type: "string" },
              confidenza: { type: "string" },
              fonti: {
                type: "array",
                items: { type: "string", format: "uri", pattern: "^https://" },
              },
              aggiornatoIl: {
                type: ["string", "null"],
                format: "date-time",
              },
            },
          },
        ],
      },
      Prestazioni: {
        type: "object",
        required: ["passoGara", "gestioneGomme", "affidabilita"],
        properties: {
          passoGara: {
            type: "string",
            deprecated: true,
            description:
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.prestazioni.passoGara`.",
          },
          gestioneGomme: {
            type: "string",
            deprecated: true,
            description:
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.prestazioni.gestioneGomme`.",
          },
          affidabilita: {
            type: "string",
            description:
              "Valutazione editoriale degli eventuali problemi di affidabilità rilevanti.",
          },
        },
      },
      PrestazioniPerAnno: {
        type: "object",
        required: ["passoGara", "gestioneGomme"],
        properties: {
          passoGara: { $ref: "#/components/schemas/TestiAnnuali" },
          gestioneGomme: { $ref: "#/components/schemas/TestiAnnuali" },
        },
      },
      DatiAnalisiPerAnno: {
        type: "object",
        description:
          "Versione strutturata e aggiornata dei risultati e dei contenuti editoriali storici.",
        required: [
          "risultatiGara",
          "spiegazioneRisultatiPassati",
          "notaBene",
          "risultatiQualifica",
          "andamento",
          "prestazioni",
        ],
        properties: {
          risultatiGara: { $ref: "#/components/schemas/TestiAnnuali" },
          spiegazioneRisultatiPassati: {
            $ref: "#/components/schemas/TestiAnnuali",
          },
          notaBene: {
            allOf: [{ $ref: "#/components/schemas/TestiAnnuali" }],
            deprecated: true,
            description:
              "Alias mantenuto per compatibilità. Usare `spiegazioneRisultatiPassati`.",
          },
          risultatiQualifica: { $ref: "#/components/schemas/TestiAnnuali" },
          andamento: { $ref: "#/components/schemas/TestiAnnuali" },
          prestazioni: { $ref: "#/components/schemas/PrestazioniPerAnno" },
        },
      },
      TestiAnnuali: {
        type: "object",
        description:
          "Contenuti separati per stagione. Le proprietà usano l'anno nel formato AAAA; `generale` conserva una sintesi non attribuibile a una singola stagione.",
        propertyNames: { pattern: "^(?:\\d{4}|generale)$" },
        additionalProperties: { type: "string" },
        example: {
          2023: "Contenuto relativo alla stagione 2023.",
          2024: "Contenuto relativo alla stagione 2024.",
          2025: "Contenuto relativo alla stagione 2025.",
        },
      },
      StoricoEdizione: {
        type: "object",
        required: [
          "stagione",
          "posizioneGara",
          "posizioneQualifica",
          "notaRisultato",
          "passoGara",
          "gestioneGomme",
          "affidabilita",
        ],
        description:
          "Risultato registrato al termine di un GP della stagione corrente.",
        properties: {
          stagione: { type: "integer" },
          posizioneGara: { type: "string", example: "P3" },
          posizioneQualifica: { type: "string", example: "Q2" },
          notaRisultato: { type: "string" },
          passoGara: { type: "string" },
          gestioneGomme: { type: "string" },
          affidabilita: { type: "string" },
        },
      },
      AnalisiBase: {
        type: "object",
        required: [
          "gara",
          "risultatiGara",
          "notaBene",
          "risultatiQualifica",
          "andamentoPerAnno",
          "prestazioni",
          "datiPerAnno",
          "considerazioniFinali",
          "aggiornamentiInArrivo",
          "storicoEdizioni",
          "fonti",
          "aggiornatoIl",
        ],
        properties: {
          gara: { $ref: "#/components/schemas/GaraBreve" },
          risultatiGara: {
            type: "string",
            deprecated: true,
            description:
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.risultatiGara`.",
          },
          notaBene: {
            type: "string",
            deprecated: true,
            description:
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.spiegazioneRisultatiPassati`.",
          },
          risultatiQualifica: {
            type: "string",
            deprecated: true,
            description:
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.risultatiQualifica`.",
          },
          andamentoPerAnno: {
            type: "string",
            deprecated: true,
            description:
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.andamento`.",
          },
          prestazioni: { $ref: "#/components/schemas/Prestazioni" },
          datiPerAnno: { $ref: "#/components/schemas/DatiAnalisiPerAnno" },
          considerazioniFinali: {
            type: "string",
            description:
              "Valutazione editoriale conclusiva sull'adattamento al circuito e sulle prospettive per il Gran Premio attuale.",
          },
          aggiornamentiInArrivo: {
            type: "string",
            description:
              "Aggiornamenti tecnici confermati; stringa vuota quando la sezione non deve mostrare contenuti. " +
              "Il riutilizzatore può adattare questo testo nel proprio software secondo " +
              "la licenza dichiarata, senza modificare il database ufficiale.",
          },
          storicoEdizioni: {
            type: "array",
            items: { $ref: "#/components/schemas/StoricoEdizione" },
          },
          fonti: {
            type: "array",
            items: { type: "string", format: "uri", pattern: "^https://" },
          },
          aggiornatoIl: { type: ["string", "null"], format: "date-time" },
        },
      },
      AnalisiPilota: {
        allOf: [
          { $ref: "#/components/schemas/AnalisiBase" },
          {
            type: "object",
            required: ["pilota", "scuderia", "penalita"],
            properties: {
              pilota: { $ref: "#/components/schemas/PilotaBreve" },
              scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
              penalita: {
                type: "string",
                description:
                  "Penalità confermata in arrivo per il Gran Premio attuale; stringa vuota quando non ce ne sono e la sezione non deve essere mostrata.",
              },
            },
          },
        ],
      },
      AnalisiScuderia: {
        allOf: [
          { $ref: "#/components/schemas/AnalisiBase" },
          {
            type: "object",
            required: ["scuderia"],
            properties: {
              scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
            },
          },
        ],
      },
      SerieAndamento: {
        type: "object",
        required: ["nome", "valori"],
        properties: {
          nome: {
            type: "string",
            description: "Codice del pilota rappresentato dalla serie.",
            example: "LEC",
          },
          valori: {
            type: "array",
            description:
              "Posizione per ciascuna etichetta; null indica un risultato non disponibile.",
            items: { type: ["integer", "null"], minimum: 1 },
          },
        },
      },
      FonteAndamento: {
        type: "object",
        required: [
          "nome",
          "url",
          "licenza",
          "licenzaUrl",
          "versione",
          "modifiche",
        ],
        properties: {
          nome: {
            type: "string",
            example: "F1DB",
          },
          url: {
            type: "string",
            format: "uri",
            example:
              "https://github.com/f1db/f1db/releases/tag/v2026.11.0",
          },
          licenza: { type: "string", example: "CC BY 4.0" },
          licenzaUrl: {
            type: "string",
            format: "uri",
            example: "https://creativecommons.org/licenses/by/4.0/",
          },
          versione: { type: "string", example: "v2026.11.0" },
          modifiche: {
            type: "string",
            description:
              "Trasformazioni applicate da Race Analysis Hub al dataset originale.",
          },
        },
      },
      Andamento: {
        type: "object",
        description:
          "Posizioni di gara e qualifica derivate dallo snapshot F1DB fino all'ultimo Gran Premio incluso nella release dichiarata.",
        required: [
          "stagione",
          "etichette",
          "qualifica",
          "gara",
          "fonte",
          "aggiornatoIl",
        ],
        properties: {
          stagione: { type: "integer", minimum: 2026 },
          etichette: { type: "array", items: { type: "string" } },
          qualifica: {
            type: "array",
            items: { $ref: "#/components/schemas/SerieAndamento" },
          },
          gara: {
            type: "array",
            items: { $ref: "#/components/schemas/SerieAndamento" },
          },
          fonte: {
            oneOf: [
              { $ref: "#/components/schemas/FonteAndamento" },
              { type: "null" },
            ],
          },
          aggiornatoIl: { type: ["string", "null"], format: "date-time" },
        },
      },
      ElencoPiloti: {
        type: "object",
        required: ["lingua", "totale", "piloti"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          totale: { type: "integer", minimum: 0 },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
          },
        },
      },
      ElencoScuderie: {
        type: "object",
        required: ["lingua", "totale", "scuderie"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          totale: { type: "integer", minimum: 0 },
          scuderie: {
            type: "array",
            items: { $ref: "#/components/schemas/Scuderia" },
          },
        },
      },
      ElencoGare: {
        type: "object",
        required: ["lingua", "totale", "gare"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          totale: { type: "integer", const: 1 },
          gare: {
            type: "array",
            minItems: 1,
            maxItems: 1,
            items: { $ref: "#/components/schemas/GaraBreve" },
          },
        },
      },
      RispostaGara: {
        type: "object",
        required: ["lingua", "gara"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          gara: { $ref: "#/components/schemas/Gara" },
        },
      },
      IndicatoriProfilo: {
        type: "object",
        description:
          "Indicatori cumulativi fino all'ultimo GP registrato. La percentuale sul " +
          "bagnato misura le gare con pioggia vinte o concluse davanti al compagno " +
          "classificato oppure ad almeno metà dei rivali presenti nella top 10 " +
          "del campionato dopo quella gara; DNS e ritiri altrui non migliorano " +
          "il risultato. " +
          "Gli errori e gli errori fatali usano entrambi tutte le partenze in gara. " +
          "I conteggi delle gare con pioggia sono esposti per rendere verificabile " +
          "la percentuale.",
        required: [
          "bravuraBagnatoPercentuale",
          "gareConPioggiaPositive",
          "gareConPioggiaDisputate",
          "erroriPilotaPercentuale",
          "erroriFataliPercentuale",
        ],
        properties: {
          bravuraBagnatoPercentuale: {
            type: "number",
            minimum: 0,
            maximum: 100,
            example: 57.9,
          },
          gareConPioggiaPositive: {
            type: "integer",
            minimum: 0,
            example: 11,
          },
          gareConPioggiaDisputate: {
            type: "integer",
            minimum: 0,
            example: 19,
          },
          erroriPilotaPercentuale: {
            type: "number",
            minimum: 0,
            maximum: 100,
            example: 3.8,
          },
          erroriFataliPercentuale: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description:
              "Quota di tutte le partenze compromessa o terminata da un errore del pilota; non è una percentuale degli errori e resta inferiore all'indicatore generale.",
            example: 1.3,
          },
        },
      },
      ValoreTecnico: {
        type: "object",
        required: ["dimensione", "valore"],
        properties: {
          dimensione: {
            type: "string",
            enum: [
              "efficienzaAerodinamica",
              "potenzaDeployment",
              "curvaLenta",
              "curvaMedia",
              "curvaVeloce",
              "trazione",
              "frenata",
              "cordoli",
              "gestioneGomme",
              "stabilitaAssetto",
            ],
          },
          valore: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
      ProfiloTecnicoScuderia: {
        type: "object",
        description:
          "Profilo editoriale tecnico 2026 basato su dati stagionali, documenti FIA e analisi pubbliche; non rappresenta una probabilità di vittoria.",
        required: [
          "stagione",
          "aggiornatoIl",
          "metodo",
          "capacita",
          "puntiForza",
          "areeSensibili",
          "fonti",
        ],
        properties: {
          stagione: { type: "integer", const: 2026 },
          aggiornatoIl: { type: "string", format: "date" },
          metodo: { type: "string" },
          capacita: {
            type: "array",
            minItems: 10,
            maxItems: 10,
            items: { $ref: "#/components/schemas/ValoreTecnico" },
          },
          puntiForza: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { $ref: "#/components/schemas/ValoreTecnico" },
          },
          areeSensibili: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { $ref: "#/components/schemas/ValoreTecnico" },
          },
          fonti: {
            type: "array",
            minItems: 2,
            items: { type: "string", format: "uri", pattern: "^https://" },
          },
        },
      },
      DatiGeometriciCircuito: {
        type: "object",
        required: [
          "lunghezzaKm",
          "giri",
          "distanzaKm",
          "curve",
          "direzione",
          "tipologia",
          "livelloCarico",
          "stressFreni",
          "stressGomme",
        ],
        properties: {
          lunghezzaKm: { type: "number", minimum: 1 },
          giri: { type: "integer", minimum: 1 },
          distanzaKm: { type: "number", minimum: 1 },
          curve: { type: "integer", minimum: 1 },
          rettilineoPrincipaleKm: { type: "number", minimum: 0 },
          percentualePienoGas: { type: "number", minimum: 0, maximum: 100 },
          quotaMetri: { type: "number" },
          velocitaMassimaStimataKmh: { type: "number", minimum: 0 },
          direzione: { type: "string" },
          tipologia: { type: "string" },
          livelloCarico: { type: "string" },
          stressFreni: { type: "string" },
          stressGomme: { type: "string" },
        },
      },
      CompatibilitaTecnicaScuderia: {
        type: "object",
        required: ["scuderia", "indice", "corrispondenze"],
        properties: {
          scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
          indice: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description:
              "Aderenza tecnica macchina-circuito; non è una probabilità di vittoria e non deriva dalla posizione in campionato.",
          },
          corrispondenze: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { type: "string" },
          },
        },
      },
      DocumentoCircuitoFia: {
        type: "object",
        required: [
          "documentoUrl",
          "pubblicatoIl",
          "acquisitoIl",
          "zoneStraightMode",
          "rilevamentiOvertakeMode",
        ],
        properties: {
          documentoUrl: { type: "string", format: "uri", pattern: "^https://" },
          pubblicatoIl: { type: ["string", "null"], format: "date-time" },
          acquisitoIl: { type: ["string", "null"], format: "date-time" },
          zoneStraightMode: { type: "integer", minimum: 0 },
          rilevamentiOvertakeMode: { type: "integer", minimum: 0 },
        },
      },
      CircuitoTecnico: {
        type: "object",
        required: [
          "stagione",
          "aggiornatoIl",
          "metodo",
          "fp1At",
          "dati",
          "caratteristiche",
          "puntiSorpassoPrincipali",
          "richieste",
          "compatibilita",
          "documentoCircuito",
          "fonti",
        ],
        properties: {
          stagione: { type: "integer", const: 2026 },
          aggiornatoIl: { type: "string", format: "date" },
          metodo: { type: "string" },
          fp1At: { type: "string", format: "date-time" },
          dati: { $ref: "#/components/schemas/DatiGeometriciCircuito" },
          caratteristiche: { type: "array", items: { type: "string" } },
          puntiSorpassoPrincipali: { type: "integer", minimum: 0 },
          richieste: {
            type: "array",
            minItems: 10,
            maxItems: 10,
            items: { $ref: "#/components/schemas/ValoreTecnico" },
          },
          compatibilita: {
            type: "array",
            minItems: 11,
            maxItems: 11,
            items: { $ref: "#/components/schemas/CompatibilitaTecnicaScuderia" },
          },
          documentoCircuito: {
            oneOf: [
              { $ref: "#/components/schemas/DocumentoCircuitoFia" },
              { type: "null" },
            ],
          },
          fonti: {
            type: "array",
            items: { type: "string", format: "uri", pattern: "^https://" },
          },
        },
      },
      AggiornamentoLiveScuderia: {
        type: "object",
        required: [
          "scuderia",
          "nessunAggiornamento",
          "componenti",
          "descrizione",
        ],
        properties: {
          scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
          nessunAggiornamento: { type: "boolean" },
          componenti: { type: "array", items: { type: "string" } },
          descrizione: {
            type: "string",
            description: "Testo tecnico originale estratto dal documento FIA.",
          },
        },
      },
      AggiornamentiLiveFia: {
        type: "object",
        description:
          "Presente soltanto dopo l'acquisizione e la validazione del documento Car Presentation Submissions per tutte le 11 scuderie.",
        required: [
          "stato",
          "fonte",
          "documentoUrl",
          "pubblicatoIl",
          "acquisitoIl",
          "scuderie",
        ],
        properties: {
          stato: { type: "string", const: "ufficiale" },
          fonte: { type: "string", const: "FIA" },
          documentoUrl: { type: "string", format: "uri", pattern: "^https://" },
          pubblicatoIl: { type: ["string", "null"], format: "date-time" },
          acquisitoIl: { type: "string", format: "date-time" },
          scuderie: {
            type: "array",
            minItems: 11,
            maxItems: 11,
            items: { $ref: "#/components/schemas/AggiornamentoLiveScuderia" },
          },
        },
      },
      DettaglioPilota: {
        type: "object",
        required: [
          "lingua",
          "pilota",
          "indicatori",
          "analisi",
          "andamentoStagioneCorrente",
        ],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          pilota: { $ref: "#/components/schemas/Pilota" },
          indicatori: { $ref: "#/components/schemas/IndicatoriProfilo" },
          analisi: {
            oneOf: [
              { $ref: "#/components/schemas/AnalisiPilota" },
              { type: "null" },
            ],
          },
          andamentoStagioneCorrente: {
            $ref: "#/components/schemas/Andamento",
          },
        },
      },
      DettaglioScuderia: {
        type: "object",
        required: [
          "lingua",
          "scuderia",
          "piloti",
          "indicatori",
          "profiloTecnico",
          "analisi",
          "andamentoStagioneCorrente",
        ],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          scuderia: { $ref: "#/components/schemas/Scuderia" },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
          },
          indicatori: {
            allOf: [{ $ref: "#/components/schemas/IndicatoriProfilo" }],
            description:
              "Aggregato ponderato sulle gare disputate dai piloti attualmente appartenenti alla scuderia.",
          },
          profiloTecnico: {
            $ref: "#/components/schemas/ProfiloTecnicoScuderia",
          },
          analisi: {
            oneOf: [
              { $ref: "#/components/schemas/AnalisiScuderia" },
              { type: "null" },
            ],
          },
          andamentoStagioneCorrente: {
            $ref: "#/components/schemas/Andamento",
          },
        },
      },
      ConfrontoPiloti: {
        type: "object",
        required: ["lingua", "tipo", "elementi"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          tipo: { type: "string", const: "piloti" },
          elementi: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { $ref: "#/components/schemas/DettaglioPilotaSenzaLingua" },
          },
        },
      },
      DettaglioPilotaSenzaLingua: {
        type: "object",
        required: ["pilota", "indicatori", "analisi", "andamentoStagioneCorrente"],
        properties: {
          pilota: { $ref: "#/components/schemas/Pilota" },
          indicatori: { $ref: "#/components/schemas/IndicatoriProfilo" },
          analisi: {
            oneOf: [
              { $ref: "#/components/schemas/AnalisiPilota" },
              { type: "null" },
            ],
          },
          andamentoStagioneCorrente: {
            $ref: "#/components/schemas/Andamento",
          },
        },
      },
      ConfrontoScuderie: {
        type: "object",
        required: ["lingua", "tipo", "elementi"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          tipo: { type: "string", const: "scuderie" },
          elementi: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { $ref: "#/components/schemas/DettaglioScuderiaSenzaLingua" },
          },
        },
      },
      DettaglioScuderiaSenzaLingua: {
        type: "object",
        required: [
          "scuderia",
          "piloti",
          "indicatori",
          "profiloTecnico",
          "analisi",
          "andamentoStagioneCorrente",
        ],
        properties: {
          scuderia: { $ref: "#/components/schemas/Scuderia" },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
          },
          indicatori: { $ref: "#/components/schemas/IndicatoriProfilo" },
          profiloTecnico: {
            $ref: "#/components/schemas/ProfiloTecnicoScuderia",
          },
          analisi: {
            oneOf: [
              { $ref: "#/components/schemas/AnalisiScuderia" },
              { type: "null" },
            ],
          },
          andamentoStagioneCorrente: {
            $ref: "#/components/schemas/Andamento",
          },
        },
      },
      PesoPrevisionale: {
        type: "object",
        required: ["chiave", "nome", "pesoPercentuale"],
        properties: {
          chiave: { type: "string" },
          nome: { type: "string" },
          pesoPercentuale: {
            type: "number",
            minimum: 0,
            maximum: 100,
          },
        },
      },
      FattorePrevisionale: {
        allOf: [
          { $ref: "#/components/schemas/PesoPrevisionale" },
          {
            type: "object",
            required: ["valutazione", "contributo"],
            properties: {
              valutazione: { type: "number", minimum: 0, maximum: 100 },
              contributo: { type: "number", minimum: 0, maximum: 100 },
            },
          },
        ],
      },
      AggiornamentoTecnicoPrevisionale: {
        type: "object",
        required: ["stato", "nota"],
        properties: {
          stato: {
            type: "string",
            description:
              "Livello di evidenza dell'aggiornamento e della sua pertinenza con il circuito.",
          },
          nota: {
            type: "string",
            description:
              "Motivo per cui il beneficio viene conteggiato, ridotto o ignorato.",
          },
        },
      },
      PosizionePrevisionale: {
        type: "object",
        required: [
          "posizione",
          "indice",
          "pilota",
          "scuderia",
          "confidenza",
          "confidenzaCodice",
          "sintesi",
          "fattori",
          "aggiornamentiTecnici",
        ],
        properties: {
          posizione: { type: "integer", minimum: 1, example: 1 },
          indice: {
            type: "number",
            minimum: 0,
            maximum: 100,
            example: 50,
          },
          pilota: { $ref: "#/components/schemas/PilotaBreve" },
          scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
          confidenza: {
            type: "string",
          },
          confidenzaCodice: {
            type: "string",
            enum: ["bassa", "media", "alta"],
          },
          sintesi: { type: "string" },
          fattori: {
            type: "array",
            minItems: 9,
            maxItems: 10,
            description:
              "Nove fattori ordinari; con una penalità confermata viene aggiunto il fattore penalità al 50% e gli altri pesi vengono dimezzati proporzionalmente.",
            items: { $ref: "#/components/schemas/FattorePrevisionale" },
            example: esempioFattoriPrevisionali,
          },
          aggiornamentiTecnici: {
            $ref: "#/components/schemas/AggiornamentoTecnicoPrevisionale",
          },
        },
      },
      ClassificaPrevisionale: {
        type: "object",
        required: [
          "lingua",
          "gara",
          "modello",
          "pesi",
          "aggiornatoIl",
          "classifica",
        ],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          gara: {
            type: "object",
            required: ["slug", "nome", "circuito"],
            properties: {
              slug: { type: "string", example: "olanda-zandvoort" },
              nome: { type: "string", example: "Gran Premio d'Olanda" },
              circuito: { type: "string", example: "Circuit Zandvoort" },
            },
          },
          modello: {
            type: "string",
            const: "statistico-editoriale-v2",
          },
          pesi: {
            type: "array",
            minItems: 9,
            maxItems: 9,
            items: { $ref: "#/components/schemas/PesoPrevisionale" },
            example: esempioPesiPrevisionali,
          },
          aggiornatoIl: { type: ["string", "null"], format: "date-time" },
          classifica: {
            type: "array",
            items: { $ref: "#/components/schemas/PosizionePrevisionale" },
          },
        },
      },
      MetadatiHome: {
        type: "object",
        required: [
          "stagione",
          "totalePiloti",
          "totaleScuderie",
          "totaleGareAnalisi",
          "totaleGareCalendario",
        ],
        properties: {
          stagione: { type: "integer", minimum: 2026 },
          totalePiloti: { type: "integer", minimum: 0 },
          totaleScuderie: { type: "integer", minimum: 0 },
          totaleGareAnalisi: {
            type: "integer",
            minimum: 1,
            description: "Numero totale dei circuiti nella sequenza editoriale della stagione.",
          },
          totaleGareCalendario: {
            type: "integer",
            minimum: 1,
            description: "Numero totale dei Gran Premi nel calendario ufficiale della stagione.",
          },
        },
      },
      Home: {
        type: "object",
        required: [
          "lingua",
          "garaAttuale",
          "piloti",
          "scuderie",
          "circuitoTecnico",
          "aggiornamentiLive",
          "classificaPrevisionale",
          "metadati",
        ],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          garaAttuale: { $ref: "#/components/schemas/GaraBreve" },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
          },
          scuderie: {
            type: "array",
            items: { $ref: "#/components/schemas/Scuderia" },
          },
          circuitoTecnico: {
            oneOf: [
              { $ref: "#/components/schemas/CircuitoTecnico" },
              { type: "null" },
            ],
          },
          aggiornamentiLive: {
            description:
              "Null finché il documento FIA ufficiale non è disponibile e completo; il frontend non mostra alcuna sezione Live in questo stato.",
            oneOf: [
              { $ref: "#/components/schemas/AggiornamentiLiveFia" },
              { type: "null" },
            ],
          },
          classificaPrevisionale: {
            $ref: "#/components/schemas/ClassificaPrevisionale",
          },
          metadati: { $ref: "#/components/schemas/MetadatiHome" },
        },
      },
      DettaglioGara: {
        type: "object",
        required: ["lingua", "gara", "analisiPiloti", "analisiScuderie"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          gara: { $ref: "#/components/schemas/Gara" },
          analisiPiloti: {
            type: "array",
            items: { $ref: "#/components/schemas/AnalisiPilota" },
          },
          analisiScuderie: {
            type: "array",
            items: { $ref: "#/components/schemas/AnalisiScuderia" },
          },
        },
      },
      PosizioneClassificaPilota: {
        type: "object",
        required: [
          "posizione",
          "pilota",
          "scuderia",
          "punti",
          "vittorie",
        ],
        properties: {
          posizione: { type: "integer", minimum: 1 },
          pilota: { $ref: "#/components/schemas/PilotaBreve" },
          scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
          punti: { type: "number", minimum: 0 },
          vittorie: { type: "integer", minimum: 0 },
        },
      },
      PosizioneClassificaScuderia: {
        type: "object",
        required: ["posizione", "scuderia", "punti", "vittorie"],
        properties: {
          posizione: { type: "integer", minimum: 1 },
          scuderia: { $ref: "#/components/schemas/ScuderiaBreve" },
          punti: { type: "number", minimum: 0 },
          vittorie: { type: "integer", minimum: 0 },
        },
      },
      ClassificaPiloti: {
        type: "object",
        required: ["lingua", "stagione", "tipo", "totale", "classifica"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          stagione: { type: "integer", minimum: 2026 },
          tipo: { type: "string", const: "piloti" },
          totale: { type: "integer", minimum: 0 },
          classifica: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PosizioneClassificaPilota",
            },
          },
        },
      },
      ClassificaScuderie: {
        type: "object",
        required: ["lingua", "stagione", "tipo", "totale", "classifica"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          stagione: { type: "integer", minimum: 2026 },
          tipo: { type: "string", const: "scuderie" },
          totale: { type: "integer", minimum: 0 },
          classifica: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PosizioneClassificaScuderia",
            },
          },
        },
      },
      RispostaAnalisiPilota: {
        type: "object",
        required: ["lingua", "analisi"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          analisi: { $ref: "#/components/schemas/AnalisiPilota" },
        },
      },
      RispostaAnalisiScuderia: {
        type: "object",
        required: ["lingua", "analisi"],
        properties: {
          lingua: { $ref: "#/components/schemas/CodiceLingua" },
          analisi: { $ref: "#/components/schemas/AnalisiScuderia" },
        },
      },
      Errore: {
        type: "object",
        required: ["errore"],
        properties: {
          errore: {
            type: "object",
            required: ["codice", "messaggio", "requestId"],
            properties: {
              codice: { type: "string", example: "PILOTA_NON_TROVATO" },
              messaggio: {
                type: "string",
                example: "Il pilota richiesto non esiste",
              },
              lingueSupportate: {
                type: "array",
                description:
                  "Presente soltanto quando codice è LINGUA_NON_SUPPORTATA.",
                minItems: 6,
                maxItems: 6,
                items: { $ref: "#/components/schemas/CodiceLingua" },
              },
              requestId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
  },
};

module.exports = documentoOpenApi;
