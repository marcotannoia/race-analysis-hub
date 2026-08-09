const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { rateLimit } = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const apiV1Routes = require("./routes/v1/apiRoutes");
const gestoreErrori = require("./middleware/gestoreErrori");
const ambiente = require("./config/ambiente");
const documentoOpenApi = require("./docs/openapi");
const { inviaErrore } = require("./utils/rispostaApi");

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

app.use(
  cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type", "If-None-Match"],
    exposedHeaders: ["ETag", "RateLimit", "RateLimit-Policy", "X-Request-ID"],
    maxAge: 86400,
  }),
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: ambiente.limiteRichieste,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: (richiesta) =>
      richiesta.method === "OPTIONS" ||
      ["/health", "/v1/health"].includes(richiesta.path),
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

app.get("/api/health", (richiesta, risposta) => {
  const databaseConnesso = mongoose.connection.readyState === 1;

  risposta
    .status(databaseConnesso ? 200 : 503)
    .set("Cache-Control", "no-store")
    .json({ stato: databaseConnesso ? "ok" : "non disponibile" });
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

app.use("/api/v1", apiV1Routes);

app.get("/api", (richiesta, risposta) => {
  risposta.json({
    nome: "Race Analysis Hub API",
    descrizione: "Usare esclusivamente la versione pubblica v1",
    versioneAttuale: "/api/v1",
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
