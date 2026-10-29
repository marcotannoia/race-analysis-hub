// Importa lo snapshot Mongo pubblicato in tabelle private PostgreSQL.
// --dry-run esegue tutte le verifiche e annulla la transazione.
const path = require('node:path');
const mongoose = require('mongoose');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const driverF1db = {
  antonelli: 'kimi-antonelli', hamilton: 'lewis-hamilton', russell: 'george-russell',
  leclerc: 'charles-leclerc', norris: 'lando-norris', max_verstappen: 'max-verstappen',
  piastri: 'oscar-piastri', hadjar: 'isack-hadjar', lawson: 'liam-lawson',
  tsunoda: 'yuki-tsunoda', gasly: 'pierre-gasly', arvid_lindblad: 'arvid-lindblad',
  colapinto: 'franco-colapinto', bearman: 'oliver-bearman', bortoleto: 'gabriel-bortoleto',
  sainz: 'carlos-sainz-jr', albon: 'alexander-albon', ocon: 'esteban-ocon',
  hulkenberg: 'nico-hulkenberg', alonso: 'fernando-alonso', stroll: 'lance-stroll',
  bottas: 'valtteri-bottas', perez: 'sergio-perez',
};
const teamF1db = {
  mercedes: 'mercedes', ferrari: 'ferrari', mclaren: 'mclaren',
  red_bull: 'red-bull', rb: 'racing-bulls', alpine: 'alpine', haas: 'haas',
  audi: 'audi', williams: 'williams', aston_martin: 'aston-martin', cadillac: 'cadillac',
};
const dimension = {
  rendimento: 'performance', qualifica: 'qualifying', trend: 'trend',
  completamento: 'completion', passoGara: 'race_pace', gestioneGomme: 'tyre_management',
  risultatiGara: 'race_results', risultatiQualifica: 'qualifying_results',
  andamentoPerAnno: 'annual_trend', affidabilita: 'reliability',
};
const RELEASE = 'https://github.com/f1db/f1db/releases/tag/v2026.17.0';
const locali = new Set(['it', 'en', 'fr', 'pt', 'es', 'de']);
const id = (x) => String(x);
const pendingText = new Map();
const pendingSources = { driver: [], team: [] };

