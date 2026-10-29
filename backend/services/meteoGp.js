const CONFIGURAZIONE_GARE = Object.freeze({
  "singapore-marina-bay": {
    latitude: 1.292,
    longitude: 103.864,
    inizio: "2026-10-11T12:00:00Z",
    fine: "2026-10-11T14:00:00Z",
  },
});

const cache = new Map();
const DURATA_CACHE = 5 * 60 * 1000;

function probabilitaNellaFascia(hourly, inizio, fine) {
  const ore = hourly?.time || [];
  const probabilita = hourly?.precipitation_probability || [];
  const valori = ore.flatMap((ora, indice) => {
    const istante = Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(ora) ? ora : `${ora}Z`);
    const valore = probabilita[indice];
    // Massimo orario: non probabilità combinata di pioggia durante l’intero GP.
    // Open-Meteo timestamps the probability at the end of the preceding hour.
    return istante > inizio && istante <= fine &&
      Number.isFinite(valore) && valore >= 0 && valore <= 100
      ? [valore] : [];
  });
  return valori.length ? Math.max(...valori) : null;
}

// Pioggia "per tutto il weekend": il giorno meno piovoso ha comunque questo picco orario.
function probabilitaWeekend(hourly, inizio, fine) {
  const giorni = [];
  for (let giorno = inizio; giorno < fine; giorno += 24 * 3600000) {
    const valore = probabilitaNellaFascia(hourly, giorno, Math.min(fine, giorno + 24 * 3600000));
    if (valore !== null) giorni.push(valore);
  }
  return giorni.length ? Math.min(...giorni) : null;
}

const istante = (data, ora) => data && ora ? new Date(`${data}T${String(ora).slice(0, 8)}Z`) : null;

async function previsioneMeteo(garaSlug) {
  let gara = CONFIGURAZIONE_GARE[garaSlug];
  if (!gara && require('../config/database').usaPostgres()) {
    try {
      const r = await require('../config/database').getPool().query(`select c.latitude,c.longitude,r.date::text date,r.time::text time,
        r.qualifying_date::text qualifying_date,r.qualifying_time::text qualifying_time,
        r.free_practice_1_date::text fp1_date,r.free_practice_1_time::text fp1_time
        from catalog.grand_prix g join catalog.circuit cc on cc.id=g.circuit_id
        join f1db.circuit c on c.id=cc.f1db_circuit_id join f1db.race r on r.year=g.season and r.round=g.calendar_order
        where g.slug=$1`, [garaSlug]);
      const row=r.rows[0];
      if(row?.date && row.time && row.latitude!=null && row.longitude!=null){
        const inizio=istante(row.date,row.time), qualifica=istante(row.qualifying_date,row.qualifying_time),
          fp1=istante(row.fp1_date,row.fp1_time);
        if(Number.isFinite(inizio?.getTime()))gara={latitude:Number(row.latitude),longitude:Number(row.longitude),
          inizio:inizio.toISOString(),fine:new Date(inizio.getTime()+2*3600000).toISOString(),
          ...(Number.isFinite(qualifica?.getTime()) ? {inizioQualifica:qualifica.toISOString(),
            fineQualifica:new Date(qualifica.getTime()+3600000).toISOString()} : {}),
          ...(Number.isFinite(fp1?.getTime()) ? {inizioWeekend:fp1.toISOString()} : {})};
      }
    } catch { return null; }
  }
  if (!gara) return null;
  const adesso = Date.now();
  const precedente = cache.get(garaSlug);
  if (precedente && adesso - precedente.caricatoIl < DURATA_CACHE) {
    return precedente.valore;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(gara.latitude),
    longitude: String(gara.longitude),
    hourly: "precipitation_probability",
    timezone: "UTC",
    forecast_days: "10",
  }).toString();

  try {
    const risposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!risposta.ok) throw new Error(`Meteo HTTP ${risposta.status}`);
    const dati = await risposta.json();
    const probabilitaPioggiaPercentuale = probabilitaNellaFascia(
      dati.hourly,
      Date.parse(gara.inizio),
      Date.parse(gara.fine),
    );
    const probabilitaPioggiaQualificaPercentuale = gara.inizioQualifica
      ? probabilitaNellaFascia(dati.hourly, Date.parse(gara.inizioQualifica), Date.parse(gara.fineQualifica)) : null;
    const probabilitaPioggiaWeekendPercentuale = gara.inizioWeekend
      ? probabilitaWeekend(dati.hourly, Date.parse(gara.inizioWeekend), Date.parse(gara.fine)) : null;
    const valore = probabilitaPioggiaPercentuale === null ? null : {
      probabilitaPioggiaPercentuale,
      probabilitaPioggiaQualificaPercentuale,
      probabilitaPioggiaWeekendPercentuale,
      intervalloInizio: gara.inizio,
      intervalloFine: gara.fine,
      rilevatoIl: new Date().toISOString(),
      metodo: "massimo_probabilita_oraria",
      fonte: "Open-Meteo",
      fonteUrl: "https://open-meteo.com/en/docs",
    };
    if (valore) cache.set(garaSlug, { caricatoIl: adesso, valore });
    return valore;
  } catch {
    return precedente && adesso - precedente.caricatoIl < 24 * 60 * 60 * 1000
      ? precedente.valore : null;
  }
}

module.exports = { previsioneMeteo, probabilitaNellaFascia, probabilitaWeekend };
