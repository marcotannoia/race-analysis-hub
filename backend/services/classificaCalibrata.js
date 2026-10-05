const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const campioni = require("../data/campioni-previsionali-2026.json");
const calibrazione = require("../data/calibrazione-pesi-2026-10-05.json");
const recente = require('../data/valutazione-forma-recente-2026-10-05.json');
const evidenze = require('../data/evidenze-giri-2023-2026.json');
const { fattoriRecenti, CHIAVI_RECENTI } = require('./modelloRecente');
const digestGiri = createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../data/evidenze-giri-2023-2026.json'))).digest('hex');
if (digestGiri !== recente.sha256Evidenze) throw new Error('Evidenze e modello recente non corrispondono');
const { indicePosizione } = require("./overallSemantici");
const { CHIAVI, creaFattori, ordinaFattori } = require("./calibrazionePesi");
const { testiPrevisione } = require("../i18n/previsioni");
const { valoreLocalizzato } = require("../i18n/lingue");
const { valutaPenalita, valutaPenalitaFia, PESO_PENALITA } = require("./classificaPrevisionale");
const digest = createHash("sha256").update(fs.readFileSync(path.join(__dirname, "../data/campioni-previsionali-2026.json"))).digest("hex");
if (digest !== calibrazione.sha256Campioni) throw new Error("Campioni e calibrazione non corrispondono");
const CHIAVI_API = Object.freeze(["compatibilitaVetturaCircuito", "risultatiCircuitiSimili", "qualifica2026", "storicoPersonale", "aggiornamentiTecnici", "andamento2026", "passoGaraRecente", "andamentoScuderiaRecente"]);
const numerosita = new Map(Object.entries(campioni.numerosita).map(([id, n]) => [Number(id), n]));

