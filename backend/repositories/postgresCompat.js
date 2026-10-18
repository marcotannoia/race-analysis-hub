// Lettore PostgreSQL per il contratto API v1. Il catalogo normalizzato governa
// anagrafiche, classifiche e stati; lo snapshot conserva i campi legacy.
const { randomBytes } = require('node:crypto');
const { getPool } = require('../config/database');

const collections = {
  Gara: ['editorial.source_document', 'gare'],
  Pilota: ['editorial.source_document', 'piloti'],
  Scuderia: ['editorial.source_document', 'scuderie'],
  AnalisiGara: ['editorial.source_document', 'analisiGare'],
  AnalisiScuderia: ['editorial.source_document', 'analisiScuderie'],
  DatiLiveFia: ['live_fia.report', null],
};
const cache = new Map();
const TTL = 86400000;
let versionMark = null;
let versionCheckAt = 0;
let versionPromise = null;

async function ensureFresh() {
  if (Date.now() - versionCheckAt < 30000) return;
  if (!versionPromise) versionPromise = (async () => {
    const result = await getPool().query(`select concat_ws('|',
      (select max(imported_at)::text from editorial.source_document),
      (select max(updated_at)::text from catalog.grand_prix),
      (select max(updated_at)::text from live_fia.report),
      (select max(calculated_at)::text from ratings.driver_score),
      (select max(calculated_at)::text from ratings.team_score)) version`);
    const next = result.rows[0].version;
    if (versionMark !== null && versionMark !== next) cache.clear();
    versionMark = next;
    versionCheckAt = Date.now();
  })().finally(() => { versionPromise = null; });
  await versionPromise;
}

function clone(value) { return structuredClone(value); }
function same(left, right) { return String(left ?? '') === String(right ?? ''); }
function fieldValue(doc, field) { return field.split('.').reduce((value, key) => value?.[key], doc); }
function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const value = fieldValue(doc, key);
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) return expected.$in.some((x) => same(value, x));
      if ('$gt' in expected && !(Number(value) > Number(expected.$gt))) return false;
      if ('$ne' in expected && same(value, expected.$ne)) return false;
      return true;
    }
    return same(value, expected);
  });
}
function sorted(rows, order) {
  if (!order) return rows;
  const clauses = typeof order === 'string' ? [[order, 1]] : Object.entries(order);
  return rows.sort((a, b) => {
    for (const [field, direction] of clauses) {
      const av = fieldValue(a, field), bv = fieldValue(b, field);
      let diff = typeof av === 'number' && typeof bv === 'number'
        ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''));
      if (diff) return diff * Number(direction);
    }
    return 0;
  });
}

async function overlayCatalog(model, rows) {
  let result;
  if (model === 'Scuderia') result = await getPool().query(`select t.slug,t.name,t.standings_name,t.abbreviation,t.colour,t.nationality,
    s.position,s.points,s.wins from catalog.team t left join catalog.team_standing_snapshot s
    on s.team_id=t.id and s.season=2026`);
  else if (model === 'Pilota') result = await getPool().query(`select d.slug,d.name,d.code,d.car_number,d.nationality,d.nationality_iso2,d.nationality_iso3,
    s.position,s.points,s.wins from catalog.driver d left join catalog.driver_standing_snapshot s
    on s.driver_id=d.id and s.season=2026`);
  else if (model === 'Gara') result = await getPool().query(`select slug,name,circuit_name,country_name,season,
    analysis_order,calendar_order,state,concluded_at from catalog.grand_prix`);
  else return rows;
  const bySlug = new Map(result.rows.map((row) => [row.slug, row]));
  return rows.map((doc) => {
    const row = bySlug.get(doc.slug);
    if (!row) throw new Error(`Catalogo PostgreSQL incompleto: ${model}/${doc.slug}`);
    if (model === 'Scuderia') return { ...doc, nome: row.name, nomeClassifica: row.standings_name,
      abbreviazione: row.abbreviation, colore: row.colour, nazionalita: row.nationality,
      classifica2026: row.position === null ? doc.classifica2026 : {
        posizione: row.position, punti: Number(row.points), vittorie: row.wins } };
    if (model === 'Pilota') return { ...doc, nome: row.name, codice: row.code,
      numero: row.car_number, nazionalita: row.nationality,
      nazionalitaIso2: row.nationality_iso2, nazionalitaIso3: row.nationality_iso3,
      classifica2026: row.position === null ? doc.classifica2026 : {
        posizione: row.position, punti: Number(row.points), vittorie: row.wins } };
    return { ...doc, nome: row.name, circuito: row.circuit_name, paese: row.country_name,
      stagione: row.season, ordineAnalisi: row.analysis_order, ordineCalendario: row.calendar_order,
      stato: row.state, conclusaIl: row.concluded_at };
  });
}