function assert(condition, message) { if (!condition) throw new Error(message); }
function plain(x) { return JSON.parse(JSON.stringify(x)); }
function flattenText(doc, fields) {
  const out = [];
  for (const locale of locali) {
    const values = locale === 'it' ? { ...doc, ...doc.traduzioni?.it } : doc.traduzioni?.[locale];
    if (!values) continue;
    for (const field of fields) {
      const value = values[field];
      if (typeof value === 'string') out.push({ locale, season: null, field, content: value });
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, content] of Object.entries(value)) {
          if (typeof content !== 'string') continue;
          out.push({ locale, season: /^\d{4}$/.test(key) ? Number(key) : null,
            field: /^\d{4}$/.test(key) ? field : `${field}.${key}`, content });
        }
      }
    }
  }
  return out;
}
async function insertText(pg, table, fk, parentId, rows) {
  if (!pendingText.has(table)) pendingText.set(table, { fk, rows: [] });
  pendingText.get(table).rows.push(...rows.map((row) => ({ ...row, parent_id: parentId })));
}
async function flushBatches(pg) {
  for (const [table, batch] of pendingText) {
    for (let start = 0; start < batch.rows.length; start += 500) {
      const rows = batch.rows.slice(start, start + 500);
      if (table.endsWith('analysis_text'))
        await pg.query(`insert into editorial.${table}(analysis_id,locale,season,field,content)
          select parent_id,locale,season,field,content from jsonb_to_recordset($1::jsonb)
          as x(parent_id bigint,locale text,season integer,field text,content text)`, [JSON.stringify(rows)]);
      else
        await pg.query(`insert into editorial.${table}(${batch.fk},locale,field,content)
          select parent_id,locale,field,content from jsonb_to_recordset($1::jsonb)
          as x(parent_id bigint,locale text,field text,content text)`, [JSON.stringify(rows)]);
    }
  }
  for (const kind of ['driver', 'team']) {
    const batch = pendingSources[kind];
    for (let start = 0; start < batch.length; start += 500)
      await pg.query(`insert into ratings.${kind}_score_source(score_id,url)
        select score_id,url from jsonb_to_recordset($1::jsonb) as x(score_id bigint,url text)`,
        [JSON.stringify(batch.slice(start, start + 500))]);
  }
}
async function insertScores(pg, kind, entityId, gpId, semantic, stats) {
  if (!semantic?.campi) return;
  for (const [field, value] of Object.entries(semantic.campi)) {
    const slug = dimension[field];
    if (!slug || typeof value?.overall !== 'number' || !Number.isInteger(value.campione) || value.campione <= 0) {
      if (typeof value?.overall === 'number') stats.scoresSkipped++;
      continue;
    }
    const urls = Array.isArray(value.fonti) ? value.fonti.filter((x) => typeof x === 'string' && x.startsWith('https://')) : [];
    assert(urls.length > 0, `Punteggio senza URL verificabile: ${kind}/${field}`);
    const source = urls.some((x) => x.includes('api.openf1.org')) ? 'OpenF1' : 'F1DB v2026.17.0';
    const r = await pg.query(
      `insert into ratings.${kind}_score (${kind}_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release,calculated_at)
       select $1,$2,d.id,$4,$5,$6,null,$7,$8 from ratings.dimension d where d.slug=$3 returning id`,
      [entityId, gpId, slug, semantic.versione, value.overall, value.campione, source, semantic.verificatoIl || new Date()],
    );
    assert(r.rowCount === 1, `Dimensione mancante: ${slug}`);
    for (const url of new Set(urls)) pendingSources[kind].push({ score_id: r.rows[0].id, url });
    stats.scores++;
  }
}

