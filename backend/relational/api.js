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
    risorse:['piloti','scuderie','gare','metriche','valutazioni'],
    fonte:require('../data/f1db-v2026.17.0-derivato.json').metadati,documentazione:'/api/v2/openapi.json'}));
  router.get('/openapi.json',(req,res)=>res.json(require('./openapi')));
  router.get('/health',async(req,res,next)=>{
    try { await leggi('f1_importazioni',{select:'id',limit:'1'}).then(rows=>{if(!rows.length)throw new Error('Importazione assente');}); res.json({stato:'ok',database:'supabase'}); }
    catch(e){e.status=503;next(e);}
  });
  const risorse = {
    piloti:{tabella:'f1_piloti',select:'*,f1_iscrizioni(anno,scuderia_slug)',order:'slug'},
    scuderie:{tabella:'f1_scuderie',select:'*',order:'slug'},
    gare:{tabella:'f1_gare',select:'*,f1_circuiti(nome,paese)',order:'anno.desc,round'},
    metriche:{tabella:'f1_metriche',select:'*',order:'codice'},
    valutazioni:{tabella:'f1_valutazioni',select:'*,f1_analisi!inner(gara_slug,pilota_slug,scuderia_slug,tipo),f1_valutazioni_fonti(fonte_url)',order:'analisi_id,anno,metrica'},
  };
  for (const [percorso,config] of Object.entries(risorse)) {
    router.get(`/${percorso}`,async(req,res,next)=>{
      try {
        const filtri = percorso === 'valutazioni' ? ['anno','metrica','gara','pilota','scuderia'] : (percorso === 'gare' ? ['anno','stato'] : []);
        if (Object.keys(req.query).some(k=>!['limit','offset',...filtri].includes(k))) return res.status(400).json({errore:'Parametro non supportato'});
        const params={select:config.select,order:config.order,limit:'100',offset:'0'};
        for (const k of ['limit','offset']) {
          if (req.query[k] !== undefined) {
            const v=req.query[k];
            if(typeof v !== 'string'||!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v))||Number(v)>(k==='limit'?100:100000)|| (k==='limit'&&Number(v)<1)) return res.status(400).json({errore:'Paginazione non valida'});
            params[k]=v;
          }
        }
        for (const k of filtri) if(req.query[k]!==undefined) {
          const v=req.query[k];
          if(typeof v !== 'string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v) || (k==='anno'&&!/^\d{4}$/.test(v))) return res.status(400).json({errore:'Filtro non valido'});
          const campo={gara:'f1_analisi.gara_slug',pilota:'f1_analisi.pilota_slug',scuderia:'f1_analisi.scuderia_slug'}[k] || k;
          params[campo]=`eq.${v}`;
        }
        const dati=await leggi(config.tabella,params);
        res.set('Cache-Control','public, max-age=300').json({dati,paginazione:{limit:Number(params.limit),offset:Number(params.offset)}});
      } catch(e){next(e);}
    });
  }
  router.use((e,req,res,next)=>{
    if(res.headersSent)return next(e);
    res.status(e.status||503).json({errore:'SUPABASE_NON_DISPONIBILE'});
  });
  return router;
}
module.exports={creaRouter};
