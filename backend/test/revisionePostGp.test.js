const test=require('node:test'),assert=require('node:assert/strict');
const {creaRevisione,similarita,aggiornaPasso}=require('../services/revisionePostGp');
const campioni=require('../data/campioni-previsionali-2026.json'),evidenze=require('../data/evidenze-giri-2023-2026.json');
const gare=require('../data/dati-iniziali.json').gare;
test('la revisione esclude esiti futuri e non confonde osservazioni con eventi',()=>{
 const cc=structuredClone(campioni),gg=structuredClone(gare);
 for(const g of gg)g.stato=g.ordineCalendario<=cc.ultimoRoundIncluso?'conclusa':'futura';
 const base=creaRevisione({campioni:cc,evidenze,gare:gg,adesso:new Date('2026-10-26')});
 cc.risultati.push({...cc.risultati[0],year:2026,round:30,raceId:-1,positionNumber:1});
 const changed=creaRevisione({campioni:cc,evidenze,gare:gg,adesso:new Date('2026-10-26')});
 assert.deepEqual(changed,base);
 for(const g of base.prossimiGp){
   assert.ok(g.circuitiSimili.every(s=>s.round<g.round&&s.round<=base.ultimoRound));
   for(const p of g.scuderie)assert.ok(p.gare<=p.osservazioni);
 }
 assert.match(base.verificaModello.tipo,/non_previsione_archiviata/);
});
test('la similarità tecnica è neutra per profili identici',()=>{
 const p=require('../data/circuiti-tecnici-2026.json').circuiti['usa-austin'].richieste;
 assert.equal(similarita(p,p),100);
});
test('la review conserva il cutoff storico anche aggiungendo giri futuri',()=>{
 const base={overallSemantici:{campi:{}},traduzioni:{it:{passoGara:'2025: storico verificato'}}};
 const gara={ordineCalendario:16},entita={slug:'leclerc'};
 const a=aggiornaPasso(structuredClone(base),gara,campioni,evidenze,entita,false);
 const ee=structuredClone(evidenze);ee.sessioni.push({...ee.sessioni.at(-1),round:30});
 const b=aggiornaPasso(structuredClone(base),gara,campioni,ee,entita,false);
 assert.deepEqual(a,b);assert.equal(a.traduzioni.it.passoGara['2025'],'storico verificato');
 for(const lang of ['it','en','fr','pt','es','de'])assert.ok(a.traduzioni[lang].passoGara['2026'].length>100);
});
test('una scrittura incompleta della review esegue rollback e conserva un backup decodificabile',async()=>{
 const {salvaRevisione}=require('../services/salvaRevisionePostGp');
 const calls=[];let backup;
 const client={query:async(sql,args)=>{
   calls.push(sql);
   if(sql.includes('max(imported_at)'))return {rows:[{value:'fonte'}]};
   if(sql.includes('for update'))return {rows:[{grand_prix_id:1,versione:'v1'}]};
   if(sql.includes("'{reviewBackup}'"))backup=JSON.parse(args[1]);
   if(sql.startsWith('update editorial.source_document'))return {rowCount:0};
   return {rows:[]};
 }};
 const documenti=[{collection_name:'analisiGare',mongo_id:'a',payload:{verificato:true}}];
 await assert.rejects(salvaRevisione(client,{modifiche:documenti},{sourceMark:'fonte',documenti,versioneAudit:'v1',dryRun:false}),/Copertura/);
 assert.equal(calls.at(-1),'rollback');assert.ok(!calls.includes('commit'));
 const decoded=JSON.parse(require('node:zlib').gunzipSync(Buffer.from(backup.data,'base64')));
 assert.deepEqual(decoded.documenti,documenti);
});
