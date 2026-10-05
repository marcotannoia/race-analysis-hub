const fs=require('node:fs'),path=require('node:path');
const { caricaFonti }=require('./lib/caricaFontiSemantiche');
const { selezionaEvidenze, aggregaEvidenze }=require('../services/evidenzePrestazioni');
const { descriviCampione, trend }=require('../services/overallSemantici');
const { formatta }=require('./lib/testiRevisioneSemantica');
const testi=require('./lib/testiEvidenze');
const evidence=require('../data/evidenze-giri-2023-2026.json');
const sviluppi=require('../data/aggiornamenti-fia-documentati-2026.json');
const { creaDatiEffettivi }=require('../utils/datiEffettivi');
const { creaClassificaCalibrata }=require('../services/classificaCalibrata');
const root=path.join(__dirname,'../data');
const scrivi=(file,x)=>fs.writeFileSync(file,JSON.stringify(x,null,2)+'\n');
const NOMINE={ 'olanda-zandvoort':'C2/C3/C4','italia-monza':'C3/C4/C5','spagna-madring':'C2/C3/C4','azerbaigian-baku':'C3/C4/C5','bahrein-sepang':'C2/C3/C4','singapore-marina-bay':'C3/C4/C5' };
const FONTI_NOMINE=['https://press.pirelli.com/tyre-compounds-selected-for-zandvoort-monza-and-madrid/','https://press.pirelli.com/tyre-compound-selections-for-baku-sepang-and-singapore/'];
function completa(rawdir) {
 const f=caricaFonti(rawdir),d=JSON.parse(fs.readFileSync(path.join(root,'dati-iniziali.json'))),eff=creaDatiEffettivi(d);
 const tm=new Map(eff.scuderie.map(s=>[s.slug,s])),pm=new Map(eff.piloti.map(p=>[p.slug,{...p,scuderia:tm.get(p.scuderiaSlug)}]));
 const predictions=new Map(d.gare.map(g=>[g.slug,creaClassificaCalibrata({gara:g,piloti:[...pm.values()],scuderie:[...tm.values()],analisiPiloti:eff.analisiGare.filter(a=>a.garaSlug===g.slug).map(a=>({...a,pilota:pm.get(a.pilotaSlug),scuderia:tm.get(a.scuderiaSlug)}))}).classifica]));
 const num=(v,lang)=>typeof v==='number'?new Intl.NumberFormat(lang,{useGrouping:false,maximumFractionDigits:3}).format(v):v??'—';
 const fmt=(str,values,lang)=>formatta(str,Object.fromEntries(Object.entries(values).map(([k,v])=>[k,num(v,lang)])));
 function testoSessioni(ss,tipo,lang) {
  const t=testi[lang];
  return ss.map(s=>`${s.circuitId} (${s.year}, ${s.round}): `+s.piloti.map(p=>{
   const v=p[tipo];
   if(tipo==='passo')return `${p.codice}: `+fmt(v.overall===null?t.pochi:t.passo,{delta:v.deltaMedianoPercentuale,n:v.campione,indice:v.overall,dettaglio:''},lang);
   const stint=v.stint.map(x=>fmt(t.stint,{codice:p.codice,mescola:x.mescola,inizio:x.giroInizio,fine:x.giroFine,giri:x.giri,eta:x.etaIniziale},lang)).join(' ');
   return fmt(v.overall===null?t.gommePochi:t.gomme,{stint,pendenza:v.pendenzaRelativaPercentualePerGiro,n:v.campione,indice:v.overall},lang);
  }).join(' ')).join('\n');
 }
 let count=0;
 for(const [section,team] of [['analisiGare',false],['analisiScuderie',true]])for(const a of d[section]) {
  const g=d.gare.find(g=>g.slug===a.garaSlug),cid=f.circuitiStorici[g.slug],limite=g.ordineCalendario;
  const criteria=team?{constructorIds:[f.scuderieF1db2026[a.scuderiaSlug]]}:{driverId:f.pilotiF1db[a.pilotaSlug]};
  const rounds=evidence.sessioni.filter(s=>s.year===2026&&s.round<limite).sort((a,b)=>a.round-b.round).slice(-3).map(s=>s.round);
  const recent=selezionaEvidenze(evidence,{...criteria,roundEsclusivo:limite}).filter(s=>rounds.includes(s.round));
  const stagione=selezionaEvidenze(evidence,{...criteria,roundEsclusivo:limite});
  const campionePerTipo=tipo=>aggregaEvidenze(recent,tipo).overall!==null?recent:stagione.filter(s=>s.piloti.some(p=>p[tipo].overall!==null)).slice(-3);
  const campioni={passo:campionePerTipo('passo'),gomme:campionePerTipo('gomme')};
  const pace=aggregaEvidenze(campioni.passo,'passo'),tyres=aggregaEvidenze(campioni.gomme,'gomme');
  pace.finestraEstesa=campioni.passo!==recent;tyres.finestraEstesa=campioni.gomme!==recent;
  const osservate=[...new Map([...recent,...campioni.passo,...campioni.gomme].map(s=>[s.sessionKey,s])).values()].sort((a,b)=>a.round-b.round);
  a.overallSemantici.campi.passoGara={...pace,limiteRoundEsclusivo:limite,fonte:evidence.fonte};
  a.overallSemantici.campi.gestioneGomme={...tyres,limiteRoundEsclusivo:limite,fonte:evidence.fonte};
  a.overallSemantici.evidenzeGiri={versione:evidence.versione,anni:{},recenti:osservate.map(s=>({sessionKey:s.sessionKey,round:s.round,circuitId:s.circuitId,driverIds:s.piloti.map(p=>p.driverId)})),limiti:evidence.metodo.limiti};
  const sport=f.risultati.filter(r=>r.year===2026&&r.round<limite&&(team?r.constructorId===criteria.constructorIds[0]:r.driverId===criteria.driverId));
  const qualifying=f.qualifiche.filter(r=>r.year===2026&&r.round<limite&&(team?r.constructorId===criteria.constructorIds[0]:r.driverId===criteria.driverId));
  const rp=descriviCampione(sport,'gara',f.numerosita),qp=descriviCampione(qualifying,'qualifica',f.numerosita),tr=trend(sport,f.numerosita);
  const forecast=predictions.get(g.slug);const relevant=forecast.filter(p=>team?p.scuderia.slug===a.scuderiaSlug:p.pilota.slug===a.pilotaSlug);
  const index=relevant.reduce((s,p)=>s+p.indice,0)/relevant.length;
  const teamRank=team?[...tm.keys()].map(slug=>({slug,indice:forecast.filter(p=>p.scuderia.slug===slug).reduce((s,p)=>s+p.indice,0)/forecast.filter(p=>p.scuderia.slug===slug).length})).sort((a,b)=>b.indice-a.indice||a.slug.localeCompare(b.slug)).findIndex(s=>s.slug===a.scuderiaSlug)+1:relevant[0].posizione;
  a.overallSemantici.campi.considerazioniFinali={overall:Math.round(index*10)/10,posizione:teamRank,stato:'stima_da_modello_attivo',metodo:forecast.length?d.gare.find(g=>g.slug===a.garaSlug).previsioneCalibrata.versione:null,probabilita:false};
  const scores={passoGara:pace.overall,gestioneGomme:tyres.overall,rendimento:rp.overall,qualifica:qp.overall};
  a.overallSemantici.puntiForti=Object.entries(scores).filter(([,v])=>v!==null&&v>=65).map(([k,v])=>({campo:k,overall:v}));
  a.overallSemantici.puntiDeboli=Object.entries(scores).filter(([,v])=>v===null||v<45).map(([k,v])=>({campo:k,overall:v,stato:v===null?'campione_insufficiente':'indice_relativo_basso'}));
  const registro=sviluppi.documenti.filter(doc=>doc.round<=limite).map(doc=>({garaSlug:doc.garaSlug,round:doc.round,fonte:doc.fonte,...doc.scuderie.find(s=>s.scuderiaSlug===a.scuderiaSlug)}));
  a.overallSemantici.campi.aggiornamentiInArrivo={overall:null,stato:'componenti_dichiarati_fia',campione:registro.length,registro,beneficioCronometrico:null,installazionePerVettura:'non_inferita',utilizzabilePrevisione:false};
  if(!team){const ultimo=registro.at(-1);a.statoAggiornamentiTecnici=limite<=16?(ultimo?.componenti.length?'confermato':'nessunPacchetto'):'';}
  for(const [lang,t] of Object.entries(testi)) {
   const hist={passo:[],gomme:[]};
   for(const year of [2023,2024,2025]) {
    const criteriaYear=team?{constructorIds:f.scuderieF1dbStoriche[a.scuderiaSlug][year]}:criteria;
    const ss=selezionaEvidenze(evidence,{...criteriaYear,year,circuito:cid});
    a.overallSemantici.evidenzeGiri.anni[year]={passo:aggregaEvidenze(ss,'passo'),gomme:aggregaEvidenze(ss,'gomme'),sessioni:ss.map(s=>s.sessionKey)};
    for(const tipo of ['passo','gomme'])hist[tipo].push(`${year}: `+(ss.length?testoSessioni(ss,tipo,lang):f.gare.some(g=>g.year===year&&g.circuitId===cid)?t.assente:t.nuovoCircuito));
   }
   for(const tipo of ['passo','gomme'])hist[tipo].push('2026: '+fmt(t.recente,{gp:campioni[tipo].length,dati:testoSessioni(campioni[tipo],tipo,lang)},lang)+' '+t.limite);
   const trad=a.traduzioni[lang];
   trad.passoGara=hist.passo.join('\n');trad.gestioneGomme=hist.gomme.join('\n');
   trad.andamentoPerAnno=fmt(t.stagione,{round:Math.min(limite-1,16),gara:rp.overall,nr:rp.campione,qualifica:qp.overall,nq:qp.campione,recente:tr.overall,delta:tr.deltaOverall},lang);
   trad.aggiornamentiInArrivo=fmt(t.registroAggiornamenti,{squadra:tm.get(a.scuderiaSlug).nome,circuito:g.traduzioni[lang].circuito,registro:registro.map(r=>`${r.garaSlug} (${r.round}): ${r.componenti.length?r.componenti.map(c=>c.componente).join(', '):t.nessunAggiornamento}`).join('; ')},lang);
   trad.considerazioniFinali=fmt(t.conclusione,{posizione:teamRank,totale:team?11:22,indice:Math.round(index*10)/10,passo:pace.overall,gomme:tyres.overall},lang);
   // Conserva le posizioni verificabili; aggiunge il contesto del nuovo campione.
   const lines=trad.notaBene.split('\n').filter(l=>!l.startsWith('2026:'));
   trad.notaBene=lines.join('\n')+'\n2026: '+trad.andamentoPerAnno.replace(/^2026\s*:?\s*/,'')+' '+t.storicoLimite;
   if(lang==='it')for(const k of ['passoGara','gestioneGomme','andamentoPerAnno','considerazioniFinali','notaBene','aggiornamentiInArrivo'])a[k]=trad[k];
  }
  a.fonti=[...new Set([...a.fonti,...registro.map(r=>r.fonte),...osservate.flatMap(s=>Object.values(s.fonti).map(m=>m.url)),...Object.values(a.overallSemantici.evidenzeGiri.anni).flatMap(y=>[...y.passo.fonti,...y.gomme.fonti]),evidence.fonte])];
  count++;
 }
 // Aggiorna anche gli archivi: il loader li applica sopra il JSON base.
 for(const filename of fs.readdirSync(path.join(root,'archivio-gp')).filter(n=>n.endsWith('.json'))) {
  const file=path.join(root,'archivio-gp',filename),archive=JSON.parse(fs.readFileSync(file)),cid=f.circuitiStorici[archive.garaConclusaSlug];
  if(!cid)continue;
  const session=evidence.sessioni.find(s=>s.year===archive.stagione&&s.circuitId===cid);
  if(!session)continue;
  for(const p of archive.risultatiPiloti||[]) {
   const ss=[{...session,piloti:session.piloti.filter(x=>x.driverId===f.pilotiF1db[p.pilotaSlug])}];
   if(!ss[0].piloti.length)continue;
   for(const lang of Object.keys(testi)) {
    p.traduzioni[lang].passoGara=testoSessioni(ss,'passo',lang);p.traduzioni[lang].gomme=testoSessioni(ss,'gomme',lang);
    if(lang==='it'){p.passoGara=p.traduzioni[lang].passoGara;p.gestioneGomme=p.traduzioni[lang].gomme;}
   }
  }
  for(const a of archive.risultatiScuderie||[]) {
   const ps=archive.risultatiPiloti.filter(p=>p.scuderiaSlug===a.scuderiaSlug);
   a.passoGara=ps.map(p=>p.passoGara).join(' ');a.gestioneGomme=ps.map(p=>p.gestioneGomme).join(' ');
  }
  archive.fonti=[...new Set([...archive.fonti,...Object.values(session.fonti).map(m=>m.url)])];
  archive.verificaGiri={versione:evidence.versione,sessionKey:session.sessionKey,limiti:evidence.metodo.limiti};scrivi(file,archive);
 }
 for(const g of d.gare) {
  const ss=evidence.sessioni.filter(s=>s.circuitId===f.circuitiStorici[g.slug]&&s.year<2026),recent=evidence.sessioni.filter(s=>s.circuitId===f.circuitiStorici[g.slug]&&s.year===2026);
  const context=ss.length?ss:recent;const values=context.flatMap(s=>s.piloti.flatMap(p=>p.gomme.stint)).filter(s=>['HARD','MEDIUM','SOFT'].includes(s.mescola));
  const summary={sessioni:context.length,sc:context.reduce((n,s)=>n+s.riepilogo.safetyCar,0),vsc:context.reduce((n,s)=>n+s.riepilogo.vsc,0),red:context.reduce((n,s)=>n+s.riepilogo.bandiereRosse,0),wet:context.filter(s=>s.riepilogo.pioggiaRegistrata).length};
  const rank=predictions.get(g.slug);
  const teamRank=[...tm.keys()].map(slug=>({slug,indice:rank.filter(p=>p.scuderia.slug===slug).reduce((s,p)=>s+p.indice,0)/rank.filter(p=>p.scuderia.slug===slug).length})).sort((a,b)=>b.indice-a.indice||a.slug.localeCompare(b.slug));
  g.overallSemantici.campi.pilotiFavoriti.metodo=g.previsioneCalibrata.versione;
  g.overallSemantici.campi.scuderieFavorite.metodo=g.previsioneCalibrata.versione;
  g.overallSemantici.pattern={stato:'storico_acquisito',campione:summary.sessioni,overall:null,riepilogo:summary,limite:'Non è una probabilità; storico non trasferito automaticamente al 2026.'};
  g.overallSemantici.protocolloRaccolta.stato='giri_stint_meteo_traffico_e_neutralizzazioni_acquisiti';
  g.overallSemantici.protocolloRaccolta.fonteGiri=evidence.fonte;
  g.overallSemantici.gomme={nomina2026:NOMINE[g.slug]||null,statoNomina:NOMINE[g.slug]?'confermata_pirelli':'non_ancora_confermata',stintStorici:values.length,sessioni:context.map(s=>s.sessionKey)};
  for(const [lang,t]of Object.entries(testi)) {
   const stint=['HARD','MEDIUM','SOFT'].map(c=>{const vv=values.filter(s=>s.mescola===c);return `${c}: ${vv.length}, max ${num(Math.max(0,...vv.map(s=>s.giri)),lang)}`;}).join(' / ');
   const vecchi=require('./lib/testiRevisioneSemantica').testi[lang];
   g.traduzioni[lang].pilotiFavoriti=vecchi.favorevoli+rank.slice(0,4).map(p=>p.pilota.codice).join(' • ');
   g.traduzioni[lang].scuderieFavorite=vecchi.favorevoli+teamRank.slice(0,3).map(s=>tm.get(s.slug).nome).join(' • ');
   g.traduzioni[lang].potenzialiDifficolta=vecchi.difficolta+rank.slice(-4).map(p=>p.pilota.codice).join(' • ');
   g.traduzioni[lang].gommeStrategia=fmt(t.strategia,{...summary,nomina:NOMINE[g.slug]?fmt(t.nomina,{mescole:NOMINE[g.slug]},lang):t.nonNomina,stint},lang);
   g.traduzioni[lang].rischi=fmt(t.rischi,summary,lang);
   if(lang==='it')for(const k of ['gommeStrategia','rischi','pilotiFavoriti','scuderieFavorite','potenzialiDifficolta'])g[k]=g.traduzioni[lang][k];
  }
  g.fonti=[...new Set([...g.fonti,...FONTI_NOMINE,...context.flatMap(s=>Object.values(s.fonti).map(m=>m.url)),evidence.fonte])];
 }
 for(const [section,team]of [['piloti',false],['scuderie',true]])for(const p of d[section]) {
  const criteria=team?{constructorIds:[f.scuderieF1db2026[p.slug]]}:{driverId:f.pilotiF1db[p.slug]};
  const ss=selezionaEvidenze(evidence,criteria);
  p.overallSemantici.campi.passoGara=aggregaEvidenze(ss,'passo');p.overallSemantici.campi.gestioneGomme=aggregaEvidenze(ss,'gomme');
 }
 d.metadati.evidenzePrestazioni={versione:evidence.versione,fonte:evidence.fonte,sessioni:evidence.sessioni.length,ultimoRoundIncluso:16,analisiAggiornate:count,metodo:evidence.metodo};
 scrivi(path.join(root,'dati-iniziali.json'),d);console.log('Schede completate:',count,'sessioni:',evidence.sessioni.length);
}
if(require.main===module)completa(process.argv[2]);module.exports={completa};
