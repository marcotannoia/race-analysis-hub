const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const app = require("./app");
const collegaDatabase = require("./config/database");
const ambiente = require("./config/ambiente");
const {
  avviaMonitorAggiornamentiFia,
} = require("./services/aggiornamentiFia");

async function avviaServer() {
  try {
    await collegaDatabase();

    const server = app.listen(ambiente.porta, ambiente.host, () => {
      console.log(`Server avviato su ${ambiente.host}:${ambiente.porta}`);
    });

    server.requestTimeout = 60000;
    server.headersTimeout = 65000;
    server.keepAliveTimeout = 5000;

    const arrestaMonitorFia = ambiente.monitorFiaAbilitato
      ? avviaMonitorAggiornamentiFia()
      : () => {};

    server.on("error", (errore) => {
      console.error("Impossibile avviare il server:", errore.message);
      process.exit(1);
    });

    let chiusuraInCorso = false;

    async function arrestaServer(segnale) {
      if (chiusuraInCorso) {
        return;
      }

      chiusuraInCorso = true;
      console.log(`Arresto del server richiesto da ${segnale}`);
      arrestaMonitorFia();

      const arrestoForzato = setTimeout(() => process.exit(1), 10000);
      arrestoForzato.unref();

      server.close(async () => {
        await mongoose.disconnect();
        clearTimeout(arrestoForzato);
        process.exit(0);
      });
    }

    process.on("SIGTERM", () => arrestaServer("SIGTERM"));
    process.on("SIGINT", () => arrestaServer("SIGINT"));
  } catch (errore) {
    console.error("Impossibile avviare il server:", errore.message);
    process.exit(1);
  }
}

avviaServer();