function creaClassificaCalibrata({ gara, piloti, scuderie, analisiPiloti, lingua = "it", meteo = null, datiLiveFia = null, pesi = null }) {
  const testi = testiPrevisione(lingua);
  const gp = campioni.gare.find((g) => g.year === gara.stagione && g.round === gara.ordineCalendario);
  if (!gp) throw new Error(`Scenario previsionale non disponibile: ${gara.slug}`);
  const analisi = new Map(analisiPiloti.map((a) => [a.pilota.slug, a]));
  const squadre = new Map(scuderie.map((s) => [s.slug, s]));
  const presenti = piloti.filter((p) => analisi.has(p.slug)).map((p) => {
    const a = analisi.get(p.slug);
    const scuderiaSlug = a.scuderia?.slug || p.scuderia?.slug;
    const driverId = campioni.mappingPiloti[p.slug], constructorId = campioni.mappingScuderie[scuderiaSlug];
    if (!driverId || !constructorId || !squadre.has(scuderiaSlug)) throw new Error(`Mapping mancante per ${p.slug}/${scuderiaSlug}`);
    return { driverId, constructorId, pilotaSlug: p.slug, scuderiaSlug };
  });
  const usaRecente = pesi === null && recente.stato === 'calibrato_retrospettivo';
  const storico = usaRecente && recente.gp.find(g => g.round === gp.round);
  if (pesi === null) pesi = usaRecente ? (storico ? Object.fromEntries(CHIAVI_RECENTI.map((k,i)=>[k,storico.pesiProgressivi[i]])) : recente.pesi) : calibrazione.pesi;
  const metodo = usaRecente ? recente : calibrazione;
  const vettorePesi = CHIAVI.map((k) => pesi[k] || 0);
  const fattoriInput = creaFattori({ ...campioni, gara: gp, partecipanti: presenti, numerosita });
  if (usaRecente) {
    const nuovi = new Map(fattoriRecenti({ campioni, evidenze, gara: gp, partecipanti: presenti, parametri: storico?.parametriProgressivi || recente.parametri }).map(p => [p.driverId,p]));
    for (const p of fattoriInput) for (const [i,k] of CHIAVI_RECENTI.entries()) p.valori[CHIAVI.indexOf(k)] = nuovi.get(p.driverId).valori[i];
  }
  // Dopo l'ultimo GP archiviato, leggi il mondiale aggiornato su Atlas.
  // Gli scenari storici continuano a usare soltanto la classifica anteriore al target.
  if (gp.round > campioni.ultimoRoundIncluso) {
    const ranking = presenti.map((p) => ({ ...p, mondiale: piloti.find((d) => d.slug === p.pilotaSlug)?.classifica2026?.posizione }))
      .sort((a, b) => (Number.isInteger(a.mondiale) && a.mondiale > 0 ? a.mondiale : 999) -
        (Number.isInteger(b.mondiale) && b.mondiale > 0 ? b.mondiale : 999) || a.driverId.localeCompare(b.driverId));
    const posizioni = new Map(ranking.map((p, i) => [p.driverId, { posizione: i + 1,
      noto: Number.isInteger(p.mondiale) && p.mondiale > 0 }]));
    for (const p of fattoriInput) {
      const r = posizioni.get(p.driverId);
      p.valori[4] = r.noto ? indicePosizione(r.posizione, presenti.length) : 50;
    }
  }
  const nomiPasso = { it: 'Passo recente da giri filtrati', en: 'Recent pace from filtered laps', fr: 'Rythme récent sur tours filtrés', pt: 'Ritmo recente de voltas filtradas', es: 'Ritmo reciente de vueltas filtradas', de: 'Aktuelles Tempo aus gefilterten Runden' };
  const nomiTeam = {it:'Forma recente scuderia',en:'Recent team form',fr:'Forme récente de l’équipe',pt:'Forma recente da equipa',es:'Forma reciente del equipo',de:'Aktuelle Teamform'};
  const nomeFattore = chiave => usaRecente && chiave === 'andamentoScuderiaRecente' ? nomiTeam[lingua] : usaRecente && chiave === 'passoGaraRecente' ? nomiPasso[lingua] : testi.fattori[chiave];
  const ordine = ordinaFattori(fattoriInput, vettorePesi);
  const classifica = ordine.map((p) => {
    const pilota = piloti.find((x) => x.slug === p.pilotaSlug);
    const scuderia = squadre.get(p.scuderiaSlug);
    const editoriale = valutaPenalita(analisi.get(p.pilotaSlug)?.penalita);
    const ufficiale = valutaPenalitaFia(datiLiveFia?.penalitaGriglia, pilota.numero);
    const penalita = ufficiale && (!editoriale || ufficiale.valore <= editoriale.valore) ? ufficiale : editoriale;
    const indice = p.indice * (penalita ? 0.65 + 0.35 * penalita.valore / 100 : 1);
    // Mantieni gli otto campi ordinari del contratto; peso zero per fattori non utilizzati.
    const fattori = CHIAVI_API.map((chiave) => {
      const i = CHIAVI.indexOf(chiave);
      const peso = i >= 0 ? vettorePesi[i] : 0;
      const valore = i >= 0 ? p.valori[i] : 50;
      return { chiave, nome: nomeFattore(chiave), pesoPercentuale: peso * (penalita ? 0.65 : 1),
        valutazione: Math.round(valore * 100) / 100,
        contributo: Math.round(valore * peso / 100 * (penalita ? 0.65 : 1) * 1000) / 1000 };
    });
    const attivi = fattori.filter((f) => f.pesoPercentuale > 0).sort((a,b)=>b.pesoPercentuale-a.pesoPercentuale);
    if (penalita) fattori.push({ chiave: "penalita", nome: testi.fattori.penalita, pesoPercentuale: PESO_PENALITA,
      valutazione: Math.round(p.indice * penalita.valore) / 100,
      contributo: Math.round(p.indice * penalita.valore * 0.35 / 100 * 1000) / 1000 });
    return { indice, pilota: { slug: pilota.slug, nome: pilota.nome, codice: pilota.codice,
      numero: pilota.numero, abbreviazioneNome: pilota.codice, numeroVettura: pilota.numero,
      nazionalitaIso2: pilota.nazionalitaIso2, nazionalitaIso3: pilota.nazionalitaIso3 },
      scuderia: { slug: scuderia.slug, nome: scuderia.nome, abbreviazione: scuderia.abbreviazione, colore: scuderia.colore },
      confidenza: testi.livelli.bassa, confidenzaCodice: "bassa", sintesi: attivi.length > 1 ?
        testi.sintesi(attivi[0].nome, attivi[1].nome) : attivi[0].nome,
      fattori, aggiornamentiTecnici: { stato: testi.stati[analisi.get(p.pilotaSlug)?.statoAggiornamentiTecnici] || testi.stati.nessunaInformazione,
        nota: valoreLocalizzato(analisi.get(p.pilotaSlug), 'aggiornamentiInArrivo', lingua) || testi.note.nessunVantaggio } };
  }).sort((a, b) => b.indice - a.indice ||
    campioni.mappingPiloti[a.pilota.slug].localeCompare(campioni.mappingPiloti[b.pilota.slug]));
  return { lingua, gara: { slug: gara.slug, nome: valoreLocalizzato(gara, "nome", lingua),
    circuito: valoreLocalizzato(gara, "circuito", lingua) }, modello: metodo.versione, meteo, circuitiSimili: [],
    pesi: CHIAVI_API.map((chiave) => ({ chiave, nome: nomeFattore(chiave), pesoPercentuale: pesi[chiave] || 0 })),
    calibrazione: { stato: metodo.stato, combinazioniEsaminate: metodo.ricerca.combinazioni,
      ultimoRoundTraining: campioni.ultimoRoundIncluso,
      fonteMondiale: gp.round > campioni.ultimoRoundIncluso ? "database" : "snapshot_anteriore_al_gp",
      candidataPromossa: metodo.stato === "calibrato_retrospettivo" },
    classifica: classifica.map((p, i) => ({ ...p, indice: Math.round(p.indice * 10) / 10, posizione: i + 1 })) };
}
module.exports = { creaClassificaCalibrata };
