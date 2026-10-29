const {createHash}=require('node:crypto');
const {CRITERI,confrontaCircuiti}=require('./similaritaCircuiti');
const CAMPI=Object.freeze({
  numeroCurve:['turn_count','smallint'],altitudineMetri:['altitude_m','numeric'],
  temperaturaAsfaltoC:['track_temperature_c','numeric'],temperaturaAriaC:['air_temperature_c','numeric'],
  numeroRettilinei:['straight_count','smallint'],lunghezzaRettilineiKm:['total_straights_km','numeric'],
  zoneSorpasso:['overtake_detection_count','smallint'],tipologia:['circuit_type','text'],
  gLateralePerKm:['lateral_g_per_km','numeric'],cambiDirezionePerKm:['direction_changes_per_km','numeric'],
  velocitaMediaKmh:['average_speed_kmh','numeric'],velocitaCurveKmh:['average_corner_speed_kmh','numeric'],
  velocitaMassimaKmh:['maximum_speed_kmh','numeric'],velocitaMinimaKmh:['minimum_speed_kmh','numeric'],
  gFrenataPerKm:['braking_g_per_km','numeric'],dislivelloMedio:['elevation_change_m','numeric'],
  caricoAerodinamico:['downforce_level','text'],umiditaPercentuale:['humidity_percent','numeric'],
  ventoMs:['wind_speed_ms','numeric'],meteoMedio:['rain_prevalent','boolean'],
  variabilitaMeteo:['weather_variability_percent','numeric'],distanzaGaraKm:['race_distance_km','numeric'],
});
const PROFILO=Object.freeze({season:'smallint',methodology_version:'text',circuit_id:'text',snapshot_date:'date',lap_length_km:'numeric',
  ...Object.fromEntries(Object.values(CAMPI)),source_observations:'jsonb',profile_context:'jsonb',dataset_metadata:'jsonb',
  criteria_definitions:'jsonb',dataset_sha256:'text',profile_sha256:'text'});
const CONFRONTO=Object.freeze({season:'smallint',methodology_version:'text',circuit_a_id:'text',circuit_b_id:'text',snapshot_date:'date',
  similarity_percent:'numeric',partial_similarity_percent:'numeric',coverage_percent:'numeric',interval_min_percent:'numeric',interval_max_percent:'numeric',
  compared_criteria:'smallint',total_criteria:'smallint',criteria_with_estimates:'smallint',usable_in_prediction:'boolean',
  details:'jsonb',dataset_sha256:'text',comparison_sha256:'text'});
function canonico(value){
  if(Array.isArray(value))return value.map(canonico);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonico(value[k])]));
  return value;
}
const hash=value=>createHash('sha256').update(JSON.stringify(canonico(value))).digest('hex');

function preparaImportazione(catalogo,datasetSha256){
  if(!/^[0-9a-f]{64}$/.test(datasetSha256))throw new Error('SHA-256 dataset non valido');
  const {circuiti,...metadata}=catalogo;
  const lista=Object.values(circuiti).sort((a,b)=>a.circuitId<b.circuitId?-1:a.circuitId>b.circuitId?1:0);
  if(lista.length!==23||new Set(lista.map(c=>c.circuitId)).size!==23)throw new Error('Sono richiesti 23 circuiti distinti');
  const chiavi=Object.keys(CAMPI).sort();
  const profili=lista.map(c=>{
    if(JSON.stringify(Object.keys(c.campi).sort())!==JSON.stringify(chiavi))throw new Error(`Schema incompleto: ${c.slug}`);
    if(!confrontaCircuiti(c,c).utilizzabileInPrevisione)throw new Error(`Valori o fonti non validi: ${c.slug}`);
    const {campi,...context}=c;
    const row={season:catalogo.stagione,methodology_version:catalogo.versione,circuit_id:c.circuitId,
      snapshot_date:catalogo.aggiornatoIl,lap_length_km:c.lunghezzaKm};
    for(const [key,[column,type]]of Object.entries(CAMPI))row[column]=type==='boolean'?campi[key].valore==='si':campi[key].valore;
    Object.assign(row,{source_observations:campi,profile_context:context,dataset_metadata:metadata,criteria_definitions:CRITERI,dataset_sha256:datasetSha256});
    row.profile_sha256=hash(row);return row;
  });
  const confronti=[];
  for(let i=0;i<lista.length;i++)for(const b of lista.slice(i+1)){
    const a=lista[i],r=confrontaCircuiti(a,b);
    if(!r.utilizzabileInPrevisione)throw new Error(`Confronto incompleto: ${a.slug}/${b.slug}`);
    const row={season:catalogo.stagione,methodology_version:catalogo.versione,circuit_a_id:a.circuitId,circuit_b_id:b.circuitId,
      snapshot_date:catalogo.aggiornatoIl,similarity_percent:r.similaritaPercentuale,partial_similarity_percent:r.similaritaParzialePercentuale,
      coverage_percent:r.coperturaPercentuale,interval_min_percent:r.intervalloPercentuale.minimo,interval_max_percent:r.intervalloPercentuale.massimo,
      compared_criteria:r.campiConfrontati,total_criteria:r.campiTotali,criteria_with_estimates:r.criteriConStime,
      usable_in_prediction:r.utilizzabileInPrevisione,details:r.dettagli,dataset_sha256:datasetSha256};
    row.comparison_sha256=hash(row);confronti.push(row);
  }
  return {profili,confronti};
}

