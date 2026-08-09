const intestazioneRequestId = {
  "X-Request-ID": { $ref: "#/components/headers/RequestId" },
};

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
    version: "1.2.0",
    description:
      "API REST pubblica, anonima e di sola lettura. Non richiede autenticazione e " +
      "consente esclusivamente GET, HEAD e OPTIONS. Le analisi editoriali sono " +
      "pubblicate soltanto per il Gran Premio attuale; gare future e relative " +
      "analisi non vengono esposte. Classifiche e risultati quantitativi provengono " +
      "da uno snapshot locale derivato da F1DB v2026.11.0 (CC BY 4.0), senza " +
      "chiamate esterne a runtime, e sono visualizzati con Chart.js. " +
      "Il riutilizzo dei dati F1DB, anche commerciale, deve mantenere l'attribuzione " +
      "e le indicazioni richieste dalla CC BY 4.0. " +
      "In produzione si applicano una cache pubblica di 60 secondi e un limite di " +
      "1000 richieste ogni 15 minuti per indirizzo IP.",
    contact: {
      name: "Marco Tannoia",
      email: "marco.tannoia@gmail.com",
    },
    license: {
      name: "Licenza mista: contenuti originali e dati di terzi",
      url: "https://github.com/marcotannoia/race-analysis-hub/blob/master/NOTICE.md",
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
      name: "Analisi",
      description: "Analisi editoriali del Gran Premio attuale.",
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
          "Endpoint non memorizzato in cache e non conteggiato nel rate limit.",
        responses: {
          200: rispostaJson(
            "Servizio e database disponibili",
            "#/components/schemas/StatoServizio",
            {
              stato: "ok",
              servizio: "race-analysis-hub-api",
              versione: "1.2.0",
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
          "Restituisce il Gran Premio attuale, l'elenco dei piloti e l'elenco delle scuderie.",
        responses: {
          200: rispostaJson("Contenuto della home", "#/components/schemas/Home"),
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
        parameters: [{ $ref: "#/components/parameters/PilotaSlug" }],
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
        parameters: [{ $ref: "#/components/parameters/ScuderiaSlug" }],
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
        parameters: [{ $ref: "#/components/parameters/GaraSlug" }],
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
      RequestId: {
        description:
          "Identificatore univoco della richiesta, utile per assistenza e analisi dei log.",
        schema: { type: "string", format: "uuid" },
      },
    },
    parameters: {
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
            example: {
              errore: {
                codice: "PARAMETRO_QUERY_NON_VALIDO",
                messaggio: "Parametri non supportati: pagina",
                requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
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
          versione: "1.2.0",
          requestId: "2f1c7e5f-7f55-4f16-a29c-45f3f667ae21",
        },
      ),
    },
    schemas: {
      IndiceEndpoint: {
        type: "object",
        required: [
          "home",
          "piloti",
          "dettaglioPilota",
          "scuderie",
          "dettaglioScuderia",
          "garaAttuale",
          "dettaglioGaraAttuale",
          "classificaPiloti",
          "classificaScuderie",
          "analisiPilota",
          "analisiScuderia",
        ],
        properties: {
          home: { type: "string", example: "/api/v1/home" },
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
          "attribuzioneDati",
          "endpoint",
        ],
        properties: {
          nome: { type: "string", const: "Race Analysis Hub API" },
          versione: { type: "string", example: "1.2.0" },
          descrizione: { type: "string" },
          documentazione: { type: "string", example: "/api/docs" },
          specificaOpenApi: {
            type: "string",
            example: "/api/v1/openapi.json",
          },
          attribuzioneDati: {
            $ref: "#/components/schemas/FonteAndamento",
          },
          endpoint: { $ref: "#/components/schemas/IndiceEndpoint" },
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
          versione: { type: "string", example: "1.2.0" },
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
        required: ["slug", "nome"],
        properties: {
          slug: { type: "string", example: "ferrari" },
          nome: { type: "string", example: "Ferrari" },
        },
      },
      PilotaBreve: {
        type: "object",
        required: ["slug", "nome", "codice", "numero"],
        properties: {
          slug: { type: "string", example: "leclerc" },
          nome: { type: "string", example: "Charles Leclerc" },
          codice: { type: "string", example: "LEC" },
          numero: { type: "string", example: "16" },
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
              nazionalita: { type: "string", example: "Monegasca" },
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
              nazionalita: { type: "string", example: "Italiana" },
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
          "stato",
        ],
        properties: {
          slug: { type: "string", example: "olanda-zandvoort" },
          nome: { type: "string", example: "Gran Premio d'Olanda" },
          circuito: { type: "string", example: "Circuit Zandvoort" },
          paese: { type: "string", example: "Olanda" },
          stagione: { type: "integer", minimum: 2026, example: 2026 },
          ordineAnalisi: { type: "integer", minimum: 1 },
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
          "notaBene",
          "risultatiQualifica",
          "andamento",
          "prestazioni",
        ],
        properties: {
          risultatiGara: { $ref: "#/components/schemas/TestiAnnuali" },
          notaBene: { $ref: "#/components/schemas/TestiAnnuali" },
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
              "Formato testuale mantenuto per compatibilità. Usare `datiPerAnno.notaBene` per gli N.B. separati per stagione.",
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
              "Aggiornamenti tecnici confermati o stato delle informazioni disponibili.",
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
                  "Situazione delle eventuali penalità del pilota per il Gran Premio attuale.",
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
        required: ["totale", "piloti"],
        properties: {
          totale: { type: "integer", minimum: 0 },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
          },
        },
      },
      ElencoScuderie: {
        type: "object",
        required: ["totale", "scuderie"],
        properties: {
          totale: { type: "integer", minimum: 0 },
          scuderie: {
            type: "array",
            items: { $ref: "#/components/schemas/Scuderia" },
          },
        },
      },
      ElencoGare: {
        type: "object",
        required: ["totale", "gare"],
        properties: {
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
        required: ["gara"],
        properties: { gara: { $ref: "#/components/schemas/Gara" } },
      },
      DettaglioPilota: {
        type: "object",
        required: ["pilota", "analisi", "andamentoStagioneCorrente"],
        properties: {
          pilota: { $ref: "#/components/schemas/Pilota" },
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
          "scuderia",
          "piloti",
          "analisi",
          "andamentoStagioneCorrente",
        ],
        properties: {
          scuderia: { $ref: "#/components/schemas/Scuderia" },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
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
      MetadatiHome: {
        type: "object",
        required: ["stagione", "totalePiloti", "totaleScuderie"],
        properties: {
          stagione: { type: "integer", minimum: 2026 },
          totalePiloti: { type: "integer", minimum: 0 },
          totaleScuderie: { type: "integer", minimum: 0 },
        },
      },
      Home: {
        type: "object",
        required: ["garaAttuale", "piloti", "scuderie", "metadati"],
        properties: {
          garaAttuale: { $ref: "#/components/schemas/GaraBreve" },
          piloti: {
            type: "array",
            items: { $ref: "#/components/schemas/Pilota" },
          },
          scuderie: {
            type: "array",
            items: { $ref: "#/components/schemas/Scuderia" },
          },
          metadati: { $ref: "#/components/schemas/MetadatiHome" },
        },
      },
      DettaglioGara: {
        type: "object",
        required: ["gara", "analisiPiloti", "analisiScuderie"],
        properties: {
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
        required: ["stagione", "tipo", "totale", "classifica"],
        properties: {
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
        required: ["stagione", "tipo", "totale", "classifica"],
        properties: {
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
        required: ["analisi"],
        properties: {
          analisi: { $ref: "#/components/schemas/AnalisiPilota" },
        },
      },
      RispostaAnalisiScuderia: {
        type: "object",
        required: ["analisi"],
        properties: {
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
              requestId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
  },
};

module.exports = documentoOpenApi;
