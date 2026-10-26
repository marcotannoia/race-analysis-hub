const risorse=Object.keys(require('./risorse'));
const originale=require('../docs/openapi');
module.exports={openapi:'3.1.0',servers:[{url:'/'}],security:[],info:{title:'Race Analysis Hub — API relazionale',version:'2.0.0',license:require('../docs/openapi').info.license,
  description:'Valutazioni numeriche da 0 a 100; null significa dati insufficienti. Le risorse GP sono limitate al GP attuale; i risultati includono le sue edizioni precedenti. Le risposte sono paginate, massimo 100 righe. I punteggi descrittivi non sono probabilità.'},
  paths:Object.fromEntries(risorse.map(r=>[`/api/v2/${r}`,{get:{operationId:`elenca_${r}_v2`,summary:`Elenco ${r}`,parameters:[
    {name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:100}},
    {name:'offset',in:'query',schema:{type:'integer',minimum:0,maximum:1000000,default:0}},
    ...require('./risorse')[r].filtri.map(name=>({name,in:'query',schema:{type:'string'}}))
  ],responses:{200:{description:'Pagina di risultati',content:{'application/json':{schema:{type:'object',required:['dati','paginazione'],properties:{dati:{type:'array',items:r==='valutazioni'?{$ref:'#/components/schemas/Valutazione'}:{type:'object'}},paginazione:{type:'object'}}}}}},400:{description:'Parametri non validi'},503:{description:'Database non disponibile'}}}}])),
  components:{schemas:{Valutazione:{type:'object',required:['analisi_id','anno','metrica','valore','campione','stato'],properties:{
    analisi_id:{type:'string'},anno:{type:'integer'},metrica:{type:'string'},
    valore:{type:'number',nullable:true,minimum:0,maximum:100},campione:{type:'integer',minimum:0},
    stato:{type:'string'},metodo:{type:'string'},ultimo_round_incluso:{type:['integer','null']},f1_analisi:{type:'object'}
  }}}}};

// I servizi compositi condividono il contratto applicativo, con testi editoriali e indici numerici v2.
const documento=module.exports;
const valutazione=documento.components.schemas.Valutazione;
documento.components=structuredClone(originale.components);
documento.components.schemas.Valutazione=valutazione;
documento.components.schemas.Valutazione.properties.valore={type:['number','null'],minimum:0,maximum:100};
const base=documento.components.schemas.AnalisiBase;
// Testi editoriali preservati, affidabilità meccanica numerica nella v2.
base.properties.affidabilita = {type:['number','null'],minimum:0,maximum:100};
base.properties.nota_bene = {type:'string'};
base.properties.considerazioni_finali = {type:'string'};
documento.components.schemas.Prestazioni.properties.affidabilita={type:['number','null'],minimum:0,maximum:100};
documento.components.schemas.ValutazioniNumeriche.properties.affidabilita={type:['number','null'],minimum:0,maximum:100};
for(const campo of ['aggiornatoIl','calcolatoIl']) documento.components.schemas.ClassificaPrevisionale.properties[campo]={type:'string',format:'date-time'};
documento.tags=originale.tags;
for(const [percorso] of require('./applicazione').percorsi){
  const chiave=percorso.replace(/:([A-Za-z]+)/g,'{$1}');
  const definizione=structuredClone(originale.paths[chiave]);
  definizione.get.operationId += '_v2';
  documento.paths['/api/v2'+chiave]=definizione;
}
documento.paths['/api/v2/health']={get:{operationId:'health_v2',summary:'Verifica accesso al database importato',responses:{200:{description:'Database disponibile'},503:{description:'Database non disponibile'}}}};
documento.paths['/api/v2/revisione-post-gp']={get:{operationId:'revisione_post_gp_v2',summary:'Giri osservati, revisione del modello e pattern esplorativi per i prossimi GP',responses:{200:{description:'Revisione con copertura, fonti, cutoff e limiti',content:{'application/json':{schema:{type:'object'}}}},404:{description:'Revisione non ancora disponibile'},503:{description:'Database non disponibile'}}}};
documento.paths['/api/v2']={get:{operationId:'indice_v2',summary:'Risorse e servizi disponibili',responses:{200:{description:'Indice API v2'}}}};
documento.paths['/api/v2/automazione']={get:{operationId:'automazione_gp_v2',summary:'Stato del controllo automatico post-GP',responses:{
  200:{description:'Configurazione, ultimo controllo e ultimo aggiornamento',content:{'application/json':{schema:{type:'object',properties:{
    abilitata:{type:'boolean'},intervalloMinuti:{type:'integer'},stato:{type:'string'},ultimoControlloIl:{type:'string',format:'date-time'},
    garaAttuale:{type:'string'},ultimoAggiornamentoIl:{type:'string',format:'date-time'},ultimoErrore:{type:['string','null']}}}}}},
  503:{description:'Database non disponibile'}}}};

delete documento.components.schemas.GaraBreve.properties.stato.const;
documento.components.schemas.GaraBreve.properties.stato.enum=['attuale'];
for(const p of ['/api/v2/gare/{garaSlug}','/api/v2/gare/{garaSlug}/piloti/{pilotaSlug}/analisi','/api/v2/gare/{garaSlug}/scuderie/{scuderiaSlug}/analisi'])
  documento.paths[p].get.description='Disponibile esclusivamente il Gran Premio attuale; gli altri GP restituiscono 404. Valutazioni numeriche 0–100 o null.';
