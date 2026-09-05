const traduzioni = require('./profiliTecnici.json');
const circuiti = require('../data/circuiti-tecnici-2026.json');
const profili = require('../data/profili-tecnici-2026.json');
const { LINGUE_SUPPORTATE } = require('./lingue');

// Technical prose is versioned alongside the API, outside MongoDB's seed data.
function verificaProfiliTecnici(catalogo = traduzioni) {
  const errori = [];
  for (const lingua of Object.keys(LINGUE_SUPPORTATE).filter((codice) => codice !== 'it')) {
    const testi = catalogo[lingua];
    for (const [campo, originale] of [['metodoCircuito', circuiti.metadati.metodo], ['metodoScuderia', profili.metadati.metodo]]) {
      if (typeof testi?.[campo] !== 'string' || !testi[campo].trim() || testi[campo] === originale) {
        errori.push(`${lingua}.${campo}: traduzione tecnica mancante`);
      }
    }
    for (const [slug, circuito] of Object.entries(circuiti.circuiti)) {
      const valori = testi?.circuiti?.[slug];
      if (!Array.isArray(valori) || valori.length !== circuito.caratteristiche.length) {
        errori.push(`${lingua}.${slug}: caratteristiche tecniche incomplete`);
        continue;
      }
      valori.forEach((testo, indice) => {
        if (typeof testo !== 'string' || !testo.trim() || testo === circuito.caratteristiche[indice]) {
          errori.push(`${lingua}.${slug}[${indice}]: caratteristica non tradotta`);
        }
      });
    }
  }
  return errori;
}
module.exports = { verificaProfiliTecnici };
