const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ ...require('../relational/connessione').configurazione(), max: 1 });
  try {
    const result = await pool.query(`select
      (select count(*) from f1db.race) f1db_races,
      (select count(*) from f1db.race_data) f1db_results,
      (select count(*) from catalog.team) teams,
      (select count(*) from catalog.driver) drivers,
      (select count(*) from catalog.grand_prix) races,
      (select count(*) from catalog.entry) entries,
      (select count(*) from editorial.driver_analysis) driver_analyses,
      (select count(*) from editorial.team_analysis) team_analyses,
      (select count(*) from catalog.grand_prix where state='attuale') current_races,
      (select count(*) from ratings.driver_score) driver_scores,
      (select count(*) from ratings.team_score) team_scores,
      (select count(*) from live_fia.report) fia_reports,
      (select count(*) from ratings.driver_context) driver_contexts,
      (select count(*) from ratings.context_metadata) context_metadata,
      (select count(*) from editorial.source_document) snapshots,
      (select count(*) from catalog.entry e left join editorial.driver_analysis a using(grand_prix_id,driver_id) where a.id is null) missing_analyses,
      (select count(*) from editorial.source_document where collection_name='piloti') driver_snapshots,
      (select count(*) from editorial.source_document where collection_name='analisiGare') analysis_snapshots,
      pg_database_size(current_database()) db_bytes`);
    const x = Object.fromEntries(Object.entries(result.rows[0]).map(([k,v])=>[k,Number(v)]));
    const checks = [
      [x.f1db_races >= 1172, 'storico gare F1DB'],
      [x.f1db_results >= 188111, 'risultati F1DB'],
      [x.teams === 11 && x.drivers >= 23 && x.driver_snapshots === x.drivers, 'anagrafiche'],
      [x.races === 12 && x.entries >= 264 && x.missing_analyses === 0, 'GP e partecipazioni'],
      [x.driver_analyses === x.entries && x.analysis_snapshots === x.entries && x.team_analyses === 132, 'analisi'],
      [x.current_races === 1, 'GP attuale'],
      [x.driver_scores > 0 && x.team_scores > 0, 'overall'],
      [x.driver_contexts === 22 && x.context_metadata === 1, 'indicatori contesto'],
      [x.snapshots === x.drivers+x.teams+x.races+x.entries+x.team_analyses, 'snapshot API'],
      [x.db_bytes < 500 * 1024 * 1024, 'limite database Free'],
    ];
    for (const [okay,label] of checks) console.log(`${okay?'OK':'ERRORE'} ${label}`);
    console.log(JSON.stringify({ ...x, db_mib: Math.round(x.db_bytes / 1048576) }));
    if (checks.some(([okay]) => !okay)) process.exitCode = 1;
  } finally { await pool.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
