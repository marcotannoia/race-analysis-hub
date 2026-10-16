// Confronta ogni documento Mongo con lo snapshot PostgreSQL, senza modificarli.
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const editorial = ['scuderie', 'piloti', 'gare', 'analisiGare', 'analisiScuderie'];
const archive = ['metodiPrevisionali', 'rilasci_dati', 'backup_rilasci_dati', 'dati_live_fia'];
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

async function main() {
  if (!process.env.MONGO_URL || !process.env.SUPABASE_DB_URL)
    throw new Error('MONGO_URL o SUPABASE_DB_URL assente');
  await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DATABASE_NAME || 'f1_stats' });
  const pg = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  try {
    const result = {};
    for (const name of [...editorial, ...archive]) {
      const schema = editorial.includes(name) ? 'editorial.source_document' : 'archive.mongo_document';
      const mongo = await mongoose.connection.db.collection(name).find().toArray();
      const stored = await pg.query(`select mongo_id,payload from ${schema} where collection_name=$1`, [name]);
      const byId = new Map(stored.rows.map((row) => [row.mongo_id.trimEnd(), hash(row.payload)]));
      if (mongo.length !== byId.size) throw new Error(`${name}: conteggio diverso`);
      for (const doc of mongo) {
        const key = String(doc._id);
        if (hash(JSON.parse(JSON.stringify(doc))) !== byId.get(key))
          throw new Error(`${name}: contenuto diverso per ${key}`);
      }
      result[name] = mongo.length;
    }
    console.log(JSON.stringify({ verified: result, total: Object.values(result).reduce((a,b)=>a+b,0) }));
  } finally {
    await pg.end(); await mongoose.disconnect();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
