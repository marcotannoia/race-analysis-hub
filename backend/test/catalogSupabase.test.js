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
  assert.equal((await leggiCatalogo('f1_circuiti',{},db))[0].slug,'austin');
  assert.deepEqual(await leggiCatalogo('f1_iscrizioni',{pilota:'eq.leclerc',gara:'eq.usa-austin'},db),
    [{anno:2026,gara_slug:'usa-austin',pilota_slug:'leclerc',scuderia_slug:'ferrari'}]);
  assert.deepEqual(await leggiCatalogo('f1_iscrizioni',{scuderia:'eq.assente'},db),[]);
  await db.exec('update ratings.driver_score set score=null');
  assert.equal((await leggiCatalogo('f1_valutazioni',{},db))[0].valore,null);
  await assert.rejects(db.exec('update ratings.driver_score set score=101'));
  await db.exec('update ratings.driver_score set score=24');
  const config=require('../config/database');const originale=config.getPool;
  config.getPool=()=>({query:(...a)=>db.query(...a),connect:async()=>({query:(sql,...args)=>/^(begin|commit|rollback)$/.test(sql)?Promise.resolve({rows:[]}):db.query(sql,...args),release:()=>{}})});
  await db.exec('insert into editorial.driver_analysis(grand_prix_id,driver_id,team_id) values(1,1,1)');
  const documento={documentoUrl:'https://www.fia.com/system/files/componenti.pdf',sha256:'a'.repeat(64),acquisitoIl:'2026-10-23T12:00:00Z',
    scuderie:Array.from({length:11},(_,i)=>({slug:i?'team-'+i:'ferrari',nessunAggiornamento:false,componenti:['Floor']}))};
  const poolTecnico={connect:async()=>({query:(...args)=>db.query(...args),release:()=>{}})};
  const {aggiornaAnalisiTecniche}=require('../services/aggiornaAnalisiTecniche');
  await aggiornaAnalisiTecniche('usa-austin',documento,{pool:poolTecnico});
  const tecnico=(await db.query("select payload from editorial.source_document where collection_name='analisiGare'")).rows[0].payload;
  assert.equal(tecnico.aggiornamentiTecniciUfficiali.vantaggioMisurato,null);
  assert.equal(tecnico.statoAggiornamentiTecnici,'confermato');
  await aggiornaAnalisiTecniche('usa-austin',{...documento,ritirato:true},{pool:poolTecnico});
  const ritirato=(await db.query("select payload from editorial.source_document where collection_name='analisiGare'")).rows[0].payload;
  assert.equal(ritirato.aggiornamentiTecniciUfficiali.stato,'ritirato');
  assert.deepEqual(ritirato.aggiornamentiTecniciUfficiali.componenti,[]);
  assert.equal(ritirato.statoAggiornamentiTecnici,'');
  await db.exec(`insert into catalog.grand_prix(slug,circuit_id,name,circuit_name,country_name,season,analysis_order,calendar_order,state)
    values('italia-monza',1,'Italia','Monza','Italia',2026,1,1,'conclusa');
    insert into catalog.entry values(2,1,1);`);
  for(const [n,p] of [
    ['gare',{_id:'000000000000000000000006',slug:'italia-monza'}],
    ['analisiGare',{_id:'000000000000000000000007',gara:'000000000000000000000006',pilota:'000000000000000000000002',scuderia:'000000000000000000000001'}],
  ])await db.query('insert into editorial.source_document(collection_name,mongo_id,payload) values($1,$2,$3)',[n,p._id,JSON.stringify(p)]);
  try {
    const repo=require('../repositories/postgresCompat');
    const storico=await repo.model('AnalisiGara').find({gara:'000000000000000000000006'}).populate('gara').populate('pilota').lean();
    assert.equal(storico.length,1);assert.equal(storico[0].gara.slug,'italia-monza');assert.equal(storico[0].gara.stato,'conclusa');
    assert.equal((await repo.load('AnalisiGara')).length,1);
    assert.equal((await repo.load('AnalisiGara'))[0].gara,'000000000000000000000003');
    const live=repo.model('DatiLiveFia');
    await Promise.all([
      live.findOneAndUpdate({garaSlug:'usa-austin'},{$set:{aggiornamenti:{scuderie:[]}},$setOnInsert:{garaSlug:'usa-austin'}},{upsert:true}),
      live.findOneAndUpdate({garaSlug:'usa-austin'},{$set:{penalitaGriglia:[{numeroVettura:16,posizioni:5}]},$setOnInsert:{garaSlug:'usa-austin'}},{upsert:true}),
    ]);
    const report=(await db.query("select payload from live_fia.report where gara_slug='usa-austin'")).rows[0].payload;
    assert.deepEqual(report.aggiornamenti.scuderie,[]);assert.equal(report.penalitaGriglia[0].posizioni,5);

  }finally{config.getPool=originale;}
  await db.exec('set role anon');await assert.rejects(db.query('select * from catalog.driver'));await assert.rejects(db.query('select * from editorial.source_document'));await assert.rejects(db.query('select * from editorial.automation_state'));await db.exec('reset role');
 }finally{await db.close();}
});
