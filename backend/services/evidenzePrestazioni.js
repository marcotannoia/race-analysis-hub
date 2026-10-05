const { media, round } = require('./overallSemantici');

function selezionaEvidenze(evidenze, { year = 2026, roundEsclusivo = Infinity, circuito, driverId, constructorIds }) {
  return evidenze.sessioni.filter(s => s.year === year && s.round < roundEsclusivo && (!circuito || s.circuitId === circuito))
    .sort((a,b) => a.round-b.round).map(s => ({ ...s, piloti: s.piloti.filter(p =>
      driverId ? p.driverId === driverId : constructorIds?.includes(p.constructorId)) })).filter(s => s.piloti.length);
}
function aggregaEvidenze(sessioni, tipo) {
  const values = sessioni.flatMap(s => s.piloti.map(p => p[tipo]));
  const validi = values.filter(v => Number.isFinite(v.overall));
  const observed = values.reduce((n,v) => n + (tipo === 'passo' ? v.campione : v.stint.length),0);
  return { overall: validi.length ? round(media(validi.map(v => v.overall))) : null,
    campione: validi.length, osservazioni: observed, sessioni: sessioni.length,
    giriComparabili: values.reduce((n,v) => n+(tipo==='passo'?v.campione:v.stintComparabili.reduce((n,s)=>n+s.giriComparabili,0)),0),
    deltaMedianoPercentuale: tipo === 'passo' ? media(validi.map(v => v.deltaMedianoPercentuale)) : undefined,
    pendenzaRelativaPercentualePerGiro: tipo === 'gomme' ? media(validi.map(v => v.pendenzaRelativaPercentualePerGiro)) : undefined,
    stato: validi.length ? 'derivato_da_giri_filtrati' : observed ? 'osservazioni_senza_indice_robusto' : 'nessuna_partecipazione_nel_campione',
    ultimoRoundIncluso: sessioni.at(-1)?.round ?? null,
    fonti: sessioni.flatMap(s=>[s.fonti.laps.url,s.fonti.stints.url]),
    metodo: tipo === 'passo' ? 'Media dei ranghi relativi di passo delle sessioni selezionate; giri e condizioni filtrati, non velocità assoluta.' :
      'Media degli indici di deriva relativa degli stint selezionati; indicatore cronometrico, non misura di usura fisica.',
    utilizzabilePrevisione: false };
}
module.exports = { selezionaEvidenze, aggregaEvidenze };
