// Esito pioggia sì/no delle gare già disputate, da OpenF1 (campo rainfall).
// Uso: node scripts/raccogliMeteoGare.js [anno]
const fs = require("node:fs");
const path = require("node:path");

const API = "https://api.openf1.org/v1";
const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

async function leggi(url) {
  for (let tentativo = 0; tentativo < 6; tentativo++) {
    const risposta = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (risposta.ok) return risposta.json();
    if (risposta.status !== 429) throw new Error(`OpenF1 HTTP ${risposta.status}: ${url}`);
    await attendi(5000 * (tentativo + 1));
  }
  throw new Error(`OpenF1 limite richieste: ${url}`);
}

async function pioggiaSessione(sessionKey) {
  const url = `${API}/weather?session_key=${sessionKey}`;
  const righe = await leggi(url);
  const validi = righe.filter((r) => r.rainfall === 0 || r.rainfall === 1);
  return validi.length ? { pioggia: validi.some((r) => r.rainfall === 1), campioni: validi.length, fonte: url } : null;
}

async function raccogliMeteoGare(anno, { log = console.log } = {}) {
  const campioni = require("../data/campioni-previsionali-2026.json");
  const gare = campioni.gare.filter((g) => g.year === anno);
  const sessioni = await leggi(`${API}/sessions?year=${anno}`);
  const adesso = Date.now();
  const edizioni = [];
  for (const g of gare) {
    const perData = (nome, data) => sessioni.find((s) => s.session_name === nome && s.date_start?.slice(0, 10) === data);
    const gara = perData("Race", g.date);
    if (!gara || Date.parse(gara.date_end) > adesso) continue;
    const qualifica = g.qualifyingDate ? perData("Qualifying", g.qualifyingDate) : null;
    const esitoGara = await pioggiaSessione(gara.session_key);
    await attendi(1500);
    const esitoQualifica = qualifica ? await pioggiaSessione(qualifica.session_key) : null;
    await attendi(1500);
    if (!esitoGara) continue;
    edizioni.push({ raceId: g.id, anno, round: g.round, circuitId: g.circuitId, pioggia: esitoGara.pioggia,
      pioggiaQualifica: esitoQualifica?.pioggia ?? null, campioniGara: esitoGara.campioni,
      fonti: [esitoGara.fonte, esitoQualifica?.fonte].filter(Boolean) });
    log(`R${g.round} ${g.circuitId}: gara ${esitoGara.pioggia ? "bagnata" : "asciutta"}`);
  }
  return { anno, aggiornatoIl: new Date().toISOString().slice(0, 10), fonte: "OpenF1 /weather (rainfall)",
    metodo: "Bagnata se almeno un campione della sessione ha rainfall=1.", edizioni };
}

async function main(anno = Number(process.argv[2]) || new Date().getUTCFullYear()) {
  const dati = await raccogliMeteoGare(anno);
  const file = path.join(__dirname, `../data/meteo-gare-${anno}.json`);
  fs.writeFileSync(file, `${JSON.stringify(dati, null, 2)}\n`);
  console.log(`Scritte ${dati.edizioni.length} edizioni in ${file}`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { pioggiaSessione, raccogliMeteoGare };
