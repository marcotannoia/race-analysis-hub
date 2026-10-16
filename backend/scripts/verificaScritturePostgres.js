// Esegue le scritture post-GP in una transazione poi la annulla.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
process.env.DATA_PROVIDER = 'postgres';
const connect = require('../config/database');
const { load, persistPostGp } = require('../repositories/postgresCompat');
const { leggiStatistichePostgres } = require('../services/statisticheContesto');

async function main() {
  await connect();
  try {
    const races = await load('Gara');
    const current = races.find((race)=>race.stato==='attuale');
    if (!current) throw new Error('GP attuale assente');
    const next = races.filter((race)=>race.stagione===current.stagione &&
      race.ordineAnalisi>current.ordineAnalisi && race.stato!=='conclusa')
      .sort((a,b)=>a.ordineAnalisi-b.ordineAnalisi)[0] || null;
    const drivers = await load('Pilota'), teams = await load('Scuderia');
    const analysesDriver = (await load('AnalisiGara')).filter((doc)=>doc.gara===current._id);
    const analysesTeam = (await load('AnalisiScuderia')).filter((doc)=>doc.gara===current._id);
    const contextStats = await leggiStatistichePostgres(connect.getPool());
    const auditBefore = await connect.getPool().query('select count(*)::integer n from editorial.post_gp_update');
    const operation = (doc) => ({ updateOne: { filter: { _id: doc._id },
      update: { $set: { classifica2026: doc.classifica2026 } } } });
    await persistPostGp({ analysesDriver, analysesTeam,
      driverOperations: drivers.map(operation), teamOperations: teams.map(operation),
      currentRace: current, nextRace: next, concludedAt: new Date(),
      contextStats, postGpUpdate: { verification: 'rollback' }, dryRun: true });
    const result = await connect.getPool().query(`select count(*)::integer n from catalog.grand_prix where state='attuale'`);
    if (result.rows[0].n !== 1) throw new Error('Rollback non riuscito');
    const auditAfter = await connect.getPool().query('select count(*)::integer n from editorial.post_gp_update');
    if (auditAfter.rows[0].n !== auditBefore.rows[0].n) throw new Error('Rollback audit non riuscito');
    console.log(JSON.stringify({ dryRun: true, gp: current.slug,
      drivers: analysesDriver.length, teams: analysesTeam.length, rolledBack: true }));
  } finally { await connect.chiudiDatabase(); }
}
main().catch((error)=>{ console.error(error.stack); process.exitCode=1; });
