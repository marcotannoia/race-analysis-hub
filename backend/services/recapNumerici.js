// Recap descrittivi delle evidenze: nessuna estrazione di numeri dalla prosa.
const DEFINIZIONI = Object.freeze({
  passoGara: ['campi','passoGara'], gestioneGomme: ['campi','gestioneGomme'],
  rendimento: ['stagioneCorrente','rendimento'], qualifica: ['stagioneCorrente','qualifica'],
  completamento: ['stagioneCorrente','completamento'], formaRecente: ['campi','andamentoPerAnno'],
  storicoGara: ['campi','risultatiGara'], storicoQualifica: ['campi','risultatiQualifica'],
});
function overallCompleti(analisi, presenta) {
  return Object.fromEntries(Object.entries(DEFINIZIONI).map(([nome,[sezione,campo]]) =>
    [nome,presenta(analisi.overallSemantici?.[sezione]?.[campo])]));
}
function creaRecapNumerici(overall) {
  const validi=Object.entries(overall).filter(([,v])=>v && Number.isFinite(v.valore) && v.valore>=0 && v.valore<=100);
  const coperturaPercentuale=Math.round(validi.length/Object.keys(DEFINIZIONI).length*1000)/10;
  const sintesi={
    valore:validi.length>=4?Math.round(validi.reduce((sum,[,v])=>sum+v.valore,0)/validi.length*10)/10:null,
    stato:validi.length>=4?'disponibile':'dati_insufficienti',
    metodo:'Media aritmetica delle metriche disponibili, almeno 4 su 8. Indice descrittivo non calibrato, non probabilità né previsione.',
    coperturaPercentuale,metricheIncluse:validi.map(([k])=>k),
    metricheMancanti:Object.keys(DEFINIZIONI).filter(k=>!validi.some(([v])=>v===k)),
    fonti:[...new Set(validi.flatMap(([,v])=>v.fonti))].sort(),
  };
  const mappa={passoGara:'passoGara',gestioneGomme:'gestioneGomme',risultatiGara:'storicoGara',
    risultatiQualifica:'storicoQualifica',andamentoPerAnno:'formaRecente'};
  const recap=Object.fromEntries(Object.entries(mappa).map(([campo,metrica])=>[campo,{
    metrica,valore:overall[metrica]?.valore??null,campione:overall[metrica]?.campione??0,
    fonti:overall[metrica]?.fonti??[],stato:overall[metrica]?'disponibile':'dati_insufficienti',
  }]));
  recap.considerazioniFinali={...sintesi};
  // Questi contenuti non rappresentano grandezze convertibili in un voto universale.
  for(const [campo,motivo] of Object.entries({
    affidabilita:'Il completamento include incidenti e squalifiche: non misura da solo l’affidabilità meccanica.',
    notaBene:'Le spiegazioni e le anomalie sono contesto, non una prestazione numerica.',
    penalita:'Le sanzioni conservano tipo e unità originali; non sono un indice di prestazione.',
    aggiornamentiInArrivo:'Un aggiornamento annunciato non quantifica il vantaggio effettivo.',
  }))recap[campo]={valore:null,stato:'non_quantificabile',motivo};
  recap.affidabilita.metricaAlternativa='completamento';
  return {recapNumerici:recap,sintesiNumerica:sintesi};
}
module.exports={DEFINIZIONI,overallCompleti,creaRecapNumerici};
