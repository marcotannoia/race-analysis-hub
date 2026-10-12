// Aggiorna gli input osservati; conserva i pesi e la valutazione del training precedente.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { caricaFonti } = require('./lib/caricaFontiSemantiche');
const { creaCampioni } = require('./calibraPesiPrevisionali');
function aggiorna(cartella) {
  const campioni = creaCampioni(caricaFonti(cartella));
  const file = path.join(__dirname, '../data/campioni-previsionali-2026.json');
  const json = JSON.stringify(campioni, null, 2) + '\n';
  const reportFile = path.join(__dirname, '../data/calibrazione-pesi-2026-10-05.json');
  const report = JSON.parse(fs.readFileSync(reportFile));
  report.aggiornamentoCorpus = {
    fonte: campioni.fonte, ultimoRoundInput: campioni.ultimoRoundIncluso,
    ultimoRoundTraining: Math.max(...report.gp.map(g => g.round)),
    sha256CorpusTraining: report.aggiornamentoCorpus?.sha256CorpusTraining || report.sha256Campioni,
    metodo: 'Nuovi risultati osservati; pesi e metriche di training conservati senza nuova ottimizzazione.',
  };
  report.sha256Campioni = createHash('sha256').update(json).digest('hex');
  fs.writeFileSync(file, json);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(`Corpus aggiornato al round ${campioni.ultimoRoundIncluso}; training conservato al round ${report.aggiornamentoCorpus.ultimoRoundTraining}`);
}
if (require.main === module) aggiorna(process.argv[2]);
module.exports = { aggiorna };
