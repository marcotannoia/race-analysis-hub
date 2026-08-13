const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const { MongoMemoryServer } = require("mongodb-memory-server");

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

async function avviaSviluppo() {
  let mongoLocale;
  let serverHttp;

  try {
    mongoLocale = await MongoMemoryServer.create({
      instance: { dbName: "f1_stats_locale" },
    });

    process.env.NODE_ENV = "development";
    process.env.MONGO_URL = mongoLocale.getUri();
    process.env.DATABASE_NAME = "f1_stats_locale";

    // Questi moduli leggono la configurazione al primo caricamento: devono
    // essere importati soltanto dopo aver impostato l'URI temporaneo.
    const collegaDatabase = require("../config/database");
    const { importaDati } = require("./importaDati");
    const app = require("../app");
    const ambiente = require("../config/ambiente");

    await collegaDatabase();
    await importaDati({ collega: false, disconnetti: false });

    serverHttp = await new Promise((risolvi, rifiuta) => {
      const server = app.listen(ambiente.porta, ambiente.host, () => {
        server.off("error", rifiuta);
        risolvi(server);
      });
      server.once("error", rifiuta);
    });

    console.log(
      `Backend locale avviato su http://${ambiente.host}:${ambiente.porta}`,
    );
    console.log(
      "Dati caricati in MongoDB temporaneo: Atlas non viene letto o modificato.",
    );

    serverHttp.requestTimeout = 60000;
    serverHttp.headersTimeout = 65000;
    serverHttp.keepAliveTimeout = 5000;

    let arrestoInCorso = false;
    async function arresta(segnale) {
      if (arrestoInCorso) return;
      arrestoInCorso = true;
      console.log(`Arresto dell'ambiente locale richiesto da ${segnale}`);

      if (serverHttp) {
        await new Promise((risolvi) => serverHttp.close(risolvi));
      }
      await mongoose.disconnect();
      if (mongoLocale) await mongoLocale.stop();
      process.exit(0);
    }

    process.on("SIGTERM", () => arresta("SIGTERM"));
    process.on("SIGINT", () => arresta("SIGINT"));
  } catch (errore) {
    console.error("Impossibile avviare l'ambiente locale:", errore.message);
    if (serverHttp) serverHttp.close();
    await mongoose.disconnect();
    if (mongoLocale) await mongoLocale.stop();
    process.exit(1);
  }
}

avviaSviluppo();
