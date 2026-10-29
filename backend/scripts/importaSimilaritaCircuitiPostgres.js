const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {Client}=require('pg');
const {configurazione}=require('../relational/connessione');
const {preparaImportazione,importaInTransazione,TABELLE}=require('../services/persistenzaSimilaritaCircuiti');
const datasetFile=path.join(__dirname,'../data/similarita-circuiti-2026.json');
const migrationDirectory=path.join(__dirname,'../../supabase/migrations');

async function main(){
  const raw=fs.readFileSync(datasetFile,'utf8');const dataset=JSON.parse(raw);
  const digest=createHash('sha256').update(raw).digest('hex');
  const piano=preparaImportazione(dataset,digest);
  const files=fs.readdirSync(migrationDirectory).filter(f=>f.endsWith('_circuit_similarity_profiles.sql'));
  if(files.length!==1)throw new Error('Migrazione circuiti assente o ambigua');
  const file=files[0],version=file.split('_')[0],name=file.replace(/^\d+_|\.sql$/g,'');
  const sql=fs.readFileSync(path.join(migrationDirectory,file),'utf8');
  const c=new Client(configurazione());await c.connect();
  try{
    const presenti=(await c.query('select id from f1db.circuit where id=any($1::text[])',[piano.profili.map(p=>p.circuit_id)])).rows;
    if(presenti.length!==piano.profili.length)throw new Error('Circuiti mancanti nel riferimento F1DB del database');
    const plan={stagione:dataset.stagione,versione:dataset.versione,profili:piano.profili.length,campi:piano.profili.length*22,
      confronti:piano.confronti.length,sha256:digest,migrazione:file};
    if(!process.argv.includes('--apply')){console.log(JSON.stringify({...plan,stato:'simulazione'}));return;}
    await c.query('begin');
    let backupFile=null;
    try{
      await c.query("set local lock_timeout='5s'");
      await c.query("select pg_advisory_xact_lock(hashtextextended('circuit_similarity_import',0))");
      const applied=await c.query('select statements from supabase_migrations.schema_migrations where version=$1',[version]);
      if(applied.rows.length){
        if(applied.rows[0].statements?.join('\n').trim()!==sql.trim())throw new Error('Migrazione registrata diversa dal file locale');
      }else{
        await c.query(sql);
        await c.query('insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3::text[])',[version,name,[sql]]);
      }
      const backup={acquisitoIl:new Date().toISOString(),tabelle:{}};
      for(const t of TABELLE)backup.tabelle[t.nome]=(await c.query(`select * from ${t.nome} where season=$1 and methodology_version=$2 for update`,[dataset.stagione,dataset.versione])).rows;
      if(Object.values(backup.tabelle).some(r=>r.length)){
        const dir=path.join(__dirname,'../../output/backup-circuiti');fs.mkdirSync(dir,{recursive:true});
        backupFile=path.join(dir,`prima-importazione-${Date.now()}.json`);fs.writeFileSync(backupFile,JSON.stringify(backup),{mode:0o600});
      }
      const result=await importaInTransazione(c,piano);
      await c.query('commit');
      console.log(JSON.stringify({...plan,stato:'completato',verifica:result,backup:backupFile}));
    }catch(e){await c.query('rollback');throw e;}
  }finally{await c.end();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
