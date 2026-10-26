const {fattoriRecenti,ordinaRecenti}=require('./modelloRecente');
const {metricheOrdine,regolare}=require('./overallSemantici');
const {selezionaEvidenze,aggregaEvidenze}=require('./evidenzePrestazioni');
const {circuitiStorici}=require('../scripts/sincronizzaF1db');
const tecnici=require('../data/circuiti-tecnici-2026.json');

function similarita(a,b){
 const dims=tecnici.dimensioni,den=dims.reduce((s,k)=>s+a[k],0);
 return den?Math.round(1000*(1-dims.reduce((s,k)=>s+a[k]*Math.abs(a[k]-b[k]),0)/(100*den)))/10:null;
}

function creaRevisione({campioni,evidenze,gare,adesso=new Date()}){
 const ultimo=campioni.gare.filter(g=>g.round<=campioni.ultimoRoundIncluso).sort((a,b)=>b.round-a.round)[0];
 const reali=campioni.risultati.filter(r=>r.raceId===ultimo.id).sort((a,b)=>a.positionDisplayOrder-b.positionDisplayOrder);
 const modello=require('../data/valutazione-forma-recente-2026-10-05.json');
 // Modello congelato già pubblicato: solo input precedenti ad Austin.
 const pesi=require('./modelloRecente').CHIAVI_RECENTI.map(k=>modello.pesi[k]);
 const previsione=ordinaRecenti(fattoriRecenti({campioni,evidenze,gara:ultimo,partecipanti:reali,parametri:modello.parametri}),pesi);
 const riferimento=ordinaRecenti(fattoriRecenti({campioni,evidenze,gara:ultimo,partecipanti:reali,parametri:modello.parametri}),[0,0,0,100]);
 const regolari=new Set(reali.filter(regolare).map(r=>r.driverId));
 const futuri=gare.filter(g=>g.stato!=='conclusa').sort((a,b)=>a.ordineCalendario-b.ordineCalendario).map(g=>{
   const profilo=tecnici.circuiti[g.slug];
   const simili=gare.filter(x=>x.ordineCalendario<g.ordineCalendario&&x.ordineCalendario<=campioni.ultimoRoundIncluso&&tecnici.circuiti[x.slug])
     .map(x=>({gara:x.slug,round:x.ordineCalendario,circuitId:circuitiStorici[x.slug],similaritaPercentuale:similarita(profilo.richieste,tecnici.circuiti[x.slug].richieste)}))
     .sort((a,b)=>b.similaritaPercentuale-a.similaritaPercentuale).slice(0,3);
   const rounds=new Set(simili.map(x=>x.round));
   const osservati=campioni.risultati.filter(r=>r.year===ultimo.year&&r.round<g.ordineCalendario&&r.round<=campioni.ultimoRoundIncluso&&regolare(r));
   function pattern(campo){
     const ids=[...new Set(osservati.map(r=>r[campo]))];
     return ids.map(id=>{
       const stagione=osservati.filter(r=>r[campo]===id),righe=stagione.filter(r=>rounds.has(r.round));
       const media=xs=>xs.length?xs.reduce((s,r)=>s+r.positionNumber,0)/xs.length:null;
       return {id,osservazioni:righe.length,gare:new Set(righe.map(r=>r.raceId)).size,posizioneMedia:media(righe),
         vantaggioPosizioniRispettoStagione:righe.length?Math.round(100*(media(stagione)-media(righe)))/100:null,
         stato:new Set(righe.map(r=>r.raceId)).size<3?'campione_insufficiente':'associazione_esplorativa'};
     }).sort((a,b)=>(b.vantaggioPosizioniRispettoStagione??-999)-(a.vantaggioPosizioniRispettoStagione??-999));
   }
   return {gara:g.slug,round:g.ordineCalendario,ultimoRoundOsservato:campioni.ultimoRoundIncluso,circuitiSimili:simili,piloti:pattern('driverId'),scuderie:pattern('constructorId')};
 });
 return {versione:'revisione-post-gp-v1',generatoIl:adesso.toISOString(),ultimoRound:ultimo.round,circuito:ultimo.circuitId,
   fonte:campioni.fonte,ricercaEditoriale:require('../data/ricerca-post-gp-2026.json')[ultimo.round]||null,copertura:{sessioni:evidenze.sessioni.length,sessioniStagione:evidenze.sessioni.filter(s=>s.year===ultimo.year).length,
     roundConGiri:evidenze.sessioni.filter(s=>s.year===ultimo.year).map(s=>s.round).sort((a,b)=>a-b)},
   garaConclusa:evidenze.sessioni.filter(s=>s.year===ultimo.year&&s.round===ultimo.round),
   verificaModello:{modello:modello.versione,pesi:modello.pesi,parametri:modello.parametri,
     tipo:'ricostruzione_con_modello_congelato_non_previsione_archiviata',
     completa:metricheOrdine(previsione,reali),regolari:metricheOrdine(previsione.filter(p=>regolari.has(p.driverId)),reali.filter(regolare)),
     riferimentoSoloMondiale:{completa:metricheOrdine(riferimento,reali),regolari:metricheOrdine(riferimento.filter(p=>regolari.has(p.driverId)),reali.filter(regolare))},
     confronto:previsione.map(p=>({driverId:p.driverId,prevista:p.posizione,reale:reali.find(r=>r.driverId===p.driverId).positionDisplayOrder}))},
   prossimiGp:futuri,
   limiti:['Associazioni esplorative: similarità da richieste tecniche editoriali, non causalità né probabilità di vittoria.',
     'Confronto sulle posizioni dei classificati regolari; ritiri esclusi dai pattern e inclusi nella metrica completa.',
     'Numero osservazioni delle scuderie conta due vetture per GP; il campo gare conta eventi distinti.',
     'I pesi pubblicati restano congelati. Una singola gara non dimostra un miglioramento del modello.',
     'La ricostruzione usa i partecipanti effettivi: non equivale a una previsione salvata prima del weekend.',
     'Nessun risultato futuro, qualifica futura o vantaggio tecnico non misurato viene inventato.']};
}

