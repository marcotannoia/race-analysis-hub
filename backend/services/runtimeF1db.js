// Lo snapshot pubblicato è persistito nell'audit post-GP, non nel disco effimero Render.
const snapshot = require('../data/f1db-v2026.17.0-derivato.json');
let campioniRuntime = null;
let verificatoIl = 0;
let versione = null;
let inCorso;
let evidenzeRuntime = null;

function applicaRuntime(runtime) {
  if (!runtime?.snapshot || !runtime?.campioni) throw new Error('Snapshot runtime incompleto');
  Object.assign(snapshot.metadati, runtime.snapshot.metadati);
  for (const [k,v] of Object.entries(runtime.snapshot)) if(k !== 'metadati') snapshot[k]=v;
  campioniRuntime=runtime.campioni;
  evidenzeRuntime=runtime.evidenze || null;
}

async function caricaRuntime(pool, forza=false) {
  if(forza && inCorso){await inCorso;return caricaRuntime(pool,true);}
  if (!forza && Date.now()-verificatoIl<30000) return;
  if (!inCorso) inCorso=(async()=>{
    const r=await pool.query("select applied_at::text versione from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1");
    const nuova=r.rows[0]?.versione;
    if(nuova && nuova!==versione){
      // Carica il modulo che verifica gli hash dei file di training prima degli input runtime.
      require('./classificaCalibrata');
      const dati=await pool.query("select payload->'runtime' runtime from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1");
      applicaRuntime(dati.rows[0].runtime);
      require('../middleware/cacheApiV1').svuota();
      versione=nuova;
    }
    verificatoIl=Date.now();
  })().finally(()=>{inCorso=null;});
  return inCorso;
}

module.exports={applicaRuntime,caricaRuntime,campioniCorrenti:base=>campioniRuntime || base,evidenzeCorrenti:base=>evidenzeRuntime || base};
