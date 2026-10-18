const { Gara, Pilota, Scuderia, AnalisiGara, AnalisiScuderia } = require('../repositories/modelli');
const { presentaGara, presentaAnalisiPilota, presentaAnalisiScuderia } = require('../presenters/apiV1');
const { linguaRichiesta } = require('../i18n/lingue');
const { inviaErrore } = require('../utils/rispostaApi');

function presenta(analisi, tipo, lingua) {
  const dati = tipo === 'pilota' ? presentaAnalisiPilota(analisi, lingua) : presentaAnalisiScuderia(analisi, lingua);
  if (dati?.gara) dati.gara.stato = analisi.gara.stato;
  return dati;
}

function queryAnalisi(modello, filtro) {
  let query = modello.find(filtro).populate('gara').populate('scuderia');
  if (modello === AnalisiGara) query = query.populate('pilota');
  return query.lean();
}

async function trovaGara(req, res) {
  const gara = await require('../services/garaAttuale')();
  if (gara && gara.slug !== req.params.garaSlug) {
    inviaErrore(res,404,'GARA_NON_ACCESSIBILE','E disponibile esclusivamente il Gran Premio attuale');
    return null;
  }
  if (!gara) inviaErrore(res,404,'GARA_NON_TROVATA','Il Gran Premio richiesto non esiste');
  return gara;
}

async function dettaglioGara(req,res) {
  const gara = await trovaGara(req,res);
  if (!gara) return;
  const lingua = linguaRichiesta(req);
  const [piloti,scuderie] = await Promise.all([
    queryAnalisi(AnalisiGara,{gara:gara._id}), queryAnalisi(AnalisiScuderia,{gara:gara._id}),
  ]);
  res.json({lingua,gara:{...presentaGara(gara,lingua),stato:gara.stato},
    analisiPiloti:piloti.map(a=>presenta(a,'pilota',lingua)),
    analisiScuderie:scuderie.map(a=>presenta(a,'scuderia',lingua))});
}

function analisiPerGara(tipo) {
  return async (req,res) => {
    const gara = await trovaGara(req,res);
    if (!gara) return;
    const modello = tipo === 'pilota' ? Pilota : Scuderia;
    const entita = await modello.findOne({slug:req.params[tipo+'Slug']}).lean();
    if (!entita) return inviaErrore(res,404,tipo==='pilota'?'PILOTA_NON_TROVATO':'SCUDERIA_NON_TROVATA','Entità non trovata');
    const righe = await queryAnalisi(tipo==='pilota'?AnalisiGara:AnalisiScuderia,{gara:gara._id,[tipo]:entita._id});
    if (!righe.length) return inviaErrore(res,404,'ANALISI_NON_TROVATA','Analisi non disponibile');
    const lingua = linguaRichiesta(req);
    res.json({lingua,analisi:presenta(righe[0],tipo,lingua)});
  };
}

module.exports = { dettaglioGara,analisiPilotaPerGara:analisiPerGara('pilota'),analisiScuderiaPerGara:analisiPerGara('scuderia') };
