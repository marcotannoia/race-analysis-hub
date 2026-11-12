// Ricalcola posizione e indice finale dei GP non conclusi con il modello attivo e
// aggiorna favoriti e considerazioni nelle sei lingue. Condiviso da review:gp e dal
// ricalcolo degli overall; modifica piano.modifiche in place.
async function aggiornaPrevisioniFuture({piano,documents,gare,refs}){
 const {creaClassificaPrevisionale}=require('./classificaPrevisionale');
 require('./runtimeF1db').applicaRuntime(piano.runtime);
   const teamDocs=documents.filter(d=>d.collection_name==='scuderie').map(d=>d.payload);
   const driverDocs=documents.filter(d=>d.collection_name==='piloti').map(d=>d.payload);
   for(const g of gare.filter(g=>g.stato!=='conclusa')){
     const rows=piano.modifiche.filter(d=>d.collection_name==='analisiGare'&&d.payload.gara===g._id);
     const analisiPiloti=rows.map(d=>({...d.payload,pilota:driverDocs.find(p=>p._id===d.payload.pilota),scuderia:teamDocs.find(t=>t._id===d.payload.scuderia)}));
     const analisiScuderie=piano.modifiche.filter(d=>d.collection_name==='analisiScuderie'&&d.payload.gara===g._id)
       .map(d=>({...d.payload,scuderia:teamDocs.find(t=>t._id===d.payload.scuderia)}));
     const meteo=await require('./meteoGp').previsioneMeteo(g.slug);
     const classifica=creaClassificaPrevisionale({gara:g,piloti:driverDocs,scuderie:teamDocs,analisiPiloti,analisiScuderie,meteo}).classifica;
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
       const o=d.payload.overallSemantici;
       if(!r){
         o.campi.considerazioniFinali={overall:null,posizione:null,stato:'fuori_previsione',probabilita:false};
         d.payload.considerazioni='';
         for(const traduzione of Object.values(d.payload.traduzioni))traduzione.considerazioni='';
         continue;
       }
       const posizione=team?squadre.indexOf(r)+1:r.posizione,totale=team?squadre.length:classifica.length;
       o.campi.considerazioniFinali={overall:Math.round(r.indice*10)/10,posizione,stato:'stima_da_modello_attivo',probabilita:false};
       for(const [lang,t] of Object.entries(require('../scripts/lib/testiEvidenze'))){
         const values={posizione,totale,indice:o.campi.considerazioniFinali.overall,passo:o.campi.passoGara.overall,gomme:o.campi.gestioneGomme.overall};
         const testo=require('../scripts/lib/testiRevisioneSemantica').formatta(t.conclusione,Object.fromEntries(Object.entries(values).map(([k,v])=>[k,typeof v==='number'?new Intl.NumberFormat(lang,{maximumFractionDigits:3}).format(v):'—'])));
         d.payload.traduzioni[lang].considerazioni=testo;if(lang==='it')d.payload.considerazioni=testo;
       }
     }
   }
 return piano;
}
module.exports={aggiornaPrevisioniFuture};
