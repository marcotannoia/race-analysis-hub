const { indicePosizione, regolare } = require('./overallSemantici');
const CHIAVI_RECENTI=['passoGaraRecente','qualifica2026','andamentoScuderiaRecente','andamento2026'];
function fattoriRecenti({campioni,evidenze,gara,partecipanti,parametri}) {
 const half=parametri.emivitaGP,prior=parametri.osservazioniPrior;
 const races=campioni.risultati.filter(r=>r.year===gara.year&&r.round<gara.round&&regolare(r));
 const qualifying=campioni.qualifiche.filter(r=>r.year===gara.year&&r.round<gara.round&&Number.isInteger(r.positionNumber)&&r.positionNumber>0&&!['DSQ','EX'].includes(r.positionText));
 const gp=campioni.gare.filter(g=>g.year===gara.year&&g.round<gara.round&&campioni.classificaPiloti.some(p=>p.raceId===g.id)).sort((a,b)=>b.round-a.round)[0];
 const standings=new Map(campioni.classificaPiloti.filter(r=>r.raceId===gp?.id&&Number.isInteger(r.positionNumber)&&r.positionNumber>0).map(r=>[r.driverId,r.positionNumber]));
 const ranking=[...partecipanti].sort((a,b)=>(standings.get(a.driverId)??999)-(standings.get(b.driverId)??999)||a.driverId.localeCompare(b.driverId));
 const positions=new Map(ranking.map((p,i)=>[p.driverId,i+1]));
 function form(rows,key,id) {
  let num=50*prior,den=prior;
  for(const r of rows)if(r[key]===id){const w=2**(-(gara.round-1-r.round)/half);const n=campioni.numerosita[r.raceId];const value=indicePosizione(r.positionNumber,n);if(value===null)continue;num+=w*value;den+=w;}
  return den?num/den:50;
 }
 function pace(id) {
  let num=50*prior,den=prior;
  for(const s of evidenze.sessioni)if(s.year===gara.year&&s.round<gara.round){const p=s.piloti.find(p=>p.driverId===id);if(p?.passo.overall==null)continue;const w=2**(-(gara.round-1-s.round)/half)*Math.min(1,p.passo.campione/20);num+=w*p.passo.overall;den+=w;}
  return den?num/den:50;
 }
 return [...partecipanti].sort((a,b)=>a.driverId.localeCompare(b.driverId)).map(p=>({...p,valori:[pace(p.driverId),form(qualifying,'driverId',p.driverId),form(races,'constructorId',p.constructorId),standings.has(p.driverId)?indicePosizione(positions.get(p.driverId),partecipanti.length):50]}));
}
function ordinaRecenti(fattori,pesi) {
 if(pesi.length!==4||pesi.some(p=>!Number.isFinite(p)||p<0)||Math.abs(pesi.reduce((s,p)=>s+p,0)-100)>1e-8)throw new Error('Pesi recenti non validi');
 return fattori.map(p=>({...p,indice:p.valori.reduce((s,v,i)=>s+v*pesi[i]/100,0)})).sort((a,b)=>b.indice-a.indice||a.driverId.localeCompare(b.driverId)).map((p,i)=>({...p,posizione:i+1}));
}
module.exports={CHIAVI_RECENTI,fattoriRecenti,ordinaRecenti};