async function overlayRatings(model, rows) {
  if (!['AnalisiGara','AnalisiScuderia'].includes(model)) return rows;
  const driver = model === 'AnalisiGara';
  const entity = driver ? 'driver' : 'team';
  const scoreTable = driver ? 'driver_score' : 'team_score';
  const result = await getPool().query(`select distinct on (e.slug,gp.slug,dim.slug)
    e.slug entity_slug,gp.slug gp_slug,dim.slug dimension,s.score,s.sample_size,
    array(select url from ratings.${entity}_score_source src where src.score_id=s.id order by url) sources
    from ratings.${scoreTable} s
    join catalog.${entity} e on e.id=s.${entity}_id
    join catalog.grand_prix gp on gp.id=s.grand_prix_id
    join ratings.dimension dim on dim.id=s.dimension_id
    where gp.state='attuale' and dim.slug in ('race_pace','tyre_management','performance','qualifying','completion','annual_trend','race_results','qualifying_results')
    order by e.slug,gp.slug,dim.slug,s.calculated_at desc,s.id desc`);
  const entities = new Map((await load(driver ? 'Pilota' : 'Scuderia'))
    .map((doc)=>[String(doc._id),doc.slug]));
  const races = new Map((await load('Gara')).map((doc)=>[String(doc._id),doc.slug]));
  const scores = new Map(result.rows.map((row)=>
    [`${row.entity_slug}|${row.gp_slug}|${row.dimension}`,row]));
  return rows.map((doc)=>{
    const key = `${entities.get(String(doc[driver ? 'pilota' : 'scuderia']))}|${races.get(String(doc.gara))}`;
    const semantic = doc.overallSemantici || { campi:{} };
    semantic.campi ||= {};
    const mapping = {
      race_pace:['campi','passoGara'], tyre_management:['campi','gestioneGomme'],
      performance:['stagioneCorrente','rendimento'], qualifying:['stagioneCorrente','qualifica'],
      completion:['stagioneCorrente','completamento'], annual_trend:['campi','andamentoPerAnno'],
      race_results:['campi','risultatiGara'], qualifying_results:['campi','risultatiQualifica'],
    };
    for (const [dimension,[section,field]] of Object.entries(mapping)) {
      const score=scores.get(`${key}|${dimension}`);
      semantic[section] ||= {};
      semantic[section][field] = score
        ? { ...(semantic[section][field] || {}), overall:score.score === null ? null : Number(score.score),
            campione:score.sample_size,fonti:score.sources }
        : { ...(semantic[section][field] || {}),overall:null,campione:0,fonti:[] };
    }
    return { ...doc,overallSemantici:semantic };
  });
}

async function load(model) {
  await ensureFresh();
  const now = Date.now();
  const item = cache.get(model);
  if (item && item.expires > now) return item.promise;
  const [table, collection] = collections[model];
  const promise = (async () => {
    const result = collection === null
      ? await getPool().query(`select payload from ${table}`)
      : ['AnalisiGara','AnalisiScuderia'].includes(model)
        ? await getPool().query(`select s.payload from ${table} s
          where s.collection_name=$1 and s.payload->>'gara'=(
            select g.mongo_id from editorial.source_document g
            join catalog.grand_prix gp on gp.slug=g.payload->>'slug'
            where g.collection_name='gare' and gp.state='attuale' limit 1)`, [collection])
      : await getPool().query(`select payload from ${table} where collection_name=$1`, [collection]);
    const rows = await overlayCatalog(model, result.rows.map((row) => row.payload));
    return overlayRatings(model, rows);
  })();
  cache.set(model, { promise, expires: now + TTL });
  try { return await promise; }
  catch (error) { cache.delete(model); throw error; }
}
function invalidate(...models) { for (const model of models) cache.delete(model); }

async function hydrate(rows, populate) {
  if (!populate.length) return rows;
  const targets = { pilota: 'Pilota', scuderia: 'Scuderia', gara: 'Gara' };
  const maps = new Map();
  for (const spec of populate) {
    const field = spec.split(' ')[0];
    const model = targets[field];
    if (!model || maps.has(field)) continue;
    maps.set(field, new Map((await load(model)).map((doc) => [String(doc._id), doc])));
  }
  return rows.map((doc) => {
    for (const [field, map] of maps) {
      const linked = map.get(String(doc[field]));
      if (linked) doc[field] = clone(linked);
    }
    return doc;
  });
}

