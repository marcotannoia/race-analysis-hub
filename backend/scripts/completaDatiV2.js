const fs=require('node:fs');const path=require('node:path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {database,chiudi}=require('../relational/connessione');
const {affidabilitaMeccanica}=require('../services/affidabilitaMeccanica');
async function main(){
 const db=database(),c=await db.connect();
 try{
  await c.query('begin');
  const docs=(await c.query("select collection_name,mongo_id,payload from editorial.source_document order by collection_name,mongo_id for update")).rows;
  const raw=(await c.query("select r.year,r.round,rd.driver_id,rd.constructor_id,rd.position_text,rd.race_reason_retired from f1db.race_data rd join f1db.race r on r.id=rd.race_id where rd.type='RACE_RESULT' and r.year in (select distinct season from catalog.grand_prix)")).rows;
  const map=n=>new Map(docs.filter(d=>d.collection_name===n).map(d=>[String(d.mongo_id),d.payload]));
  const gare=map('gare'),piloti=map('piloti'),teams=map('scuderie');
  const mapping=require('../data/campioni-previsionali-2026.json');
  const patch=[],scores=[];
  for(const d of docs){
   const a=structuredClone(d.payload);
   if(['analisiGare','analisiScuderie'].includes(d.collection_name)){
    const driver=d.collection_name==='analisiGare',g=gare.get(String(a.gara));
    const e=(driver?piloti:teams).get(String(a[driver?'pilota':'scuderia']));
    const id=(driver?mapping.mappingPiloti:mapping.mappingScuderie)[e.slug];
    if(!id)throw Error('Identità F1DB assente: '+e.slug);
    const rs=raw.filter(r=>r.year===g.stagione&&r.round<g.ordineCalendario&&r[driver?'driver_id':'constructor_id']===id)
      .map(r=>({positionText:r.position_text,reasonRetired:r.race_reason_retired}));
    const m=affidabilitaMeccanica(rs);
    a.overallSemantici||={};a.overallSemantici.stagioneCorrente||={};a.overallSemantici.stagioneCorrente.affidabilita=m;
    scores.push({tipo:driver?'driver':'team',slug:e.slug,gara:g.slug,score:m.overall,campione:m.campione,fonti:m.fonti});
   }else if(d.collection_name==='gare'){
    const circuito=require('../data/circuiti-tecnici-2026.json').circuiti[a.slug];
    if(circuito)a.circuitoTecnico={dati:circuito.dati,provenienzaDati:circuito.provenienzaDati||{}};
    if(a.previsioneCalibrata?.calcolatoIl)a.previsioneCalibrata.aggiornatoIl=new Date(a.previsioneCalibrata.calcolatoIl).toISOString();
   }else continue;
   patch.push({collection_name:d.collection_name,mongo_id:String(d.mongo_id),payload:a});
  }
  if(!process.argv.includes('--apply')){await c.query('rollback');console.log(JSON.stringify({documenti:patch.length,affidabilita:scores.length,senzaCampione:scores.filter(s=>s.score===null).length}));return;}
  const dir=path.join(__dirname,'../../.codex_work/supabase-backup');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,`before-v2-completion-${Date.now()}.json`),JSON.stringify({docs,scores:(await c.query("select 'driver' tipo,s.* from ratings.driver_score s join ratings.dimension d on d.id=s.dimension_id where d.slug='reliability' union all select 'team' tipo,s.* from ratings.team_score s join ratings.dimension d on d.id=s.dimension_id where d.slug='reliability'")).rows}),{mode:0o600});
  await c.query(`update editorial.source_document s set payload=x.payload,imported_at=now() from jsonb_to_recordset($1::jsonb) x(collection_name text,mongo_id text,payload jsonb) where s.collection_name=x.collection_name and s.mongo_id=x.mongo_id`,[JSON.stringify(patch)]);
  for(const tipo of ['driver','team']){
   await c.query(`insert into ratings.${tipo}_score(${tipo}_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release)
    select e.id,g.id,d.id,'affidabilita-meccanica-v1',x.score,x.campione,null,$2 from jsonb_to_recordset($1::jsonb) x(slug text,gara text,score numeric,campione integer)
    join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gara join ratings.dimension d on d.slug='reliability'
    on conflict (${tipo}_id,grand_prix_id,dimension_id,model_version) do update set score=excluded.score,sample_size=excluded.sample_size,calculated_at=now()`,[JSON.stringify(scores.filter(s=>s.tipo===tipo)),require('../services/overallSemantici').FONTE]);
   await c.query(`insert into ratings.${tipo}_score_source(score_id,url) select s.id,$1 from ratings.${tipo}_score s where s.model_version='affidabilita-meccanica-v1' on conflict do nothing`,[require('../services/overallSemantici').FONTE]);
  }
  const check=await c.query("select count(*) totale,count(*) filter(where jsonb_typeof(payload#>'{overallSemantici,stagioneCorrente,affidabilita,overall}')='number') numerici from editorial.source_document where collection_name in ('analisiGare','analisiScuderie')");
  if(Number(check.rows[0].numerici)!==scores.filter(s=>s.score!==null).length)throw Error('Verifica persistenza fallita');
  await c.query('commit');console.log(JSON.stringify({stato:'applicato',...check.rows[0],documenti:patch.length}));
 }catch(e){await c.query('rollback');throw e;}finally{c.release();await chiudi();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={main};
