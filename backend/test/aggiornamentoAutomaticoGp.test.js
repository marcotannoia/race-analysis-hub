const test=require('node:test');
const assert=require('node:assert/strict');
const {zipSync,strToU8}=require('fflate');
const {giornataTerminata,righeSessione,snake,preparaPostGp}=require('../services/preparaPostGp');
const {estraiClassifica,confrontaClassifica,leggiArchivio,scarica}=require('../services/fontiPostGp');
const {decisioneRiportabile,sincronizzaPenalitaFia}=require('../services/penalitaFia');

test('il cambio GP attende fine giornata locale: Austin domenica e Las Vegas sabato',()=>{
  const austin={date:'2026-10-25',time:'20:00'};
  assert.equal(giornataTerminata(austin,'usa-austin',new Date('2026-10-26T04:59:00Z')),false);
  assert.equal(giornataTerminata(austin,'usa-austin',new Date('2026-10-26T05:00:00Z')),true);
  const vegas={date:'2026-11-22',time:'04:00'};
  assert.equal(giornataTerminata(vegas,'usa-las-vegas',new Date('2026-11-22T07:59:00Z')),false);
  assert.equal(giornataTerminata(vegas,'usa-las-vegas',new Date('2026-11-22T08:00:00Z')),true);
  assert.equal(giornataTerminata(austin,'non-configurato',new Date('2026-12-01')),false);
  assert.equal(giornataTerminata({date:'2026-10-25'},'usa-austin',new Date('2026-12-01')),false);
});

test('la classifica finale FIA viene letta per colonne, escludendo copertina e fastest lap',()=>{
  const fixture=require('./fixtures/classifica-fia-singapore-2026.json');
  const r=estraiClassifica(fixture.pagine);
  assert.equal(r.length,22);
  assert.deepEqual(r[0],{numero:3,posizione:1,punti:25});
  assert.deepEqual(r.find(r=>r.numero===16),{numero:16,posizione:2,punti:18});
  assert.equal(r.find(r=>r.numero===43).posizione,null);
  const f1db=r.map(u=>({driverNumber:String(u.numero),positionNumber:u.posizione,points:u.punti,positionText:u.posizione?String(u.posizione):'DNF'}));
  assert.doesNotThrow(()=>confrontaClassifica(r,f1db));
  assert.throws(()=>confrontaClassifica(r,f1db.slice(1)),/Copertura/);
  assert.throws(()=>confrontaClassifica(r,f1db.map((r,i)=>i? r:{...r,points:18})),/non allineata/);
  assert.throws(()=>estraiClassifica([{elementi:[]}]),/incompleta/);
});

test('le righe F1DB mantengono tempi, punti, null e identificativi relazionali',()=>{
  assert.equal(snake('freePractice1Date'),'free_practice_1_date');
  assert.equal(snake('total1And2Finishes'),'total_1_and_2_finishes');
  assert.equal(snake('q1Millis'),'q1_millis');
  const [r]=righeSessione([{raceId:1170,year:2026,round:21,driverId:'test',constructorId:'team',positionDisplayOrder:1,
    positionNumber:1,timeMillis:12345,points:25,sharedCar:false,reasonRetired:null}],'RACE_RESULT','race');
  assert.equal(r.race_id,1170);assert.equal(r.driver_id,'test');assert.equal(r.race_time_millis,12345);
  assert.equal(r.race_points,25);assert.equal(r.race_shared_car,false);assert.equal(r.race_reason_retired,null);
  assert.equal(r.year,undefined);assert.equal(r.type,'RACE_RESULT');
});

test('l’archivio F1DB è letto senza estrarre percorsi sul filesystem e senza stagioni future',()=>{
  const z=zipSync({'f1db-races.json':strToU8(JSON.stringify([{year:2023},{year:2026},{year:2027}]))});
  const f=leggiArchivio(z,2026);
  assert.deepEqual(f.carica('f1db-races.json'),[{year:2023},{year:2026}]);
  assert.throws(()=>f.carica('assente.json'),/assente/);
});

