const path=require('node:path');const fs=require('node:fs');const {createHash}=require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {Client}=require('pg');const {configurazione}=require('../relational/connessione');
const {creaDatiEffettivi}=require('../utils/datiEffettivi');const {documentoAnalisi}=require('../utils/documentiMigrazione');
const {punteggio}=require('../services/valutazioniNumeriche');
async function main(){
 const c=new Client(configurazione());await c.connect();
 try{
  const dati=creaDatiEffettivi(require('../data/dati-iniziali.json'));
  const sorgenti=(await c.query('select collection_name,mongo_id,payload from editorial.source_document')).rows;
  const righe=Object.fromEntries(['scuderie','piloti','gare','analisiGare','analisiScuderie'].map(n=>[n,sorgenti.filter(r=>r.collection_name===n).map(r=>r.payload)]));
  for(const[n,rows]of Object.entries(righe))if(rows.length!==dati[n].length)throw new Error(`Copertura diversa: ${n}`);
  const refs=Object.fromEntries(['scuderie','piloti','gare'].map(n=>[n,new Map(righe[n].map(r=>[r.slug,r]))]));
  const modificati=[];
  for(const n of ['scuderie','piloti','gare'])for(const source of dati[n]){
    const old=refs[n].get(source.slug);if(!old)throw new Error('Identità sorgente assente');
    const doc={...old,...source};delete doc.scuderiaSlug;
    if(n==='piloti')doc.scuderia=refs.scuderie.get(source.scuderiaSlug)._id;
    modificati.push({collection_name:n,mongo_id:String(old._id),payload:doc});
  }
  for(const n of ['analisiGare','analisiScuderie']){
    const team=n==='analisiScuderie';const index=new Map(righe[n].map(r=>[`${r.gara}|${r[team?'scuderia':'pilota']}`,r]));
    for(const a of dati[n]){const doc=documentoAnalisi(a,refs,team);const old=index.get(`${doc.gara}|${doc[team?'scuderia':'pilota']}`);if(!old)throw new Error('Analisi sorgente assente');modificati.push({collection_name:n,mongo_id:String(old._id),payload:{...old,...doc}});}
  }
  const score=[];
  for(const [tipo,analisi]of [['driver',dati.analisiGare],['team',dati.analisiScuderie]])for(const a of analisi){
    const s=a.overallSemantici||{},f=s.campi||{},st=s.stagioneCorrente||{};
    const fields={race_pace:f.passoGara,tyre_management:f.gestioneGomme,performance:st.rendimento,qualifying:st.qualifica,completion:st.completamento,annual_trend:f.andamentoPerAnno,race_results:f.risultatiGara,qualifying_results:f.risultatiQualifica};
    for(const[metrica,m]of Object.entries(fields))score.push({tipo,slug:a.pilotaSlug||a.scuderiaSlug,gp:a.garaSlug,metrica,score:punteggio(m?.overall),sample_size:m?.campione||0,fonti:m?.fonti||[]});
  }
  const plan={documenti:modificati.length,punteggi:score.length,sha256:createHash('sha256').update(JSON.stringify(modificati)).digest('hex')};
  if(!process.argv.includes('--apply')){console.log(JSON.stringify(plan));return;}
  const directory=path.join(__dirname,'../../.codex_work/supabase-backup');fs.mkdirSync(directory,{recursive:true});
  const backup={at:new Date().toISOString(),tables:{}};
  const tabelle=['editorial.source_document','catalog.team','catalog.driver','catalog.grand_prix','catalog.entry','catalog.driver_standing_snapshot','catalog.team_standing_snapshot','ratings.driver_score','ratings.team_score','ratings.driver_score_source','ratings.team_score_source'];
  for(const table of tabelle)backup.tables[table]=(await c.query(`select * from ${table}`)).rows;
  const backupFile=path.join(directory,`before-sync-${Date.now()}.json`);fs.writeFileSync(backupFile,JSON.stringify(backup),{mode:0o600});
  await c.query('begin');
  try{
    await c.query('select pg_advisory_xact_lock(182026)');
    for(const [tipo,list]of [['driver',dati.piloti],['team',dati.scuderie]]){
      const source=list.map(v=>({slug:v.slug,...v.classifica2026}));
      await c.query(`insert into catalog.${tipo}_standing_snapshot(season,${tipo}_id,position,points,wins,source_version) select 2026,e.id,x.posizione,x.punti,x.vittorie,'v2026.17.0' from jsonb_to_recordset($1::jsonb) as x(slug text,posizione integer,punti numeric,vittorie integer) join catalog.${tipo} e on e.slug=x.slug on conflict(season,${tipo}_id) do update set position=excluded.position,points=excluded.points,wins=excluded.wins,source_version=excluded.source_version`,[JSON.stringify(source)]);
    }
    await c.query(`update catalog.driver d set current_team_id=t.id,name=x.nome,code=x.codice,car_number=x.numero,nationality=x.nazionalita,updated_at=now() from jsonb_to_recordset($1::jsonb) as x(slug text,"scuderiaSlug" text,nome text,codice text,numero text,nazionalita text) join catalog.team t on t.slug=x."scuderiaSlug" where d.slug=x.slug`,[JSON.stringify(dati.piloti)]);
    const entries=dati.analisiGare.map(a=>({driver:a.pilotaSlug,gp:a.garaSlug,team:a.scuderiaSlug}));
    await c.query(`insert into catalog.entry(grand_prix_id,driver_id,team_id) select g.id,d.id,t.id from jsonb_to_recordset($1::jsonb) as x(driver text,gp text,team text) join catalog.grand_prix g on g.slug=x.gp join catalog.driver d on d.slug=x.driver join catalog.team t on t.slug=x.team on conflict(grand_prix_id,driver_id) do update set team_id=excluded.team_id`,[JSON.stringify(entries)]);
    await c.query(`update editorial.driver_analysis a set team_id=e.team_id,updated_at=now() from catalog.entry e where e.grand_prix_id=a.grand_prix_id and e.driver_id=a.driver_id and a.team_id<>e.team_id`);
    const gare=dati.gare.map(g=>({slug:g.slug,stato:g.stato||'futura',round:g.ordineCalendario}));
    await c.query(`update catalog.grand_prix g set state=x.stato,calendar_order=x.round,updated_at=now() from jsonb_to_recordset($1::jsonb) as x(slug text,stato text,round integer) where g.slug=x.slug`,[JSON.stringify(gare)]);
    const sources=JSON.stringify(modificati);
    const changed=await c.query(`insert into editorial.source_document(collection_name,mongo_id,payload) select collection_name,mongo_id,payload from jsonb_to_recordset($1::jsonb) as x(collection_name text,mongo_id char(24),payload jsonb) on conflict(collection_name,mongo_id) do update set payload=excluded.payload,imported_at=now()`,[sources]);
    if(changed.rowCount!==modificati.length)throw new Error('Importazione incompleta');
    for(const tipo of ['driver','team']){
      const values=JSON.stringify(score.filter(r=>r.tipo===tipo));
      const changed=await c.query(`insert into ratings.${tipo}_score(${tipo}_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release) select e.id,g.id,d.id,'risultati-semantici-v1',x.score,x.sample_size,null,'v2026.17.0' from jsonb_to_recordset($1::jsonb) as x(slug text,gp text,metrica text,score numeric,sample_size integer) join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gp join ratings.dimension d on d.slug=x.metrica on conflict(${tipo}_id,grand_prix_id,dimension_id,model_version) do update set score=excluded.score,sample_size=excluded.sample_size,confidence=null,source_release=excluded.source_release,calculated_at=now()`,[values]);
      if(changed.rowCount!==score.filter(r=>r.tipo===tipo).length)throw new Error('Punteggi incompleti');
      await c.query(`insert into ratings.${tipo}_score_source(score_id,url) select s.id,u.url from jsonb_to_recordset($1::jsonb) as x(slug text,gp text,metrica text,fonti jsonb) join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gp join ratings.dimension d on d.slug=x.metrica join ratings.${tipo}_score s on s.${tipo}_id=e.id and s.grand_prix_id=g.id and s.dimension_id=d.id and s.model_version='risultati-semantici-v1' cross join lateral jsonb_array_elements_text(x.fonti) u(url) on conflict do nothing`,[values]);
    }
    // Verifica il payload effettivamente salvato, prima del commit.
    const check=await c.query(`select count(*)::int as n from editorial.source_document s join jsonb_to_recordset($1::jsonb) as x(collection_name text,mongo_id char(24),payload jsonb) using(collection_name,mongo_id) where s.payload=x.payload`,[sources]);
    if(check.rows[0].n!==modificati.length)throw new Error('Confronto post importazione fallito');
    await c.query('commit');console.log(JSON.stringify({...plan,stato:'completato',backup:backupFile}));
  }catch(e){await c.query('rollback');throw e;}
 }finally{await c.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
