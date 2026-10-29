const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const app = require("./app");
const collegaDatabase = require("./config/database");
const ambiente = require("./config/ambiente");
const { avviaMonitorPenalitaFia } = require("./services/penalitaFia");

async function avviaServer() {
  try {
    await collegaDatabase();
    if (collegaDatabase.usaPostgres()) await require('./services/runtimeF1db').caricaRuntime(collegaDatabase.getPool(),true);
    await require('./routes/admin').ricaricaMeteoGare().catch((e) => console.error('Meteo gare non ricaricato:', e.message));
    if (!collegaDatabase.usaPostgres()) {
      await require("./services/aggiornamentoSingaporeConcluso").applicaAggiornamentoSingapore();
    }

    const server = app.listen(ambiente.porta, ambiente.host, () => {
      console.log(`Server avviato su ${ambiente.host}:${ambiente.porta}`);
    });

    server.requestTimeout = 60000;
    server.headersTimeout = 65000;
    server.keepAliveTimeout = 5000;

    const fermaMonitorPenalita = ambiente.monitorFiaAbilitato
      ? avviaMonitorPenalitaFia() : () => {};
    const fermaMonitorAggiornamenti = ambiente.monitorFiaAbilitato
      ? require('./services/aggiornamentiFia').avviaMonitorAggiornamentiFia() : () => {};
    const fermaAggiornamentoGp = require('./services/aggiornamentoAutomaticoGp').avviaAggiornamentoAutomaticoGp();


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
      fermaMonitorPenalita();
      fermaMonitorAggiornamenti();
      fermaAggiornamentoGp();
      console.log(`Arresto del server richiesto da ${segnale}`);

      const arrestoForzato = setTimeout(() => process.exit(1), 10000);
      arrestoForzato.unref();

      server.close(async () => {
        await collegaDatabase.chiudiDatabase();
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
