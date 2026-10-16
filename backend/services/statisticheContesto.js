const statistiche = require("../data/statistiche-contesto.json");
let lastLoaded = 0;
let lastVersion = null;

async function leggiStatistichePostgres(pool) {
  const [drivers,meta] = await Promise.all([
    pool.query(`select d.slug,c.races_started,c.wet_races,c.positive_wet_races,
      c.wet_wins,c.driver_errors,c.fatal_errors
      from catalog.driver d left join ratings.driver_context c on c.driver_id=d.id`),
    pool.query('select * from ratings.context_metadata where singleton=true'),
  ]);
  if (meta.rowCount !== 1) throw new Error('Metadati statistiche PostgreSQL assenti');
  const row=meta.rows[0];
  return {
    metadati: { versioneMetodologia:row.methodology_version,
      ultimoGpIncluso:row.last_grand_prix_key,descrizione:row.description,
      metodologiaPioggia:row.wet_methodology,fonti:row.sources,
      aggiornamentiApplicati:row.applied_grand_prix_keys },
    piloti: Object.fromEntries(drivers.rows.map((x)=>[x.slug,
      x.races_started === null ? null : {
        gareDisputate:x.races_started,gareConPioggiaDisputate:x.wet_races,
        gareConPioggiaPositive:x.positive_wet_races,vittorieConPioggia:x.wet_wins,
        erroriPilota:x.driver_errors,erroriFatali:x.fatal_errors }])),
  };
}

async function caricaStatistichePostgres(pool) {
  const data=await leggiStatistichePostgres(pool);
  statistiche.piloti=data.piloti;
  statistiche.metadati=data.metadati;
  lastLoaded=Date.now();
  const result=await pool.query(`select greatest(
    coalesce((select max(updated_at) from ratings.driver_context),'epoch'::timestamptz),
    (select updated_at from ratings.context_metadata where singleton=true)) version`);
  lastVersion=result.rows[0].version?.toISOString();
}

async function aggiornaStatistichePostgresSeNecessario() {
  const database=require('../config/database');
  if (!database.usaPostgres() || Date.now()-lastLoaded < 30000) return;
  const pool=database.getPool();
  const result=await pool.query(`select greatest(
    coalesce((select max(updated_at) from ratings.driver_context),'epoch'::timestamptz),
    (select updated_at from ratings.context_metadata where singleton=true)) version`);
  const version=result.rows[0].version?.toISOString();
  if (version !== lastVersion) await caricaStatistichePostgres(pool);
  else lastLoaded=Date.now();
}

function arrotondaPercentuale(numeratore, denominatore) {
  if (!Number.isFinite(denominatore) || denominatore <= 0) return 0;
  return Math.round((numeratore / denominatore) * 1000) / 10;
}

function sommaStatistiche(voci) {
  const campi = [
    "gareDisputate",
    "gareConPioggiaDisputate",
    "gareConPioggiaPositive",
    "vittorieConPioggia",
    "erroriPilota",
    "erroriFatali",
  ];

  return Object.fromEntries(
    campi.map((campo) => [
      campo,
      voci.reduce((totale, voce) => totale + (voce?.[campo] || 0), 0),
    ]),
  );
}

function presentaIndicatori(valori) {
  if (!valori) return null;

  const percentualeErrori = arrotondaPercentuale(
    valori.erroriPilota,
    valori.gareDisputate,
  );
  const percentualeErroriFatali = Math.min(
    percentualeErrori,
    arrotondaPercentuale(valori.erroriFatali, valori.gareDisputate),
  );

  return {
    bravuraBagnatoPercentuale: arrotondaPercentuale(
      valori.gareConPioggiaPositive,
      valori.gareConPioggiaDisputate,
    ),
    gareConPioggiaPositive: valori.gareConPioggiaPositive,
    gareConPioggiaDisputate: valori.gareConPioggiaDisputate,
    erroriPilotaPercentuale: percentualeErrori,
    erroriFataliPercentuale: percentualeErroriFatali,
  };
}

function indicatoriPilota(pilotaSlug) {
  return presentaIndicatori(statistiche.piloti[pilotaSlug]);
}

function indicatoriScuderia(piloti) {
  const voci = (piloti || []).map(
    (pilota) => statistiche.piloti[pilota.slug],
  );

  return voci.length && voci.every(Boolean)
    ? presentaIndicatori(sommaStatistiche(voci))
    : null;
}

module.exports = {
  leggiStatistichePostgres,
  caricaStatistichePostgres,
  aggiornaStatistichePostgresSeNecessario,
  indicatoriPilota,
  indicatoriScuderia,
  presentaIndicatori,
  sommaStatistiche,
};
