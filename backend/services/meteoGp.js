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

async function previsioneMeteo(garaSlug) {
  const gara = CONFIGURAZIONE_GARE[garaSlug];
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
    const valore = probabilitaPioggiaPercentuale === null ? null : {
      probabilitaPioggiaPercentuale,
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

module.exports = { previsioneMeteo, probabilitaNellaFascia };
