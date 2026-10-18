const {database}=require('./connessione');
const MAPPA={race_pace:'passoGara',tyre_management:'gestioneGomme',performance:'rendimento',qualifying:'qualifica',completion:'completamento',annual_trend:'formaRecente',race_results:'storicoGara',qualifying_results:'storicoQualifica'};
async function leggiCatalogo(tabella,p,db=database()){
 const metricCase=`case d.slug ${Object.entries(MAPPA).map(([a,b])=>`when '${a}' then '${b}'`).join(' ')} end`;
 const q={
  f1_piloti:{from:'catalog.driver t',select:"jsonb_build_object('slug',t.slug,'nome',t.name,'codice',t.code,'numero',t.car_number,'nazionalita_iso2',t.nationality_iso2,'nazionalita_iso3',t.nationality_iso3,'f1_iscrizioni',coalesce((select jsonb_agg(distinct jsonb_build_object('anno',g.season,'scuderia_slug',team.slug)) from catalog.entry e join catalog.grand_prix g on g.id=e.grand_prix_id join catalog.team team on team.id=e.team_id where e.driver_id=t.id),'[]'::jsonb))",order:'t.slug',filtri:{}},
  f1_scuderie:{from:'catalog.team t',select:"jsonb_build_object('slug',t.slug,'nome',t.name,'abbreviazione',t.abbreviation,'colore',t.colour,'nazionalita',t.nationality)",order:'t.slug',filtri:{}},
  f1_gare:{from:'catalog.grand_prix t join catalog.circuit c on c.id=t.circuit_id',select:"jsonb_build_object('slug',t.slug,'anno',t.season,'circuito_slug',c.slug,'nome',t.name,'round',t.calendar_order,'stato',t.state,'f1_circuiti',jsonb_build_object('nome',t.circuit_name,'paese',t.country_name))",order:'t.season desc,t.calendar_order',filtri:{anno:'t.season',stato:'t.state'}},
  f1_metriche:{from:'ratings.dimension d',select:`jsonb_build_object('codice',${metricCase},'nome',d.name,'unita','0–100')`,where:`${metricCase} is not null`,order:'d.slug',filtri:{}},
  f1_importazioni:{from:'editorial.source_document t',select:"jsonb_build_object('id',t.mongo_id)",order:'t.imported_at desc',filtri:{}},
 };
 if(tabella==='f1_valutazioni'){
   const mapping=Object.entries(MAPPA).map(([a,b])=>`when '${a}' then '${b}'`).join(' ');
   const sub=tipo=>`select '${tipo}' as tipo,s.id,s.score,s.sample_size,s.model_version,s.source_release,s.calculated_at,e.slug as entita,g.slug as gara,g.season,t.slug as team,d.slug as dimensione,case d.slug ${mapping} end as metrica,(select coalesce(jsonb_agg(jsonb_build_object('fonte_url',f.url) order by f.url),'[]') from ratings.${tipo}_score_source f where f.score_id=s.id) as fonti from ratings.${tipo}_score s join catalog.${tipo} e on e.id=s.${tipo}_id join catalog.grand_prix g on g.id=s.grand_prix_id ${tipo==='driver'?'join catalog.entry entry on entry.grand_prix_id=g.id and entry.driver_id=e.id join catalog.team t on t.id=entry.team_id':'join catalog.team t on t.id=e.id'} join ratings.dimension d on d.id=s.dimension_id where s.model_version='risultati-semantici-v1'`;
   q.f1_valutazioni={from:`(${sub('driver')} union all ${sub('team')}) t`,select:"jsonb_build_object('analisi_id',concat(case when t.tipo='driver' then 'pilota' else 'scuderia' end,':',t.entita,':',t.gara),'anno',t.season,'metrica',t.metrica,'valore',t.score,'campione',t.sample_size,'stato',case when t.score is null then 'dati_insufficienti' else 'disponibile' end,'metodo',t.model_version,'ultimo_round_incluso',null,'f1_analisi',jsonb_build_object('gara_slug',t.gara,'pilota_slug',case when t.tipo='driver' then t.entita else null end,'scuderia_slug',t.team,'tipo',case when t.tipo='driver' then 'pilota' else 'scuderia' end),'f1_valutazioni_fonti',t.fonti)",order:'t.tipo,t.entita,t.gara,t.metrica',where:'t.metrica is not null',filtri:{anno:'t.season',metrica:'t.metrica','f1_analisi.gara_slug':'t.gara','f1_analisi.pilota_slug':"case when t.tipo='driver' then t.entita else null end",'f1_analisi.scuderia_slug':'t.team'}};
 }
 const cfg=q[tabella];if(!cfg)throw new Error('Tabella non consentita');
 const values=[],where=cfg.where?[cfg.where]:[];
 for(const[k,v]of Object.entries(p)){
  if(['select','order','limit','offset'].includes(k))continue;
  if(!Object.hasOwn(cfg.filtri,k)||typeof v!=='string'||!v.startsWith('eq.'))throw new Error('Filtro non consentito');
  values.push(v.slice(3));where.push(`(${cfg.filtri[k]})=$${values.length}`);
 }
 const limit=Number(p.limit||100),offset=Number(p.offset||0);
 if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>100000)throw new Error('Paginazione non valida');
 values.push(limit,offset);
 const result=await db.query(`select ${cfg.select} as dato from ${cfg.from} ${where.length?'where '+where.join(' and '):''} order by ${cfg.order} limit $${values.length-1} offset $${values.length}`,values);
 return result.rows.map(r=>r.dato);
}
module.exports={leggiCatalogo,MAPPA};
