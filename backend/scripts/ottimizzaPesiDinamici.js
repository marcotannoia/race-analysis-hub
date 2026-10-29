// Backtest dei pesi del modello dinamico sui GP già disputati della stagione.
// Per ogni GP i fattori usano solo dati anteriori; il meteo "previsto" è l'esito reale della gara.
// Uso: node scripts/ottimizzaPesiDinamici.js [passo=1] > report.json
const { creaClassificaDinamica, PESI_DINAMICI } = require("../services/classificaDinamica");

const CHIAVI = ["compatibilitaVetturaCircuito", "compatibilitaPilotaCircuito", "andamentoUltimi4Gp", "storicoPersonale"];

function scenari(campioni = require("../data/campioni-previsionali-2026.json")) {
  const catalogo = require("../data/similarita-circuiti-2026.json");
  const meteoGare = require("../data/meteo-gare-2026.json");
  const perCircuito = new Map(Object.values(catalogo.circuiti).map((c) => [c.circuitId, c]));
  const slugPilota = Object.fromEntries(Object.entries(campioni.mappingPiloti).map(([s, id]) => [id, s]));
  const slugScuderia = Object.fromEntries(Object.entries(campioni.mappingScuderie).map(([s, id]) => [id, s]));
  const scuderie = Object.keys(campioni.mappingScuderie).map((slug) => ({ slug, nome: slug }));
  return campioni.gare.filter((g) => g.year === 2026 && g.round > 1).flatMap((g) => {
    const reali = campioni.risultati.filter((r) => r.raceId === g.id && slugPilota[r.driverId] && slugScuderia[r.constructorId])
      .sort((a, b) => a.positionDisplayOrder - b.positionDisplayOrder);
    const circuito = perCircuito.get(g.circuitId);
    if (reali.length < 10 || !circuito) return [];
    const piloti = reali.map((r) => ({ slug: slugPilota[r.driverId], nome: r.driverId, codice: r.driverId.slice(0, 3), numero: 0 }));
    const analisiPiloti = reali.map((r) => ({ pilota: { slug: slugPilota[r.driverId] }, scuderia: { slug: slugScuderia[r.constructorId] } }));
    const bagnato = meteoGare.edizioni.find((e) => e.raceId === g.id)?.pioggia;
    const output = creaClassificaDinamica({ gara: { slug: circuito.slug, stagione: 2026, ordineCalendario: g.round, nome: g.officialName },
      piloti, scuderie, analisiPiloti, meteo: { probabilitaPioggiaPercentuale: bagnato ? 100 : 0 } });
    const valori = new Map(output.classifica.map((p) => [p.pilota.slug,
      CHIAVI.map((k) => p.fattori.find((f) => f.chiave === k)?.valutazione ?? 50)]));
    return [{ round: g.round, gara: g.officialName, bagnato: Boolean(bagnato),
      piloti: reali.map((r) => ({ slug: slugPilota[r.driverId], reale: r.positionDisplayOrder, valori: valori.get(slugPilota[r.driverId]) })) }];
  });
}

// Spearman tra ordine previsto e ordine reale (1 = classifica identica).
function spearman(scenario, pesi) {
  const n = scenario.piloti.length;
  const ordinati = scenario.piloti.map((p) => ({ p, indice: p.valori.reduce((s, v, i) => s + v * pesi[i], 0) }))
    .sort((a, b) => b.indice - a.indice || a.p.slug.localeCompare(b.p.slug));
  const realiOrdinati = [...scenario.piloti].sort((a, b) => a.reale - b.reale).map((p) => p.slug);
  let d2 = 0, esatti = 0;
  ordinati.forEach(({ p }, i) => { const r = realiOrdinati.indexOf(p.slug); d2 += (i - r) ** 2; if (i === r) esatti++; });
  return { rho: 1 - 6 * d2 / (n * (n * n - 1)), esatti, podio: ordinati.slice(0, 3).filter(({ p }) => p.reale <= 3).length };
}

function valuta(lista, pesi) {
  const r = lista.map((s) => spearman(s, pesi));
  return { rho: r.reduce((s, x) => s + x.rho, 0) / r.length, esatti: r.reduce((s, x) => s + x.esatti, 0),
    podio: r.reduce((s, x) => s + x.podio, 0) };
}

function* combinazioni(totale, passo, k = CHIAVI.length) {
  if (k === 1) { yield [totale]; return; }
  for (let v = 0; v <= totale; v += passo) for (const resto of combinazioni(totale - v, passo, k - 1)) yield [v, ...resto];
}

function cerca(lista, totale, passo) {
  let migliore = null;
  for (const pesi of combinazioni(totale, passo)) {
    const v = valuta(lista, pesi);
    if (!migliore || v.rho > migliore.rho + 1e-12) migliore = { pesi, ...v };
  }
  return migliore;
}

function main() {
  const passo = Number(process.argv[2]) || 1;
  const fissoAggiornamenti = PESI_DINAMICI.aggiornamentiTecnici;
  const totale = 100 - fissoAggiornamenti;
  const lista = scenari();
  const attuali = CHIAVI.map((k) => PESI_DINAMICI[k]);
  const ottimo = cerca(lista, totale, passo);
  // Fuori campione: pesi trovati solo sui GP precedenti, provati sul GP successivo.
  const progressivo = lista.slice(3).map((s, i) => {
    const pesi = cerca(lista.slice(0, i + 3), totale, Math.max(passo, 2)).pesi;
    return { round: s.round, pesi, ...spearman(s, pesi), attuali: spearman(s, attuali).rho };
  });
  const perGp = lista.map((s) => ({ round: s.round, gara: s.gara, bagnato: s.bagnato,
    ottimo: spearman(s, ottimo.pesi), attuali: spearman(s, attuali), migliorePossibile: cerca([s], totale, Math.max(passo, 2)) }));
  console.log(JSON.stringify({ chiavi: CHIAVI, aggiornamentiFissi: fissoAggiornamenti, gp: lista.length,
    attuali: { pesi: attuali, ...valuta(lista, attuali) }, ottimo, progressivo, perGp }, null, 2));
}

if (require.main === module) main();
module.exports = { scenari, spearman, valuta, cerca, CHIAVI };
