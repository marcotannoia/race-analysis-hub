const {snake}=require('./preparaPostGp');

async function inserisciRecord(client,table,rows,chiave) {
  if(!rows.length)return;
  const [schema,nome]=table.split('.');
  const cols=(await client.query('select column_name from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position',[schema,nome])).rows.map(r=>r.column_name);
  const sconosciuti=Object.keys(rows[0]).filter(k=>!cols.includes(k)&&!(nome.startsWith('race_')&&['year','round'].includes(k)));
  if(sconosciuti.length)throw new Error(`Formato F1DB cambiato: ${nome}/${sconosciuti.join(',')}`);
  const aggiorna=cols.filter(c=>!chiave.includes(c)).map(c=>`"${c}"=excluded."${c}"`).join(',');
  for(let offset=0;offset<rows.length;offset+=500){
    await client.query(`insert into ${table} select * from jsonb_populate_recordset(null::${table},$1::jsonb) where true
      on conflict(${chiave.join(',')}) do update set ${aggiorna}`,[JSON.stringify(rows.slice(offset,offset+500))]);
  }
}

async function salvaPostGpAutomatico(client,piano,{fonte,prove,chiaveFonte,sourceMark,dryRun=false}={}){
 await client.query('begin');
 try{
  await client.query('select pg_advisory_xact_lock(182026)');
  await client.query("set local statement_timeout='120s'");
  const attuale=await client.query("select slug from catalog.grand_prix where state='attuale' for update");
  if(attuale.rows[0]?.slug!==piano.current.slug)throw new Error('GP cambiato durante il controllo: riprovare');
  const mark=await client.query('select max(imported_at)::text value from editorial.source_document');
  if(sourceMark && mark.rows[0].value!==sourceMark)throw new Error('Dati cambiati durante il controllo: riprovare');
  const dimensione=Number((await client.query('select pg_database_size(current_database()) n')).rows[0].n);
  if(dimensione>400*1024*1024)throw new Error('Spazio database insufficiente per un aggiornamento con backup');
  const ids=piano.gare.map(g=>g.id);
  const chiaviDocumenti=piano.modifiche.map(({collection_name,mongo_id})=>({collection_name,mongo_id}));
  const last=piano.conclusi.at(-1) || (await client.query("select slug from catalog.grand_prix where season=$1 and state='conclusa' order by calendar_order desc limit 1",[piano.anno])).rows[0];
  if(!last)throw new Error('GP di riferimento audit assente');
  const aggrega=(table,where='true')=>`(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from ${table} t where ${where})`;
  const auxiliary=Object.entries(piano.ausiliarie||{}).map(([table,data])=>`'${table}',${aggrega('f1db.'+table,data.chiave.includes('year')?'t.year=$3':'t.race_id=any($2::int[])')}`).join(',');
  // Il backup rimane dentro PostgreSQL: non duplica payload e risultati nella RAM del backend.
  await client.query(`insert into editorial.post_gp_update(grand_prix_id,payload)
    select g.id,jsonb_build_object('tipo','automatico-f1db-fia-v1','prima',jsonb_build_object(
      'documenti',(select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) from editorial.source_document s
        join jsonb_to_recordset($1::jsonb) x(collection_name text,mongo_id char(24)) using(collection_name,mongo_id)),
      'sessioni',${aggrega('f1db.race_data','t.race_id=any($2::int[])')},
      'gareF1db',${aggrega('f1db.race','t.id=any($2::int[])')},'gare',${aggrega('catalog.grand_prix')},
      'classificaPiloti',${aggrega('catalog.driver_standing_snapshot')},'classificaScuderie',${aggrega('catalog.team_standing_snapshot')},
      'punteggi',jsonb_build_object('driver',${aggrega('ratings.driver_score')},'driver_fonti',${aggrega('ratings.driver_score_source')},
        'team',${aggrega('ratings.team_score')},'team_fonti',${aggrega('ratings.team_score_source')}),
      'ausiliarie',jsonb_build_object(${auxiliary}))) from catalog.grand_prix g where g.slug=$4
    on conflict(grand_prix_id) do update set payload=excluded.payload ||
      jsonb_build_object('auditManualePrecedente',case when editorial.post_gp_update.payload->>'tipo'='automatico-f1db-fia-v1'
        then editorial.post_gp_update.payload->'auditManualePrecedente' else editorial.post_gp_update.payload end),applied_at=now()`,
    [JSON.stringify(chiaviDocumenti),ids,piano.anno,last.slug]);
  await inserisciRecord(client,'f1db.race',piano.gare.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[snake(k),v]))),['id']);
  // Sostituisce ciascuna sessione completa: una rettifica può rimuovere o riordinare righe.
  const sessioni=[...new Map(piano.sessioni.map(r=>[`${r.race_id}|${r.type}`,{race_id:r.race_id,type:r.type}])).values()];
  await client.query(`delete from f1db.race_data t using jsonb_to_recordset($1::jsonb) x(race_id integer,type text) where t.race_id=x.race_id and t.type=x.type`,[JSON.stringify(sessioni)]);
  await inserisciRecord(client,'f1db.race_data',piano.sessioni,['race_id','type','position_display_order']);
  for(const [table,data] of Object.entries(piano.ausiliarie||{})){
    await client.query(`delete from f1db.${table} where ${data.chiave.includes('year')?'year=$1':'race_id=any($1::int[])'}`,[data.chiave.includes('year')?piano.anno:ids]);
    await inserisciRecord(client,'f1db.'+table,data.righe,data.chiave);
  }
  const changed=await client.query(`update editorial.source_document s set payload=x.payload,imported_at=now()
    from jsonb_to_recordset($1::jsonb) x(collection_name text,mongo_id char(24),payload jsonb)
    where s.collection_name=x.collection_name and s.mongo_id=x.mongo_id`,[JSON.stringify(piano.modifiche)]);
  if(changed.rowCount!==piano.modifiche.length)throw new Error('Copertura documenti incompleta');
  for(const [tipo,n] of [['driver','piloti'],['team','scuderie']]){
    const rows=piano.modifiche.filter(r=>r.collection_name===n).map(r=>({slug:r.payload.slug,...r.payload.classifica2026}));
    const r=await client.query(`insert into catalog.${tipo}_standing_snapshot(season,${tipo}_id,position,points,wins,source_version)
      select $2,e.id,x.posizione,x.punti,x.vittorie,$3 from jsonb_to_recordset($1::jsonb) x(slug text,posizione integer,punti numeric,vittorie integer)
      join catalog.${tipo} e on e.slug=x.slug on conflict(season,${tipo}_id) do update set position=excluded.position,points=excluded.points,wins=excluded.wins,source_version=excluded.source_version`,[JSON.stringify(rows),piano.anno,fonte.versione]);
    if(r.rowCount!==rows.length)throw new Error('Copertura classifiche incompleta');
  }
  // Libera prima il vincolo del singolo GP attuale, poi assegna il successivo.
  if(piano.target.slug!==piano.current.slug)await client.query("update catalog.grand_prix set state='conclusa',concluded_at=now(),updated_at=now() where slug=$1",[piano.current.slug]);
  for(const g of piano.conclusi)if(g.slug!==piano.target.slug)
    await client.query("update catalog.grand_prix set state='conclusa',concluded_at=coalesce(concluded_at,now()),updated_at=now() where slug=$1",[g.slug]);
  await client.query("update catalog.grand_prix set state='attuale',concluded_at=null,updated_at=now() where slug=$1",[piano.target.slug]);
  for(const tipo of ['driver','team']){
    const rows=piano.scores.filter(s=>s.tipo===tipo),json=JSON.stringify(rows);
    const r=await client.query(`insert into ratings.${tipo}_score(${tipo}_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release)
      select e.id,g.id,d.id,'risultati-semantici-v1',x.valore,x.campione,null,$2 from jsonb_to_recordset($1::jsonb) x(slug text,gara text,dimensione text,valore numeric,campione integer)
      join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gara join ratings.dimension d on d.slug=x.dimensione
      on conflict(${tipo}_id,grand_prix_id,dimension_id,model_version) do update set score=excluded.score,sample_size=excluded.sample_size,source_release=excluded.source_release,calculated_at=now()`,[json,fonte.versione]);
    if(r.rowCount!==rows.length)throw new Error('Copertura valutazioni incompleta');
    await client.query(`delete from ratings.${tipo}_score_source f using ratings.${tipo}_score s,catalog.${tipo} e,catalog.grand_prix g,ratings.dimension d,
      jsonb_to_recordset($1::jsonb) x(slug text,gara text,dimensione text) where f.score_id=s.id and s.${tipo}_id=e.id and s.grand_prix_id=g.id and s.dimension_id=d.id
      and e.slug=x.slug and g.slug=x.gara and d.slug=x.dimensione and s.model_version='risultati-semantici-v1'`,[json]);
    await client.query(`insert into ratings.${tipo}_score_source(score_id,url) select s.id,u.url from jsonb_to_recordset($1::jsonb) x(slug text,gara text,dimensione text,fonti jsonb)
      join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gara join ratings.dimension d on d.slug=x.dimensione
      join ratings.${tipo}_score s on s.${tipo}_id=e.id and s.grand_prix_id=g.id and s.dimension_id=d.id and s.model_version='risultati-semantici-v1'
      cross join lateral jsonb_array_elements_text(x.fonti) u(url) on conflict do nothing`,[json]);
  }
  const check=await client.query(`select count(*)::int n from editorial.source_document s join jsonb_to_recordset($1::jsonb) x(collection_name text,mongo_id char(24),payload jsonb)
    using(collection_name,mongo_id) where s.payload=x.payload`,[JSON.stringify(piano.modifiche)]);
  if(check.rows[0].n!==piano.modifiche.length)throw new Error('Verifica finale documenti fallita');
  const audit={tipo:'automatico-f1db-fia-v1',fonte:fonte.versione,chiaveFonte,sha256:fonte.sha256,prove,
    garaPrecedente:piano.current.slug,garaSuccessiva:piano.target.slug,stagioneCompletata:piano.stagioneCompletata,
    runtime:piano.runtime,
    limiti:['Indici di pioggia/errori e misure di passo/gomme non sono inventati quando manca nuova evidenza verificata.']};
  await client.query(`update editorial.post_gp_update a set payload=a.payload||$2::jsonb from catalog.grand_prix g where a.grand_prix_id=g.id and g.slug=$1`,[last.slug,JSON.stringify(audit)]);
  await client.query(dryRun?'rollback':'commit');
  return {documenti:changed.rowCount,punteggi:piano.scores.length,righeSessione:piano.sessioni.length,
    da:piano.current.slug,a:piano.target.slug,dryRun,stagioneCompletata:piano.stagioneCompletata};
 }catch(e){await client.query('rollback');throw e;}
}
module.exports={salvaPostGpAutomatico,inserisciRecord};
