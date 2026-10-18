const risorse=['piloti','scuderie','gare','metriche','valutazioni'];
module.exports={openapi:'3.0.3',servers:[{url:'/'}],security:[],info:{title:'Race Analysis Hub — API relazionale',version:'2.0.0',license:require('../docs/openapi').info.license,
  description:'Valutazioni numeriche da 0 a 100; null significa dati insufficienti. Le risposte sono paginate, massimo 100 righe. I punteggi descrittivi non sono probabilità.'},
  paths:Object.fromEntries(risorse.map(r=>[`/api/v2/${r}`,{get:{operationId:`elenca_${r}_v2`,summary:`Elenco ${r}`,parameters:[
    {name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:100}},
    {name:'offset',in:'query',schema:{type:'integer',minimum:0,maximum:100000,default:0}},
    ...(r==='valutazioni'?['anno','metrica','gara','pilota','scuderia']:r==='gare'?['anno','stato']:[]).map(name=>({name,in:'query',schema:{type:'string'}}))
  ],responses:{200:{description:'Pagina di risultati',content:{'application/json':{schema:{type:'object',required:['dati','paginazione'],properties:{dati:{type:'array',items:r==='valutazioni'?{$ref:'#/components/schemas/Valutazione'}:{type:'object'}},paginazione:{type:'object'}}}}}},400:{description:'Parametri non validi'},503:{description:'Database non disponibile'}}}}])),
  components:{schemas:{Valutazione:{type:'object',required:['analisi_id','anno','metrica','valore','campione','stato'],properties:{
    analisi_id:{type:'string'},anno:{type:'integer'},metrica:{type:'string'},
    valore:{type:'number',nullable:true,minimum:0,maximum:100},campione:{type:'integer',minimum:0},
    stato:{type:'string'},metodo:{type:'string'},ultimo_round_incluso:{type:'integer',nullable:true},f1_analisi:{type:'object'}
  }}}}};
