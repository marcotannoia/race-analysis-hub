// Preparazione locale con gli stessi controlli del comando GP; Atlas viene sincronizzato separatamente.
const fs = require('node:fs');
const path = require('node:path');
const { verificaAggiornamento, aggiornaStatisticheContesto } = require('./registraGpConcluso');
const { creaDatiEffettivi } = require('../utils/datiEffettivi');
function prepara(file, applica = false) {
  const datiFile = path.join(__dirname, '../data/dati-iniziali.json');
  const d = JSON.parse(fs.readFileSync(datiFile));
  const eff = creaDatiEffettivi(d);
  const a = JSON.parse(fs.readFileSync(file));
  const g = eff.gare.find(g => g.stato === 'attuale');
  const presenti = new Set(eff.analisiGare.filter(x => x.garaSlug === g.slug).map(x => x.pilotaSlug));
  const piloti = eff.piloti.filter(p => presenti.has(p.slug));
  verificaAggiornamento(a, g, eff.piloti, eff.scuderie, piloti);
  console.log(`Controllo locale superato: ${a.risultatiPiloti.length} risultati, ${a.classificaPiloti.length} piloti nel mondiale, ${a.classificaScuderie.length} scuderie.`);
  if (!applica) return;
  const archivio = path.join(__dirname, `../data/archivio-gp/${a.stagione}-${String(g.ordineAnalisi).padStart(2,'0')}-${g.slug}.json`);
  fs.writeFileSync(archivio, JSON.stringify(a, null, 2)+'\n');
  aggiornaStatisticheContesto(a, g, piloti, new Map(a.risultatiPiloti.map(p => [p.pilotaSlug,p])));
  const dopo = creaDatiEffettivi(d);
  d.gare = dopo.gare;
  fs.writeFileSync(datiFile, JSON.stringify(d, null, 2)+'\n');
  console.log(`Archivio salvato; prossimo GP locale: ${d.gare.find(g => g.stato === 'attuale').slug}. Database non modificato.`);
}
if (require.main === module) prepara(process.argv[2], process.argv.includes('--applica'));
module.exports = { prepara };
