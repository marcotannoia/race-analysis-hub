const {gzipSync}=require('node:zlib');

async function salvaRevisione(client,piano,{sourceMark,documenti,versioneAudit,dryRun=true}){
 await client.query('begin');
 try{
   await client.query('select pg_advisory_xact_lock(182026)');
   await client.query("set local statement_timeout='60s'");
   const mark=(await client.query('select max(imported_at)::text value from editorial.source_document')).rows[0].value;
   if(mark!==sourceMark)throw new Error('Dati cambiati durante la revisione: riprovare');
   const audit=(await client.query("select grand_prix_id,applied_at::text versione from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1 for update")).rows[0];
   if(audit.versione!==versioneAudit)throw new Error('Corpus cambiato durante la revisione');
   const backup={documenti,punteggi:{}};
   for(const tipo of ['driver','team']){
     backup.punteggi[tipo]=(await client.query(`select * from ratings.${tipo}_score`)).rows;
     backup.punteggi[tipo+'_fonti']=(await client.query(`select * from ratings.${tipo}_score_source`)).rows;
   }
   // Il backup è compresso nel client: evitare grandi jsonb_agg di tutti i testi
   // multilingue nel database con risorse limitate. Ripristino: gunzip + JSON.parse.
   const compresso=gzipSync(JSON.stringify(backup)).toString('base64');
   await client.query(`update editorial.post_gp_update set payload=jsonb_set(payload,'{reviewBackup}',$2::jsonb),applied_at=now() where grand_prix_id=$1`,
     [audit.grand_prix_id,JSON.stringify({encoding:'gzip-base64',creatoIl:new Date().toISOString(),data:compresso})]);
   for(let i=0;i<piano.modifiche.length;i+=12){
     const batch=JSON.stringify(piano.modifiche.slice(i,i+12));
     const r=await client.query(`update editorial.source_document s set payload=x.payload,imported_at=now()
       from jsonb_to_recordset($1::jsonb) x(collection_name text,mongo_id char(24),payload jsonb)
       where s.collection_name=x.collection_name and s.mongo_id=x.mongo_id`,[batch]);
     if(r.rowCount!==piano.modifiche.slice(i,i+12).length)throw new Error('Copertura documenti incompleta');
     const check=await client.query(`select count(*)::int n from editorial.source_document s
       join jsonb_to_recordset($1::jsonb) x(collection_name text,mongo_id char(24),payload jsonb) using(collection_name,mongo_id) where s.payload=x.payload`,[batch]);
     if(check.rows[0].n!==r.rowCount)throw new Error('Verifica documenti non riuscita');
   }
   for(const tipo of ['driver','team']){
     const rows=piano.scores.filter(s=>s.tipo===tipo);
     for(let i=0;i<rows.length;i+=100){
       const batch=JSON.stringify(rows.slice(i,i+100));
       const r=await client.query(`insert into ratings.${tipo}_score(${tipo}_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release)
         select e.id,g.id,d.id,case when x.dimensione='reliability' then 'affidabilita-meccanica-v1' else 'risultati-semantici-v1' end,x.valore,x.campione,null,$2
         from jsonb_to_recordset($1::jsonb) x(slug text,gara text,dimensione text,valore numeric,campione integer)
         join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gara join ratings.dimension d on d.slug=x.dimensione
         on conflict(${tipo}_id,grand_prix_id,dimension_id,model_version) do update set score=excluded.score,sample_size=excluded.sample_size,confidence=null,source_release=excluded.source_release,calculated_at=now()`,[batch,piano.runtime.snapshot.metadati.versione]);
       if(r.rowCount!==rows.slice(i,i+100).length)throw new Error('Copertura punteggi incompleta');
       await client.query(`delete from ratings.${tipo}_score_source f using ratings.${tipo}_score s,catalog.${tipo} e,catalog.grand_prix g,ratings.dimension d,
         jsonb_to_recordset($1::jsonb) x(slug text,gara text,dimensione text) where f.score_id=s.id and s.${tipo}_id=e.id and s.grand_prix_id=g.id and s.dimension_id=d.id
         and e.slug=x.slug and g.slug=x.gara and d.slug=x.dimensione and s.model_version=case when x.dimensione='reliability' then 'affidabilita-meccanica-v1' else 'risultati-semantici-v1' end`,[batch]);
       await client.query(`insert into ratings.${tipo}_score_source(score_id,url) select s.id,u.url
         from jsonb_to_recordset($1::jsonb) x(slug text,gara text,dimensione text,fonti jsonb)
         join catalog.${tipo} e on e.slug=x.slug join catalog.grand_prix g on g.slug=x.gara join ratings.dimension d on d.slug=x.dimensione
         join ratings.${tipo}_score s on s.${tipo}_id=e.id and s.grand_prix_id=g.id and s.dimension_id=d.id
         and s.model_version=case when x.dimensione='reliability' then 'affidabilita-meccanica-v1' else 'risultati-semantici-v1' end
         cross join lateral jsonb_array_elements_text(x.fonti) u(url) on conflict do nothing`,[batch]);
     }
   }
   await client.query(`update editorial.post_gp_update set payload=jsonb_set(payload,'{runtime}',$2::jsonb),applied_at=now() where grand_prix_id=$1`,[audit.grand_prix_id,JSON.stringify(piano.runtime)]);
   await client.query(dryRun?'rollback':'commit');
   return {documenti:piano.modifiche.length,punteggi:piano.scores.length,dryRun,backupCompressoBytes:Buffer.byteLength(compresso)};
 }catch(e){await client.query('rollback');throw e;}
}
module.exports={salvaRevisione};
