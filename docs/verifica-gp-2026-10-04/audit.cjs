/* Audit in sola lettura: non cambia dati, database, modello o deployment.
 * Uso: node docs/verifica-gp-2026-10-04/audit.cjs /percorso/f1db-v2026.16.0
 * Richiede i JSON estratti dalla release F1DB indicata nel rapporto.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const upstream = process.argv[2];
if (!upstream) throw new Error('Specificare la cartella dei JSON F1DB v2026.16.0');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const base = read(path.join(root, 'backend/data/dati-iniziali.json'));
const effective = require('../../backend/utils/datiEffettivi').creaDatiEffettivi(base);
const snapshot = require('../../backend/data/f1db-v2026.15.1-derivato.json');
const circuits = require('../../backend/data/circuiti-tecnici-2026.json');
const profiles = require('../../backend/data/profili-tecnici-2026.json');
const predictions = require('../../backend/services/classificaPrevisionale');
const { normalizzaTestiAnnuali } = require('../../backend/utils/normalizzaNotaBene');
const f1 = (name) => read(path.join(upstream, `f1db-${name}.json`));
const races = f1('races');
const driverData = f1('drivers');
const constructors = f1('constructors');
const standingsDrivers = f1('seasons-drivers').filter(x => x.year === 2026);
const standingsTeams = f1('seasons-constructors').filter(x => x.year === 2026);
const driverIds = { antonelli:'kimi-antonelli', hamilton:'lewis-hamilton', russell:'george-russell', leclerc:'charles-leclerc', norris:'lando-norris', max_verstappen:'max-verstappen', piastri:'oscar-piastri', hadjar:'isack-hadjar', lawson:'liam-lawson', tsunoda:'yuki-tsunoda', gasly:'pierre-gasly', arvid_lindblad:'arvid-lindblad', colapinto:'franco-colapinto', bearman:'oliver-bearman', bortoleto:'gabriel-bortoleto', sainz:'carlos-sainz-jr', albon:'alexander-albon', ocon:'esteban-ocon', hulkenberg:'nico-hulkenberg', alonso:'fernando-alonso', stroll:'lance-stroll', bottas:'valtteri-bottas', perez:'sergio-perez' };
const teamIds = {mercedes:'mercedes', ferrari:'ferrari', mclaren:'mclaren', red_bull:'red-bull', rb:'racing-bulls', alpine:'alpine', haas:'haas', audi:'audi', williams:'williams', aston_martin:'aston-martin', cadillac:'cadillac'};
const historicTeams = { ...Object.fromEntries(Object.entries(teamIds).map(([k,v]) => [k,{2023:[v],2024:[v],2025:[v]}])), rb:{2023:['alphatauri'],2024:['rb'],2025:['racing-bulls']}, audi:{2023:['alfa-romeo'],2024:['kick-sauber'],2025:['kick-sauber']}, cadillac:{2023:[],2024:[],2025:[]} };
const circuitIds = {'singapore-marina-bay':'marina-bay','usa-austin':'austin','messico-citta-del-messico':'mexico-city','brasile-interlagos':'interlagos','usa-las-vegas':'las-vegas','qatar-lusail':'lusail','abu-dhabi-yas-marina':'yas-marina'};
const dimNames = {efficienzaAerodinamica:'efficienza aerodinamica',potenzaDeployment:'potenza/deployment',curvaLenta:'curve lente',curvaMedia:'curve medie',curvaVeloce:'curve veloci',trazione:'trazione',frenata:'frenata',cordoli:'cordoli',gestioneGomme:'gestione gomme',stabilitaAssetto:'stabilità'};
const rankPriority = x => ({DSQ:5,EX:4,DNS:3,DNF:2,NC:1}[x.positionText] || 0);
function deduplicate(list) {
  const m = new Map();
  for (const x of list) {
    const key = `${x.raceId}|${x.driverId}`, old = m.get(key);
    if (!old || rankPriority(x) > rankPriority(old) || (rankPriority(x) === rankPriority(old) && x.positionDisplayOrder > old.positionDisplayOrder)) m.set(key,x);
  }
  return [...m.values()];
}
const rr = deduplicate(f1('races-race-results'));
const qr = deduplicate(f1('races-qualifying-results'));
const byDriver = new Map(driverData.map(x => [x.id,x]));
const byConstructor = new Map(constructors.map(x => [x.id,x]));
const teams = effective.scuderie;
const tm = new Map(teams.map(x => [x.slug,x]));
const drivers = effective.piloti.map(x => ({...x,scuderia:tm.get(x.scuderiaSlug)}));
const dm = new Map(drivers.map(x => [x.slug,x]));
const gps = effective.gare.filter(g => g.ordineCalendario >= 17);
const latestEvents = races.filter(x => x.year === 2026 && rr.some(r => r.raceId === x.id)).sort((a,b) => a.round-b.round);
const pos = (r,prefix='P') => !r ? 'assente' : Number.isInteger(r.positionNumber) ? `${prefix}${r.positionNumber}` : r.positionText;
const lookup = (list,race,driverId) => list.find(x => x.raceId === race?.id && x.driverId === driverId);
const historicRace = (slug,year) => races.find(x => x.circuitId === circuitIds[slug] && x.year === year);
function expectedHistory(a,kind,team) {
  return [2023,2024,2025].map(year => {
    const race = historicRace(a.garaSlug,year), list = kind === 'risultatiGara' ? rr : qr, prefix = kind === 'risultatiGara' ? 'P':'Q';
    if (team) {
      const rs = list.filter(x => x.raceId === race?.id && historicTeams[a.scuderiaSlug][year].includes(x.constructorId)).sort((a,b) => a.positionDisplayOrder-b.positionDisplayOrder);
      return `${year}: ${rs.length ? rs.map(r => `${byDriver.get(r.driverId).abbreviation} ${pos(r,prefix)}`).join(' / ') : 'NON PRESENTE IN F1'}`;
    }
    const r = lookup(list,race,driverIds[a.pilotaSlug]);
    return `${year}: ${r ? `${pos(r,prefix)} (${byConstructor.get(r.constructorId).name})` : 'NON CORSO IN F1'}`;
  }).join('\n');
}
function createSnapshot16() {
  return {...snapshot, andamento2026:{...snapshot.andamento2026,eventi:latestEvents.map(race => {
    const raceRows = rr.filter(x => x.raceId === race.id), qualifyingRows = qr.filter(x => x.raceId === race.id);
    return {raceId:race.id,round:race.round,data:race.date,grandPrixId:race.grandPrixId,circuitoId:race.circuitId,etichetta:race.circuitId,piloti:Object.fromEntries(drivers.map(d => [d.slug,{codice:d.codice,gara:lookup(rr,race,driverIds[d.slug])?.positionNumber ?? null,qualifica:lookup(qr,race,driverIds[d.slug])?.positionNumber ?? null}])),scuderie:Object.fromEntries(teams.map(t => {
      const rs = raceRows.filter(x => x.constructorId === teamIds[t.slug]), qs = qualifyingRows.filter(x => x.constructorId === teamIds[t.slug]);
      return [t.slug,{gara:Object.fromEntries(rs.map(x => [byDriver.get(x.driverId).abbreviation,x.positionNumber])),qualifica:Object.fromEntries(qs.map(x => [byDriver.get(x.driverId).abbreviation,x.positionNumber]))}];
    }))};
  })}};
}
const snapshot16 = createSnapshot16();
const standingsDiffs = [];
for (const [entity,list,ids,raw,key] of [['pilota',drivers,driverIds,standingsDrivers,'driverId'],['scuderia',teams,teamIds,standingsTeams,'constructorId']]) {
  for (const x of list) {
    const r = raw.find(v => v[key] === ids[x.slug]);
    const expected = {posizione:r?.positionNumber,punti:r?.totalPoints,vittorie:r?.totalRaceWins};
    if (JSON.stringify(expected) !== JSON.stringify(x.classifica2026)) standingsDiffs.push({entity,slug:x.slug,locale:x.classifica2026,upstream:expected});
  }
}
const contextStats = require('../../backend/data/statistiche-contesto.json');
const careerStarts = drivers.map(d => ({pilota:d.slug,locale:contextStats.piloti[d.slug]?.gareDisputate ?? null,f1db:byDriver.get(driverIds[d.slug]).totalRaceStarts}));
const archiveSepang = require('../../backend/data/archivio-gp/2026-05-bahrein-sepang.json');
const sepangRace = latestEvents.find(x => x.round === 16);
const archiveDiffs = archiveSepang.risultatiPiloti.flatMap(r => {
  const raw = lookup(rr,sepangRace,driverIds[r.pilotaSlug]);
  const expected = pos(raw);
  return r.posizioneGara === expected ? [] : [{pilota:r.pilotaSlug,locale:r.posizioneGara,classificazioneF1db:expected,causaRitiro:raw?.reasonRetired}];
});
const findings = [], predictionAudit = [], rows = [], calendarAudit = [];
const add = (code,context,detail) => findings.push({code,...context,detail});
const fields = ['passoGara','gestioneGomme','considerazioniFinali','affidabilita','aggiornamentiInArrivo'];
for (const g of gps) {
  const rawRace = races.find(x => x.year === 2026 && x.circuitId === circuitIds[g.slug]);
  const ca = {slug:g.slug,round:rawRace.round,dataUTC:rawRace.date,oraUTC:rawRace.time,sprint:!!rawRace.sprintRaceDate,fp1At:`${rawRace.freePractice1Date}T${rawRace.freePractice1Time}:00.000Z`,datiF1db:{lunghezzaKm:rawRace.courseLength,giri:rawRace.laps,distanzaKm:rawRace.distance,curve:rawRace.turns}};
  calendarAudit.push(ca);
  if (ca.fp1At !== circuits.circuiti[g.slug].fp1At) add('ORARIO_FP1',{gp:g.slug},{locale:circuits.circuiti[g.slug].fp1At,upstream:ca.fp1At});
  const staleFav = [...g.pilotiFavoriti.matchAll(/([A-Z]{3})\s*\(P(\d+) mondiale\)/g)].flatMap(([,code,n]) => {
    const d=drivers.find(d => d.codice===code); return d && Number(n)!==d.classifica2026.posizione ? [{pilota:code,testo:Number(n),corretto:d.classifica2026.posizione}]:[];
  });
  if(staleFav.length) add('FAVORITI_CLASSIFICA_VECCHIA',{gp:g.slug},staleFav);
  const aDrivers = effective.analisiGare.filter(a => a.garaSlug === g.slug), aTeams = effective.analisiScuderie.filter(a => a.garaSlug === g.slug);
  const args = {gara:g,piloti:drivers,scuderie:teams,analisiPiloti:aDrivers.map(a => ({...a,pilota:dm.get(a.pilotaSlug),scuderia:tm.get(a.scuderiaSlug),posizioniStoriche:normalizzaTestiAnnuali(a.risultatiGara),considerazioni:a.considerazioniFinali})),analisiScuderie:aTeams.map(a => ({...a,scuderia:tm.get(a.scuderiaSlug),considerazioni:a.considerazioniFinali}))};
  const model = predictions.creaClassificaPrevisionale(args), refreshed = predictions.creaClassificaPrevisionale({...args,snapshot:snapshot16});
  predictionAudit.push({gp:g.slug,scenario:'asciutto; meteo=null; nessuna penalità live iniettata',modelloLocale:model.modello,candidatiSimili:predictions.selezionaCircuitiSimili(g.slug,snapshot.andamento2026.eventi,100).length,circuitiSimili:model.circuitiSimili,classifica:model.classifica,soloSerieAggiornataA16:refreshed.classifica.map(x => ({pilota:x.pilota.slug,posizione:x.posizione,indice:x.indice})),variazioni:refreshed.classifica.map(x => {const old=model.classifica.find(o=>o.pilota.slug===x.pilota.slug);return {pilota:x.pilota.slug,indicePrima:old.indice,indiceDopo:x.indice,deltaIndice:Number((x.indice-old.indice).toFixed(1)),posizionePrima:old.posizione,posizioneDopo:x.posizione};}).filter(x=>x.deltaIndice!==0 || x.posizionePrima!==x.posizioneDopo)});
  for (const [team,list] of [[false,aDrivers],[true,aTeams]]) for (const a of list) {
    const slug=team?a.scuderiaSlug:a.pilotaSlug, context={gp:g.slug,tipo:team?'scuderia':'pilota',slug};
    const entity=team?tm.get(slug):dm.get(slug);
    const result={...context,storicoVerificato:true,risultatiGara:a.risultatiGara,risultatiQualifica:a.risultatiQualifica,riscontri:[],conclusioneEsistente:a.considerazioniFinali,aggiornamenti:a.aggiornamentiInArrivo||'',affidabilita:a.affidabilita||''};
    for (const field of ['risultatiGara','risultatiQualifica']) {
      const expected=expectedHistory(a,field,team);
      if(a[field]!==expected){result.storicoVerificato=false;add('STORICO_DIVERGENTE',context,{field,locale:a[field],upstream:expected});}
    }
    for (const field of fields) {
      const value=typeof a[field]==='object'?JSON.stringify(a[field]):String(a[field]||'');
      const pointMatch=value.match(/(?:Forma 2026: P\d+ con |2026: P\d+, |Forma 2026: P\d+, )(\d+) punti/);
      if(pointMatch&&Number(pointMatch[1])!==entity.classifica2026.punti){result.riscontri.push(`${field}: punti 2026 ${pointMatch[1]} → ${entity.classifica2026.punti}`);add('PUNTI_NEL_TESTO_VECCHI',context,{field,testo:Number(pointMatch[1]),corretto:entity.classifica2026.punti});}
      if(!ca.sprint && /formato Sprint|weekend Sprint/i.test(value)){result.riscontri.push(`${field}: riferimento Sprint non valido per il 2026`);add('SPRINT_NON_PREVISTA',context,{field});}
    }
    if(!result.aggiornamenti){result.riscontri.push('aggiornamenti futuri: campo vuoto, nessuna conclusione sulla loro assenza');add('AGGIORNAMENTI_NON_DOCUMENTATI',context,{});}
    if(!result.affidabilita){result.riscontri.push('affidabilità specifica: campo vuoto');add('AFFIDABILITA_NON_DOCUMENTATA',context,{});}
    if(!team){
      const hs=[2023,2024,2025].map(year=>{const race=historicRace(g.slug,year);const r=lookup(rr,race,driverIds[slug]),q=lookup(qr,race,driverIds[slug]);return {anno:year,gara:pos(r),qualifica:pos(q,'Q'),griglia:r?.gridPositionNumber??null,causaRitiro:r?.reasonRetired??null,scuderia:r?.constructorId??null};});
      result.storico=hs;
      result.recenti=latestEvents.slice(-3).map(race=>({round:race.round,circuito:race.circuitId,gara:pos(lookup(rr,race,driverIds[slug])),qualifica:pos(lookup(qr,race,driverIds[slug]),'Q')}));
      result.campioneStorico=hs.filter(x=>x.gara!=='assente').length;
      result.esitiAnomaliStorici=hs.filter(x=>x.causaRitiro || ['DNF','DNS','DSQ','NC','EX'].includes(x.gara) || ['DSQ','EX'].includes(x.qualifica)).length;
      const vals=hs.map(x=>Number(x.gara.match(/^P(\d+)$/)?.[1])).filter(Number.isFinite);result.migliorArrivoStorico=vals.length?Math.min(...vals):null;
      const cleanGrid=hs.filter(x=>x.gara!=='assente'&&x.griglia!==null);
      const claimedGrid=String(a.passoGara||'').match(/media griglia (\d+,\d)/);
      const actualGrid=cleanGrid.length?cleanGrid.reduce((n,x)=>n+x.griglia,0)/cleanGrid.length:null;
      if(claimedGrid&&actualGrid!==null&&Math.abs(Number(claimedGrid[1].replace(',','.'))-actualGrid)>0.11){result.riscontri.push('media griglia diversa dalle posizioni effettive di partenza; verificare qualifica, penalità e partenze dalla pit lane');add('MEDIA_GRIGLIA_DA_RIVEDERE',context,{testo:claimedGrid[1],mediaGrigliaF1db:actualGrid});}
    }
    rows.push(result);
  }
}
const inputs=['backend/data/dati-iniziali.json','backend/data/circuiti-tecnici-2026.json','backend/data/profili-tecnici-2026.json','backend/data/f1db-v2026.15.1-derivato.json','backend/data/statistiche-contesto.json','backend/data/archivio-gp/2026-05-bahrein-sepang.json','backend/services/classificaPrevisionale.js','backend/utils/datiEffettivi.js'];
const result={verificatoAlleUTC:new Date().toISOString(),dataRiferimento:'2026-10-04',f1db:{versione:'v2026.16.0',releaseUrl:'https://github.com/f1db/f1db/releases/tag/v2026.16.0',archivioSha256:'5bfcde5546bd16ec58a86a87c5d1e4c4150c2ec680480ea5cc487cb6223ea45f'},hashInput:Object.fromEntries(inputs.map(p=>[p,createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')])),copertura:{gp:gps.length,pilotiPerGp:22,scuderiePerGp:11,schede:rows.length,risultatiStoriciControllati:rows.length*3*2},classificheEffettiveDifferenze:standingsDiffs,partenzeCarriera:careerStarts,archivioSepangDifferenze:archiveDiffs,calendario:calendarAudit,riscontri:findings,schede:rows,previsioni:predictionAudit,diagnosiAggiornamento:predictions.valutaAggiornamento('Mercedes ha annunciato un ampio pacchetto per migliorare la stabilità, particolarmente utile per il circuito.','it',{stabilitaAssetto:98}),diagnosiPenalita:{indiceBase:40,posizioni:3,valorePenalita:predictions.valutaPenalita('Penalità confermata: 3 posizioni in griglia.').valore,indiceDopo:40*.65+70*.35}};
fs.writeFileSync(path.join(__dirname,'audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({copertura:result.copertura,classificheDifferenze:standingsDiffs.length,storicoDifferenze:findings.filter(x=>x.code==='STORICO_DIVERGENTE').length,riscontriPerTipo:findings.reduce((m,x)=>(m[x.code]=(m[x.code]||0)+1,m),{})},null,2));
