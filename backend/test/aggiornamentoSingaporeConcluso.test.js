const assert=require('node:assert/strict');
const test=require('node:test');
const mongoose=require('mongoose');
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const {applicaAggiornamentoSingapore,RELEASE}=require('../services/aggiornamentoSingaporeConcluso');
const {documentoAnalisi}=require('../utils/documentiMigrazione');
const {creaDatiEffettivi}=require('../utils/datiEffettivi');
test('migrazione post-Singapore atomica, backup recuperabile e riavvio senza sovrascrittura', {timeout:120000}, async()=>{
 const repl=await MongoMemoryReplSet.create({replSet:{count:1}});
 try{
  await mongoose.connect(repl.getUri(),{dbName:'test_post_singapore'});
  const models=Object.fromEntries(['Pilota','Scuderia','Gara','AnalisiGara','AnalisiScuderia','MetodoPrevisionale'].map(n=>[n,require('../models/'+n)]));
  const d=creaDatiEffettivi(require('../data/dati-iniziali.json'));
  const teams=await models.Scuderia.insertMany(d.scuderie),tm=new Map(teams.map(s=>[s.slug,s]));
  const drivers=await models.Pilota.insertMany(d.piloti.map(p=>({...p,scuderia:tm.get(p.scuderiaSlug)._id}))),pm=new Map(drivers.map(p=>[p.slug,p]));
  const races=await models.Gara.insertMany(d.gare.map(g=>({...g,stato:g.slug==='singapore-marina-bay'?'attuale':g.slug==='usa-austin'?'futura':g.stato}))),gm=new Map(races.map(g=>[g.slug,g]));
  const refs={piloti:pm,scuderie:tm,gare:gm};
  await models.AnalisiGara.insertMany(d.analisiGare.map(a=>documentoAnalisi(a,refs,false)));
  await models.AnalisiScuderia.insertMany(d.analisiScuderie.map(a=>documentoAnalisi(a,refs,true)));
  for(const filename of ['backtest-semantico-2026-10-05.json','calibrazione-pesi-2026-10-05.json','valutazione-forma-recente-2026-10-05.json']){const r=require('../data/'+filename);await models.MetodoPrevisionale.create({versione:r.versione,stato:r.versione==='risultati-semantici-v1'?'sperimentale_non_promosso':r.stato,pesi:r.pesi,protocollo:r.protocollo,backtest:r,fonti:[r.fonte]});}
  const oldPoints=pm.get('russell').classifica2026.punti-2;
  await models.Pilota.updateOne({slug:'russell'},{$set:{'classifica2026.punti':oldPoints}});
  const bulkWriteGara=models.Gara.bulkWrite;
  models.Gara.bulkWrite=async()=>{throw Error('Errore simulato durante la transazione');};
  try { await assert.rejects(applicaAggiornamentoSingapore(), /Errore simulato/); }
  finally { models.Gara.bulkWrite=bulkWriteGara; }
  assert.equal((await models.Pilota.findOne({slug:'russell'})).classifica2026.punti,oldPoints);
  assert.equal((await models.Gara.findOne({stato:'attuale'})).slug,'singapore-marina-bay');
  assert.equal(await mongoose.connection.db.collection('backup_rilasci_dati').countDocuments(),0);
  assert.equal(await mongoose.connection.db.collection('rilasci_dati').countDocuments(),0);
  const result=await applicaAggiornamentoSingapore();assert.equal(result.differenze,0);
  assert.equal((await models.Gara.findOne({stato:'attuale'})).slug,'usa-austin');
  assert.equal((await models.Gara.findOne({slug:'singapore-marina-bay'})).stato,'conclusa');
  const backup=await mongoose.connection.db.collection('backup_rilasci_dati').findOne({rilascio:RELEASE,collezione:models.Pilota.collection.name});
  assert.equal(backup.documento.classifica2026.punti,oldPoints);
  assert.equal((await mongoose.connection.db.collection('rilasci_dati').findOne({_id:RELEASE})).differenze,0);
  await models.Pilota.updateOne({slug:'russell'},{$set:{'classifica2026.punti':999}});
  assert.equal((await applicaAggiornamentoSingapore()).stato,'gia_applicato');
  assert.equal((await models.Pilota.findOne({slug:'russell'})).classifica2026.punti,999);
 }finally{await mongoose.disconnect();await repl.stop();}
});
