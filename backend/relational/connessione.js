const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
let pool;
function connectionString(env = process.env) {
  return env.SUPABASE_DATABASE_URL?.trim() || env.DATABASE_CONNECTION?.trim() || env.SUPABASE_DB_URL?.trim();
}
function configurazione(env = process.env) {
  const valore = connectionString(env);
  if (!valore) throw new Error('Configurare DATABASE_CONNECTION oppure SUPABASE_DATABASE_URL');
  const url = new URL(valore);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('La connessione deve essere un URL PostgreSQL');
  if (url.searchParams.get('sslmode') === 'disable') throw new Error('Supabase richiede TLS');
  // La validazione del certificato resta attiva, anche quando sslmode è omesso.
  url.searchParams.delete('sslmode');
  return {connectionString:url.toString(),ssl:{rejectUnauthorized:true,ca:fs.readFileSync(env.SUPABASE_CA_FILE || path.join(__dirname,'certs/prod-ca-2021.crt'),'utf8')},
    connectionTimeoutMillis:12000,statement_timeout:60000};
}
function database() {
  if (!pool) pool = new Pool({...configurazione(),max:3,idleTimeoutMillis:30000});
  return pool;
}
async function chiudi() { if(pool){const attuale=pool;pool=undefined;await attuale.end();} }
module.exports={connectionString,configurazione,database,chiudi};
