// Backtest dei pesi del modello dinamico sui GP già disputati della stagione.
// Per ogni GP i fattori usano solo dati anteriori; il meteo "previsto" è l'esito reale della gara.
// Uso: node scripts/ottimizzaPesiDinamici.js [passo=1] > report.json
const { creaClassificaDinamica, PESI_DINAMICI } = require("../services/classificaDinamica");

const CHIAVI = ["compatibilitaVetturaCircuito", "compatibilitaPilotaCircuito", "andamentoUltimi4Gp", "storicoPersonale"];

function scenari(campioni = require("./../services/runtimeF1db").campioniCorrenti(require("../data/campioni-previsionali-2026.json"))) {
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

// Per ogni GP: tutte le combinazioni entro "tolleranza" dal massimo di quel GP, mediate
// (centroide). Il compromesso è la media dei centroidi: ogni GP vota la propria combinazione.
function compromessoPerGp(lista, totale, passo, tolleranza = 0.01) {
  const perGp = lista.map((s) => {
    const tutte = [...combinazioni(totale, passo)].map((pesi) => ({ pesi, rho: spearman(s, pesi).rho }));
    const massimo = tutte.reduce((m, c) => Math.max(m, c.rho), -Infinity);
    const vicine = tutte.filter((c) => c.rho >= massimo - tolleranza);
    const centroide = CHIAVI.map((_, i) => vicine.reduce((t, c) => t + c.pesi[i], 0) / vicine.length);
    return { round: s.round, gara: s.gara, rhoMassimo: massimo, combinazioniVicine: vicine.length,
      centroide: centroide.map((v) => Math.round(v * 10) / 10) };
  });
  const media = CHIAVI.map((_, i) => perGp.reduce((t, g) => t + g.centroide[i], 0) / perGp.length);
  // Arrotonda all'intero mantenendo la somma.
  const interi = media.map(Math.floor);
  const resti = media.map((v, i) => [v - interi[i], i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < totale - interi.reduce((t, v) => t + v, 0); k++) interi[resti[k][1]]++;
  return { perGp, pesi: interi };
}

// Quante volte i due compagni di squadra finiscono attaccati nella previsione (blocchi per scuderia).
function blocchiScuderia(lista, pesi, scuderiaDi) {
  let coppie = 0, totali = 0;
  for (const s of lista) {
    const ordine = s.piloti.map((p) => ({ p, i: p.valori.reduce((t, v, k) => t + v * pesi[k], 0) }))
      .sort((a, b) => b.i - a.i || a.p.slug.localeCompare(b.p.slug)).map((x) => scuderiaDi.get(`${s.round}|${x.p.slug}`));
    for (let k = 0; k < ordine.length - 1; k++) { totali++; if (ordine[k] === ordine[k + 1]) coppie++; }
  }
  return coppie / totali;
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
  const compromesso = compromessoPerGp(lista, totale, passo);
  const progressivoCompromesso = lista.slice(3).map((s, i) => {
    const pesi = compromessoPerGp(lista.slice(0, i + 3), totale, Math.max(passo, 2)).pesi;
    return { round: s.round, pesi, ...spearman(s, pesi) };
  });
  const scuderiaDi = new Map();
  const campioni = require("../services/runtimeF1db").campioniCorrenti(require("../data/campioni-previsionali-2026.json"));
  const slugPilota = Object.fromEntries(Object.entries(campioni.mappingPiloti).map(([s, id]) => [id, s]));
  for (const g of campioni.gare) for (const r of campioni.risultati.filter((x) => x.raceId === g.id))
    scuderiaDi.set(`${g.round}|${slugPilota[r.driverId]}`, r.constructorId);
  // Riferimento: quanto spesso i compagni arrivano davvero attaccati.
  const reale = (() => { let c = 0, t = 0; for (const s of lista) { const o = [...s.piloti].sort((a, b) => a.reale - b.reale)
    .map((p) => scuderiaDi.get(`${s.round}|${p.slug}`)); for (let k = 0; k < o.length - 1; k++) { t++; if (o[k] === o[k + 1]) c++; } } return c / t; })();
  const media = (xs) => xs.reduce((t, x) => t + x, 0) / xs.length;
  console.log(JSON.stringify({ chiavi: CHIAVI, aggiornamentiFissi: fissoAggiornamenti, gp: lista.length,
    blocchiScuderiaReali: reale,
    attuali: { pesi: attuali, ...valuta(lista, attuali), blocchi: blocchiScuderia(lista, attuali, scuderiaDi) },
    ottimoGlobale: { ...ottimo, blocchi: blocchiScuderia(lista, ottimo.pesi, scuderiaDi), fuoriCampione: media(progressivo.map((x) => x.rho)) },
    compromesso: { pesi: compromesso.pesi, ...valuta(lista, compromesso.pesi), blocchi: blocchiScuderia(lista, compromesso.pesi, scuderiaDi),
      fuoriCampione: media(progressivoCompromesso.map((x) => x.rho)), attualiFuoriCampione: media(progressivo.map((x) => x.attuali)) },
    perGp: compromesso.perGp.map((g) => ({ ...g, conCompromesso: spearman(lista.find((s) => s.round === g.round), compromesso.pesi).rho,
      conAttuali: spearman(lista.find((s) => s.round === g.round), attuali).rho })) }, null, 2));
}

if (require.main === module) main();
module.exports = { main, scenari, spearman, valuta, cerca, compromessoPerGp, CHIAVI };
