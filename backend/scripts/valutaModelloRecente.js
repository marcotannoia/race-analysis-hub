const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {fattoriRecenti,ordinaRecenti,CHIAVI_RECENTI}=require('../services/modelloRecente');
const {regolare,metricheOrdine}=require('../services/overallSemantici');
const {aggrega}=require('../services/calibrazionePesi');
const campioni=require('../data/campioni-previsionali-2026.json'),evidenze=require('../data/evidenze-giri-2023-2026.json');
function valuta() {
 const scenari=campioni.gare.filter(g=>g.round<=campioni.ultimoRoundIncluso).sort((a,b)=>a.round-b.round).map(g=>({gara:g,reali:campioni.risultati.filter(r=>r.raceId===g.id).sort((a,b)=>a.positionDisplayOrder-b.positionDisplayOrder)}));
 const modelli=[];
 for(const emivitaGP of [1,2,4,8,16])for(const osservazioniPrior of [0,1,2]) {
  const parametri={emivitaGP,osservazioniPrior};const fattori=scenari.map(s=>fattoriRecenti({campioni,evidenze,gara:s.gara,partecipanti:s.reali,parametri}));
  for(let p=0;p<=50;p+=5)for(let q=0;q<=50-p;q+=5)for(let t=0;t<=50-p-q;t+=5) {
   const pesi=[p,q,t,100-p-q-t];
   const errori=fattori.map((f,i)=>{const reg=new Set(scenari[i].reali.filter(regolare).map(p=>p.driverId));return metricheOrdine(ordinaRecenti(f,pesi).filter(p=>reg.has(p.driverId)),scenari[i].reali.filter(regolare)).sommaErroriAssoluti;});
   modelli.push({parametri,pesi,errori});
  }
 }
 function scegli(roundEsclusivo) {
  // Finestra mobile di tre eventi: reagisce alla forma recente, con mondiale >=50%.
  const start=Math.max(0,roundEsclusivo-4),end=roundEsclusivo-1;
  return [...modelli].sort((a,b)=>a.errori.slice(start,end).reduce((s,e)=>s+e,0)-b.errori.slice(start,end).reduce((s,e)=>s+e,0)||
   b.pesi[3]-a.pesi[3]||a.parametri.emivitaGP-b.parametri.emivitaGP||a.parametri.osservazioniPrior-b.parametri.osservazioniPrior)[0];
 }
 const congelato=scegli(13),finale=scegli(17);
 function misura(s,m) {
  const f=fattoriRecenti({campioni,evidenze,gara:s.gara,partecipanti:s.reali,parametri:m.parametri});const rank=ordinaRecenti(f,m.pesi),regular=new Set(s.reali.filter(regolare).map(p=>p.driverId));
  return {regolari:metricheOrdine(rank.filter(p=>regular.has(p.driverId)),s.reali.filter(regolare)),completa:metricheOrdine(rank,s.reali),classifica:rank.map(p=>({driverId:p.driverId,constructorId:p.constructorId,posizione:p.posizione,indice:p.indice,valori:p.valori}))};
 }
 const gp=scenari.map(s=>({round:s.gara.round,circuito:s.gara.circuitId,parametriProgressivi:scegli(s.gara.round).parametri,pesiProgressivi:scegli(s.gara.round).pesi,progressivo:misura(s,scegli(s.gara.round)),congelato:misura(s,congelato),mondiale:misura(s,{parametri:finale.parametri,pesi:[0,0,0,100]}),classificazioneReale:s.reali.map(({driverId,positionDisplayOrder,reasonRetired,positionText})=>({driverId,positionDisplayOrder,reasonRetired,positionText}))}));
 const summary=(rows,key)=>({regolari:aggrega(rows.map(g=>g[key]),'regolari'),completa:aggrega(rows.map(g=>g[key]),'completa')});
 const walk=Object.fromEntries(['progressivo','mondiale'].map(k=>[k,summary(gp.slice(3),k)]));
 const test=Object.fromEntries(['congelato','mondiale'].map(k=>[k,summary(gp.slice(12),k)]));
 const adotta=walk.progressivo.regolari.erroreAssolutoMedio<walk.mondiale.regolari.erroreAssolutoMedio&&test.congelato.regolari.erroreAssolutoMedio<test.mondiale.regolari.erroreAssolutoMedio&&test.congelato.completa.erroreAssolutoMedio<=test.mondiale.completa.erroreAssolutoMedio+0.1;
 const risultato={versione:'forma-recente-v1',calcolatoIl:'2026-10-05',stato:adotta?'calibrato_retrospettivo':'sperimentale_non_promosso',fonte:evidenze.fonte,ricerca:{combinazioni:modelli.length,passoPercentuale:5,mondialeMinimoPercentuale:50,finestraCalibrazioneGP:3},parametri:finale.parametri,pesi:Object.fromEntries(CHIAVI_RECENTI.map((k,i)=>[k,finale.pesi[i]])),trainingRound10a12:{parametri:congelato.parametri,pesi:congelato.pesi},walkForward:walk,diagnosticaRound13a16:test,sha256Evidenze:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../data/evidenze-giri-2023-2026.json'))).digest('hex'),protocollo:{primaGara:'Solo giri e risultati dei GP antecedenti al target. Forma con media esponenziale; mondiale minimo 50%. Finestra mobile di tre GP per scegliere pesi e parametri. Pareggi: mondiale maggiore, emivita minore, prior minore.',limite:'Il blocco 13–16 è già stato esaminato nella revisione precedente: controllo diagnostico riutilizzato, non nuovo test indipendente. Ricerca di famiglie e finestre esplorativa; nessuna promessa di accuratezza futura. Valutazione separata con e senza esclusioni documentate.',adozione:'Miglioramento della MAE regolare sia progressiva sia del blocco diagnostico; MAE integrale del blocco non peggiore di oltre 0.1 posizioni rispetto al mondiale.'},gp};
 fs.writeFileSync(path.join(__dirname,'../data/valutazione-forma-recente-2026-10-05.json'),JSON.stringify(risultato,null,2)+'\n');console.log(JSON.stringify({stato:risultato.stato,ricerca:risultato.ricerca,pesi:risultato.pesi,parametri:finale.parametri,training:risultato.trainingRound10a12,walk,test},null,2));return risultato;
}
if(require.main===module)valuta();module.exports={valuta};
