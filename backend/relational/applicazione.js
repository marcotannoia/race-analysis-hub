const express = require('express');
const controller = require('../controllers/v1/apiController');
const { convalidaLingua } = require('../i18n/lingue');
const convalidaQuery = require('../middleware/convalidaQuery');
const convalidaSlug = require('../middleware/convalidaParametriSlug');

// Stessi servizi applicativi e stessa base Postgres, con analisi numeriche v2.
const percorsi = [
  ['/home', 'home'],
  ['/stagione', 'stagione'],
  ['/lingue', 'elencaLingue'],
  ['/previsioni/piloti', 'classificaPrevisionale'],
  ['/classifiche/piloti', 'classificaPiloti'],
  ['/classifiche/scuderie', 'classificaScuderie'],
  ['/piloti/:pilotaSlug', 'dettaglioPilota'],
  ['/scuderie/:scuderiaSlug', 'dettaglioScuderia'],
  ['/gare/attuale', 'garaAttuale'],
  ['/gare/:garaSlug/piloti/:pilotaSlug/analisi', 'analisiPilotaPerGara'],
  ['/gare/:garaSlug/scuderie/:scuderiaSlug/analisi', 'analisiScuderiaPerGara'],
  ['/gare/:garaSlug', 'dettaglioGara'],
  ['/confronti/piloti/:primoPilotaSlug/:secondoPilotaSlug', 'confrontoPiloti'],
  ['/confronti/scuderie/:primaScuderiaSlug/:secondaScuderiaSlug', 'confrontoScuderie'],
];

function posizioneStorica(testo) {
  if (!testo) return '—';
  const posizioni = String(testo).toUpperCase().match(/\b(?:[PQ]\d+|DNF|DNS|DSQ|NC)\b/g);
  return posizioni ? posizioni.join(' / ') : '—';
}

function analisiNumerica(analisi) {
  if (!analisi) return null;
  const { pilota, scuderia, gara, valutazioni, valutazioniPerAnno, overall, fonti } = analisi;
  const edizioni = new Map();
  const annuali = analisi.datiPerAnno || {};
  const anni = new Set([...Object.keys(annuali.risultatiGara || {}), ...Object.keys(annuali.risultatiQualifica || {})]);
  for (const anno of anni) if (/^\d{4}$/.test(anno)) edizioni.set(Number(anno), {
    stagione: Number(anno),
    posizioneGara: posizioneStorica(annuali.risultatiGara?.[anno]),
    posizioneQualifica: posizioneStorica(annuali.risultatiQualifica?.[anno]),
  });
  for (const { stagione, posizioneGara, posizioneQualifica } of analisi.storicoEdizioni || [])
    edizioni.set(stagione, { stagione, posizioneGara, posizioneQualifica });
  return {
    ...(pilota ? { pilota } : {}), scuderia, gara,
    valutazioni, valutazioniPerAnno, overall, fonti,
    // Le posizioni sono risultati, non punteggi: conservano l'unità originale.
    storicoEdizioni: [...edizioni.values()].sort((a,b)=>a.stagione-b.stagione),
    penalita: analisi.penalita,
    aggiornamentiInArrivo: analisi.aggiornamentiInArrivo,
    ...(analisi.aggiornamentiTecniciUfficiali ? {aggiornamentiTecniciUfficiali:analisi.aggiornamentiTecniciUfficiali} : {}),
  };
}

function presentaRisposta(dati) {
  if (Array.isArray(dati)) return dati.map(presentaRisposta);
  if (!dati || typeof dati !== 'object') return dati;
  if (Object.hasOwn(dati, 'valutazioni') && Object.hasOwn(dati, 'gara')) return analisiNumerica(dati);
  return Object.fromEntries(Object.entries(dati).map(([chiave, valore]) =>
    [chiave, presentaRisposta(valore)]));
}

function creaRouterApplicazione(controllers = {...controller,...require('./analisi')}) {
  const router = express.Router();
  router.use(convalidaLingua);
  router.use((req,res,next)=>{res.set('Content-Language',res.locals.lingua);next();});
  router.use(require('../middleware/cacheApiV1'));
  for (const [percorso, nome] of percorsi) {
    const slugs = [...percorso.matchAll(/:([A-Za-z]+)/g)].map(m => m[1]);
    router.get(percorso, convalidaQuery('lingua'), convalidaSlug(...slugs), async (req, res, next) => {
      const json = res.json.bind(res);
      res.json = dati => json(presentaRisposta(dati));
      try { await controllers[nome](req, res); } catch (errore) { next(errore); }
    });
  }
  return router;
}

module.exports = { creaRouterApplicazione, percorsi, presentaRisposta };