test('una penalità precedente passa al prossimo GP solo se esplicita e pubblicata dopo la gara',()=>{
  const docs=[{titolo:'Doc 80 - Provisional Race Classification',pubblicatoIl:new Date('2026-10-25T22:00:00Z')}];
  const prima={pubblicatoIl:new Date('2026-10-24T12:00:00Z')};
  const dopo={pubblicatoIl:new Date('2026-10-25T23:00:00Z')};
  assert.equal(decisioneRiportabile(prima,docs,'Drop of 5 grid positions for the next Race'),false);
  assert.equal(decisioneRiportabile(dopo,docs,'Drop of 5 grid positions for the next Race'),true);
  assert.equal(decisioneRiportabile(dopo,docs,'Drop of 5 grid positions for the next Sprint Race'),false);
  assert.equal(decisioneRiportabile(dopo,docs,'Five second time penalty'),false);
  assert.equal(decisioneRiportabile(dopo,[],'next Race'),false);
});

test('il monitor rileva una decisione modificata allo stesso URL senza duplicare penalità',async()=>{
 let valore=10,salvato=null;
 const opzioni={adesso:new Date('2026-10-10T12:00:00Z'),gara:{slug:'singapore-marina-bay'},
   archivio:{findOne:()=>({lean:async()=>salvato}),findOneAndUpdate:async(_f,a)=>{salvato=a.$set;}},svuotaCache:()=>{},
   scaricaDocumento:async url=>Buffer.from(url.endsWith('.pdf')?'pdf-'+valore:'<div class="event-title">Singapore Grand Prix</div><li class="document-row"><a href="/system/files/test.pdf"><div class="title">Doc 17 - Decision - Car 41 - Grid</div></a></li>'),
   estraiPagine:async()=>[{elementi:[{testo:`No / Driver 41 - Driver Decision Drop of ${valore} grid positions for the next Race. Reason Breach.`}]}]};
 await sincronizzaPenalitaFia(opzioni);assert.equal(salvato.penalitaGriglia[0].posizioni,10);
 valore=5;await sincronizzaPenalitaFia(opzioni);
 assert.equal(salvato.penalitaGriglia.length,1);assert.equal(salvato.penalitaGriglia[0].posizioni,5);
});

test('due istanze non eseguono contemporaneamente il passaggio GP e rilasciano la connessione',async()=>{
 let rilasciata=false;
 const client={query:async sql=>{assert.match(sql,/pg_try_advisory_lock/);return {rows:[{locked:false}]};},release:()=>{rilasciata=true;}};
 const r=await require('../services/aggiornamentoAutomaticoGp').controllaAggiornamentoGp({pool:{connect:async()=>client},dryRun:true});
 assert.equal(r.stato,'altro_controllo_in_corso');assert.equal(rilasciata,true);
});

test('risultati anticipati o qualifiche incomplete non fanno avanzare il calendario',()=>{
 const gara={_id:'gp',slug:'usa-austin',stato:'attuale',stagione:2026,ordineCalendario:18};
 const raw={raceId:1167,year:2026,round:18,driverId:'driver'};
 const fonte={carica:n=>n==='f1db-races.json'?[{id:1167,year:2026,round:18,date:'2026-10-25',time:'20:00'}]:n==='f1db-races-race-results.json'?[raw]:[]};
 const documenti=[{collection_name:'gare',payload:gara}];
 assert.throws(()=>preparaPostGp({fonte,documenti,adesso:new Date('2026-10-25T23:00:00Z')}),/fine della giornata/);
 assert.throws(()=>preparaPostGp({fonte,documenti,adesso:new Date('2026-10-26T06:00:00Z')}),/incompleti/);
});

test('un errore temporaneo della fonte viene ritentato senza seguire domini estranei',async()=>{
 let chiamate=0,attese=0;
 const body=()=>new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('ok'));c.close();}});
 const fetchImpl=async url=>({ok:++chiamate>1,status:chiamate===1?500:200,url,headers:new Headers(),body:body()});
 const b=await scarica('https://api.github.com/repos/f1db/f1db/releases/latest',100,{fetchImpl,attendi:async()=>{attese++;}});
 assert.equal(b.toString(),'ok');assert.equal(chiamate,2);assert.equal(attese,1);
 await assert.rejects(scarica('https://example.com/documento'),/non consentita/);
});

test('i punti null di F1DB e i decimali PostgreSQL non generano false rettifiche',()=>{
 const {firmaRisultati}=require('../services/aggiornamentoAutomaticoGp');
 const json=[{driverNumber:'16',constructorId:'ferrari',positionNumber:12,positionText:'12',points:null,reasonRetired:null}];
 const sql=[{driver_number:'16',constructor_id:'ferrari',position_number:12,position_text:'12',race_points:null,race_reason_retired:null}];
 assert.equal(firmaRisultati(json),firmaRisultati(sql));
 assert.notEqual(firmaRisultati(json),firmaRisultati([{...sql[0],race_points:'1.00'}]));
});
