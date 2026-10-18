const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const{PGlite}=require('@electric-sql/pglite');
test('schema Supabase canonico: API numerica, relazioni e privilegi privati',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;');
  for(const f of fs.readdirSync(path.join(__dirname,'../../supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(path.join(__dirname,'../../supabase/migrations',f),'utf8'));
  await db.exec(`insert into catalog.team(slug,name,standings_name,abbreviation,colour,nationality) values('ferrari','Ferrari','Ferrari','FER','#FF0000','Italiana');
   insert into catalog.driver(slug,current_team_id,name,code,car_number,nationality,nationality_iso2,nationality_iso3) values('leclerc',1,'Charles Leclerc','LEC','16','Monegasca','MC','MCO');
   insert into catalog.circuit(slug,name) values('austin','Austin');
   insert into catalog.grand_prix(slug,circuit_id,name,circuit_name,country_name,season,analysis_order,calendar_order,state) values('usa-austin',1,'USA','Austin','USA',2026,7,18,'attuale');
   insert into catalog.entry values(1,1,1);
   insert into catalog.driver_standing_snapshot values(2026,1,5,215,0,'test');
   insert into catalog.team_standing_snapshot values(2026,1,2,400,2,'test');
   insert into ratings.driver_score(driver_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release) select 1,1,id,'risultati-semantici-v1',24,2,null,'test' from ratings.dimension where slug='tyre_management';
   insert into ratings.driver_score_source(score_id,url) values(1,'https://openf1.org/docs/');`);
  const rows=[['scuderie',{_id:'000000000000000000000001',slug:'ferrari',nome:'vecchio'}],['piloti',{_id:'000000000000000000000002',slug:'leclerc',scuderia:'000000000000000000000001',nome:'vecchio'}],['gare',{_id:'000000000000000000000003',slug:'usa-austin'}],['analisiGare',{_id:'000000000000000000000004',pilota:'000000000000000000000002',gara:'000000000000000000000003',scuderia:'000000000000000000000001'}],['analisiScuderie',{_id:'000000000000000000000005',gara:'000000000000000000000003',scuderia:'000000000000000000000001'}]];
  for(const[n,p]of rows)await db.query('insert into editorial.source_document(collection_name,mongo_id,payload) values($1,$2,$3)',[n,p._id,JSON.stringify(p)]);
  const{leggiCatalogo}=require('../relational/letturaCatalogo');
  const scores=await leggiCatalogo('f1_valutazioni',{'f1_analisi.pilota_slug':'eq.leclerc',metrica:'eq.gestioneGomme',anno:'eq.2026'},db);
  assert.equal(scores.length,1);assert.equal(scores[0].valore,24);assert.equal(scores[0].f1_valutazioni_fonti[0].fonte_url,'https://openf1.org/docs/');
  assert.equal((await leggiCatalogo('f1_piloti',{},db))[0].f1_iscrizioni[0].scuderia_slug,'ferrari');
  await db.exec('update ratings.driver_score set score=null');
  assert.equal((await leggiCatalogo('f1_valutazioni',{},db))[0].valore,null);
  await assert.rejects(db.exec('update ratings.driver_score set score=101'));
  await db.exec('update ratings.driver_score set score=24');
  await db.exec('set role anon');await assert.rejects(db.query('select * from catalog.driver'));await assert.rejects(db.query('select * from editorial.source_document'));await db.exec('reset role');
 }finally{await db.close();}
});
