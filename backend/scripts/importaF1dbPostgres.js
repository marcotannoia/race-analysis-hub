// Importa il dump SQL verificato di F1DB nello schema privato f1db.
// Richiede SUPABASE_DB_URL nel file backend/.env o nell'ambiente.
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

async function principale() {
  const sqlFile = process.argv[2];
  if (!sqlFile || !fs.existsSync(sqlFile)) {
    throw new Error("Indicare il percorso del dump SQL preparato da preparaDumpF1db.ps1");
  }
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error("SUPABASE_DB_URL non configurata in backend/.env");
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    connectionTimeoutMillis: 15000,
    query_timeout: 300000,
  });
  await client.connect();
  let transazioneAperta = false;
  try {
    const esistenti = await client.query("select count(*)::int as totale from f1db.driver");
    if (esistenti.rows[0].totale !== 0) {
      throw new Error("Lo schema f1db contiene già dati: importazione interrotta");
    }

    await client.query("begin");
    transazioneAperta = true;
    await client.query("set local search_path to f1db");

    const stream = fs.createReadStream(sqlFile, { encoding: "utf8" });
    const righe = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let inserimenti = 0;
    for await (const riga of righe) {
      if (!riga.startsWith("INSERT INTO ")) continue;
      await client.query(riga);
      inserimenti += 1;
      if (inserimenti % 10 === 0) console.log(`Gruppi SQL importati: ${inserimenti}`);
    }
    if (inserimenti !== 47) {
      throw new Error(`Dump inatteso: ${inserimenti} gruppi INSERT invece di 47`);
    }

    const verifica = await client.query(`
      select
        (select count(*)::int from f1db.driver) as drivers,
        (select count(*)::int from f1db.constructor) as constructors,
        (select count(*)::int from f1db.circuit) as circuits,
        (select count(*)::int from f1db.race) as races,
        (select count(*)::int from f1db.race_data) as race_data,
        pg_database_size(current_database())::bigint as database_bytes
    `);
    const dati = verifica.rows[0];
    if (!dati.drivers || !dati.constructors || !dati.circuits || !dati.races || !dati.race_data) {
      throw new Error("Importazione incompleta: una o più tabelle principali sono vuote");
    }
    if (Number(dati.database_bytes) > 450_000_000) {
      throw new Error(`Database oltre la soglia prudenziale Free: ${dati.database_bytes} byte`);
    }

    await client.query("commit");
    transazioneAperta = false;
    console.log(JSON.stringify(dati, null, 2));
  } catch (errore) {
    if (transazioneAperta) await client.query("rollback");
    throw errore;
  } finally {
    await client.end();
  }
}

principale().catch((errore) => {
  console.error(`${errore.name}: ${errore.message}`);
  process.exitCode = 1;
});
