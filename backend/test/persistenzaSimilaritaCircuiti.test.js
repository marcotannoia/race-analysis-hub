const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {createHash}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const {preparaImportazione,importaInTransazione,leggiCatalogoPostgres}=require('../services/persistenzaSimilaritaCircuiti');
const catalogo=require('../data/similarita-circuiti-2026.json');
const raw=fs.readFileSync(path.join(__dirname,'../data/similarita-circuiti-2026.json'),'utf8');
const digest=createHash('sha256').update(raw).digest('hex');
const piano=preparaImportazione(catalogo,digest);

test('importa 23 profili e 253 confronti, conserva i 506 campi e le fonti, ed è idempotente',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create role anon;create role authenticated;create schema f1db;create schema catalog;create schema ratings;create table f1db.circuit(id varchar(100) primary key);');
  for(const c of Object.values(catalogo.circuiti))await db.query('insert into f1db.circuit(id) values($1)',[c.circuitId]);
  const dir=path.join(__dirname,'../../supabase/migrations');
  const f=fs.readdirSync(dir).find(f=>f.endsWith('_circuit_similarity_profiles.sql'));
  await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
  await db.exec('begin');const primo=await importaInTransazione(db,piano);await db.exec('commit');
  assert.deepEqual(primo,{profili:23,confronti:253,campi:506,dettagliConfronti:5566,modificati:{profili:23,confronti:253}});
  assert.deepEqual(await leggiCatalogoPostgres(db),catalogo);
  const secondo=await importaInTransazione(db,piano);
  assert.deepEqual(secondo.modificati,{profili:0,confronti:0});
  const counts=await db.query(`select (select count(*)::int from catalog.circuit_similarity_profile) profili,(select count(*)::int from ratings.circuit_similarity) confronti`);
  assert.deepEqual(counts.rows[0],{profili:23,confronti:253});
  await assert.rejects(db.query("update catalog.circuit_similarity_profile set downforce_level='altissimo'"));
  await assert.rejects(db.query('update catalog.circuit_similarity_profile set rain_prevalent=null'));
  await assert.rejects(db.query('update ratings.circuit_similarity set circuit_b_id=circuit_a_id'));
  await assert.rejects(db.query('update ratings.circuit_similarity set similarity_percent=101'));
  // La nuova tabella non diventa pubblica; RLS protegge anche dopo un GRANT accidentale.
  await db.exec('set role anon');await assert.rejects(db.query('select * from catalog.circuit_similarity_profile'));await db.exec('reset role');
  await db.exec('grant usage on schema catalog,ratings to anon;grant select on catalog.circuit_similarity_profile,ratings.circuit_similarity to anon;set role anon');
  assert.equal((await db.query('select * from catalog.circuit_similarity_profile')).rows.length,0);
  assert.equal((await db.query('select * from ratings.circuit_similarity')).rows.length,0);
  await db.exec('reset role');
 }finally{await db.close();}
});

test('rifiuta una raccolta incompleta prima di scrivere nel database',()=>{
 const mancante=structuredClone(catalogo);delete mancante.circuiti[Object.keys(mancante.circuiti)[0]].campi.caricoAerodinamico;
 assert.throws(()=>preparaImportazione(mancante,digest),/Schema incompleto/);
 const senzaFonte=structuredClone(catalogo);senzaFonte.circuiti[Object.keys(senzaFonte.circuiti)[0]].campi.numeroCurve.fonti=[];
 assert.throws(()=>preparaImportazione(senzaFonte,digest),/Valori o fonti/);
});
