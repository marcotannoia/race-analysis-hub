const {database}=require('./connessione');
const MAPPA={reliability:'affidabilita',race_pace:'passoGara',tyre_management:'gestioneGomme',performance:'rendimento',qualifying:'qualifica',completion:'completamento',annual_trend:'formaRecente',race_results:'storicoGara',qualifying_results:'storicoQualifica'};
async function leggiCatalogo(tabella,p,db=database()){
 const metricCase=`case d.slug ${Object.entries(MAPPA).map(([a,b])=>`when '${a}' then '${b}'`).join(' ')} end`;
 const q={
  f1_piloti:{from:'catalog.driver t',select:"jsonb_build_object('slug',t.slug,'nome',t.name,'codice',t.code,'numero',t.car_number,'nazionalita_iso2',t.nationality_iso2,'nazionalita_iso3',t.nationality_iso3,'f1_iscrizioni',coalesce((select jsonb_agg(distinct jsonb_build_object('anno',g.season,'scuderia_slug',team.slug)) from catalog.entry e join catalog.grand_prix g on g.id=e.grand_prix_id join catalog.team team on team.id=e.team_id where e.driver_id=t.id and g.state='attuale'),'[]'::jsonb))",order:'t.slug',filtri:{}},
  f1_scuderie:{from:'catalog.team t',select:"jsonb_build_object('slug',t.slug,'nome',t.name,'abbreviazione',t.abbreviation,'colore',t.colour,'nazionalita',t.nationality)",order:'t.slug',filtri:{}},
  f1_gare:{from:'catalog.grand_prix t join catalog.circuit c on c.id=t.circuit_id',select:"jsonb_build_object('slug',t.slug,'anno',t.season,'circuito_slug',c.slug,'nome',t.name,'round',t.calendar_order,'stato',t.state,'f1_circuiti',jsonb_build_object('nome',t.circuit_name,'paese',t.country_name))",order:'t.season desc,t.calendar_order',filtri:{anno:'t.season',stato:'t.state'}},
  f1_metriche:{from:'ratings.dimension d',select:`jsonb_build_object('codice',${metricCase},'nome',d.name,'unita','0–100')`,where:`${metricCase} is not null`,order:'d.slug',filtri:{}},
  f1_circuiti:{from:'catalog.circuit t',select:"jsonb_build_object('slug',t.slug,'nome',t.name,'f1db_id',t.f1db_circuit_id)",order:'t.slug',filtri:{}},
  f1_iscrizioni:{from:'catalog.entry t join catalog.grand_prix g on g.id=t.grand_prix_id join catalog.driver d on d.id=t.driver_id join catalog.team team on team.id=t.team_id',select:"jsonb_build_object('anno',g.season,'gara_slug',g.slug,'pilota_slug',d.slug,'scuderia_slug',team.slug)",order:'g.season,g.calendar_order,d.slug',filtri:{anno:'g.season',gara:'g.slug',pilota:'d.slug',scuderia:'team.slug'}},
  f1_risultati:{
    from:'f1db.race_data t join f1db.race r on r.id=t.race_id',
    select:"jsonb_build_object('gara_id',r.id,'anno',r.year,'round',r.round,'data',r.date,'circuito_id',r.circuit_id,'sessione',t.type,'ordine',t.position_display_order,'posizione',t.position_number,'stato',t.position_text,'pilota_id',t.driver_id,'scuderia_id',t.constructor_id,'dati',to_jsonb(t)-'race_id'-'type'-'driver_id'-'constructor_id')",
    order:'r.year desc,r.round desc,t.type,t.position_display_order',
    filtri:{anno:'r.year',sessione:'t.type',
      gara:n=>`r.circuit_id in (select c.f1db_circuit_id from catalog.grand_prix g join catalog.circuit c on c.id=g.circuit_id where g.slug=$${n})`,
      pilota:n=>`t.driver_id in (select d.f1db_driver_id from catalog.driver d where d.slug=$${n})`,
      scuderia:n=>`t.constructor_id in (select s.f1db_constructor_id from catalog.team s where s.slug=$${n})`},
  },
  f1_importazioni:{from:'editorial.source_document t',select:"jsonb_build_object('id',t.mongo_id)",order:'t.imported_at desc',filtri:{}},
 };
 if(tabella==='f1_valutazioni'){
   const mapping=Object.entries(MAPPA).map(([a,b])=>`when '${a}' then '${b}'`).join(' ');
   const sub=tipo=>`select '${tipo}' as tipo,s.id,s.score,s.sample_size,s.model_version,s.source_release,s.calculated_at,e.slug as entita,g.slug as gara,g.season,t.slug as team,d.slug as dimensione,case d.slug ${mapping} end as metrica,(select coalesce(jsonb_agg(jsonb_build_object('fonte_url',f.url) order by f.url),'[]') from ratings.${tipo}_score_source f where f.score_id=s.id) as fonti from ratings.${tipo}_score s join catalog.${tipo} e on e.id=s.${tipo}_id join catalog.grand_prix g on g.id=s.grand_prix_id ${tipo==='driver'?'join catalog.entry entry on entry.grand_prix_id=g.id and entry.driver_id=e.id join catalog.team t on t.id=entry.team_id':'join catalog.team t on t.id=e.id'} join ratings.dimension d on d.id=s.dimension_id where s.model_version=case when d.slug='reliability' then 'affidabilita-meccanica-v1' else 'risultati-semantici-v1' end`;
   q.f1_valutazioni={from:`(${sub('driver')} union all ${sub('team')}) t`,select:"jsonb_build_object('analisi_id',concat(case when t.tipo='driver' then 'pilota' else 'scuderia' end,':',t.entita,':',t.gara),'anno',t.season,'metrica',t.metrica,'valore',t.score,'campione',t.sample_size,'stato',case when t.score is null then 'dati_insufficienti' else 'disponibile' end,'metodo',t.model_version,'ultimo_round_incluso',null,'f1_analisi',jsonb_build_object('gara_slug',t.gara,'pilota_slug',case when t.tipo='driver' then t.entita else null end,'scuderia_slug',t.team,'tipo',case when t.tipo='driver' then 'pilota' else 'scuderia' end),'f1_valutazioni_fonti',t.fonti)",order:'t.tipo,t.entita,t.gara,t.metrica',where:'t.metrica is not null',filtri:{anno:'t.season',metrica:'t.metrica','f1_analisi.gara_slug':'t.gara','f1_analisi.pilota_slug':"case when t.tipo='driver' then t.entita else null end",'f1_analisi.scuderia_slug':'t.team'}};
 }
 const cfg=q[tabella];if(!cfg)throw new Error('Tabella non consentita');
 // Il contesto pubblico segue sempre lo stato nel database, anche dopo il cambio automatico.
 const corrente="select id from catalog.grand_prix where state='attuale'";
 const contesto={
  f1_gare:`t.id in (${corrente})`,
  f1_circuiti:`t.id in (select circuit_id from catalog.grand_prix where state='attuale')`,
  f1_iscrizioni:`g.id in (${corrente})`,
  f1_valutazioni:`(t.gara,t.season) in (select slug,season from catalog.grand_prix where state='attuale')`,
  // Le edizioni precedenti del circuito attuale alimentano lo storico delle analisi.
  f1_risultati:`exists (select 1 from catalog.grand_prix gp join catalog.circuit c on c.id=gp.circuit_id where gp.state='attuale' and c.f1db_circuit_id=r.circuit_id and (r.year<gp.season or (r.year=gp.season and r.round<=gp.calendar_order)))`,
 };
 const values=[],where=cfg.where?[cfg.where]:[];
 if(contesto[tabella])where.push(contesto[tabella]);
 for(const[k,v]of Object.entries(p)){
  if(['select','order','limit','offset'].includes(k))continue;
  if(!Object.hasOwn(cfg.filtri,k)||typeof v!=='string'||!v.startsWith('eq.'))throw new Error('Filtro non consentito');
  values.push(v.slice(3));
  const filtro=cfg.filtri[k];
  where.push(typeof filtro==='function' ? filtro(values.length) : `(${filtro})=$${values.length}`);
 }
 const limit=Number(p.limit||100),offset=Number(p.offset||0);
 if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0||offset>1000000)throw new Error('Paginazione non valida');
 values.push(limit,offset);
 const result=await db.query(`select ${cfg.select} as dato from ${cfg.from} ${where.length?'where '+where.join(' and '):''} order by ${cfg.order} limit $${values.length-1} offset $${values.length}`,values);
 return result.rows.map(r=>r.dato);
}
module.exports={leggiCatalogo,MAPPA};
