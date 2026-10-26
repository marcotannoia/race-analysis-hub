const express = require('express');

function creaRouter({ readImpl = (tabella, parametri) => require('./letturaCatalogo').leggiCatalogo(tabella,parametri,require('../config/database').getPool()) } = {}) {
  const router = express.Router();
  async function leggi(tabella, parametri = {}) {
    return readImpl(tabella, parametri);
  }
  router.use((req,res,next)=>{
    res.set('Cache-Control','no-store');
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) return res.status(405).set('Allow','GET, HEAD, OPTIONS').json({errore:'Sola lettura'});
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  router.get('/',(req,res)=>res.json({versione:2,scala:{min:0,max:100,mancante:null},
    risorse:Object.keys(require('./risorse')),
    servizi:require('./applicazione').percorsi.map(([p])=>p),
    fonte:require('../data/f1db-v2026.17.0-derivato.json').metadati,documentazione:'/api/v2/openapi.json',automazione:'/api/v2/automazione'}));
  router.get('/openapi.json',(req,res)=>res.json(require('./openapi')));
  router.get('/automazione',async(req,res,next)=>{
    try{res.json(await require('../services/aggiornamentoAutomaticoGp').statoAutomatico());}catch(e){next(e);}
  });
  router.get('/revisione-post-gp',async(req,res,next)=>{
    try{
      const r=await require('../config/database').getPool().query("select payload->'runtime'->'revisione' revisione from editorial.post_gp_update where payload->'runtime' ? 'revisione' order by applied_at desc limit 1");
      if(!r.rows[0])return res.status(404).json({errore:'REVISIONE_NON_DISPONIBILE'});
      res.json(r.rows[0].revisione);
    }catch(e){next(e);}
  });
  router.get('/health',async(req,res,next)=>{
    try { await leggi('f1_importazioni',{select:'id',limit:'1'}).then(rows=>{if(!rows.length)throw new Error('Importazione assente');}); res.json({stato:'ok',database:'supabase'}); }
    catch(e){e.status=503;next(e);}
  });
  const risorse = require('./risorse');
  for (const [percorso,config] of Object.entries(risorse)) {
    router.get(`/${percorso}`,async(req,res,next)=>{
      try {
        const filtri = config.filtri;
        if (Object.keys(req.query).some(k=>!['limit','offset',...filtri].includes(k))) return res.status(400).json({errore:'Parametro non supportato'});
        const params={select:config.select,order:config.order,limit:'100',offset:'0'};
        for (const k of ['limit','offset']) {
          if (req.query[k] !== undefined) {
            const v=req.query[k];
            if(typeof v !== 'string'||!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v))||Number(v)>(k==='limit'?100:1000000)|| (k==='limit'&&Number(v)<1)) return res.status(400).json({errore:'Paginazione non valida'});
            params[k]=v;
          }
        }
        for (const k of filtri) if(req.query[k]!==undefined) {
          const v=req.query[k];
          if(typeof v !== 'string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v) || (k==='anno'&&!/^\d{4}$/.test(v))) return res.status(400).json({errore:'Filtro non valido'});
          const campo=percorso === 'valutazioni' ? ({gara:'f1_analisi.gara_slug',pilota:'f1_analisi.pilota_slug',scuderia:'f1_analisi.scuderia_slug'}[k] || k) : k;
          params[campo]=`eq.${v}`;
        }
        const dati=await leggi(config.tabella,params);
        res.set('Cache-Control','no-store').json({dati,paginazione:{limit:Number(params.limit),offset:Number(params.offset)}});
      } catch(e){next(e);}
    });
  }
  router.use(require('./applicazione').creaRouterApplicazione());
  router.use((req,res)=>res.status(404).json({errore:'ENDPOINT_NON_TROVATO'}));
  router.use((e,req,res,next)=>{
    if(res.headersSent)return next(e);
    res.status(e.status||503).json({errore:'SUPABASE_NON_DISPONIBILE'});
  });
  return router;
}
module.exports={creaRouter};
