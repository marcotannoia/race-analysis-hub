// Sostituzione editoriale richiesta dall'utente nei soli GP 2026 non conclusi.
// Non equivale a una conferma FIA. Senza --apply verifica e annulla la transazione.
const fs = require('node:fs'), path = require('node:path'), { gzipSync } = require('node:zlib');
const { descriviCampione, completamento, trend, attenuaStoriciAnalisi } = require('../services/overallSemantici');
const { aggiornaPasso } = require('../services/revisionePostGp');
const NOTE = {
  it: 'Hirakawa inserito come sostituto editoriale provvisorio su richiesta del gestore; iscrizione ufficiale al GP da confermare. Dati personali disponibili: Messico 2026; nessuno storico di Ocon trasferito.',
  en: 'Hirakawa included as a provisional editorial replacement at the manager’s request; official race entry remains unconfirmed. Available personal data: Mexico 2026; no Ocon history transferred.',
  fr: 'Hirakawa ajouté comme remplaçant éditorial provisoire à la demande du gestionnaire ; engagement officiel à confirmer. Données personnelles disponibles : Mexique 2026 ; aucun historique d’Ocon transféré.',
  pt: 'Hirakawa incluído como substituto editorial provisório a pedido do gestor; inscrição oficial a confirmar. Dados pessoais disponíveis: México 2026; nenhum histórico de Ocon transferido.',
  es: 'Hirakawa incluido como sustituto editorial provisional a petición del gestor; inscripción oficial por confirmar. Datos personales disponibles: México 2026; ningún historial de Ocon transferido.',
  de: 'Hirakawa auf Wunsch des Betreibers als vorläufiger redaktioneller Ersatz aufgenommen; offizielle GP-Nennung noch unbestätigt. Verfügbare persönliche Daten: Mexiko 2026; keine Ocon-Historie übernommen.',
};

