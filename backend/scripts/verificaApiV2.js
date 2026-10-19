const assert = require('node:assert/strict');
const fs = require('node:fs');
const { percorsi } = require('../relational/applicazione');
const baseUrl = (process.env.API_BASE_URL || 'http://127.0.0.1:5003').replace(/\/$/, '');
const esempi = {pilotaSlug:'leclerc',scuderiaSlug:'ferrari',garaSlug:'usa-austin',
  primoPilotaSlug:'leclerc',secondoPilotaSlug:'hamilton',primaScuderiaSlug:'ferrari',secondaScuderiaSlug:'mercedes'};

function verificaAnalisi(dati) {
  if (!dati || typeof dati !== 'object') return;
  if (Object.hasOwn(dati,'valutazioni') && Object.hasOwn(dati,'gara')) {
    assert.ok(dati.prestazioni && typeof dati.prestazioni === 'object');
    assert.ok(dati.affidabilita===null || typeof dati.affidabilita==='number');
    assert.equal(dati.prestazioni.affidabilita,dati.affidabilita);
    assert.equal(typeof dati.nota_bene,'string');
    assert.equal(typeof dati.considerazioni_finali,'string');
    assert.equal(typeof dati.considerazioniFinali, 'string');
    assert.deepEqual(Object.keys(dati.overall).sort(),Object.keys(require('../services/recapNumerici').DEFINIZIONI).sort());
    assert.ok(dati.recapNumerici && dati.sintesiNumerica);
    assert.ok(dati.sintesiNumerica.coperturaPercentuale>=0 && dati.sintesiNumerica.coperturaPercentuale<=100);
    assert.ok(dati.sintesiNumerica.valore===null || (dati.sintesiNumerica.valore>=0 && dati.sintesiNumerica.valore<=100));
    for (const v of Object.values(dati.valutazioni))
      assert.ok(v === null || (typeof v === 'number' && v >= 0 && v <= 100));
  }
  for (const v of Object.values(dati)) verificaAnalisi(v);
}

async function main() {
  const risultati = [];
  async function controlla(percorso, stato=200) {
    const inizio = performance.now();
    const risposta = await fetch(baseUrl+percorso,{signal:AbortSignal.timeout(60000)});
    assert.equal(risposta.status, stato, percorso);
    const dati = await risposta.json();
    risultati.push({percorso,stato,ms:Math.round(performance.now()-inizio)});
    if(stato===200 && percorso.startsWith('/api/v2/') && !percorso.includes('openapi.json')) verificaAnalisi(dati);
    return dati;
  }
  await controlla('/api/v2');
  assert.equal((await controlla('/api/v2/health')).database,'supabase');
  const corrente=await controlla('/api/v2/gare/attuale');
  esempi.garaSlug=corrente.gara.slug;
  for(const nome of Object.keys(require('../relational/risorse'))){
    const dati=await controlla(`/api/v2/${nome}?limit=5`);
    assert.ok(dati.dati.length>0 && dati.dati.length<=5,nome);
  }
  for(const [p] of percorsi) await controlla('/api/v2'+p.replace(/:([A-Za-z]+)/g,(_,k)=>esempi[k]));
  await controlla('/api/v2/gare/non-attuale',404);
  await controlla('/api/v2/gare/non-attuale/piloti/leclerc/analisi',404);
  await controlla('/api/v2/gare/non-attuale/scuderie/ferrari/analisi',404);
  const gare=await controlla('/api/v2/gare');
  assert.ok(gare.dati.every(g=>g.slug===esempi.garaSlug && g.stato==='attuale'));
  assert.equal((await controlla('/api/v2/valutazioni?gara=non-attuale')).dati.length,0);
  await controlla('/api/v2/piloti/leclerc?lingua=en');
  for(const p of ['/api/v2/valutazioni?limit=101','/api/v2/risultati?foo=1','/api/v2/piloti/leclerc?lingua=xx']) await controlla(p,400);
  await controlla('/api/v2/inesistente',404);
  for(const p of ['/api/v1/health','/api/v1/home','/api/v1/piloti/leclerc','/api/v1/scuderie/ferrari','/api/v1/openapi.json']) await controlla(p);
  const spec=await controlla('/api/v2/openapi.json');
  assert.ok(spec.paths['/api/v2/home']);assert.ok(spec.paths['/api/v2/risultati']);
  const report={verificatoIl:new Date().toISOString(),baseUrl,endpoint:risultati};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({baseUrl,verificati:risultati.length,stato:'ok'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
