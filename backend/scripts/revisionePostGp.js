// Acquisizione incrementale e revisione ripetibile. Senza --apply: rollback.
const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
process.env.DATA_PROVIDER='postgres';
const db=require('../config/database');
const {creaRevisione,aggiornaPasso}=require('../services/revisionePostGp');
const {preparaPostGp}=require('../services/preparaPostGp');
const {salvaRevisione}=require('../services/salvaRevisionePostGp');
const fonti=require('../services/fontiPostGp');

async function main(){
 const apply=process.argv.includes('--apply');
 const dir=path.resolve(process.env.POST_GP_OUTPUT || path.join(__dirname,'../../output/post-gp'));
 fs.mkdirSync(dir,{recursive:true});
 await db();const pool=db.getPool();let client;
 try{
   const release=await fonti.ultimaRelease(),fonte=await fonti.acquisisciRelease(release,2026);
   const audit=(await pool.query("select payload,applied_at::text versione from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1")).rows[0];
   if(audit?.payload.fonte!==fonte.versione)throw new Error('Eseguire prima check:auto-gp -- --apply: la revisione richiede il corpus verificato aggiornato.');
   const runtime=audit.payload.runtime;
   const base=runtime.evidenze || require('../data/evidenze-giri-2023-2026.json');
   fs.writeFileSync(path.join(dir,'corpus.json'),JSON.stringify(runtime.campioni));
   const rawdir=path.join(dir,'raw');fs.mkdirSync(rawdir,{recursive:true});
   for(const name of ['races','races-race-results','drivers'])fs.writeFileSync(path.join(rawdir,`f1db-${name}.json`),JSON.stringify(fonte.carica(`f1db-${name}.json`)));
   const tutte=new Map(base.sessioni.map(s=>[s.sessionKey,s]));
   const mancanti=runtime.campioni.gare.filter(g=>g.round<=runtime.campioni.ultimoRoundIncluso&&!base.sessioni.some(s=>s.year===g.year&&s.round===g.round));
   for(const g of mancanti){
     const cache=path.join(dir,`giri-${g.round}`),out=path.join(dir,`evidenze-${g.round}.json`);
     for(const args of [
       [path.join(__dirname,'raccogliEvidenzeGiri.py'),cache,'--corpus',path.join(dir,'corpus.json'),'--round',String(g.round)],
       [path.join(__dirname,'analizzaEvidenzeGiri.py'),cache,rawdir,out],
     ]){const r=spawnSync(process.env.PYTHON || 'python3',args,{stdio:'inherit',timeout:600000});if(r.status!==0)throw new Error('Acquisizione o derivazione giri non riuscita');}
     const nuovo=JSON.parse(fs.readFileSync(out));
     if(!nuovo.sessioni.some(s=>s.round===g.round&&s.year===g.year))throw new Error(`Giri non disponibili per il round ${g.round}`);
     for(const s of nuovo.sessioni)tutte.set(s.sessionKey,s);
   }
   const evidenze={...base,acquisitoIlUTC:new Date().toISOString(),sessioni:[...tutte.values()].sort((a,b)=>a.year-b.year||a.round-b.round)};
   const sourceMark=(await pool.query('select max(imported_at)::text value from editorial.source_document')).rows[0].value;
   const documents=(await pool.query("select collection_name,mongo_id,payload from editorial.source_document where collection_name in ('gare','piloti','scuderie','analisiGare','analisiScuderie')")).rows;
   const gare=documents.filter(d=>d.collection_name==='gare').map(d=>d.payload);
   console.log('Preparazione schede, cutoff e revisione del modello');
   const piano=preparaPostGp({fonte,documenti:documents,rettifiche:gare.filter(g=>g.stato==='conclusa').map(g=>g.slug)});
   const report=creaRevisione({campioni:runtime.campioni,evidenze,gare});
   // Il piano aggiorna tutti i futuri; la review conserva i cutoff storici.
   const refs=new Map(documents.map(d=>[`${d.collection_name}|${d.mongo_id.trim()}`,d.payload]));
   for(const d of documents.filter(d=>['analisiGare','analisiScuderie'].includes(d.collection_name))){
     const g=refs.get(`gare|${d.payload.gara}`),team=d.collection_name==='analisiScuderie';
     const entita=refs.get(`${team?'scuderie':'piloti'}|${d.payload[team?'scuderia':'pilota']}`);
     let change=piano.modifiche.find(x=>x.collection_name===d.collection_name&&x.mongo_id===d.mongo_id.trim());
     if(!change){change={collection_name:d.collection_name,mongo_id:d.mongo_id.trim(),payload:structuredClone(d.payload)};piano.modifiche.push(change);}
     aggiornaPasso(change.payload,g,runtime.campioni,evidenze,entita,team);
     for(const [dimensione,campo] of [['race_pace','passoGara'],['tyre_management','gestioneGomme']]){
       const m=change.payload.overallSemantici.campi[campo];
       const value={tipo:team?'team':'driver',slug:entita.slug,gara:g.slug,dimensione,valore:m.overall,campione:m.campione,fonti:m.fonti};
       const i=piano.scores.findIndex(s=>s.tipo===value.tipo&&s.slug===value.slug&&s.gara===g.slug&&s.dimensione===dimensione);
       if(i>=0)piano.scores[i]=value;else piano.scores.push(value);
     }
   }
   piano.runtime={...runtime,evidenze,revisione:report};
   const {creaClassificaCalibrata}=require('../services/classificaCalibrata');
   require('../services/runtimeF1db').applicaRuntime(piano.runtime);
   const teamDocs=documents.filter(d=>d.collection_name==='scuderie').map(d=>d.payload);
   const driverDocs=documents.filter(d=>d.collection_name==='piloti').map(d=>d.payload);
   for(const g of gare.filter(g=>g.stato!=='conclusa')){
     const rows=piano.modifiche.filter(d=>d.collection_name==='analisiGare'&&d.payload.gara===g._id);
     const analisiPiloti=rows.map(d=>({...d.payload,pilota:driverDocs.find(p=>p._id===d.payload.pilota),scuderia:teamDocs.find(t=>t._id===d.payload.scuderia)}));
     const classifica=creaClassificaCalibrata({gara:g,piloti:driverDocs,scuderie:teamDocs,analisiPiloti}).classifica;
     const squadre=teamDocs.map(t=>({slug:t.slug,righe:classifica.filter(p=>p.scuderia.slug===t.slug)})).filter(t=>t.righe.length)
       .map(t=>({...t,indice:t.righe.reduce((s,p)=>s+p.indice,0)/t.righe.length})).sort((a,b)=>b.indice-a.indice||a.slug.localeCompare(b.slug));
     let overview=piano.modifiche.find(d=>d.collection_name==='gare'&&d.payload._id===g._id);
     if(!overview){overview={collection_name:'gare',mongo_id:String(g._id),payload:structuredClone(g)};piano.modifiche.push(overview);}
     const etichette={it:'Ordine descrittivo del modello, non probabilità di vittoria: ',en:'Descriptive model order, not win probabilities: ',fr:'Ordre descriptif du modèle, pas des probabilités de victoire : ',pt:'Ordem descritiva do modelo, não probabilidades de vitória: ',es:'Orden descriptivo del modelo, no probabilidades de victoria: ',de:'Deskriptive Modellreihenfolge, keine Siegchancen: '};
     for(const [lang,label] of Object.entries(etichette)){
       const valori={pilotiFavoriti:label+classifica.slice(0,4).map(p=>p.pilota.codice).join(' • '),
         scuderieFavorite:label+squadre.slice(0,3).map(t=>teamDocs.find(d=>d.slug===t.slug).nome).join(' • '),
         potenzialiDifficolta:label+classifica.slice(-4).map(p=>p.pilota.codice).join(' • ')};
       overview.payload.traduzioni ||= {};overview.payload.traduzioni[lang] ||= {};
       Object.assign(overview.payload.traduzioni[lang],valori);if(lang==='it')Object.assign(overview.payload,valori);
     }
     for(const d of piano.modifiche.filter(d=>['analisiGare','analisiScuderie'].includes(d.collection_name)&&d.payload.gara===g._id)){
       const team=d.collection_name==='analisiScuderie';
       const entita=refs.get(`${team?'scuderie':'piloti'}|${d.payload[team?'scuderia':'pilota']}`);
       const r=team?squadre.find(t=>t.slug===entita.slug):classifica.find(p=>p.pilota.slug===entita.slug);
       const posizione=team?squadre.indexOf(r)+1:r.posizione,totale=team?squadre.length:classifica.length;
       const o=d.payload.overallSemantici;
       o.campi.considerazioniFinali={overall:Math.round(r.indice*10)/10,posizione,stato:'stima_da_modello_attivo',probabilita:false};
       for(const [lang,t] of Object.entries(require('./lib/testiEvidenze'))){
         const values={posizione,totale,indice:o.campi.considerazioniFinali.overall,passo:o.campi.passoGara.overall,gomme:o.campi.gestioneGomme.overall};
         const testo=require('./lib/testiRevisioneSemantica').formatta(t.conclusione,Object.fromEntries(Object.entries(values).map(([k,v])=>[k,typeof v==='number'?new Intl.NumberFormat(lang,{maximumFractionDigits:3}).format(v):'—'])));
         d.payload.traduzioni[lang].considerazioni=testo;if(lang==='it')d.payload.considerazioni=testo;
       }
     }
   }
   console.log('Verifica finale FIA');
   const prove=[];
   for(const g of gare.filter(g=>g.stato==='conclusa'&&g.ordineCalendario===runtime.campioni.ultimoRoundIncluso))
     prove.push({gara:g.slug,...await fonti.verificaFinale(g.slug,runtime.campioni.risultati.filter(r=>r.year===g.stagione&&r.round===g.ordineCalendario))});
   if(!prove.length)throw new Error('Classifica finale di riferimento assente');
   client=await pool.connect();
   client.on('error',e=>console.error('Connessione revisione interrotta:',e.message));
   console.log(apply?'Applicazione transazionale della revisione':'Simulazione transazionale con rollback');
   piano.runtime.revisione.proveFia=prove;
   const esito=await salvaRevisione(client,piano,{sourceMark,documenti:documents,versioneAudit:audit.versione,dryRun:!apply});
   fs.writeFileSync(path.join(dir,'revisione.json'),JSON.stringify(report,null,2)+'\n');
   console.log(JSON.stringify({esito,copertura:report.copertura,verificaModello:report.verificaModello,rapporto:path.join(dir,'revisione.json')},null,2));
 }finally{client?.release();await db.chiudiDatabase();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
