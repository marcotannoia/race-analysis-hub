const ambiente=require('../config/ambiente');
const {getPool,usaPostgres}=require('../config/database');
const fonti=require('./fontiPostGp');
const {preparaPostGp,giornataTerminata}=require('./preparaPostGp');
const {salvaPostGpAutomatico}=require('./salvaPostGpAutomatico');
const {caricaRuntime}=require('./runtimeF1db');
const CHIAVE='post_gp_2026';
const LOCK=180126;

const firmaRisultati=rs=>JSON.stringify(rs.map(r=>[String(r.driverNumber??r.driver_number),r.constructorId??r.constructor_id,
    r.positionNumber??r.position_number??null,r.positionText??r.position_text,Number(r.points??r.race_points??0),r.reasonRetired??r.race_reason_retired??null]).sort((a,b)=>a[0].localeCompare(b[0])));

async function statoAutomatico(pool=getPool()){
 const r=await pool.query('select status from editorial.automation_state where job_name=$1',[CHIAVE]);
 return {...(r.rows[0]?.status || {stato:'in_avvio'}),
   abilitata:ambiente.aggiornamentoGpAutomatico,intervalloMinuti:ambiente.intervalloGpMinuti,
   politica:'Fine giornata nel fuso del circuito, risultati F1DB completi e confronto con classifica finale FIA. Nessun risultato o indice mancante viene inventato.'};
}
async function salvaStato(pool,stato){
 await pool.query(`insert into editorial.automation_state(job_name,status,checked_at) values($1,$2::jsonb,$3)
   on conflict(job_name) do update set status=excluded.status,checked_at=excluded.checked_at,updated_at=now()`,[CHIAVE,JSON.stringify(stato),stato.ultimoControlloIl]);
}

