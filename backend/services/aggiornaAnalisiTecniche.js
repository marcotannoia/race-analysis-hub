const {getPool,usaPostgres}=require('../config/database');

async function aggiornaAnalisiTecniche(garaSlug,documento,{pool,dryRun=false}={}){
 if((!usaPostgres() && !pool) || documento.scuderie?.length!==11)return;
 const client=await (pool||getPool()).connect();
 try{
  await client.query('begin');await client.query('select pg_advisory_xact_lock(182026)');
  const refs=(await client.query("select collection_name,mongo_id,payload from editorial.source_document where collection_name in ('scuderie','gare')")).rows;
  const gara=refs.find(r=>r.collection_name==='gare'&&r.payload.slug===garaSlug);
  if(!gara)throw new Error('GP tecnico assente');
  const teams=new Map(refs.filter(r=>r.collection_name==='scuderie').map(r=>[r.payload.slug,r.mongo_id.trim()]));
  const analisi=(await client.query("select collection_name,mongo_id,payload from editorial.source_document where collection_name in ('analisiGare','analisiScuderie') and payload->>'gara'=$1",[gara.mongo_id.trim()])).rows;
  for(const a of analisi){
    const voce=documento.scuderie.find(t=>teams.get(t.slug)===a.payload.scuderia);
    if(!voce)throw new Error('Copertura scuderie tecniche incompleta');
    const info={fonte:'FIA',documentoUrl:documento.documentoUrl,sha256:documento.sha256,acquisitoIl:documento.acquisitoIl,
      stato:documento.ritirato?'ritirato':'pubblicato',nessunAggiornamento:voce.nessunAggiornamento,
      componenti:documento.ritirato?[]:voce.componenti,vantaggioMisurato:null};
    const testo=documento.ritirato?'FIA: documento ritirato; aggiornamenti da verificare.':voce.nessunAggiornamento?'FIA: nessun nuovo componente dichiarato per questo GP.':`FIA: ${voce.componenti.join(', ')}. Vantaggio prestazionale non misurato.`;
    const payload={...a.payload,aggiornamentiInArrivo:testo,aggiornamentiTecniciUfficiali:info,
      vantaggioAggiornamentiTecnici:null,statoAggiornamentiTecnici:documento.ritirato?'':voce.nessunAggiornamento?'nessunPacchetto':'confermato'};
    for(const traduzione of Object.values(payload.traduzioni||{}))delete traduzione.aggiornamentiInArrivo;
    await client.query('update editorial.source_document set payload=$1::jsonb,imported_at=now() where collection_name=$2 and mongo_id=$3',[JSON.stringify(payload),a.collection_name,a.mongo_id]);
  }
  await client.query(`update editorial.driver_analysis a set technical_upgrade_advantage=null,
    technical_upgrade_state=case when $3::boolean then '' when x."nessunAggiornamento" then 'nessunPacchetto' else 'confermato' end,updated_at=now()
    from catalog.grand_prix g,jsonb_to_recordset($2::jsonb) x(slug text,"nessunAggiornamento" boolean),catalog.team t
    where a.grand_prix_id=g.id and g.slug=$1 and t.slug=x.slug and a.team_id=t.id`,[garaSlug,JSON.stringify(documento.scuderie),Boolean(documento.ritirato)]);
  await client.query(dryRun?'rollback':'commit');
  if(!dryRun){
    require('../repositories/postgresCompat').invalidate('AnalisiGara','AnalisiScuderia');
    require('../middleware/cacheApiV1').svuota();
  }
 }catch(e){await client.query('rollback');throw e;}finally{client.release();}
}
module.exports={aggiornaAnalisiTecniche};
