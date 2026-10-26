const {creaSnapshot,circuitiStorici}=require('../scripts/sincronizzaF1db');
const {descriviCampione,completamento,trend}=require('./overallSemantici');
const {valutazioniNumeriche}=require('./valutazioniNumeriche');
const {MAPPA}=require('../relational/letturaCatalogo');

const FUSI={
  'olanda-zandvoort':'Europe/Amsterdam','italia-monza':'Europe/Rome','spagna-madring':'Europe/Madrid',
  'azerbaigian-baku':'Asia/Baku','bahrein-sepang':'Asia/Kuala_Lumpur','singapore-marina-bay':'Asia/Singapore',
  'usa-austin':'America/Chicago','messico-citta-del-messico':'America/Mexico_City','brasile-interlagos':'America/Sao_Paulo',
  'usa-las-vegas':'America/Los_Angeles','qatar-lusail':'Asia/Qatar','abu-dhabi-yas-marina':'Asia/Dubai',
};
function giornoLocale(data,fuso){
  const parti=new Intl.DateTimeFormat('en-CA',{timeZone:fuso,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(data);
  return ['year','month','day'].map(k=>parti.find(p=>p.type===k).value).join('-');
}
function giornataTerminata(gara,slug,adesso=new Date()){
  if(!gara?.date || !gara?.time || !FUSI[slug])return false;
  const partenza=new Date(`${gara.date}T${gara.time}${gara.time.length===5?':00':''}Z`);
  return Number.isFinite(partenza.getTime()) && adesso-partenza>=4*3600000 &&
    giornoLocale(adesso,FUSI[slug])>giornoLocale(partenza,FUSI[slug]);
}

const snake=s=>s.replace(/([a-z0-9])([A-Z])/g,'$1_$2').replace(/([a-zA-Z])(\d)/g,'$1_$2').toLowerCase().replace(/^q_([123])/,'q$1');
const TIPI={
 'race-results':['RACE_RESULT','race'], 'qualifying-results':['QUALIFYING_RESULT','qualifying'],
 'sprint-race-results':['SPRINT_RACE_RESULT','race'],'sprint-qualifying-results':['SPRINT_QUALIFYING_RESULT','qualifying'],
 'starting-grid-positions':['STARTING_GRID_POSITION','starting_grid_position'],
 'sprint-starting-grid-positions':['SPRINT_STARTING_GRID_POSITION','starting_grid_position'],
 'free-practice-1-results':['FREE_PRACTICE_1_RESULT','practice'],'free-practice-2-results':['FREE_PRACTICE_2_RESULT','practice'],
 'free-practice-3-results':['FREE_PRACTICE_3_RESULT','practice'],'free-practice-4-results':['FREE_PRACTICE_4_RESULT','practice'],
 'pre-qualifying-results':['PRE_QUALIFYING_RESULT','practice'],'qualifying-1-results':['QUALIFYING_1_RESULT','qualifying'],
 'qualifying-2-results':['QUALIFYING_2_RESULT','qualifying'],'warming-up-results':['WARMING_UP_RESULT','practice'],
 'fastest-laps':['FASTEST_LAP','fastest_lap'],'pit-stops':['PIT_STOP','pit_stop'],
 'driver-of-the-day-results':['DRIVER_OF_THE_DAY_RESULT','driver_of_the_day'],
};
const COMUNI=new Set(['raceId','driverId','constructorId','positionDisplayOrder','positionNumber','positionText','driverNumber','engineManufacturerId','tyreManufacturerId']);
function righeSessione(righe,tipo,prefisso){
 return righe.map(r=>Object.fromEntries([['type',tipo],...Object.entries(r).filter(([k])=>!['year','round'].includes(k))
   .map(([k,v])=>[COMUNI.has(k)?snake(k):prefisso+'_'+snake(k),v])]));
}

function preparaPostGp({fonte,documenti,adesso=new Date(),rettifiche=[]}){
 const gruppi=Object.fromEntries(['piloti','scuderie','gare','analisiGare','analisiScuderie'].map(n=>[n,documenti.filter(d=>d.collection_name===n).map(d=>d.payload)]));
 const current=gruppi.gare.find(g=>g.stato==='attuale');
 if(!current || current.stagione!==2026)throw new Error('Calendario automatico non configurato per questa stagione');
 const gare=fonte.carica('f1db-races.json'),gareById=new Map(gare.map(g=>[g.id,g]));
 const raw=fonte.carica('f1db-races-race-results.json');
 const qualifiche=fonte.carica('f1db-races-qualifying-results.json');
 const anno=current.stagione;
 const conclusi=gruppi.gare.filter(g=>g.stagione===anno&&g.ordineCalendario>=current.ordineCalendario)
   .sort((a,b)=>a.ordineCalendario-b.ordineCalendario).filter(g=>{
     const race=gare.find(r=>r.year===anno&&r.round===g.ordineCalendario);
     return giornataTerminata(race,g.slug,adesso)&&raw.some(r=>r.raceId===race.id);
   });
 for(let i=0;i<conclusi.length;i++)if(conclusi[i].ordineCalendario!==current.ordineCalendario+i)throw new Error('Risultati mancanti tra due GP');
 const ultimoRound=conclusi.at(-1)?.ordineCalendario || current.ordineCalendario-1;
 const successiva=gruppi.gare.filter(g=>g.stagione===anno&&g.ordineCalendario>ultimoRound&&g.stato!=='conclusa')
   .sort((a,b)=>a.ordineCalendario-b.ordineCalendario)[0] || null;
 const target=successiva || current;
 if(!conclusi.length && raw.some(r=>r.year===anno&&r.round>=current.ordineCalendario))throw new Error('Attendere la fine della giornata locale della gara');
 const idPiloti=new Map(gruppi.piloti.map(p=>[p.slug,p._id])),idTeam=new Map(gruppi.scuderie.map(t=>[t.slug,t._id]));
 const baseCampioni=require('../data/campioni-previsionali-2026.json');
 const pilotaByF1=new Map(Object.entries(baseCampioni.mappingPiloti).map(([slug,id])=>[id,slug]));
 const teamByF1=new Map(Object.entries(baseCampioni.mappingScuderie).map(([slug,id])=>[id,slug]));
 for(const g of conclusi){
   const race=gare.find(r=>r.year===anno&&r.round===g.ordineCalendario);
   const rs=raw.filter(r=>r.raceId===race.id),qs=qualifiche.filter(r=>r.raceId===race.id);
   if(rs.length<10 || qs.length!==rs.length || new Set(rs.map(r=>r.driverId)).size!==rs.length || new Set(qs.map(r=>r.driverId)).size!==qs.length)
     throw new Error('Risultati o qualifiche incompleti');
   for(const r of rs)if(!idPiloti.has(pilotaByF1.get(r.driverId))||!idTeam.has(teamByF1.get(r.constructorId)))throw new Error('Nuovo partecipante: anagrafica da verificare');
 }
 const snapshot=creaSnapshot(null,{gare:gruppi.gare,piloti:gruppi.piloti,scuderie:gruppi.scuderie},{carica:fonte.carica});
 snapshot.metadati={...snapshot.metadati,versione:fonte.versione,pubblicatoIl:fonte.pubblicatoIl,archivioSha256:fonte.sha256,
   archivioUrl:fonte.url,releaseUrl:`https://github.com/f1db/f1db/releases/tag/${fonte.versione}`};
 const risultati=raw.map(r=>({...r,circuitId:gareById.get(r.raceId)?.circuitId}));
 const qs=qualifiche.map(r=>({...r,circuitId:gareById.get(r.raceId)?.circuitId}));
 const numerosita=new Map();for(const r of risultati)numerosita.set(r.raceId,(numerosita.get(r.raceId)||0)+1);
 const campioni={...baseCampioni,fonte:snapshot.metadati.releaseUrl,ultimoRoundIncluso:Math.max(...raw.filter(r=>r.year===anno).map(r=>r.round)),
   gare:gare.filter(g=>g.year===anno),risultati,qualifiche:qs,numerosita:Object.fromEntries(numerosita),
   classificaPiloti:fonte.carica('f1db-races-driver-standings.json').filter(r=>r.year===anno)};
 const modifiche=[];const scores=[];
 const aggiungi=(collection_name,payload)=>modifiche.push({collection_name,mongo_id:String(payload._id),payload});
 for(const [n,key] of [['piloti','piloti'],['scuderie','scuderie']]){
   const classifiche=new Map(snapshot.classifiche2026[key].map(e=>[e.slug,e.classifica2026]));
   if(classifiche.size!==gruppi[n].length)throw new Error('Classifiche incomplete');
   for(const e of gruppi[n])aggiungi(n,{...e,classifica2026:classifiche.get(e.slug)});
 }
 for(const g of gruppi.gare){
   if(conclusi.some(c=>c.slug===g.slug)&&g.slug!==target.slug)aggiungi('gare',{...g,stato:'conclusa',conclusaIl:adesso.toISOString()});
   else if(g.slug===target.slug)aggiungi('gare',{...g,stato:'attuale',conclusaIl:null});
 }
 const gareInteressate=new Set([target._id,...conclusi.map(g=>g._id),...gruppi.gare.filter(g=>g.stato==='futura'||rettifiche.includes(g.slug)).map(g=>g._id)]);
 for(const [tipo,n] of [['driver','analisiGare'],['team','analisiScuderie']])for(const original of gruppi[n]){
   if(!gareInteressate.has(original.gara))continue;
   const a=structuredClone(original),g=gruppi.gare.find(g=>g._id===a.gara);
   if(g._id===target._id && target.slug!==current.slug){
     if(!a.aggiornamentiTecniciUfficiali){
       a.aggiornamentiInArrivo='';a.vantaggioAggiornamentiTecnici=null;a.statoAggiornamentiTecnici='';
       for(const t of Object.values(a.traduzioni||{}))delete t.aggiornamentiInArrivo;
     }
     if(tipo==='driver'){
       a.penalita='';for(const t of Object.values(a.traduzioni||{}))delete t.penalita;
     }
   }
   const entita=gruppi[tipo==='driver'?'piloti':'scuderie'].find(e=>e._id===a[tipo==='driver'?'pilota':'scuderia']);
   const id=baseCampioni[tipo==='driver'?'mappingPiloti':'mappingScuderie'][entita.slug];
   const campo=tipo==='driver'?'driverId':'constructorId';
   const rs=risultati.filter(r=>r[campo]===id&&r.year===anno&&r.round<g.ordineCalendario);
   const q=qs.filter(r=>r[campo]===id&&r.year===anno&&r.round<g.ordineCalendario);
   const o=a.overallSemantici ||= {campi:{}};o.campi ||= {};
   o.stagioneCorrente={rendimento:descriviCampione(rs,'gara',numerosita),qualifica:descriviCampione(q,'qualifica',numerosita),completamento:completamento(rs),affidabilita:require('./affidabilitaMeccanica').affidabilitaMeccanica(rs)};
   o.campi.andamentoPerAnno=trend(rs,numerosita);
   for(const m of [...Object.values(o.stagioneCorrente),o.campi.andamentoPerAnno])m.fonti=[snapshot.metadati.releaseUrl];
   o.ultimoRoundIncluso=rs.length?Math.max(...rs.map(r=>r.round)):null;
   const gpConcluso=conclusi.find(c=>c._id===g._id) || rettifiche.includes(g.slug);
   if(gpConcluso){
     const race=gare.find(r=>r.year===anno&&r.round===g.ordineCalendario);
     const rr=raw.filter(r=>r.raceId===race.id&&r[campo]===id),qq=qualifiche.filter(r=>r.raceId===race.id&&r[campo]===id);
     const posizione=(r,p)=>r?Number.isInteger(r.positionNumber)?p+r.positionNumber:r.positionText:'—';
     a.storicoEdizioni=(a.storicoEdizioni||[]).filter(e=>e.stagione!==anno);
     a.storicoEdizioni.push({stagione:anno,posizioneGara:rr.map(r=>posizione(r,'P')).join(' / '),posizioneQualifica:qq.map(r=>posizione(r,'Q')).join(' / ')});
     const edizione=a.storicoEdizioni.at(-1);
     for(const [campo,valore] of [['posizioniStoriche',edizione.posizioneGara],['qualificheStoriche',edizione.posizioneQualifica]]){
       a[campo]={...require('../utils/normalizzaNotaBene').normalizzaTestiAnnuali(a[campo]),[anno]:valore};
       for(const t of Object.values(a.traduzioni||{}))t[campo]={...require('../utils/normalizzaNotaBene').normalizzaTestiAnnuali(t[campo]),[anno]:valore};
     }
   }
   aggiungi(n,a);
   const valori=valutazioniNumeriche(a);
   const campi={affidabilita:o.stagioneCorrente.affidabilita,passoGara:o.campi.passoGara,gestioneGomme:o.campi.gestioneGomme,rendimento:o.stagioneCorrente.rendimento,
     qualifica:o.stagioneCorrente.qualifica,completamento:o.stagioneCorrente.completamento,formaRecente:o.campi.andamentoPerAnno,
     storicoGara:o.campi.risultatiGara,storicoQualifica:o.campi.risultatiQualifica};
   for(const [dimensione,metrica] of Object.entries(MAPPA))scores.push({tipo,slug:entita.slug,gara:g.slug,dimensione,valore:valori[metrica],
     campione:campi[metrica]?.campione||0,fonti:campi[metrica]?.fonti||[]});
 }
 const sessioni=[];
 for(const [file,[tipo,prefisso]] of Object.entries(TIPI)){
   const nome=`f1db-races-${file}.json`;
   if(fonte.nomi.includes(nome))sessioni.push(...righeSessione(fonte.carica(nome).filter(r=>r.year===anno&&r.round<=ultimoRound),tipo,prefisso));
 }
 const ausiliarie={};
 for(const [file,table,key] of [
   ['races-driver-standings','race_driver_standing',['race_id','position_display_order']],
   ['races-constructor-standings','race_constructor_standing',['race_id','position_display_order']],
   ['seasons-drivers','season_driver',['year','driver_id']],
   ['seasons-constructors','season_constructor',['year','constructor_id']],
   ['seasons-driver-standings','season_driver_standing',['year','position_display_order']],
   ['seasons-constructor-standings','season_constructor_standing',['year','position_display_order']],
 ]){
   const righe=fonte.carica(`f1db-${file}.json`).filter(r=>r.year===anno && (r.round===undefined||r.round<=ultimoRound));
   if(!righe.length)throw new Error('Classifiche F1DB ausiliarie incomplete');
   ausiliarie[table]={chiave:key,righe:righe.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[snake(k),v])))};
 }
 return {current,target,conclusi,anno,modifiche,scores,sessioni,gare:gare.filter(g=>g.year===anno),
   runtime:{snapshot,campioni,evidenze:require('./runtimeF1db').evidenzeCorrenti(require('../data/evidenze-giri-2023-2026.json'))},ausiliarie,ultimoRound,stagioneCompletata:!successiva};
}
module.exports={preparaPostGp,giornataTerminata,righeSessione,snake,FUSI};
