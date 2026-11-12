// Backtest del modello dinamico attivo su tutti i GP della stagione già disputati.
// Ogni GP usa solo dati anteriori; il meteo "previsto" è l'esito reale della gara.
// Riferimenti: mondiale prima del GP e (solo come tetto) la qualifica dello stesso GP.
// Uso: node scripts/backtestModelloDinamico.js [--runtime percorso.json] [--dettaglio]
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { regolare } = require('../services/overallSemantici');

async function caricaRuntime() {
  const i = process.argv.indexOf('--runtime');
  if (i > 0) return require(path.resolve(process.argv[i + 1]));
  process.env.DATA_PROVIDER = 'postgres';
  const db = require('../config/database');
  await db();
  try {
    return (await db.getPool().query("select payload->'runtime' runtime from editorial.post_gp_update where payload ? 'runtime' order by applied_at desc limit 1")).rows[0].runtime;
  } finally { await db.chiudiDatabase(); }
}

function metriche(previsti, reali) {
  const pos = new Map(reali.map((s, i) => [s, i]));
  const n = previsti.length;
  let d2 = 0, ae = 0;
  previsti.forEach((s, i) => { const d = i - pos.get(s); d2 += d * d; ae += Math.abs(d); });
  return { spearman: 1 - 6 * d2 / (n * (n * n - 1)), erroreMedio: ae / n, vincitore: previsti[0] === reali[0] ? 1 : 0,
    podio: previsti.slice(0, 3).filter((s) => pos.get(s) < 3).length, top10: previsti.slice(0, 10).filter((s) => pos.get(s) < 10).length };
}

function aggrega(lista) {
  const somma = (k) => lista.reduce((t, m) => t + m[k], 0);
  const r = (v) => Math.round(v * 1000) / 1000;
  return { gp: lista.length, spearman: r(somma('spearman') / lista.length), erroreMedio: r(somma('erroreMedio') / lista.length),
    vincitori: somma('vincitore'), podio: somma('podio'), top10: somma('top10') };
}

function backtest(runtime) {
  require('../services/runtimeF1db').applicaRuntime(runtime);
  const { creaClassificaDinamica } = require('../services/classificaDinamica');
  const c = runtime.campioni;
  const catalogo = require('../data/similarita-circuiti-2026.json');
  const meteoGare = require('../data/meteo-gare-2026.json');
  const perCircuito = new Map(Object.values(catalogo.circuiti).map((x) => [x.circuitId, x]));
  const slugPilota = Object.fromEntries(Object.entries(c.mappingPiloti).map(([s, id]) => [id, s]));
  const slugScuderia = Object.fromEntries(Object.entries(c.mappingScuderie).map(([s, id]) => [id, s]));
  const scuderie = Object.keys(c.mappingScuderie).map((slug) => ({ slug, nome: slug }));
  const anno = Math.max(...c.gare.map((g) => g.year));
  const righe = [];
  for (const g of c.gare.filter((x) => x.year === anno && x.round > 1 && x.round <= c.ultimoRoundIncluso).sort((a, b) => a.round - b.round)) {
    const reali = c.risultati.filter((r) => r.raceId === g.id && slugPilota[r.driverId] && slugScuderia[r.constructorId])
      .sort((a, b) => a.positionDisplayOrder - b.positionDisplayOrder);
    const circuito = perCircuito.get(g.circuitId);
    if (reali.length < 10 || !circuito) continue;
    const bagnato = meteoGare.edizioni.find((e) => e.raceId === g.id)?.pioggia;
    const output = creaClassificaDinamica({
      gara: { slug: circuito.slug, stagione: anno, ordineCalendario: g.round, nome: g.officialName },
      piloti: reali.map((r) => ({ slug: slugPilota[r.driverId], nome: r.driverId, codice: r.driverId.slice(0, 3), numero: 0 })),
      scuderie, analisiPiloti: reali.map((r) => ({ pilota: { slug: slugPilota[r.driverId] }, scuderia: { slug: slugScuderia[r.constructorId] } })),
      meteo: { probabilitaPioggiaPercentuale: bagnato ? 100 : 0 } });
    const ordine = reali.map((r) => r.driverId);
    const regolari = new Set(reali.filter(regolare).map((r) => r.driverId));
    const prevMap = new Map(Object.entries(c.mappingPiloti).map(([s, id]) => [s, id]));
    const modello = output.classifica.map((p) => prevMap.get(p.pilota.slug));
    const precedente = c.gare.filter((x) => x.year === anno && x.round < g.round).sort((a, b) => b.round - a.round)[0];
    const mondiale = new Map(c.classificaPiloti.filter((r) => r.raceId === precedente.id).map((r) => [r.driverId, r.positionNumber]));
    const qualifica = new Map(c.qualifiche.filter((r) => r.raceId === g.id).map((r) => [r.driverId, r.positionNumber]));
    const ordina = (m) => [...ordine].sort((a, b) => (m.get(a) ?? 99) - (m.get(b) ?? 99) || a.localeCompare(b));
    const soloRegolari = (xs) => xs.filter((s) => regolari.has(s));
    const riga = { round: g.round, circuito: circuito.slug };
    for (const [nome, previsti] of [['modello', modello], ['mondiale', ordina(mondiale)], ['tettoQualificaGp', ordina(qualifica)]])
      riga[nome] = { completa: metriche(previsti, ordine), regolari: metriche(soloRegolari(previsti), soloRegolari(ordine)), primi5: previsti.slice(0, 5) };
    righe.push(riga);
  }
  const sintesi = Object.fromEntries(['modello', 'mondiale', 'tettoQualificaGp'].map((k) =>
    [k, { completa: aggrega(righe.map((r) => r[k].completa)), regolari: aggrega(righe.map((r) => r[k].regolari)) }]));
  return { modello: 'dinamico-similarita-meteo-v2', anno, ultimoRound: c.ultimoRoundIncluso, sintesi, righe };
}

async function main() {
  const esito = backtest(await caricaRuntime());
  if (!process.argv.includes('--dettaglio')) delete esito.righe;
  console.log(JSON.stringify(esito, null, 2));
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
module.exports = { backtest, metriche, aggrega };