async function saveDocument(model, doc, client = getPool()) {
  const [table, collection] = collections[model];
  await client.query(`update ${table} set payload=$1::jsonb,imported_at=now()
    where collection_name=$2 and mongo_id=$3`, [JSON.stringify(doc), collection, String(doc._id)]);
  if ((model === 'Pilota' || model === 'Scuderia') && doc.classifica2026) {
    const driver = model === 'Pilota';
    const entity = driver ? 'driver' : 'team';
    const standing = driver ? 'driver_standing_snapshot' : 'team_standing_snapshot';
    await client.query(`insert into catalog.${standing}(season,${entity}_id,position,points,wins,source_version)
      select 2026,id,$2,$3,$4,'post-gp' from catalog.${entity} where slug=$1
      on conflict(season,${entity}_id) do update set position=excluded.position,
      points=excluded.points,wins=excluded.wins,source_version=excluded.source_version`,
      [doc.slug,doc.classifica2026.posizione,doc.classifica2026.punti,doc.classifica2026.vittorie]);
  }
  invalidate(model);
}

async function persistPostGp({ analysesDriver, analysesTeam, driverOperations, teamOperations,
  currentRace, nextRace, concludedAt, contextStats = null, postGpUpdate = null,
  dryRun = false }) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    for (const doc of analysesDriver) await saveDocument('AnalisiGara', doc, client);
    for (const doc of analysesTeam) await saveDocument('AnalisiScuderia', doc, client);
    for (const [model, operations] of [['Pilota',driverOperations],['Scuderia',teamOperations]]) {
      const byId = new Map((await load(model)).map((doc) => [String(doc._id),doc]));
      for (const operation of operations) {
        const target = byId.get(String(operation.updateOne.filter._id));
        if (!target) throw new Error(`Classifica senza ${model}: ${operation.updateOne.filter._id}`);
        const doc = clone(target);
        applyUpdate(doc, operation.updateOne.update, false);
        await saveDocument(model, doc, client);
      }
    }
    const races = await load('Gara');
    for (const race of races.filter((doc) => ['attuale','prossima'].includes(doc.stato))) {
      const doc = clone(race); doc.stato = 'futura';
      await saveDocument('Gara', doc, client);
      await client.query(`update catalog.grand_prix set state='futura',updated_at=now() where slug=$1`, [doc.slug]);
    }
    const current = clone(currentRace);
    current.stato='conclusa'; current.conclusaIl=concludedAt;
    await saveDocument('Gara', current, client);
    await client.query(`update catalog.grand_prix set state='conclusa',concluded_at=$2,updated_at=now() where slug=$1`,
      [current.slug,concludedAt]);
    if (nextRace) {
      const next=clone(nextRace); next.stato='attuale'; next.conclusaIl=null;
      await saveDocument('Gara', next, client);
      await client.query(`update catalog.grand_prix set state='attuale',concluded_at=null,updated_at=now() where slug=$1`,
        [next.slug]);
    }
    if (contextStats) {
      for (const [slug, values] of Object.entries(contextStats.piloti)) {
        if (!values) continue;
        const updated = await client.query(`insert into ratings.driver_context
          (driver_id,races_started,wet_races,positive_wet_races,wet_wins,driver_errors,fatal_errors,updated_at)
          select id,$2,$3,$4,$5,$6,$7,now() from catalog.driver where slug=$1
          on conflict(driver_id) do update set races_started=excluded.races_started,
          wet_races=excluded.wet_races,positive_wet_races=excluded.positive_wet_races,
          wet_wins=excluded.wet_wins,driver_errors=excluded.driver_errors,
          fatal_errors=excluded.fatal_errors,updated_at=now()`,
        [slug,values.gareDisputate,values.gareConPioggiaDisputate,
          values.gareConPioggiaPositive,values.vittorieConPioggia,
          values.erroriPilota,values.erroriFatali]);
        if (updated.rowCount !== 1) throw new Error(`Pilota contesto sconosciuto: ${slug}`);
      }
      const meta=contextStats.metadati;
      await client.query(`update ratings.context_metadata set
        methodology_version=$1,last_grand_prix_key=$2,description=$3,
        wet_methodology=$4::jsonb,sources=$5,applied_grand_prix_keys=$6,updated_at=now()
        where singleton=true`,
      [meta.versioneMetodologia,meta.ultimoGpIncluso,meta.descrizione,
        JSON.stringify(meta.metodologiaPioggia),meta.fonti,meta.aggiornamentiApplicati]);
    }
    if (postGpUpdate) {
      const audit=await client.query(`insert into editorial.post_gp_update(grand_prix_id,payload)
        select id,$2::jsonb from catalog.grand_prix where slug=$1
        on conflict(grand_prix_id) do update set payload=excluded.payload,applied_at=now()`,
      [current.slug,JSON.stringify(postGpUpdate)]);
      if (audit.rowCount !== 1) throw new Error(`GP audit sconosciuto: ${current.slug}`);
    }
    await client.query(dryRun ? 'rollback' : 'commit');
    invalidate(...Object.keys(collections));
  } catch (error) {
    await client.query('rollback');
    invalidate(...Object.keys(collections));
    throw error;
  } finally { client.release(); }
}