function aggiornaPasso(analisi,gara,campioni,evidenze,entita,team){
 const criteria=team?{constructorIds:[campioni.mappingScuderie[entita.slug]]}:{driverId:campioni.mappingPiloti[entita.slug]};
 const stagione=selezionaEvidenze(evidenze,{...criteria,roundEsclusivo:gara.ordineCalendario});
 const recenti=stagione.slice(-3);
 const o=analisi.overallSemantici ||= {campi:{}};o.campi ||= {};
 for(const [campo,tipo] of [['passoGara','passo'],['gestioneGomme','gomme']]){
   const metrica=aggregaEvidenze(recenti,tipo);
   o.campi[campo]={...metrica,limiteRoundEsclusivo:gara.ordineCalendario};
 }
 o.evidenzeGiri={...(o.evidenzeGiri||{}),versione:evidenze.versione,recenti:recenti.map(s=>({sessionKey:s.sessionKey,round:s.round,circuitId:s.circuitId,driverIds:s.piloti.map(p=>p.driverId)})),limiti:evidenze.metodo.limiti};
 const {formatta}=require('../scripts/lib/testiRevisioneSemantica');
 for(const [lang,t] of Object.entries(require('../scripts/lib/testiEvidenze'))){
   const num=v=>typeof v==='number'?new Intl.NumberFormat(lang,{maximumFractionDigits:3,useGrouping:false}).format(v):v??'—';
   const fmt=(text,values)=>formatta(text,Object.fromEntries(Object.entries(values).map(([k,v])=>[k,num(v)])));
   for(const [campo,tipo] of [['passoGara','passo'],['gomme','gomme']]){
     const dettagli=recenti.map(s=>`${s.circuitId} (${s.year}, ${s.round}): `+s.piloti.map(p=>{
       const m=p[tipo];
       if(tipo==='passo')return `${p.codice}: `+fmt(m.overall===null?t.pochi:t.passo,{n:m.campione,indice:m.overall,delta:m.deltaMedianoPercentuale,dettaglio:''});
       const stint=m.stint.map(st=>fmt(t.stint,{codice:p.codice,mescola:st.mescola,inizio:st.giroInizio,fine:st.giroFine,giri:st.giri,eta:st.etaIniziale})).join(' ');
       return fmt(m.overall===null?t.gommePochi:t.gomme,{stint,pendenza:m.pendenzaRelativaPercentualePerGiro,n:m.campione,indice:m.overall});
     }).join(' ')).join('\n');
     const precedente=require('../utils/normalizzaNotaBene').normalizzaTestiAnnuali(analisi.traduzioni?.[lang]?.[campo] || analisi[campo] || '');
     const testo={...precedente,2026:[fmt(t.recente,{gp:recenti.length,dati:dettagli}),t.limite].join('\n')};
     analisi.traduzioni ||= {};analisi.traduzioni[lang] ||= {};analisi.traduzioni[lang][campo]=testo;
     if(lang==='it')analisi[campo]=testo;
   }
   if(o.stagioneCorrente){
     const st=o.stagioneCorrente,tr=o.campi.andamentoPerAnno;
     const testo=fmt(t.stagione,{round:Math.min(gara.ordineCalendario-1,campioni.ultimoRoundIncluso),gara:st.rendimento?.overall,nr:st.rendimento?.campione,qualifica:st.qualifica?.overall,nq:st.qualifica?.campione,recente:tr?.overall,delta:tr?.deltaOverall});
     const andamento={...require('../utils/normalizzaNotaBene').normalizzaTestiAnnuali(analisi.traduzioni[lang].andamentoPerAnno || analisi.andamentoPerAnno || ''),2026:testo};
     analisi.traduzioni[lang].andamentoPerAnno=andamento;if(lang==='it')analisi.andamentoPerAnno=andamento;
   }
 }
 return analisi;
}
module.exports={creaRevisione,similarita,aggiornaPasso};
