// Partecipazione verificata limitata al Messico; nessuna iscrizione futura dedotta.
const path=require('node:path'),fs=require('node:fs'),{randomBytes}=require('node:crypto');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
process.env.DATA_PROVIDER='postgres';
const db=require('../config/database'),fonti=require('../services/fontiPostGp');
async function main(){
 await db();const c=await db.getPool().connect();
 try{
  const fonte=await fonti.acquisisciRelease(await fonti.ultimaRelease(),2026);
  const rs=fonte.carica('f1db-races-race-results.json').filter(r=>r.year===2026&&r.round===19);
  const risultato=rs.find(r=>r.driverId==='ryo-hirakawa'&&r.constructorId==='haas'&&String(r.driverNumber)==='50');
  if(!risultato)throw new Error('Partecipazione Hirakawa non confermata');
  const prova=await fonti.verificaFinale('messico-citta-del-messico',rs);
  const driver=fonte.carica('f1db-drivers.json').find(d=>d.id==='ryo-hirakawa');
  const standing=fonte.carica('f1db-seasons-driver-standings.json').find(r=>r.year===2026&&r.driverId===driver.id);
  if(!standing?.positionNumber)throw new Error('Classifica stagionale assente');
  await c.query('begin');await c.query('select pg_advisory_xact_lock(182026)');
  if((await c.query("select 1 from catalog.driver where slug='hirakawa'")).rowCount){await c.query('rollback');console.log('Partecipazione già registrata');return;}
  const docs=(await c.query("select collection_name,mongo_id,payload from editorial.source_document where (collection_name='gare' and payload->>'slug'='messico-citta-del-messico') or (collection_name='scuderie' and payload->>'slug'='haas')")).rows;
  const g=docs.find(d=>d.collection_name==='gare').payload,t=docs.find(d=>d.collection_name==='scuderie').payload;
  const id=randomBytes(12).toString('hex'),aid=randomBytes(12).toString('hex');
  const p={_id:id,slug:'hirakawa',nome:driver.name,codice:driver.abbreviation,numero:'50',nazionalita:'Giapponese',nazionalitaIso2:'JP',nazionalitaIso3:'JPN',scuderia:t._id,classifica2026:{posizione:standing.positionNumber,punti:standing.totalPoints,vittorie:standing.totalRaceWins},overallSemantici:{campi:{}},traduzioni:Object.fromEntries(Object.entries({it:'Giapponese',en:'Japanese',fr:'Japonaise',de:'Japanisch',es:'Japonesa',pt:'Japonesa'}).map(([l,n])=>[l,{nazionalita:n}]))};
  const a={_id:aid,pilota:id,scuderia:t._id,gara:g._id,posizioniStoriche:{},spiegazionePosizioni:{},qualificheStoriche:{},andamentoPerAnno:{},passoGara:{},gomme:{},considerazioni:'',penalita:'',affidabilita:'',aggiornamentiInArrivo:'',vantaggioAggiornamentiTecnici:null,statoAggiornamentiTecnici:'',overallSemantici:{campi:{}},traduzioni:Object.fromEntries(['it','en','fr','de','es','pt'].map(l=>[l,{}])),storicoEdizioni:[],fonti:[prova.url,'https://www.haasf1team.com/news/team-statement-driver-update']};
  const d=(await c.query(`insert into catalog.driver(slug,f1db_driver_id,name,code,car_number,nationality,nationality_iso2,nationality_iso3) values('hirakawa',$1,$2,$3,'50','Giapponese','JP','JPN') returning id`,[driver.id,driver.name,driver.abbreviation])).rows[0];
  await c.query(`insert into catalog.entry(grand_prix_id,driver_id,team_id) select g.id,$1,t.id from catalog.grand_prix g,catalog.team t where g.slug=$2 and t.slug='haas'`,[d.id,g.slug]);
  await c.query(`insert into editorial.driver_analysis(grand_prix_id,driver_id,team_id) select grand_prix_id,driver_id,team_id from catalog.entry where driver_id=$1`,[d.id]);
  for(const [collection,payload] of [['piloti',p],['analisiGare',a]])await c.query('insert into editorial.source_document(collection_name,mongo_id,payload) values($1,$2,$3)',[collection,payload._id,JSON.stringify(payload)]);
  fs.mkdirSync(path.join(__dirname,'../../output/post-gp'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'../../output/post-gp/partecipazione-hirakawa.json'),JSON.stringify({fonte:fonte.versione,prova,documenti:[p,a],dryRun:!process.argv.includes('--apply')},null,2));
  await c.query(process.argv.includes('--apply')?'commit':'rollback');console.log(JSON.stringify({pilota:p.slug,gara:g.slug,prova:prova.url,dryRun:!process.argv.includes('--apply')}));
 }catch(e){await c.query('rollback');throw e;}finally{c.release();await db.chiudiDatabase();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