class Query {
  constructor(model, mode, filter) { this.model=model; this.mode=mode; this.filter=filter; this.order=null; this.populates=[]; }
  populate(field) { this.populates.push(field); return this; }
  sort(order) { this.order=order; return this; }
  select() { return this; }
  lean() { this.plain=true; return this; }
  async execute() {
    let rows = (await load(this.model)).filter((doc) => matches(doc, this.filter)).map(clone);
    sorted(rows, this.order);
    if (this.mode === 'one') rows = rows.slice(0, 1);
    await hydrate(rows, this.populates);
    if (!this.plain) for (const doc of rows)
      Object.defineProperty(doc, 'save', { enumerable:false, value: () => saveDocument(this.model, doc) });
    return this.mode === 'one' ? rows[0] || null : rows;
  }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
  catch(reject) { return this.execute().catch(reject); }
}

function applyUpdate(doc, update, inserted) {
  if (inserted) Object.assign(doc, update.$setOnInsert || {});
  Object.assign(doc, update.$set || {});
}
async function update(model, filter, change, many = false) {
  const list = (await load(model)).filter((doc) => matches(doc, filter));
  for (const item of many ? list : list.slice(0, 1)) {
    const doc = clone(item);
    applyUpdate(doc, change, false);
    await saveDocument(model, doc);
    if (model === 'Gara') await getPool().query(`update catalog.grand_prix set state=$1,
      concluded_at=$2,updated_at=now() where slug=$3`, [doc.stato, doc.conclusaIl || null, doc.slug]);
  }
  return { modifiedCount: list.length };
}

function model(name) {
  return {
    find: (filter = {}) => new Query(name, 'many', filter),
    findOne: (filter = {}) => new Query(name, 'one', filter),
    countDocuments: async (filter = {}) => (await load(name)).filter((doc) => matches(doc, filter)).length,
    exists: async (filter = {}) => (await load(name)).some((doc) => matches(doc, filter)),
    updateOne: (filter, change) => update(name, filter, change),
    updateMany: (filter, change) => update(name, filter, change, true),
    bulkWrite: async (operations) => {
      for (const op of operations) if (op.updateOne) await update(name, op.updateOne.filter, op.updateOne.update);
      return { modifiedCount: operations.length };
    },
    findOneAndUpdate: async (filter, change, options = {}) => {
      const found = (await load(name)).find((doc) => matches(doc, filter));
      if (!found && !options.upsert) return null;
      const doc = found ? clone(found) : { _id: randomBytes(12).toString('hex') };
      applyUpdate(doc, change, !found);
      if (name === 'DatiLiveFia') {
        const client = await getPool().connect();
        try {
          await client.query('begin');
          const report = await client.query(`insert into live_fia.report(grand_prix_id,gara_slug,payload,checked_at)
            select id,$1,$2::jsonb,$3 from catalog.grand_prix where slug=$1
            on conflict(gara_slug) do update set payload=excluded.payload,
              checked_at=excluded.checked_at,updated_at=now() returning id`,
            [doc.garaSlug,JSON.stringify(doc),doc.ultimoControlloIl || null]);
          if (report.rowCount !== 1) throw new Error(`GP FIA sconosciuto: ${doc.garaSlug}`);
          if (doc.aggiornamenti?.scuderie) {
            await client.query('delete from live_fia.team_upgrade where report_id=$1', [report.rows[0].id]);
            for (const item of doc.aggiornamenti.scuderie) {
              await client.query(`insert into live_fia.team_upgrade
                (report_id,team_id,fia_name,no_upgrade,components,description)
                select $1,id,$3,$4,$5,$6 from catalog.team where slug=$2`,
                [report.rows[0].id,item.slug,item.nomeFia,item.nessunAggiornamento,
                  item.componenti || [],item.descrizione || '']);
            }
          }
          await client.query(options.dryRun ? 'rollback' : 'commit');
        } catch (error) { await client.query('rollback'); throw error; }
        finally { client.release(); }
        invalidate(name);
        return doc;
      }
      const [table, collection] = collections[name];
      await getPool().query(`insert into ${table}(collection_name,mongo_id,payload) values ($1,$2,$3::jsonb)
        on conflict(collection_name,mongo_id) do update set payload=excluded.payload,imported_at=now()`,
        [collection, String(doc._id), JSON.stringify(doc)]);
      invalidate(name);
      return doc;
    },
  };
}

module.exports = { model, load, invalidate, saveDocument, persistPostGp };