async function main() {
  assert(process.env.MONGO_URL && process.env.SUPABASE_DB_URL, 'MONGO_URL o SUPABASE_DB_URL assente');
  const dryRun = process.argv.includes('--dry-run');
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.DATABASE_NAME || 'f1_stats', serverSelectionTimeoutMS: 10000,
  });
  const pg = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  let transaction = false;
  try {
    const db = mongoose.connection.db;
    const names = ['scuderie', 'piloti', 'gare', 'analisiGare', 'analisiScuderie'];
    const documents = Object.fromEntries(await Promise.all(names.map(async (name) =>
      [name, await db.collection(name).find().toArray()])));
    const mongo = Object.fromEntries(names.map((name) => [name, new Map(documents[name].map((doc) => [id(doc._id), doc]))]));
    const f1db = {};
    for (const [key, sql] of Object.entries({
      driver: 'select id from f1db.driver', team: 'select id from f1db.constructor',
      circuit: 'select id from f1db.circuit', race: 'select id,year,round,circuit_id from f1db.race where year=2026',
    })) f1db[key] = (await pg.query(sql)).rows;
    const exists = (kind, value) => f1db[kind].some((item) => item.id === value);
    const current = await pg.query('select count(*)::integer n from catalog.team');
    assert(current.rows[0].n === 0, 'Il catalogo è già popolato: importazione non ripetuta');
    await pg.query('begin'); transaction = true;
    const maps = { team: new Map(), driver: new Map(), gp: new Map(), circuit: new Map() };
    const stats = { documents: 0, scores: 0, scoresSkipped: 0 };

    for (const doc of documents.scuderie) {
      const fid = teamF1db[doc.slug];
      assert(fid && exists('team', fid), `Scuderia F1DB mancante: ${doc.slug}`);
      const r = await pg.query(`insert into catalog.team
        (slug,f1db_constructor_id,name,standings_name,abbreviation,colour,nationality,created_at,updated_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [doc.slug, fid, doc.nome, doc.nomeClassifica, doc.abbreviazione, doc.colore, doc.nazionalita, doc.createdAt, doc.updatedAt]);
      maps.team.set(id(doc._id), r.rows[0].id);
      for (const row of flattenText(doc, ['nazionalita']))
        await insertText(pg, 'team_text', 'team_id', r.rows[0].id, [row]);
      for (const [season, name] of Object.entries(doc.denominazioniStoriche || {}))
        if (typeof name === 'string') await insertText(pg, 'team_text', 'team_id', r.rows[0].id,
          [{ locale: 'it', field: `denominazioniStoriche.${season}`, content: name }]);
      if (doc.classifica2026?.posizione)
        await pg.query(`insert into catalog.team_standing_snapshot values (2026,$1,$2,$3,$4,'mongo-live-2026-10-16')`,
          [r.rows[0].id, doc.classifica2026.posizione, doc.classifica2026.punti, doc.classifica2026.vittorie]);
      await insertScores(pg, 'team', r.rows[0].id, null, doc.overallSemantici, stats);
    }
    for (const doc of documents.piloti) {
      const fid = driverF1db[doc.slug];
      assert(fid && exists('driver', fid), `Pilota F1DB mancante: ${doc.slug}`);
      const teamId = maps.team.get(id(doc.scuderia));
      assert(teamId, `Scuderia pilota mancante: ${doc.slug}`);
      const r = await pg.query(`insert into catalog.driver
        (slug,f1db_driver_id,name,code,car_number,nationality,nationality_iso2,nationality_iso3,created_at,updated_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
        [doc.slug, fid, doc.nome, doc.codice, doc.numero, doc.nazionalita,
          doc.nazionalitaIso2, doc.nazionalitaIso3, doc.createdAt, doc.updatedAt]);
      maps.driver.set(id(doc._id), r.rows[0].id);
      await insertText(pg, 'driver_text', 'driver_id', r.rows[0].id, flattenText(doc, ['nazionalita']));
      if (doc.classifica2026?.posizione)
        await pg.query(`insert into catalog.driver_standing_snapshot values (2026,$1,$2,$3,$4,'mongo-live-2026-10-16')`,
          [r.rows[0].id, doc.classifica2026.posizione, doc.classifica2026.punti, doc.classifica2026.vittorie]);
      await insertScores(pg, 'driver', r.rows[0].id, null, doc.overallSemantici, stats);
    }
    for (const doc of documents.gare) {
      const race = f1db.race.find((x) => x.year === doc.stagione && x.round === doc.ordineCalendario);
      assert(race, `GP F1DB mancante: ${doc.slug}`);
      assert(exists('circuit', race.circuit_id), `Circuito F1DB mancante: ${race.circuit_id}`);
      if (!maps.circuit.has(race.circuit_id)) {
        const circuit = await pg.query(`insert into catalog.circuit(slug,f1db_circuit_id,name)
          values ($1,$2,$3) returning id`, [race.circuit_id, race.circuit_id, doc.circuito]);
        maps.circuit.set(race.circuit_id, circuit.rows[0].id);
      }
      const r = await pg.query(`insert into catalog.grand_prix
        (slug,f1db_race_id,circuit_id,name,circuit_name,country_name,season,analysis_order,calendar_order,state,concluded_at,created_at,updated_at)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
        [doc.slug, race.id, maps.circuit.get(race.circuit_id), doc.nome, doc.circuito, doc.paese,
          doc.stagione, doc.ordineAnalisi, doc.ordineCalendario,
          doc.stato === 'prossima' ? 'attuale' : doc.stato, doc.conclusaIl || null, doc.createdAt, doc.updatedAt]);
      maps.gp.set(id(doc._id), r.rows[0].id);
      await insertText(pg, 'grand_prix_text', 'grand_prix_id', r.rows[0].id,
        flattenText(doc, ['nome', 'circuito', 'paese', 'etichettaExcel', 'contestoStorico',
          'pilotiFavoriti', 'scuderieFavorite', 'outsider', 'potenzialiDifficolta',
          'gommeStrategia', 'rischi', 'confidenza']));
    }
    const driverFields = ['posizioniStoriche', 'spiegazionePosizioni', 'qualificheStoriche',
      'andamentoPerAnno', 'passoGara', 'gomme', 'considerazioni', 'penalita', 'affidabilita',
      'aggiornamentiInArrivo'];
    const teamFields = driverFields.filter((x) => x !== 'penalita');
    for (const doc of documents.analisiGare) {
      const gpId = maps.gp.get(id(doc.gara)), driverId = maps.driver.get(id(doc.pilota));
      const teamId = maps.team.get(id(doc.scuderia));
      assert(gpId && driverId && teamId, `Analisi pilota senza FK ${doc._id}`);
      await pg.query(`insert into catalog.entry(grand_prix_id,driver_id,team_id)
        values ($1,$2,$3) on conflict (grand_prix_id,driver_id) do nothing`, [gpId, driverId, teamId]);
      const r = await pg.query(`insert into editorial.driver_analysis
        (grand_prix_id,driver_id,team_id,technical_upgrade_advantage,technical_upgrade_state,updated_at)
        values ($1,$2,$3,$4,$5,$6) returning id`,
        [gpId, driverId, teamId, doc.vantaggioAggiornamentiTecnici ?? null,
          doc.statoAggiornamentiTecnici || null, doc.updatedAt]);
      await insertText(pg, 'driver_analysis_text', 'analysis_id', r.rows[0].id, flattenText(doc, driverFields));
      await insertScores(pg, 'driver', driverId, gpId, doc.overallSemantici, stats);
    }
    for (const doc of documents.analisiScuderie) {
      const gpId = maps.gp.get(id(doc.gara)), teamId = maps.team.get(id(doc.scuderia));
      assert(gpId && teamId, `Analisi scuderia senza FK ${doc._id}`);
      const r = await pg.query(`insert into editorial.team_analysis(grand_prix_id,team_id,updated_at)
        values ($1,$2,$3) returning id`, [gpId, teamId, doc.updatedAt]);
      await insertText(pg, 'team_analysis_text', 'analysis_id', r.rows[0].id, flattenText(doc, teamFields));
      await insertScores(pg, 'team', teamId, gpId, doc.overallSemantici, stats);
    }
    for (const name of names) for (const doc of documents[name]) {
      await pg.query('insert into editorial.source_document(collection_name,mongo_id,payload) values ($1,$2,$3)',
        [name, id(doc._id), plain(doc)]);
      stats.documents++;
    }
    await flushBatches(pg);
    const counts = {};
    for (const name of ['team', 'driver', 'grand_prix', 'entry'])
      counts[name] = Number((await pg.query(`select count(*) n from catalog.${name}`)).rows[0].n);
    for (const name of ['driver_analysis', 'team_analysis'])
      counts[name] = Number((await pg.query(`select count(*) n from editorial.${name}`)).rows[0].n);
    assert(counts.team === documents.scuderie.length && counts.driver === documents.piloti.length,
      'Numero anagrafiche diverso da Mongo');
    assert(counts.grand_prix === documents.gare.length && counts.driver_analysis === documents.analisiGare.length,
      'Numero GP o analisi pilota diverso da Mongo');
    assert(counts.team_analysis === documents.analisiScuderie.length && stats.documents === names.reduce((n,x)=>n+documents[x].length,0),
      'Numero analisi scuderia o snapshot diverso da Mongo');
    if (dryRun) await pg.query('rollback'); else await pg.query('commit');
    transaction = false;
    console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'committed', counts, ...stats }));
  } catch (error) {
    if (transaction) await pg.query('rollback');
    throw error;
  } finally {
    await pg.end(); await mongoose.disconnect();
  }
}
main().catch((error) => { console.error(error.stack); process.exitCode = 1; });
