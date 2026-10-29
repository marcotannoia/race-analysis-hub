// Scale fisse: la somiglianza di una coppia non cambia aggiungendo altre piste.
// Le scale sono scelte metodologiche esplicite, non parametri già calibrati.
const CRITERI = Object.freeze([
  ['numeroCurve', 'Numero di curve', 'curve', 20, 0, 50],
  ['altitudineMetri', 'Altitudine', 'm', 2500, -500, 5000],
  ['temperaturaAsfaltoC', 'Temperatura media asfalto', '°C', 40, -20, 90],
  ['temperaturaAriaC', 'Temperatura media aria', '°C', 30, -20, 60],
  ['numeroRettilinei', 'Numero di rettilinei', 'rettilinei', 10, 0, 30],
  ['lunghezzaRettilineiKm', 'Lunghezza totale rettilinei', 'km', 5, 0, 10],
  ['zoneSorpasso', 'Zone DRS / Overtake', 'zone', 5, 0, 10],
  ['tipologia', 'Tipologia circuito', 'categoria', null],
  ['gLateralePerKm', 'G laterale di riferimento / km', 'g/km', 1.5, 0, 5],
  ['cambiDirezionePerKm', 'Cambi di direzione per km', '1/km', 5, 0, 20],
  ['velocitaMediaKmh', 'Velocità media sul giro', 'km/h', 150, 50, 400],
  ['velocitaCurveKmh', 'Velocità media in curva', 'km/h', 150, 20, 350],
  ['velocitaMassimaKmh', 'Velocità massima', 'km/h', 100, 100, 450],
  ['velocitaMinimaKmh', 'Velocità minima in pista', 'km/h', 150, 10, 250],
  ['gFrenataPerKm', 'G medio in frenata / km', 'g/km', 1, 0, 5],
  ['dislivelloMedio', 'Dislivello di riferimento (max–min)', 'm', 120, 0, 300],
  ['caricoAerodinamico', 'Richiesta di carico aerodinamico', 'basso / medio / alto', null],
  ['umiditaPercentuale', 'Umidità media', '%', 100, 0, 100],
  ['ventoMs', 'Velocità media del vento', 'm/s', 15, 0, 100],
  ['meteoMedio', 'Pioggia prevalente nelle edizioni osservate', 'si / no', null],
  ['variabilitaMeteo', 'Variabilità pioggia / asciutto', '%', 100, 0, 100],
  ['distanzaGaraKm', 'Distanza programmata gara', 'km', 60, 200, 350],
].map(([chiave, nome, unita, scala, minimo, massimo]) => Object.freeze({chiave, nome, unita, scala, minimo, massimo, pesoPercentuale: 100 / 22})));

const round = n => Math.round(n * 10000) / 10000;
function valoreValido(voce, criterio, annoLimite) {
  if (!voce || !['documentato', 'derivato', 'stimato'].includes(voce.stato) || !Array.isArray(voce.fonti) || !voce.fonti.length) return false;
  if (annoLimite && voce.anni?.some(a => a >= annoLimite)) return false;
  if (criterio.chiave === 'caricoAerodinamico') return ['basso','medio','alto'].includes(voce.valore);
  if (criterio.chiave === 'meteoMedio') return ['si','no'].includes(voce.valore);
  if (criterio.chiave === 'tipologia') return ['cittadino', 'ibrido', 'permanente'].includes(voce.valore);
  return Number.isFinite(voce.valore) && voce.valore >= criterio.minimo && voce.valore <= criterio.massimo;
}

