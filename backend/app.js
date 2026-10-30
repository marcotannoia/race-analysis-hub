const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { databaseDisponibile } = require("./config/database");
const { rateLimit } = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const apiV1Routes = require("./routes/v1/apiRoutes");
const gestoreErrori = require("./middleware/gestoreErrori");
const ambiente = require("./config/ambiente");
const documentoOpenApi = require("./docs/openapi");
const { inviaErrore } = require("./utils/rispostaApi");
const { linguaRichiesta } = require("./i18n/lingue");

const app = express();
const cartellaFrontend = path.join(__dirname, "../frontend/dist");
const frontendDisponibile =
  ambiente.serviFrontend && fs.existsSync(path.join(cartellaFrontend, "index.html"));

app.disable("x-powered-by");
app.set("query parser", "simple");

if (ambiente.trustProxy > 0) {
  app.set("trust proxy", ambiente.trustProxy);
}

app.use((richiesta, risposta, next) => {
  const requestId = randomUUID();
  risposta.locals.requestId = requestId;
  risposta.set("X-Request-ID", requestId);

  if (richiesta.originalUrl.startsWith("/api/v1")) {
    const lingua = linguaRichiesta(richiesta);
    risposta.locals.lingua = lingua;
    risposta.set("Content-Language", lingua);
  }

  next();
});

app.use(
  helmet({
    contentSecurityPolicy: ambiente.produzione
      ? { directives: { frameAncestors: ["'none'"] } }
      : false,
    frameguard: { action: "deny" },
    strictTransportSecurity: ambiente.produzione ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use((richiesta, risposta, next) => {
  risposta.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=()",
  );
  next();
});

// L'area admin ha CORS proprio (metodi POST e header Authorization).
const corsPubblico = cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type", "If-None-Match"],
    exposedHeaders: [
      "Content-Language",
      "ETag",
      "RateLimit",
      "RateLimit-Policy",
      "X-App-Cache",
      "X-Request-ID",
    ],
    maxAge: 86400,
  });
app.use((req, res, next) => req.path.startsWith("/api/admin") ? next() : corsPubblico(req, res, next));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: ambiente.limiteRichieste,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: (richiesta) =>
      richiesta.method === "OPTIONS" ||
      ["/health", "/v1/health", "/v2/health"].includes(richiesta.path),
    handler(richiesta, risposta) {
      if (richiesta.originalUrl.startsWith("/api/v1")) {
        return inviaErrore(
          risposta,
          429,
          "LIMITE_RICHIESTE_SUPERATO",
          "Troppe richieste. Riprova tra qualche minuto",
        );
      }

      risposta.status(429).json({
        messaggio: "Troppe richieste. Riprova tra qualche minuto",
      });
    },
  }),
);

app.get("/api/health", async (richiesta, risposta) => {
  const connesso = await databaseDisponibile();

  risposta
    .status(connesso ? 200 : 503)
    .set("Cache-Control", "no-store")
    .json({ stato: connesso ? "ok" : "non disponibile" });
});

app.use(
  "/api/docs",
  (richiesta, risposta, next) => {
    risposta.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'self'; script-src 'self'; " +
        "img-src 'self' data:; font-src 'self'; connect-src 'self'; " +
        "frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(documentoOpenApi, {
    customSiteTitle: "Race Analysis Hub API - Documentazione",
    swaggerOptions: { tryItOutEnabled: true },
  }),
);

app.get("/api/v1/openapi.json", (richiesta, risposta) => {
  risposta
    .set("Cache-Control", "public, max-age=300")
    .json(documentoOpenApi);
});

app.use('/api',async (req,res,next)=>{
  try{
    const db=require('./config/database');
    if(db.usaPostgres() && db.databaseConnesso())await require('./services/runtimeF1db').caricaRuntime(db.getPool());
    next();
  }catch(e){next(e);}
});
app.use("/api/admin", cors({ origin: ambiente.produzione ? false : true, methods: ["GET", "POST"],
  allowedHeaders: ["Authorization", "Content-Type"] }), require("./routes/admin").creaRouterAdmin());
app.use("/api/dashboard", cors({ origin: ambiente.produzione ? false : true, methods: ["GET", "POST"],
  credentials: true, allowedHeaders: ["Content-Type"] }), require("./routes/dashboard").creaRouterDashboard());
app.use("/api/v1", apiV1Routes);
app.use("/api/v2", require("./relational/api").creaRouter());
app.get('/post-gp.md',(_req,res)=>res.type('text/markdown').sendFile(require('node:path').join(__dirname,'../post-gp.md')));

app.get("/api", (richiesta, risposta) => {
  risposta.json({
    nome: "Race Analysis Hub API",
    descrizione: "API pubbliche v1 e v2; la v2 espone analisi numeriche e risorse relazionali",
    versioneAttuale: "/api/v2",
    versioniDisponibili: ["/api/v1", "/api/v2"],
    specificaOpenApiV2: "/api/v2/openapi.json",
    documentazione: "/api/docs",
  });
});

app.use(
  ["/api/piloti", "/api/scuderie", "/api/gare"],
  (richiesta, risposta) => {
    inviaErrore(
      risposta,
      410,
      "VERSIONE_API_OBSOLETA",
      "Questo endpoint e stato sostituito dalla versione /api/v1",
    );
  },
);

app.use("/api", (richiesta, risposta) => {
  risposta.status(404).json({ messaggio: "Endpoint non trovato" });
});

if (frontendDisponibile) {
  app.use(
    express.static(cartellaFrontend, {
      index: false,
      setHeaders(risposta, percorsoFile) {
        if (percorsoFile.includes(`${path.sep}assets${path.sep}`)) {
          risposta.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  app.use((richiesta, risposta, next) => {
    if (richiesta.method === "GET" && richiesta.accepts("html")) {
      return risposta.sendFile(path.join(cartellaFrontend, "index.html"));
    }

    next();
  });
}

app.use((richiesta, risposta) => {
  risposta.status(404).json({ messaggio: "Risorsa non trovata" });
});

app.use(gestoreErrori);

module.exports = app;