const TABELLE=Object.freeze([
  {nome:'catalog.circuit_similarity_profile',colonne:PROFILO,chiavi:['season','methodology_version','circuit_id'],hash:'profile_sha256',righe:'profili'},
  {nome:'ratings.circuit_similarity',colonne:CONFRONTO,chiavi:['season','methodology_version','circuit_a_id','circuit_b_id'],hash:'comparison_sha256',righe:'confronti'},
]);
const record=colonne=>Object.entries(colonne).map(([k,t])=>`${k} ${t}`).join(',');
async function salvaRighe(client,t,righe){
  const cols=Object.keys(t.colonne);
  const updates=cols.filter(k=>!t.chiavi.includes(k)).map(k=>`${k}=excluded.${k}`).concat('updated_at=now()').join(',');
  const sql=`insert into ${t.nome} as target (${cols.join(',')})
    select ${cols.join(',')} from jsonb_to_recordset($1::jsonb) as x(${record(t.colonne)})
    on conflict (${t.chiavi.join(',')}) do update set ${updates}
    where target.${t.hash} is distinct from excluded.${t.hash}`;
  return (await client.query(sql,[JSON.stringify(righe)])).rowCount;
}
async function verificaImportazione(client,piano){
  const esito={};
  for(const t of TABELLE){
    const righe=piano[t.righe];const base=righe[0];
    const tot=await client.query(`select count(*)::int n from ${t.nome} where season=$1 and methodology_version=$2`,[base.season,base.methodology_version]);
    const join=t.chiavi.map(k=>`p.${k}=x.${k}`).join(' and ');
    const parity=await client.query(`select count(*)::int n from ${t.nome} p join jsonb_to_recordset($1::jsonb) as x(${record(t.colonne)}) on ${join}
      where (to_jsonb(p)-'created_at'-'updated_at')=to_jsonb(x)`,[JSON.stringify(righe)]);
    if(tot.rows[0].n!==righe.length||parity.rows[0].n!==righe.length)throw new Error(`Verifica integrale fallita: ${t.nome}`);
    esito[t.righe]=tot.rows[0].n;
  }
  return {...esito,campi:piano.profili.length*CRITERI.length,dettagliConfronti:piano.confronti.length*CRITERI.length};
}
async function importaInTransazione(client,piano){
  const modificati={};
  for(const t of TABELLE)modificati[t.righe]=await salvaRighe(client,t,piano[t.righe]);
  return {...await verificaImportazione(client,piano),modificati};
}
async function leggiCatalogoPostgres(client,{season=2026,version='similarita-multicriterio-v2'}={}){
  const result=await client.query(`select profile_context,source_observations,dataset_metadata from catalog.circuit_similarity_profile
    where season=$1 and methodology_version=$2 order by circuit_id`,[season,version]);
  if(!result.rows.length)throw new Error('Catalogo circuiti non importato nel database');
  const metadata=result.rows[0].dataset_metadata;
  return {...metadata,circuiti:Object.fromEntries(result.rows.map(r=>[r.profile_context.slug,{...r.profile_context,campi:r.source_observations}]))};
}
module.exports={CAMPI,TABELLE,preparaImportazione,importaInTransazione,verificaImportazione,leggiCatalogoPostgres};
