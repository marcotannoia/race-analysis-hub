// Ricalcolo degli overall v2 su tutti i GP presenti nel database.
// Passo gara e gomme con la stima v2, storico sul circuito attenuato, considerazioni
// finali dei GP futuri con il modello dinamico v2. Senza --apply: rollback.
// Uso: node scripts/ricalcolaOverallV2.js [--apply]
const fs = require('node:fs'), path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
process.env.DATA_PROVIDER = 'postgres';
const db = require('../config/database');
const { aggiornaPasso } = require('../services/revisionePostGp');
const { attenuaStoriciAnalisi } = require('../services/overallSemantici');
const { aggiornaPrevisioniFuture } = require('../services/aggiornaPrevisioniFuture');
const { salvaRevisione } = require('../services/salvaRevisionePostGp');

const DIMENSIONI = [['race_pace', 'passoGara'], ['tyre_management', 'gestioneGomme'],
  ['race_results', 'risultatiGara'], ['qualifying_results', 'risultatiQualifica']];

function riepilogo(prima, dopo) {
  const out = {};
  for (const [dimensione] of DIMENSIONI) {
    const coppie = dopo.filter((s) => s.dimensione === dimensione).map((s) => ({ s,
      p: prima.get(`${s.tipo}|${s.slug}|${s.gara}|${dimensione}`) }));
    const confrontabili = coppie.filter((c) => c.p && c.p.score !== null && c.s.valore !== null);
    const estremi = (xs) => xs.filter((v) => v === 0 || v === 100).length;
    out[dimensione] = {
      punteggi: coppie.length,
      modificati: confrontabili.filter((c) => Math.abs(Number(c.p.score) - c.s.valore) >= 0.05).length,
      variazioneMediaAssoluta: confrontabili.length ? Math.round(100 * confrontabili.reduce((t, c) =>
        t + Math.abs(Number(c.p.score) - c.s.valore), 0) / confrontabili.length) / 100 : null,
      valoriEstremi0o100: { prima: estremi(coppie.map((c) => c.p?.score === null || !c.p ? null : Number(c.p.score))),
        dopo: estremi(coppie.map((c) => c.s.valore)) },
      nulli: { prima: coppie.filter((c) => !c.p || c.p.score === null).length, dopo: coppie.filter((c) => c.s.valore === null).length },
    };
  }
  return out;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dir = path.resolve(process.env.OVERALL_OUTPUT || path.join(__dirname, '../../output/overall-v2'));
  fs.mkdirSync(dir, { recursive: true });
  await db(); const pool = db.getPool(); let client;
  await require('../routes/admin').ricaricaMeteoGare();
  await require('../services/modificheDashboard').ricaricaModifiche();
  try {
    const audit = (await pool.query("select payload,applied_at::text versione from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1")).rows[0];
    if (!audit) throw new Error('Runtime post-GP assente: eseguire prima check:auto-gp');
    const runtime = audit.payload.runtime;
    if (!runtime?.evidenze?.sessioni?.length) throw new Error('Evidenze dei giri assenti nel runtime');
    const sourceMark = (await pool.query('select max(imported_at)::text value from editorial.source_document')).rows[0].value;
    const documents = (await pool.query("select collection_name,mongo_id,payload from editorial.source_document where collection_name in ('gare','piloti','scuderie','analisiGare','analisiScuderie')")).rows;
    const prima = new Map();
    for (const tipo of ['driver', 'team']) for (const r of (await pool.query(`select e.slug,g.slug gara,d.slug dimensione,s.score
      from ratings.${tipo}_score s join catalog.${tipo} e on e.id=s.${tipo}_id join catalog.grand_prix g on g.id=s.grand_prix_id
      join ratings.dimension d on d.id=s.dimension_id where s.model_version='risultati-semantici-v1'`)).rows)
      prima.set(`${tipo}|${r.slug}|${r.gara}|${r.dimensione}`, r);
    const gare = documents.filter((d) => d.collection_name === 'gare').map((d) => d.payload);
    const refs = new Map(documents.map((d) => [`${d.collection_name}|${d.mongo_id.trim()}`, d.payload]));
    const piano = { modifiche: [], scores: [], runtime };
    for (const d of documents.filter((x) => ['analisiGare', 'analisiScuderie'].includes(x.collection_name))) {
      const team = d.collection_name === 'analisiScuderie';
      const g = refs.get(`gare|${d.payload.gara}`);
      const entita = refs.get(`${team ? 'scuderie' : 'piloti'}|${d.payload[team ? 'scuderia' : 'pilota']}`);
      if (!g || !entita) throw new Error(`Riferimenti mancanti per ${d.collection_name}/${d.mongo_id}`);
      const payload = structuredClone(d.payload);
      aggiornaPasso(payload, g, runtime.campioni, runtime.evidenze, entita, team);
      attenuaStoriciAnalisi(payload);
      piano.modifiche.push({ collection_name: d.collection_name, mongo_id: d.mongo_id.trim(), payload });
      for (const [dimensione, campo] of DIMENSIONI) {
        const m = payload.overallSemantici.campi[campo];
        if (!m) continue;
        piano.scores.push({ tipo: team ? 'team' : 'driver', slug: entita.slug, gara: g.slug, dimensione,
          valore: Number.isFinite(m.overall) ? m.overall : null, campione: m.campione || 0, fonti: m.fonti || [] });
      }
    }
    await aggiornaPrevisioniFuture({ piano, documents, gare, refs });
    const report = { versione: 'overall-v2', generatoIl: new Date().toISOString(), gp: gare.length,
      documenti: piano.modifiche.length, variazioni: riepilogo(prima, piano.scores) };
    if (apply) {
      // Il backup in editorial.post_gp_update ha un solo slot: copia locale privata in più.
      const punteggi = {};
      for (const t of ['driver_score', 'driver_score_source', 'team_score', 'team_score_source'])
        punteggi[t] = (await pool.query(`select * from ratings.${t}`)).rows;
      const file = path.join(dir, `backup-prima-v2-${Date.now()}.json.gz`);
      fs.writeFileSync(file, require('node:zlib').gzipSync(JSON.stringify({ documents, punteggi })), { mode: 0o600 });
      console.log(`Backup locale: ${file}`);
    }
    client = await pool.connect();
    client.on('error', (e) => console.error('Connessione interrotta:', e.message));
    report.esito = await salvaRevisione(client, piano, { sourceMark, documenti: documents, versioneAudit: audit.versione, dryRun: !apply });
    fs.writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } finally { client?.release(); await db.chiudiDatabase(); }
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
module.exports = { DIMENSIONI, riepilogo };
