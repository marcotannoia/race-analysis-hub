// Migrazione di rilascio autorizzata: Singapore concluso -> Austin.
// Nessuna cancellazione. Backup per documento e marcatore nella stessa transazione.
const mongoose = require('mongoose');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { creaDatiEffettivi } = require('../utils/datiEffettivi');
const { canon, documentoAnalisi } = require('../utils/documentiMigrazione');
const RELEASE = 'post-singapore-2026-10-12';
const models = Object.fromEntries(['Pilota','Scuderia','Gara','AnalisiGara','AnalisiScuderia','MetodoPrevisionale'].map(n=>[n,require(`../models/${n}`)]));
const uguali = (a,b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
async function preparaPiano(dati, letti) {
  const refs={piloti:new Map(letti.Pilota.map(p=>[p.slug,p])),scuderie:new Map(letti.Scuderia.map(s=>[s.slug,s])),gare:new Map(letti.Gara.map(g=>[g.slug,g]))};
  const lookup=(key,field)=>new Map(letti[key].map(a=>[`${String(a.gara)}|${String(a[field])}`,a]));
  const drivers=lookup('AnalisiGara','pilota'),teams=lookup('AnalisiScuderia','scuderia');
  const piano=[],attesi=[];
  async function aggiungi(nome,chiave,prima,fields) {
    if(!prima)throw Error(`Documento assente: ${nome}/${chiave}`);
    const m=new models[nome]({...prima,...fields});await m.validate();const cast=m.toObject();
    const expected=Object.fromEntries(Object.keys(fields).map(k=>[k,cast[k]]));
    const set=Object.fromEntries(Object.entries(expected).filter(([k,v])=>!uguali(prima[k],v)));
    attesi.push({nome,id:prima._id,fields:expected});
    if(Object.keys(set).length)piano.push({nome,chiave,prima,set});
  }
  for(const s of dati.scuderie)await aggiungi('Scuderia',s.slug,refs.scuderie.get(s.slug),s);
  for(const p of dati.piloti){const {scuderiaSlug,...fields}=p;await aggiungi('Pilota',p.slug,refs.piloti.get(p.slug),{...fields,scuderia:refs.scuderie.get(scuderiaSlug)._id});}
  for(const g of dati.gare)await aggiungi('Gara',g.slug,refs.gare.get(g.slug),g);
  for(const a of dati.analisiGare){const key=`${refs.gare.get(a.garaSlug)._id}|${refs.piloti.get(a.pilotaSlug)._id}`;await aggiungi('AnalisiGara',`${a.garaSlug}/${a.pilotaSlug}`,drivers.get(key),documentoAnalisi(a,refs,false));}
  for(const a of dati.analisiScuderie){const key=`${refs.gare.get(a.garaSlug)._id}|${refs.scuderie.get(a.scuderiaSlug)._id}`;await aggiungi('AnalisiScuderia',`${a.garaSlug}/${a.scuderiaSlug}`,teams.get(key),documentoAnalisi(a,refs,true));}
  for(const [filename,stato] of [['backtest-semantico-2026-10-05.json','sperimentale_non_promosso'],['calibrazione-pesi-2026-10-05.json',null],['valutazione-forma-recente-2026-10-05.json',null]]){
    const r=require('../data/'+filename);const fields={versione:r.versione,stato:stato||r.stato,pesi:r.pesi,protocollo:r.protocollo,backtest:r,fonti:[r.fonte]};
    await aggiungi('MetodoPrevisionale',r.versione,letti.MetodoPrevisionale.find(m=>m.versione===r.versione),fields);
  }
  return {piano,attesi};
}
async function verificaAttesi(attesi,session) {
  const errors=[];
  for(const nome of Object.keys(models)){
    const docs=new Map((await models[nome].find().session(session).lean()).map(d=>[String(d._id),d]));
    for(const a of attesi.filter(a=>a.nome===nome))for(const [k,v]of Object.entries(a.fields))if(!uguali(docs.get(String(a.id))?.[k],v))errors.push(`${nome}/${a.id}/${k}`);
  }
  if(errors.length)throw Error(`Verifica migrazione: ${errors.length} differenze`);
}
async function applicaAggiornamentoSingapore(){
  const db=mongoose.connection.db,markers=db.collection('rilasci_dati'),backups=db.collection('backup_rilasci_dati');
  if(await markers.findOne({_id:RELEASE}))return {stato:'gia_applicato'};
  const dati=creaDatiEffettivi(require('../data/dati-iniziali.json'));
  if(dati.metadati.f1db.versione!=='v2026.17.0'||dati.gare.find(g=>g.stato==='attuale')?.slug!=='usa-austin')throw Error('Sorgente migrazione non conforme');
  const archive=path.join(__dirname,'../data/archivio-gp/2026-06-singapore-marina-bay.json');
  const hash=createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  const letti={};for(const [n,m]of Object.entries(models))letti[n]=await m.find().lean();
  const corrente=letti.Gara.filter(g=>g.stato==='attuale');
  if(corrente.length!==1||!['singapore-marina-bay','usa-austin'].includes(corrente[0].slug))throw Error('GP Atlas inatteso: migrazione fermata');
  for(const [n,size]of Object.entries({Pilota:23,Scuderia:11,Gara:12,AnalisiGara:264,AnalisiScuderia:132}))if(letti[n].length!==size)throw Error(`Copertura Atlas inattesa: ${n}`);
  const {piano,attesi}=await preparaPiano(dati,letti);
  // Crea le collezioni fuori dalla transazione, senza toccare dati esistenti.
  for(const c of ['rilasci_dati','backup_rilasci_dati'])try{await db.createCollection(c)}catch(e){if(e.code!==48)throw e;}
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
    if(await markers.findOne({_id:RELEASE},{session}))return;
    if(piano.length)await backups.insertMany(piano.map(x=>({_id:`${RELEASE}/${x.nome}/${x.prima._id}`,rilascio:RELEASE,collezione:models[x.nome].collection.name,documento:x.prima,salvatoIl:new Date()})),{session});
    for(const nome of Object.keys(models)){
      const items=piano.filter(x=>x.nome===nome);if(!items.length)continue;
      const result=await models[nome].bulkWrite(items.map(x=>({updateOne:{filter:{_id:x.prima._id,updatedAt:x.prima.updatedAt??{$exists:false}},update:{$set:x.set}}})),{session});
      if(result.matchedCount!==items.length)throw Error(`Modifica concorrente: ${nome}`);
    }
    await verificaAttesi(attesi,session);
    const differenze = await require('../scripts/verificaDatabase').verificaCorrispondenzaSorgente(session,dati);
    if (differenze.length) throw Error(`JSON-Atlas: ${differenze.length} differenze; transazione annullata`);
    await markers.insertOne({_id:RELEASE,completatoIl:new Date(),archivioSha256:hash,documenti:piano.length,differenze:0,backupCollezione:'backup_rilasci_dati'},{session});
  });}finally{await session.endSession();}
  console.log(`Aggiornamento ${RELEASE}: ${piano.length} documenti, backup conservato, 0 differenze.`);
  return {stato:'applicato',documenti:piano.length,differenze:0};
}
module.exports={applicaAggiornamentoSingapore,preparaPiano,RELEASE};
