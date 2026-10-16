const mongoose = require("mongoose");
const { Pool } = require("pg");
const ambiente = require("./ambiente");
let pool;
let connected = false;

function usaPostgres() { return ambiente.dataProvider === "postgres"; }

function getPool() {
  if (!usaPostgres()) throw new Error("Provider PostgreSQL non attivo");
  if (!pool) {
    if (!ambiente.supabaseDbUrl) throw new Error("SUPABASE_DB_URL non configurata");
    pool = new Pool({ connectionString: ambiente.supabaseDbUrl, max: 4,
      connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
    pool.on("error", (error) => console.error("Pool PostgreSQL:", error.message));
  }
  return pool;
}

async function collegaDatabase() {
  if (usaPostgres()) {
    await getPool().query("select 1");
    await require('../services/statisticheContesto').caricaStatistichePostgres(getPool());
    connected = true;
    console.log("PostgreSQL Supabase collegato");
    return;
  }
  const mongoUrl = ambiente.mongoUrl;

  if (!mongoUrl) {
    throw new Error("La variabile MONGO_URL non è configurata");
  }

  await mongoose.connect(mongoUrl, {
    dbName: ambiente.nomeDatabase,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB collegato al database: ${mongoose.connection.name}`);
}

async function chiudiDatabase() {
  connected = false;
  if (usaPostgres()) { if (pool) await pool.end(); }
  else await mongoose.disconnect();
}

function databaseConnesso() {
  return usaPostgres() ? connected : mongoose.connection.readyState === 1;
}
async function databaseDisponibile() {
  if (!databaseConnesso()) return false;
  if (!usaPostgres()) return true;
  try { await getPool().query('select 1'); return true; }
  catch { return false; }
}

module.exports = collegaDatabase;
module.exports.chiudiDatabase = chiudiDatabase;
module.exports.databaseConnesso = databaseConnesso;
module.exports.databaseDisponibile = databaseDisponibile;
module.exports.getPool = getPool;
module.exports.usaPostgres = usaPostgres;
