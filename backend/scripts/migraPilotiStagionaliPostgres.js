const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {Client}=require('pg');const{configurazione}=require('../relational/connessione');
const {TIPI}=require('../services/storicoPilotaCircuito');
async function verifica(c,attesi){
 const counts=(await c.query(`select
   (select count(*)::int from catalog.driver) piloti,
   (select count(*)::int from catalog.season_driver) associazioni,
   (select count(*)::int from catalog.driver_circuit_result) risultati,
   (select count(distinct circuit_id)::int from catalog.driver_circuit_result) circuiti,
   (select count(*)::int from catalog.entry where season_driver_id is null or season is null) iscrizioni_incomplete,
   (select count(*)::int from information_schema.columns where table_schema='catalog' and table_name='driver' and column_name='current_team_id') scuderia_in_anagrafica`)).rows[0];
 const parity=(await c.query(`select count(*)::int n from catalog.driver_circuit_result h
   join f1db.race_data rd on rd.race_id=h.race_id and rd.type=h.session_type and rd.position_display_order=h.position_display_order
   join f1db.race r on r.id=rd.race_id join catalog.season_driver sd on sd.id=h.season_driver_id
   join catalog.driver d on d.id=sd.driver_id
   where rd.driver_id=d.f1db_driver_id and rd.constructor_id=sd.constructor_id
     and h.season=r.year and sd.season=r.year and h.circuit_id=r.circuit_id
     and h.source_payload=to_jsonb(rd) and h.position_number is not distinct from rd.position_number
     and h.position_text=rd.position_text and h.points is not distinct from rd.race_points
     and h.laps is not distinct from rd.race_laps
     and h.time_millis is not distinct from coalesce(rd.race_time_millis,rd.qualifying_time_millis)
     and h.retirement_reason is not distinct from rd.race_reason_retired`)).rows[0].n;
 assert.equal(counts.risultati,attesi,'Copertura storico incompleta');assert.equal(parity,attesi,'Risultati o scuderie diversi dalla fonte');
 assert.equal(counts.iscrizioni_incomplete,0);assert.equal(counts.scuderia_in_anagrafica,0);
 const cambi=(await c.query(`select driver_slug,season,constructor_id,count(distinct race_id)::int gare
   from catalog.driver_circuit_history where season=2025 and driver_slug in ('lawson','tsunoda') and session_type='RACE_RESULT'
   group by 1,2,3 order by 1,3`)).rows;
 const profiles=(await c.query(`select count(*)::int collegati from catalog.driver_circuit_result h
   where exists(select 1 from catalog.circuit_similarity_profile p where p.circuit_id=h.circuit_id)`)).rows[0].collegati;
 const permissions=(await c.query(`select n.nspname schema,c.relname tabella,c.relrowsecurity rls,
   has_table_privilege('anon',c.oid,'select') lettura_anon,has_table_privilege('authenticated',c.oid,'insert') scrittura_authenticated
   from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='catalog' and c.relname in ('season_driver','driver_circuit_result') order by c.relname`)).rows;
 assert.ok(permissions.every(r=>r.rls&&!r.lettura_anon&&!r.scrittura_authenticated));
 return {...counts,risultatiVerificati:parity,risultatiConProfiloCircuito:profiles,cambiScuderia2025:cambi,permessi:permissions};
}
async function main(){
 const dir=path.join(__dirname,'../../supabase/migrations');
 const matches=fs.readdirSync(dir).filter(f=>f.endsWith('_driver_season_and_circuit_history.sql'));
 if(matches.length!==1)throw new Error('Migrazione assente o ambigua');
 const file=matches[0],version=file.split('_')[0],name=file.replace(/^\d+_|\.sql$/g,'');
 const sql=fs.readFileSync(path.join(dir,file),'utf8');const c=new Client(configurazione());await c.connect();
 try{
  const expected=async()=>(await c.query(`select count(*)::int n from f1db.race_data rd join catalog.driver d on d.f1db_driver_id=rd.driver_id where rd.type=any($1::text[])`,[TIPI])).rows[0].n;
  const attesi=await expected();
  const applied=await c.query('select statements from supabase_migrations.schema_migrations where version=$1',[version]);
  if(applied.rows.length){
   assert.equal(applied.rows[0].statements.join('\n').trim(),sql.trim(),'Migrazione diversa dal file locale');
   console.log(JSON.stringify({stato:'gia_applicata',verifica:await verifica(c,attesi)}));return;
  }
  const plan={migrazione:file,risultatiDaImportare:attesi,piloti:(await c.query('select count(*)::int n from catalog.driver')).rows[0].n};
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({...plan,stato:'simulazione'}));return;}
  await c.query('begin');
  try{
   await c.query("set local lock_timeout='5s'");
   await c.query("select pg_advisory_xact_lock(hashtextextended('driver_season_history_migration',0))");
   await c.query('lock table catalog.driver,catalog.entry in share row exclusive mode');
   const driverBefore=(await c.query('select * from catalog.driver order by id')).rows;
   const entryBefore=(await c.query('select grand_prix_id,driver_id,team_id from catalog.entry order by grand_prix_id,driver_id')).rows;
   const backup={generatoIl:new Date().toISOString(),driver:driverBefore,entry:entryBefore};
   const backupDir=path.join(__dirname,'../../output/backup-piloti');fs.mkdirSync(backupDir,{recursive:true});
   const backupFile=path.join(backupDir,`prima-migrazione-${Date.now()}.json`);fs.writeFileSync(backupFile,JSON.stringify(backup),{mode:0o600});
   await c.query(sql);await c.query('set constraints all immediate');
   const driverAfter=(await c.query('select * from catalog.driver order by id')).rows;
   assert.deepEqual(driverAfter,driverBefore.map(({current_team_id,...r})=>r),'Schede anagrafiche alterate');
   assert.deepEqual((await c.query('select grand_prix_id,driver_id,team_id from catalog.entry order by grand_prix_id,driver_id')).rows,entryBefore,'Iscrizioni o scuderie dei GP alterate');
   const result=await verifica(c,await expected());
   await c.query('insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3::text[])',[version,name,[sql]]);
   await c.query('commit');
   const report={generatoIl:new Date().toISOString(),stato:'completata',...plan,verifica:result,backup:backupFile};
   fs.mkdirSync(path.join(__dirname,'../../docs/modello-piloti'),{recursive:true});
   fs.writeFileSync(path.join(__dirname,'../../docs/modello-piloti/verifica-database.json'),JSON.stringify(report,null,2)+'\n');
   console.log(JSON.stringify(report));
  }catch(e){await c.query('rollback');throw e;}
 }finally{await c.end();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={verifica};
