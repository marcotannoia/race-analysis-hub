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
// Stima v2, verificata sul 2026: prevede l'indice della gara successiva meglio della
// media semplice degli ultimi tre GP (passo: Spearman 0,795 → 0,825) e non produce
// 0 o 100 da una sola gara. Passo: intera stagione, emivita 6 GP, peso per giri
// comparabili (pieno da 20), un'osservazione convenzionale a 50. Gomme: la deriva non
// è stabile fra una gara e l'altra (Spearman ≈ 0,1), quindi ultimi tre GP attirati
// verso 50 con due osservazioni convenzionali.
const STIMA = Object.freeze({
  passo: { emivitaGp: 6, ultime: Infinity, prior: 1, giriPieni: 20 },
  gomme: { emivitaGp: Infinity, ultime: 3, prior: 2, giriPieni: 0 },
});
const VERSIONE_STIMA = 'evidenze-giri-v2';

function stimaEvidenze(stagione, tipo, roundTarget) {
  const p = STIMA[tipo];
  const conDato = stagione.filter((s) => s.piloti.some((x) => Number.isFinite(x[tipo].overall)));
  const sessioni = Number.isFinite(p.ultime) ? conDato.slice(-p.ultime) : conDato;
  const base = aggregaEvidenze(sessioni, tipo);
  if (base.overall === null) return { ...base, overallOsservato: null, versione: VERSIONE_STIMA };
  let num = 50 * p.prior, den = p.prior;
  for (const s of sessioni) for (const x of s.piloti) {
    const v = x[tipo].overall;
    if (!Number.isFinite(v)) continue;
    const w = (Number.isFinite(p.emivitaGp) ? 2 ** (-(roundTarget - 1 - s.round) / p.emivitaGp) : 1)
      * (p.giriPieni ? Math.min(1, x.passo.campione / p.giriPieni) : 1);
    num += w * v; den += w;
  }
  return { ...base, overall: round(num / den), overallOsservato: base.overall, versione: VERSIONE_STIMA,
    metodo: tipo === 'passo'
      ? 'Media dei ranghi relativi di passo di tutte le gare della stagione, più recenti più pesanti (emivita 6 GP) e pesate per giri comparabili; campioni piccoli attirati verso 50. Non è velocità assoluta.'
      : 'Media degli indici di deriva relativa degli ultimi tre GP, attirata verso 50 con due osservazioni convenzionali perché poco stabile fra gare; non misura usura fisica.' };
}
module.exports = { selezionaEvidenze, aggregaEvidenze, stimaEvidenze, STIMA, VERSIONE_STIMA };
