const {createHash}=require('node:crypto');
const {unzipSync,strFromU8}=require('fflate');
const {estraiDocumentiFia,estraiPaginePdf}=require('./aggiornamentiFia');
const {configurazioneEvento}=require('./profiliTecnici');

async function scarica(url,maxBytes=30*1024*1024,{fetchImpl=fetch,attendi=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
  const u=new URL(url);
  if(u.protocol!=='https:' || !(u.hostname==='api.github.com' || u.hostname==='github.com' || u.hostname==='fia.com' || u.hostname.endsWith('.fia.com')))
    throw new Error('Fonte post-GP non consentita');
  let r;
  for(let tentativo=0;tentativo<3;tentativo++){
    r=await fetchImpl(url,{headers:{'User-Agent':'RaceAnalysisHub-post-gp','Accept':'application/json,text/html,application/pdf,*/*'},signal:AbortSignal.timeout(30000)});
    if(r.ok)break;
    if(tentativo<2 && [429,500,502,503,504].includes(r.status)){
      await r.body?.cancel();await attendi(Math.min(5000,Math.max(1000*(tentativo+1),Number(r.headers.get('retry-after')||0)*1000)));
    }else throw new Error(`Fonte ${u.hostname}${u.pathname} non disponibile: HTTP ${r.status}`);
  }
  const finale=new URL(r.url);
  if(finale.protocol!=='https:' || !['github.com','api.github.com','release-assets.githubusercontent.com'].includes(finale.hostname) && !(finale.hostname==='fia.com'||finale.hostname.endsWith('.fia.com')))
    throw new Error('Redirect della fonte non consentito');
  if(Number(r.headers.get('content-length'))>maxBytes)throw new Error('Fonte troppo grande');
  const chunks=[];let n=0;
  for await(const b of r.body){n+=b.length;if(n>maxBytes)throw new Error('Fonte troppo grande');chunks.push(b);}
  return Buffer.concat(chunks);
}

async function ultimaRelease() {
  const release=JSON.parse(await scarica('https://api.github.com/repos/f1db/f1db/releases/latest',1024*1024));
  if(release.draft || release.prerelease || !/^v\d{4}\.\d+\.\d+$/.test(release.tag_name))throw new Error('Release F1DB non valida');
  return release;
}

function leggiArchivio(buffer,season=2026) {
  const nomi=[];
  unzipSync(buffer,{filter:f=>{
    if(f.originalSize>40*1024*1024)throw new Error('File F1DB troppo grande');
    if(f.name.endsWith('.json')&&!f.name.endsWith('.schema.json'))nomi.push(f.name);
    return false;
  }});
  const cache=new Map();
  function carica(nome) {
    if(!cache.has(nome)){
      if(!nomi.includes(nome))throw new Error(`File F1DB assente: ${nome}`);
      // Decompressione di un solo file alla volta per rispettare la RAM di Starter.
      const file=unzipSync(buffer,{filter:f=>f.name===nome})[nome];
      const righe=JSON.parse(strFromU8(file));
      if(!Array.isArray(righe))throw new Error('Formato F1DB non valido');
      cache.set(nome,righe.filter(r=>r.year===undefined || r.year>=season-3 && r.year<=season));
    }
    return cache.get(nome);
  }
  return {carica,nomi};
}

async function acquisisciRelease(release,season) {
  const root=`https://github.com/f1db/f1db/releases/download/${release.tag_name}/`;
  const checksums=(await scarica(root+'checksums_sha256.txt',32000)).toString('utf8');
  const digest=checksums.split(/\r?\n/).find(l=>/\bf1db-json-splitted\.zip$/.test(l))?.match(/^[a-f0-9]{64}/i)?.[0];
  if(!digest)throw new Error('Checksum F1DB assente');
  const buffer=await scarica(root+'f1db-json-splitted.zip');
  if(createHash('sha256').update(buffer).digest('hex')!==digest.toLowerCase())throw new Error('Checksum F1DB errato');
  return {...leggiArchivio(buffer,season),versione:release.tag_name,sha256:digest,url:root+'f1db-json-splitted.zip',pubblicatoIl:release.published_at};
}

function righePagina(pagina) {
  const righe=[];
  for(const e of [...pagina.elementi].sort((a,b)=>b.y-a.y||a.x-b.x)){
    let r=righe.find(r=>Math.abs(r.y-e.y)<1.8);
    if(!r){r={y:e.y,celle:[]};righe.push(r);}r.celle.push(e);
  }
  return righe.map(r=>({...r,celle:r.celle.sort((a,b)=>a.x-b.x)}));
}

function estraiClassifica(pagine) {
  const risultati=[];
  for(const pagina of pagine){
    const righe=righePagina(pagina);
    const header=righe.find(r=>r.celle.some(c=>c.testo.trim()==='NO')&&r.celle.some(c=>c.testo.trim()==='DRIVER')&&r.celle.some(c=>c.testo.trim()==='PTS'));
    if(!header)continue;
    const no=header.celle.find(c=>c.testo.trim()==='NO').x;
    const driver=header.celle.find(c=>c.testo.trim()==='DRIVER').x;
    const pts=header.celle.find(c=>c.testo.trim()==='PTS').x;
    for(const r of righe.filter(r=>r.y<header.y)){
      if(r.celle.some(c=>/FASTEST LAP|Race Distance|Stewards|INFRINGEMENT/i.test(c.testo)))break;
      const numero=r.celle.find(c=>c.x>=no-2&&c.x<driver-2&&/^\d{1,2}$/.test(c.testo.trim()));
      if(!numero || !r.celle.some(c=>c.x>=driver-2&&c.x<driver+100&&/[a-z]/i.test(c.testo)))continue;
      const posizione=r.celle.find(c=>c.x<no-2&&/^\d{1,2}$/.test(c.testo.trim()));
      const punti=r.celle.find(c=>c.x>=pts-3&&/^\d+(?:\.\d+)?$/.test(c.testo.trim()));
      risultati.push({numero:Number(numero.testo),posizione:posizione?Number(posizione.testo):null,punti:punti?Number(punti.testo):0});
    }
  }
  if(risultati.length<10 || new Set(risultati.map(r=>r.numero)).size!==risultati.length)throw new Error('Classifica FIA incompleta o non riconosciuta');
  return risultati;
}

function confrontaClassifica(ufficiali,risultati) {
  if(ufficiali.length!==risultati.length)throw new Error('Copertura FIA/F1DB diversa');
  const byNumber=new Map(risultati.map(r=>[Number(r.driverNumber),r]));
  for(const u of ufficiali){
    const r=byNumber.get(u.numero);
    if(!r || Number(r.points)!==u.punti || (u.posizione!==null && r.positionNumber!==u.posizione) ||
      (u.posizione===null && !r.reasonRetired && !['DNS','DSQ','EX','DNF','NC'].includes(r.positionText)))
      throw new Error(`Classifica FIA/F1DB non allineata: vettura ${u.numero}`);
  }
}

async function documentiEvento(slug) {
  const config=configurazioneEvento(slug);
  if(!config)throw new Error('Evento FIA non configurato');
  const html=(await scarica(config.paginaFia,5*1024*1024)).toString('utf8');
  const documenti=estraiDocumentiFia(html,config.paginaFia).filter(d=>!/recalled|withdrawn/i.test(d.titolo));
  if(!documenti.length)throw new Error('Elenco documenti FIA non disponibile o non riconosciuto');
  return documenti;
}

async function verificaFinale(slug,risultati) {
  const documenti=await documentiEvento(slug);
  const doc=documenti.filter(d=>/\b(?:revised )?final race classification\b/i.test(d.titolo)&&!/provisional/i.test(d.titolo))
    .sort((a,b)=>(b.pubblicatoIl||0)-(a.pubblicatoIl||0))[0];
  if(!doc)throw new Error('Classifica finale FIA non ancora disponibile');
  const buffer=await scarica(doc.url);
  confrontaClassifica(estraiClassifica(await estraiPaginePdf(buffer)),risultati);
  return {...doc,sha256:createHash('sha256').update(buffer).digest('hex')};
}

module.exports={scarica,ultimaRelease,leggiArchivio,acquisisciRelease,estraiClassifica,confrontaClassifica,verificaFinale,documentiEvento};