function confrontaCircuiti(primo, secondo, { annoLimite = 2027 } = {}) {
  const dettagli = CRITERI.map(criterio => {
    const a = primo?.campi?.[criterio.chiave], b = secondo?.campi?.[criterio.chiave];
    let percentuale = null;
    const confrontabili = valoreValido(a, criterio, annoLimite) && valoreValido(b, criterio, annoLimite) &&
      // DRS storico e Overtake Mode non sono la stessa infrastruttura.
      (criterio.chiave !== 'zoneSorpasso' || (a.sistema && a.sistema === b.sistema));
    if (confrontabili) {
      percentuale = criterio.chiave === 'caricoAerodinamico'
        ? 100 - 50 * Math.abs(['basso','medio','alto'].indexOf(a.valore) - ['basso','medio','alto'].indexOf(b.valore))
        : criterio.chiave === 'meteoMedio' ? (a.valore === b.valore ? 100 : 0)
        : criterio.chiave === 'tipologia'
        ? (a.valore === b.valore ? 100 : a.valore === 'ibrido' || b.valore === 'ibrido' ? 50 : 0)
        : 100 * Math.max(0, 1 - Math.abs(a.valore - b.valore) / criterio.scala);
    }
    return { ...criterio, valorePrimo: a?.valore ?? null, valoreSecondo: b?.valore ?? null,
      similaritaPercentuale: percentuale === null ? null : round(percentuale),
      fontiPrimo: a?.fonti || [], fontiSecondo: b?.fonti || [],
      qualitaPrimo: a?.stato ?? 'mancante', qualitaSecondo: b?.stato ?? 'mancante',
      metodoPrimo: a?.metodo ?? null, metodoSecondo: b?.metodo ?? null,
      stato: confrontabili ? 'confrontabile' : 'dati_mancanti_o_non_omogenei' };
  });
  const validi = dettagli.filter(d => d.similaritaPercentuale !== null);
  const somma = validi.reduce((s, d) => s + d.similaritaPercentuale, 0);
  const completo = validi.length === CRITERI.length;
  return {
    versione: 'similarita-multicriterio-v2',
    // La media completa esiste soltanto quando tutti i 22 criteri sono disponibili.
    similaritaPercentuale: completo ? round(somma / CRITERI.length) : null,
    similaritaParzialePercentuale: validi.length ? round(somma / validi.length) : null,
    coperturaPercentuale: round(validi.length / CRITERI.length * 100),
    intervalloPercentuale: { minimo: round(somma / CRITERI.length), massimo: round((somma + (CRITERI.length - validi.length) * 100) / CRITERI.length) },
    campiConfrontati: validi.length, campiTotali: CRITERI.length,
    criteriConStime: dettagli.filter(d => d.qualitaPrimo === 'stimato' || d.qualitaSecondo === 'stimato').length,
    utilizzabileInPrevisione: completo, dettagli,
  };
}

function confrontaCalendario(slug, { catalogo = require('../data/similarita-circuiti-2026.json'), annoLimite = 2027 } = {}) {
  const corrente = catalogo.circuiti[slug];
  if (!corrente) return [];
  return Object.values(catalogo.circuiti).filter(c => c.slug !== slug).map(c => ({
    slug: c.slug, circuitId: c.circuitId, nome: c.nome, round: c.round,
    ...confrontaCircuiti(corrente, c, {annoLimite}),
  })).sort((a,b) => (b.similaritaPercentuale ?? -1) - (a.similaritaPercentuale ?? -1) ||
    b.coperturaPercentuale - a.coperturaPercentuale ||
    (b.similaritaParzialePercentuale ?? -1) - (a.similaritaParzialePercentuale ?? -1) || a.slug.localeCompare(b.slug));
}

// Il chiamante passa solo risultati disponibili prima del GP target.
function valutaRisultatiSimili(confronti, risultati, driverId, roundEsclusivo, annoTarget = 2026) {
  const ammessi = new Map(confronti.filter(c => c.utilizzabileInPrevisione).map(c => [c.circuitId,c]));
  const righe = risultati.filter(r => Number.isInteger(r.year) &&
    (r.year < annoTarget || r.year === annoTarget && r.round < roundEsclusivo) && r.driverId === driverId &&
    require('./overallSemantici').regolare(r) && ammessi.has(r.circuitId));
  let somma = 0, peso = 0, campione = 0;
  for (const r of righe) {
    const w = ammessi.get(r.circuitId).similaritaPercentuale / 100;
    const partecipanti = risultati.filter(x => x.raceId === r.raceId).length;
    if (partecipanti < 2) continue;
    somma += Math.max(0, 100 * (partecipanti - r.positionNumber) / (partecipanti - 1)) * w;
    peso += w;
    if (w > 0) campione++;
  }
  return {valore: peso ? round(somma / peso) : null, campione};
}
module.exports = { CRITERI, confrontaCircuiti, confrontaCalendario, valutaRisultatiSimili };
