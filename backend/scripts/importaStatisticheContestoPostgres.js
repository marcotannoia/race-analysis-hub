const path = require('node:path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const data = require('../data/statistiche-contesto.json');

async function main() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL assente');
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();
  try {
    await client.query('begin');
    const previous = await client.query('select applied_grand_prix_keys from ratings.context_metadata where singleton=true for update');
    const earlier = previous.rows[0]?.applied_grand_prix_keys || [];
    const incoming = data.metadati.aggiornamentiApplicati;
    if (!earlier.every((key, index) => incoming[index] === key)) {
      throw new Error('Statistiche PostgreSQL più recenti o divergenti dal file: importazione annullata');
    }
    let count=0;
    for (const [slug,values] of Object.entries(data.piloti)) {
      if (!values) continue;
      const result = await client.query(`insert into ratings.driver_context
        (driver_id,races_started,wet_races,positive_wet_races,wet_wins,driver_errors,fatal_errors)
        select id,$2,$3,$4,$5,$6,$7 from catalog.driver where slug=$1
        on conflict(driver_id) do update set races_started=excluded.races_started,
          wet_races=excluded.wet_races,positive_wet_races=excluded.positive_wet_races,
          wet_wins=excluded.wet_wins,driver_errors=excluded.driver_errors,
          fatal_errors=excluded.fatal_errors,updated_at=now() returning driver_id`,
        [slug,values.gareDisputate,values.gareConPioggiaDisputate,
          values.gareConPioggiaPositive,values.vittorieConPioggia,
          values.erroriPilota,values.erroriFatali]);
      count+=result.rowCount;
    }
    const meta=data.metadati;
    await client.query(`insert into ratings.context_metadata
      (singleton,methodology_version,last_grand_prix_key,description,wet_methodology,sources,applied_grand_prix_keys)
      values (true,$1,$2,$3,$4::jsonb,$5,$6)
      on conflict(singleton) do update set methodology_version=excluded.methodology_version,
        last_grand_prix_key=excluded.last_grand_prix_key,description=excluded.description,
        wet_methodology=excluded.wet_methodology,sources=excluded.sources,
        applied_grand_prix_keys=excluded.applied_grand_prix_keys,updated_at=now()`,
      [meta.versioneMetodologia,meta.ultimoGpIncluso,meta.descrizione,
        JSON.stringify(meta.metodologiaPioggia),meta.fonti,meta.aggiornamentiApplicati]);
    await client.query('commit');
    console.log(JSON.stringify({ insertedDrivers:count, metadata:true }));
  } catch (error) { await client.query('rollback'); throw error; }
  finally { await client.end(); }
}
main().catch((error)=>{console.error(error.message);process.exitCode=1});
