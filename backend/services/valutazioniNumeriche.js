// Nessuna conversione da prosa o assegnazione di valori convenzionali ai dati mancanti.
function punteggio(valore) {
  if (valore === null || valore === undefined) return null;
  if (!Number.isFinite(valore) || valore < 0 || valore > 100) {
    throw new RangeError('Il punteggio deve essere numerico e compreso fra 0 e 100');
  }
  return valore;
}

function valutazioniNumeriche(analisi) {
  const overall = analisi.overallSemantici || {};
  const campi = overall.campi || {};
  const corrente = overall.stagioneCorrente || {};
  const daMetrica = (metrica) => punteggio(metrica?.overall);
  return {
    passoGara: daMetrica(campi.passoGara),
    gestioneGomme: daMetrica(campi.gestioneGomme),
    rendimento: daMetrica(corrente.rendimento),
    qualifica: daMetrica(corrente.qualifica),
    completamento: daMetrica(corrente.completamento),
    formaRecente: daMetrica(campi.andamentoPerAnno),
    storicoGara: daMetrica(campi.risultatiGara),
    storicoQualifica: daMetrica(campi.risultatiQualifica),
  };
}

function valutazioniPerAnno(analisi) {
  return Object.fromEntries(Object.entries(analisi.overallSemantici?.evidenzeGiri?.anni || {})
    .map(([anno, dati]) => [anno, {
      passoGara: punteggio(dati.passo?.overall),
      gestioneGomme: punteggio(dati.gomme?.overall),
    }]));
}
module.exports = { punteggio, valutazioniNumeriche, valutazioniPerAnno };