function preparaSostituzione(documents, runtime) {
  const piloti = documents.filter(d => d.collection_name === 'piloti').map(d => d.payload);
  const ocon = piloti.find(p => p.slug === 'ocon'), hirakawa = piloti.find(p => p.slug === 'hirakawa');
  if (!ocon || !hirakawa) throw new Error('Anagrafiche Ocon/Hirakawa mancanti');
  const c = runtime.campioni, driverId = c.mappingPiloti.hirakawa;
  if (driverId !== 'ryo-hirakawa') throw new Error('Mapping Hirakawa non verificato');
  const numerosita = new Map(Object.entries(c.numerosita).map(([id, n]) => [Number(id), n]));
  const modifiche = [];
  for (const gara of documents.filter(d => d.collection_name === 'gare').map(d => d.payload)
    .filter(g => g.stagione === 2026 && g.ordineCalendario > 20 && g.stato !== 'conclusa')) {
    const righe = documents.filter(d => d.collection_name === 'analisiGare' && d.payload.gara === gara._id);
    const vecchia = righe.find(d => d.payload.pilota === ocon._id);
    const presente = righe.find(d => d.payload.pilota === hirakawa._id);
    if (!vecchia && presente) continue;
    if (!vecchia || presente) throw new Error(`Partecipazioni inattese: ${gara.slug}`);
    if (vecchia.payload.scuderia !== hirakawa.scuderia) throw new Error('Scuderia Hirakawa diversa dal sedile sostituito');
    const rs = c.risultati.filter(r => r.driverId === driverId && r.year === 2026 && r.round < gara.ordineCalendario);
    const qs = c.qualifiche.filter(r => r.driverId === driverId && r.year === 2026 && r.round < gara.ordineCalendario);
    const rendimento = descriviCampione(rs, 'gara', numerosita), qualifica = descriviCampione(qs, 'qualifica', numerosita);
    const storicoVuoto = () => descriviCampione([], 'gara', numerosita);
    const payload = {
      _id: vecchia.payload._id, pilota: hirakawa._id, scuderia: hirakawa.scuderia, gara: gara._id,
      posizioniStoriche: {}, spiegazionePosizioni: { 2026: NOTE.it }, qualificheStoriche: {},
      andamentoPerAnno: {}, passoGara: {}, gomme: {}, considerazioni: '', penalita: '', affidabilita: '',
      aggiornamentiInArrivo: '', vantaggioAggiornamentiTecnici: null, statoAggiornamentiTecnici: '', storicoEdizioni: [],
      partecipazione: { stato: 'editoriale_provvisoria', confermaUfficiale: false, richiestaIl: '2026-11-12', sostituisce: 'ocon' },
      fonti: [c.fonte, 'https://www.haasf1team.com/news/team-statement-driver-update'],
      traduzioni: Object.fromEntries(Object.entries(NOTE).map(([l, testo]) => [l, { spiegazionePosizioni: { 2026: testo } }])),
      overallSemantici: { ultimoRoundIncluso: rs.length ? Math.max(...rs.map(r => r.round)) : null,
        stagioneCorrente: { rendimento, qualifica, completamento: completamento(rs),
          affidabilita: require('../services/affidabilitaMeccanica').affidabilitaMeccanica(rs) },
        campi: { risultatiGara: storicoVuoto(), risultatiQualifica: storicoVuoto(), andamentoPerAnno: trend(rs, numerosita) } },
    };
    for (const m of [...Object.values(payload.overallSemantici.stagioneCorrente), ...Object.values(payload.overallSemantici.campi)]) m.fonti = [c.fonte];
    aggiornaPasso(payload, gara, c, runtime.evidenze, hirakawa, false);
    attenuaStoriciAnalisi(payload);
    modifiche.push({ ...vecchia, payload, garaSlug: gara.slug });
  }
  return { ocon, hirakawa, modifiche };
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
  process.env.DATA_PROVIDER = 'postgres';
  const db = require('../config/database'), apply = process.argv.includes('--apply');
  await db(); const client = await db.getPool().connect();
  const dir = path.resolve(__dirname, '../../output/overall-v2'); fs.mkdirSync(dir, { recursive: true });
  try {
    await client.query('begin');
    await client.query('select pg_advisory_xact_lock(182026)');
    await client.query("set local statement_timeout='60s'");
    const audit = (await client.query("select grand_prix_id,payload from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1 for update")).rows[0];
    const documents = (await client.query("select collection_name,mongo_id,payload from editorial.source_document where collection_name in ('gare','piloti','scuderie','analisiGare','analisiScuderie')")).rows;
    const piano = preparaSostituzione(documents, audit.payload.runtime);
    if (!piano.modifiche.length) { await client.query('rollback'); console.log('Sostituzione già applicata'); return; }
    if (piano.modifiche.length !== 3) throw new Error('Attese tre sostituzioni nei GP rimanenti');
    const preview = documents.map(d => piano.modifiche.find(x => x.collection_name === d.collection_name && x.mongo_id === d.mongo_id) || d);
    const piloti = preview.filter(d => d.collection_name === 'piloti').map(d => d.payload);
    const scuderie = preview.filter(d => d.collection_name === 'scuderie').map(d => d.payload);
    const gara = preview.find(d => d.collection_name === 'gare' && d.payload.stato === 'attuale').payload;
    require('../services/runtimeF1db').applicaRuntime(audit.payload.runtime);
    const classifica = require('../services/classificaDinamica').creaClassificaDinamica({ gara, piloti, scuderie,
      analisiPiloti: preview.filter(d => d.collection_name === 'analisiGare' && d.payload.gara === gara._id)
        .map(d => ({ ...d.payload, pilota: piloti.find(p => p._id === d.payload.pilota), scuderia: scuderie.find(t => t._id === d.payload.scuderia) })) });
    if (classifica.classifica.length !== 22 || !classifica.classifica.some(p => p.pilota.slug === 'hirakawa') || classifica.classifica.some(p => p.pilota.slug === 'ocon'))
      throw new Error('La previsione deve includere 22 piloti, con Hirakawa e senza Ocon');
    const backup = { documents, tabelle: {} };
    for (const table of ['catalog.entry', 'catalog.season_driver', 'editorial.driver_analysis', 'editorial.driver_analysis_text',
      'ratings.driver_score', 'ratings.driver_score_source', 'ratings.driver_score_evidence'])
      backup.tabelle[table] = (await client.query(`select * from ${table}`)).rows;
    const zipped = gzipSync(JSON.stringify(backup));
    let fileBackup = null;
    if (apply) {
      fileBackup = path.join(dir, `backup-partecipazioni-${Date.now()}.json.gz`);
      fs.writeFileSync(fileBackup, zipped, { mode: 0o600 });
      console.log(`Backup partecipazioni: ${fileBackup}`);
    }
    const ids = (await client.query("select id,slug from catalog.driver where slug in ('ocon','hirakawa')")).rows;
    const oldId = ids.find(d => d.slug === 'ocon').id, newId = ids.find(d => d.slug === 'hirakawa').id;
    const scores = [];
    const mapping = { reliability: ['stagioneCorrente','affidabilita'], performance: ['stagioneCorrente','rendimento'],
      qualifying: ['stagioneCorrente','qualifica'], completion: ['stagioneCorrente','completamento'],
      annual_trend: ['campi','andamentoPerAnno'], race_pace: ['campi','passoGara'], tyre_management: ['campi','gestioneGomme'],
      race_results: ['campi','risultatiGara'], qualifying_results: ['campi','risultatiQualifica'] };
    for (const d of piano.modifiche) {
      const entry = (await client.query(`select e.* from catalog.entry e join catalog.grand_prix g on g.id=e.grand_prix_id
        where g.slug=$1 and e.driver_id=$2 and g.state<>'conclusa' for update of e`, [d.garaSlug, oldId])).rows[0];
      if (!entry) throw new Error(`Iscrizione da sostituire assente: ${d.garaSlug}`);
      await client.query('insert into catalog.entry(grand_prix_id,driver_id,team_id) values($1,$2,$3)', [entry.grand_prix_id, newId, entry.team_id]);
      const changed = await client.query(`update editorial.driver_analysis set driver_id=$1,technical_upgrade_advantage=null,
        technical_upgrade_state='',updated_at=now() where grand_prix_id=$2 and driver_id=$3 returning id`, [newId, entry.grand_prix_id, oldId]);
      if (changed.rowCount !== 1) throw new Error('Analisi normalizzata assente');
      await client.query('delete from editorial.driver_analysis_text where analysis_id=$1', [changed.rows[0].id]);
      await client.query('delete from ratings.driver_score where driver_id=$1 and grand_prix_id=$2', [oldId, entry.grand_prix_id]);
      await client.query('delete from catalog.entry where driver_id=$1 and grand_prix_id=$2', [oldId, entry.grand_prix_id]);
      const written = await client.query("update editorial.source_document set payload=$1::jsonb,imported_at=now() where collection_name='analisiGare' and mongo_id=$2", [JSON.stringify(d.payload), d.mongo_id]);
      if (written.rowCount !== 1) throw new Error('Snapshot da sostituire assente');
      for (const [dimensione, [sezione, campo]] of Object.entries(mapping)) {
        const m = d.payload.overallSemantici[sezione][campo];
        scores.push({ gp: entry.grand_prix_id, dimensione, valore: m.overall ?? null, campione: m.campione || 0, fonti: m.fonti || [] });
      }
    }
    const batch = JSON.stringify(scores);
    const inserted = await client.query(`insert into ratings.driver_score(driver_id,grand_prix_id,dimension_id,model_version,score,sample_size,confidence,source_release)
      select $2,x.gp,d.id,case when x.dimensione='reliability' then 'affidabilita-meccanica-v1' else 'risultati-semantici-v1' end,x.valore,x.campione,null,$3
      from jsonb_to_recordset($1::jsonb) x(gp bigint,dimensione text,valore numeric,campione integer)
      join ratings.dimension d on d.slug=x.dimensione`, [batch, newId, audit.payload.runtime.campioni.fonte]);
    if (inserted.rowCount !== scores.length) throw new Error('Copertura punteggi incompleta');
    await client.query(`insert into ratings.driver_score_source(score_id,url) select s.id,u.url
      from jsonb_to_recordset($1::jsonb) x(gp bigint,dimensione text,fonti jsonb)
      join ratings.dimension d on d.slug=x.dimensione join ratings.driver_score s on s.driver_id=$2 and s.grand_prix_id=x.gp and s.dimension_id=d.id
      cross join lateral jsonb_array_elements_text(x.fonti) u(url) on conflict do nothing`, [batch, newId]);
    await client.query(`update editorial.post_gp_update set payload=jsonb_set(payload,'{rosterBackup}',$2::jsonb),applied_at=now() where grand_prix_id=$1`,
      [audit.grand_prix_id, JSON.stringify({ encoding: 'gzip-base64', data: zipped.toString('base64'), confermaUfficiale: false })]);
    const report = { da: 'ocon', a: 'hirakawa', confermaUfficiale: false, gare: piano.modifiche.map(d => d.garaSlug),
      dati: 'Risultati e giri personali del Messico 2026; storico circuito non disponibile lasciato nullo.', pilotiPrevisti: classifica.classifica.length,
      punteggi: scores.length, dryRun: !apply, backup: fileBackup };
    await client.query(apply ? 'commit' : 'rollback');
    fs.writeFileSync(path.join(dir, apply ? 'partecipazioni-applicate.json' : 'partecipazioni-simulazione.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } catch (e) { await client.query('rollback'); throw e; }
  finally { client.release(); await db.chiudiDatabase(); }
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { preparaSostituzione };