async function controllaAggiornamentoGp({pool=getPool(),adesso=new Date(),dryRun=false,
  provider=fonti,salva=salvaPostGpAutomatico}={}){
 if(!usaPostgres() && pool===undefined)return {stato:'postgres_richiesto'};
 const client=await pool.connect();let locked=false;
 let status={ultimoControlloIl:adesso.toISOString()};
 try{
  locked=(await client.query('select pg_try_advisory_lock($1) locked',[LOCK])).rows[0].locked;
  if(!locked)return {stato:'altro_controllo_in_corso'};
  const precedente=await statoAutomatico(client);
  status={...precedente,...status};delete status.politica;delete status.abilitata;delete status.intervalloMinuti;
  await caricaRuntime(pool,true);
  const catalogo=(await client.query('select slug,season,calendar_order,state from catalog.grand_prix order by season,calendar_order')).rows;
  const current=catalogo.find(g=>g.state==='attuale');
  if(!current)return {stato:'calendario_completato'};
  status.garaAttuale=current.slug;
  if(!dryRun)await salvaStato(client,{...status,stato:'controllo_in_corso'});
  if(!dryRun)await require('./penalitaFia').sincronizzaPenalitaRiportate({adesso});
  delete status.avvisi;
  const {campioniCorrenti}=require('./runtimeF1db');
  const calendario=campioniCorrenti(require('../data/campioni-previsionali-2026.json')).gare;
  const gara=calendario.find(g=>g.year===current.season&&g.round===current.calendar_order);
  if(!gara || current.season!==2026)throw new Error('Calendario automatico non configurato per questa stagione');
  status.dataGara= gara.date;
  const terminata=giornataTerminata(gara,current.slug,adesso);
  const release=await provider.ultimaRelease();
  const asset=release.assets?.find(a=>a.name==='f1db-json-splitted.zip');
  const chiaveFonte=[release.tag_name,asset?.updated_at || release.published_at,asset?.digest || asset?.size].join('|');
  status.fonteDisponibile=release.tag_name;
  const audit=(await client.query("select payload->>'chiaveFonte' chiave,applied_at,(payload->>'stagioneCompletata')::boolean stagione_completata from editorial.post_gp_update where payload->>'tipo'='automatico-f1db-fia-v1' order by applied_at desc limit 1")).rows[0];
  const ultimaApplicata=audit?.chiave || precedente.ultimaFonteApplicata;
  if(chiaveFonte===ultimaApplicata){
    status.ultimaFonteApplicata=ultimaApplicata;
    if(audit){status.ultimoAggiornamentoIl=new Date(audit.applied_at).toISOString();status.stagioneCompletata=audit.stagione_completata;}
    // Ricontrolla l'ultima classifica ufficiale anche senza una nuova release F1DB.
    const ultimo=status.stagioneCompletata?current:catalogo.filter(g=>g.season===current.season&&g.state==='conclusa').at(-1);
    if(ultimo){
      const righe=(await client.query(`select rd.driver_number "driverNumber",rd.position_number "positionNumber",rd.position_text "positionText",
        rd.race_points points,rd.race_reason_retired "reasonRetired" from f1db.race_data rd join f1db.race r on r.id=rd.race_id
        where r.year=$1 and r.round=$2 and rd.type='RACE_RESULT'`,[ultimo.season,ultimo.calendar_order])).rows;
      status.ultimaVerificaFia=await provider.verificaFinale(ultimo.slug,righe);
    }
    status.stato=status.stagioneCompletata?'calendario_completato':terminata?'in_attesa_risultati':'in_attesa_fine_giornata';
    status.ultimoErrore=null;
    if(!dryRun)await salvaStato(client,status);
    return status;
  }
  const fonte=await provider.acquisisciRelease(release,current.season);
  const sourceMark=(await client.query('select max(imported_at)::text value from editorial.source_document')).rows[0].value;
  const precedentiRisultati=(await client.query(`select r.round,rd.driver_number,rd.constructor_id,rd.position_number,rd.position_text,rd.race_points,rd.race_reason_retired
    from f1db.race_data rd join f1db.race r on r.id=rd.race_id where r.year=$1 and rd.type='RACE_RESULT'`,[current.season])).rows;
  const rawRisultati=fonte.carica('f1db-races-race-results.json');
  const rettifiche=catalogo.filter(g=>g.season===current.season&&g.state==='conclusa'&&
    firmaRisultati(precedentiRisultati.filter(r=>r.round===g.calendar_order))!==firmaRisultati(rawRisultati.filter(r=>r.year===g.season&&r.round===g.calendar_order)));
  const ultimoRoundFonte=Math.max(...fonte.carica('f1db-races-race-results.json').filter(r=>r.year===current.season).map(r=>r.round));
  const documenti=(await client.query(`select s.collection_name,s.mongo_id,s.payload from editorial.source_document s
    where s.collection_name in ('piloti','scuderie','gare') or (s.collection_name in ('analisiGare','analisiScuderie') and s.payload->>'gara' in (
      select g.mongo_id from editorial.source_document g join catalog.grand_prix gp on gp.slug=g.payload->>'slug'
      where g.collection_name='gare' and gp.season=$1 and (gp.calendar_order between $2 and $3 or gp.calendar_order=any($4::int[]))))`,
    [current.season,current.calendar_order,Math.max(current.calendar_order,ultimoRoundFonte+1),rettifiche.map(g=>g.calendar_order)])).rows;
  const piano=preparaPostGp({fonte,documenti,adesso,rettifiche:rettifiche.map(g=>g.slug)});
  const prove=[];
  const daVerificare=[...new Map([...piano.conclusi,...rettifiche,catalogo.filter(g=>g.season===current.season&&g.state==='conclusa').at(-1)]
    .filter(Boolean).map(g=>[g.slug,g])).values()];
  for(const g of daVerificare.filter(Boolean)){
    const round=g.ordineCalendario || g.calendar_order;
    const rs=fonte.carica('f1db-races-race-results.json').filter(r=>r.year===current.season&&r.round===round);
    prove.push({gara:g.slug,...await provider.verificaFinale(g.slug,rs)});
  }
  const esito=await salva(client,piano,{fonte,prove,chiaveFonte,sourceMark,dryRun});
  if(!dryRun){
    status.garaAttuale=piano.target.slug;
    require('../repositories/postgresCompat').invalidate('Gara','Pilota','Scuderia','AnalisiGara','AnalisiScuderia');
    await caricaRuntime(pool,true);
    require('../middleware/cacheApiV1').svuota();
    try{await require('./penalitaFia').sincronizzaPenalitaRiportate({adesso});}
    catch(e){status.avvisi=['Verifica penalità riportate da ripetere'];console.error('Verifica penalità riportate rinviata:',e.message);}
  }
  status={...status,stato:piano.stagioneCompletata?'calendario_completato':piano.target.slug!==piano.current.slug?'aggiornato':terminata?'in_attesa_risultati':'dati_sincronizzati',ultimoAggiornamentoIl:adesso.toISOString(),
    ultimaFonteApplicata:chiaveFonte,garaAttuale:piano.target.slug,ultimaVerificaFia:prove.at(-1),
    stagioneCompletata:piano.stagioneCompletata,esito,ultimoErrore:null,piccoMemoriaMiB:Math.round(process.resourceUsage().maxRSS/1024)};
  status.ultimaVerificaFia=prove.find(p=>p.gara===piano.conclusi.at(-1)?.slug)||prove.at(-1);
  if(!dryRun)await salvaStato(client,status);
  return status;
 }catch(e){
  // Un errore conserva il GP corrente e fa riprovare al ciclo successivo.
  status={...status,stato:'in_attesa_fonti_verificate',ultimoErrore:e.code?'Verifica database o connessione non riuscita':e.message};
  if(!dryRun && locked)await salvaStato(client,status);
  throw e;
 }finally{
  if(locked)await client.query('select pg_advisory_unlock($1)',[LOCK]);
  client.release();
 }
}

function avviaAggiornamentoAutomaticoGp(){
 if(!ambiente.aggiornamentoGpAutomatico || !usaPostgres())return ()=>{};
 let attivo=true,timer,inCorso=false;
 async function tick(){
  if(!attivo || inCorso)return;
  inCorso=true;
  try{const esito=await controllaAggiornamentoGp();console.log('Controllo automatico GP:',esito.stato,esito.garaAttuale||'');}
  catch(e){console.error('Aggiornamento automatico GP rinviato:',e.message);}
  finally{inCorso=false;if(attivo){timer=setTimeout(tick,ambiente.intervalloGpMinuti*60000);timer.unref();}}
 }
 void tick();
 return ()=>{attivo=false;clearTimeout(timer);};
}
module.exports={controllaAggiornamentoGp,avviaAggiornamentoAutomaticoGp,statoAutomatico,firmaRisultati};
