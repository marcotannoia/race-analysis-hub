// Copia le raccolte Mongo non editoriali, conservando il contenuto originale.
const path = require('node:path');
const mongoose = require('mongoose');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const names = ['metodiPrevisionali', 'rilasci_dati', 'backup_rilasci_dati', 'dati_live_fia'];

async function main() {
  if (!process.env.MONGO_URL || !process.env.SUPABASE_DB_URL)
    throw new Error('MONGO_URL o SUPABASE_DB_URL assente');
  await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DATABASE_NAME || 'f1_stats' });
  const pg = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  let transaction = false;
  try {
    const existing = await pg.query('select count(*)::integer n from archive.mongo_document');
    if (existing.rows[0].n !== 0) throw new Error('Archivio già popolato');
    await pg.query('begin'); transaction = true;
    const counts = {};
    for (const name of names) {
      const documents = await mongoose.connection.db.collection(name).find().toArray();
      for (const doc of documents) {
        await pg.query('insert into archive.mongo_document(collection_name,mongo_id,payload) values ($1,$2,$3)',
          [name, String(doc._id), JSON.parse(JSON.stringify(doc))]);
      }
      counts[name] = documents.length;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const database = await pg.query('select pg_database_size(current_database()) bytes');
    if (Number(database.rows[0].bytes) > 400 * 1024 * 1024)
      throw new Error('Archivio oltre la soglia di sicurezza di 400 MiB');
    const inserted = await pg.query('select count(*)::integer n from archive.mongo_document');
    if (inserted.rows[0].n !== total) throw new Error('Conteggio archivio diverso da Mongo');
    await pg.query('commit'); transaction = false;
    console.log(JSON.stringify({ counts, total, databaseMiB: Math.round(Number(database.rows[0].bytes) / 1048576) }));
  } catch (error) {
    if (transaction) await pg.query('rollback');
    throw error;
  } finally {
    await pg.end(); await mongoose.disconnect();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
