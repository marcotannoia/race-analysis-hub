// Classifica previsionale con pesi fissi e componenti dinamiche:
// somiglianza circuito campo per campo, meteo previsto e aggiornamenti pertinenti.
const catalogoBase = require("../data/similarita-circuiti-2026.json");
let meteoGareBase = require("../data/meteo-gare-2026.json");
// Aggiornamento a runtime (dashboard admin) senza riavviare il server.
function impostaMeteoGare(dati) { if (Array.isArray(dati?.edizioni)) meteoGareBase = dati; return meteoGareBase; }
const meteoGareCorrenti = () => meteoGareBase;
const { CRITERI, confrontaCircuiti } = require("./similaritaCircuiti");
const { regolare } = require("./overallSemantici");
const { testiPrevisione } = require("../i18n/previsioni");
const { valoreLocalizzato } = require("../i18n/lingue");
const { valutaPenalita, valutaPenalitaFia, PESO_PENALITA, valutaAggiornamentoTesto } = require("./classificaPrevisionale");

const PESI_DINAMICI = Object.freeze({
  compatibilitaVetturaCircuito: 42,
  compatibilitaPilotaCircuito: 25,
  aggiornamentiTecnici: 8,
  andamentoUltimi4Gp: 10,
  andamentoUltime4Qualifiche: 10,
  storicoPersonale: 5,
});

// Pioggia "riconosciuta": gara, qualifica o intero weekend almeno a questa probabilità.
const SOGLIA_PIOGGIA = 50;
// Peso del meteo attuale nella somiglianza di un'edizione: un criterio su 23 con
// tempo asciutto, metà della somiglianza quando la pioggia è riconosciuta.
const PESO_METEO_ASCIUTTO = 1 / (CRITERI.length + 1);
const PESO_METEO_BAGNATO = 0.5;
// Il pilota conserva parte della propria esperienza fra regolamenti diversi.
const DECADIMENTO_ANNO = 0.6;

// Chiavi del contratto precedente: restano con peso zero per i client nativi già pubblicati.
const CHIAVI_LEGACY = Object.freeze(["risultatiCircuitiSimili", "qualifica2026", "andamento2026", "passoGaraRecente", "andamentoScuderiaRecente"]);
const nomeFattore = (testi, chiave) => testi.fattori[chiave === "storicoPersonale" ? "storicoPersonaleCircuito" : chiave];
const arrotonda = (n, cifre = 2) => Math.round(n * 10 ** cifre) / 10 ** cifre;

function scenarioMeteo(meteo) {
  const gara = meteo?.probabilitaPioggiaPercentuale ?? null;
  const qualifica = meteo?.probabilitaPioggiaQualificaPercentuale ?? null;
  const weekend = meteo?.probabilitaPioggiaWeekendPercentuale ?? null;
  const note = [gara, qualifica, weekend].filter(Number.isFinite);
  const probabilita = note.length ? Math.max(...note) : null;
  const pioggia = probabilita !== null && probabilita >= SOGLIA_PIOGGIA;
  return {
    probabilitaGaraPercentuale: gara, probabilitaQualificaPercentuale: qualifica,
    probabilitaWeekendPercentuale: weekend, probabilitaRiferimentoPercentuale: probabilita,
    sogliaPercentuale: SOGLIA_PIOGGIA, pioggiaRiconosciuta: pioggia,
    pesoMeteoNellaSomiglianzaPercentuale: probabilita === null ? 0
      : arrotonda(100 * (pioggia ? PESO_METEO_BAGNATO : PESO_METEO_ASCIUTTO)),
  };
}

// 100 se il meteo dell'edizione coincide con quello previsto, 0 se opposto.
function concordanzaMeteo(bagnatoEdizione, probabilita) {
  if (probabilita === null) return null;
  if (typeof bagnatoEdizione !== "boolean") return 50;
  return 100 * (1 - Math.abs((bagnatoEdizione ? 100 : 0) - probabilita) / 100);
}

function similaritaEdizione(simCircuito, concordanza, scenario) {
  if (concordanza === null) return simCircuito;
  const w = scenario.pioggiaRiconosciuta ? PESO_METEO_BAGNATO : PESO_METEO_ASCIUTTO;
  return (1 - w) * simCircuito + w * concordanza;
}

function indiciCampioni(campioni) {
  const partecipanti = new Map(), qualificati = new Map();
  for (const r of campioni.risultati) partecipanti.set(r.raceId, (partecipanti.get(r.raceId) || 0) + 1);
  for (const q of campioni.qualifiche || []) qualificati.set(q.raceId, (qualificati.get(q.raceId) || 0) + 1);
  const qualifiche = new Map((campioni.qualifiche || []).map(q => [`${q.raceId}|${q.driverId}`, q]));
  return { partecipanti, qualificati, qualifiche };
}

const scala = (pos, n) => Number.isInteger(pos) && n > 1 ? Math.max(0, 100 * (n - pos) / (n - 1)) : null;

// Prestazione di un pilota in un'edizione: 70% gara (se regolare), 30% qualifica.
function prestazione(r, indici) {
  const gara = r && regolare(r) ? scala(r.positionNumber, indici.partecipanti.get(r.raceId)) : null;
  const q = r && indici.qualifiche.get(`${r.raceId}|${r.driverId}`);
  const qualifica = q ? scala(q.positionNumber, indici.qualificati.get(q.raceId)) : null;
  if (gara === null) return qualifica;
  return qualifica === null ? gara : gara * 0.7 + qualifica * 0.3;
}

function media(campioni) {
  const validi = campioni.filter(c => Number.isFinite(c.valore) && c.peso > 0);
  const peso = validi.reduce((s, c) => s + c.peso, 0);
  return peso ? validi.reduce((s, c) => s + c.valore * c.peso, 0) / peso : null;
}

function creaContesto({ gara, gp, campioni, catalogo, meteo, meteoGare }) {
  // Esito osservato della singola gara (OpenF1); in mancanza, storico del catalogo circuiti.
  const esitiGare = new Map((meteoGare?.edizioni || []).map(e => [e.raceId, e.pioggia]));
  const perCircuito = new Map(Object.values(catalogo.circuiti).map(c => [c.circuitId, c]));
  const corrente = catalogo.circuiti[gara.slug] || perCircuito.get(gp.circuitId);
  const scenario = scenarioMeteo(meteo);
  const confronti = new Map();
  for (const c of perCircuito.values()) {
    if (!corrente || c.circuitId === corrente.circuitId) continue;
    const confronto = confrontaCircuiti(corrente, c);
    if (confronto.utilizzabileInPrevisione) confronti.set(c.circuitId, { circuito: c, ...confronto });
  }
  const gare = new Map(campioni.gare.map(g => [g.id, g]));
  const precedente = r => r.year < gp.year || r.year === gp.year && r.round < gp.round;
  // Edizioni anteriori al GP target con la loro somiglianza dinamica.
  const edizioni = new Map();
  for (const r of campioni.risultati) {
    if (!precedente(r) || edizioni.has(r.raceId)) continue;
    const confronto = confronti.get(r.circuitId);
    const bagnato = esitiGare.get(r.raceId) ?? perCircuito.get(r.circuitId)?.meteoEdizioni?.find(e => e.anno === r.year)?.pioggia;
    const concordanza = concordanzaMeteo(bagnato, scenario.probabilitaRiferimentoPercentuale);
    edizioni.set(r.raceId, { raceId: r.raceId, year: r.year, round: r.round, circuitId: r.circuitId,
      nome: gare.get(r.raceId)?.officialName || confronto?.circuito.nome || r.circuitId,
      bagnato: typeof bagnato === "boolean" ? bagnato : null,
      similaritaCircuitoPercentuale: confronto?.similaritaPercentuale ?? null,
      concordanzaMeteoPercentuale: concordanza,
      similaritaPercentuale: confronto ? arrotonda(similaritaEdizione(confronto.similaritaPercentuale, concordanza, scenario)) : null });
  }
  return { corrente, scenario, confronti, edizioni, precedente, indici: indiciCampioni(campioni), campioni };
}

function sintesiEdizioni(usate) {
  return usate.sort((a, b) => b.peso - a.peso).slice(0, 5).map(u => ({
    gara: u.edizione.nome, anno: u.edizione.year, circuitId: u.edizione.circuitId, bagnato: u.edizione.bagnato,
    similaritaCircuitoPercentuale: u.edizione.similaritaCircuitoPercentuale,
    concordanzaMeteoPercentuale: u.edizione.concordanzaMeteoPercentuale,
    similaritaPercentuale: u.edizione.similaritaPercentuale, valutazione: arrotonda(u.valore) }));
}

// Vettura: solo edizioni 2026 (regolamento corrente), media delle due vetture della scuderia.
function valutaVettura(ctx, constructorId, annoTarget) {
  const usate = [];
  for (const e of ctx.edizioni.values()) {
    if (e.year !== annoTarget || e.similaritaPercentuale === null) continue;
    const valori = ctx.campioni.risultati.filter(r => r.raceId === e.raceId && r.constructorId === constructorId)
      .map(r => prestazione(r, ctx.indici)).filter(Number.isFinite).sort((a, b) => b - a);
    if (!valori.length) continue;
    const valore = valori.length === 1 ? valori[0] : valori[0] * 0.6 + valori[1] * 0.4;
    usate.push({ edizione: e, valore, peso: (e.similaritaPercentuale / 100) ** 2 });
  }
  return { valore: media(usate), campione: usate.length, edizioni: sintesiEdizioni(usate) };
}

// Pilota: tutte le edizioni su circuiti diversi dal target, più recenti più pesanti.
function valutaPilotaCircuiti(ctx, driverId, annoTarget) {
  const usate = [];
  for (const r of ctx.campioni.risultati) {
    const e = ctx.edizioni.get(r.raceId);
    if (r.driverId !== driverId || !e || e.similaritaPercentuale === null) continue;
    const valore = prestazione(r, ctx.indici);
    if (!Number.isFinite(valore)) continue;
    usate.push({ edizione: e, valore, peso: (e.similaritaPercentuale / 100) ** 2 * DECADIMENTO_ANNO ** (annoTarget - e.year) });
  }
  return { valore: media(usate), campione: usate.length, edizioni: sintesiEdizioni(usate) };
}

function valutaStoricoCircuito(ctx, driverId, annoTarget) {
  const usate = ctx.campioni.risultati.filter(r => r.driverId === driverId && r.circuitId === ctx.corrente?.circuitId && ctx.precedente(r))
    .map(r => ({ valore: prestazione(r, ctx.indici), peso: DECADIMENTO_ANNO ** (annoTarget - r.year) }));
  return { valore: media(usate), campione: usate.filter(u => Number.isFinite(u.valore)).length };
}

function valutaRecenti(ctx, driverId, gp, quanti, tipo) {
  const gare = ctx.campioni.gare.filter(g => g.year === gp.year && g.round < gp.round)
    .sort((a, b) => a.round - b.round).slice(-quanti);
  const sorgente = tipo === "gara" ? ctx.campioni.risultati : ctx.campioni.qualifiche || [];
  const usate = gare.map((g, i) => {
    const r = sorgente.find(x => x.raceId === g.id && x.driverId === driverId);
    const n = tipo === "gara" ? ctx.indici.partecipanti.get(g.id) : ctx.indici.qualificati.get(g.id);
    const valore = !r || tipo === "gara" && !regolare(r) ? null : scala(r.positionNumber, n);
    return { valore, peso: i + 1 };
  });
  return { valore: media(usate), campione: usate.filter(u => Number.isFinite(u.valore)).length };
}

// Caratteristica dell'aggiornamento → criteri del circuito in cui porta vantaggio.
const BENEFICI_AGGIORNAMENTI = Object.freeze({
  efficienzaAerodinamica: { testo: /efficienza aerodinamica|riduzion[^.]*drag|resistenza all.avanzamento|basso carico/,
    criteri: [["velocitaMassimaKmh", 1], ["lunghezzaRettilineiKm", 1], ["caricoAerodinamico", -1]] },
  caricoAerodinamico: { testo: /(?:piu|maggior[ei]?|aument\w*)[^.]*carico aerodinamico|downforce/,
    criteri: [["caricoAerodinamico", 1], ["gLateralePerKm", 1]] },
  potenzaDeployment: { testo: /potenza|deployment|recupero (?:di )?energia|erogazione/,
    criteri: [["lunghezzaRettilineiKm", 1], ["velocitaMediaKmh", 1]] },
  curvaLenta: { testo: /curve? lent[ae]|bassa velocita/, criteri: [["velocitaCurveKmh", -1], ["velocitaMinimaKmh", -1]] },
  curvaMedia: { testo: /curve? medi[ae]|media velocita/, criteri: [["numeroCurve", 1]] },
  curvaVeloce: { testo: /curve? veloc[ei]|alta velocita|curve in appoggio/, criteri: [["gLateralePerKm", 1], ["velocitaCurveKmh", 1]] },
  trazione: { testo: /trazione/, criteri: [["velocitaMinimaKmh", -1], ["tipologia", 1]] },
  frenata: { testo: /frenata|staccata/, criteri: [["gFrenataPerKm", 1]] },
  cordoli: { testo: /cordoli/, criteri: [["tipologia", 1], ["cambiDirezionePerKm", 1]] },
  gestioneGomme: { testo: /gestione (?:delle )?gomme|degrado|pneumatici/, criteri: [["temperaturaAsfaltoC", 1], ["gLateralePerKm", 1]] },
  stabilitaAssetto: { testo: /stabilita|bilanciamento|assetto/, criteri: [["cambiDirezionePerKm", 1], ["ventoMs", 1]] },
});
const ORDINALI = { caricoAerodinamico: { basso: 0, medio: 1, alto: 2 }, tipologia: { permanente: 0, ibrido: 1, cittadino: 2 } };
// Un criterio è rilevante se il circuito è nel 40% più estremo del calendario in quella direzione.
const PERCENTILE_RILEVANZA = 0.6;

function percentileCircuito(catalogo, corrente, chiave, direzione) {
  const valore = c => ORDINALI[chiave] ? ORDINALI[chiave][c.campi?.[chiave]?.valore] : c.campi?.[chiave]?.valore;
  const proprio = valore(corrente);
  const tutti = Object.values(catalogo.circuiti).map(valore).filter(Number.isFinite);
  if (!Number.isFinite(proprio) || tutti.length < 2) return null;
  const sotto = tutti.filter(v => direzione > 0 ? v < proprio : v > proprio).length;
  const uguali = tutti.filter(v => v === proprio).length - 1;
  return (sotto + uguali / 2) / (tutti.length - 1);
}

function valutaAggiornamentoPertinente(testoOriginale, catalogo, corrente, statoEditoriale, testi) {
  const testo = String(testoOriginale || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const frasi = testo.split(/[.!?;]/).filter(f => !/\bnon\b|nessun|senza benefici/.test(f));
  const benefici = Object.entries(BENEFICI_AGGIORNAMENTI).filter(([, b]) => frasi.some(f => b.testo.test(f)));
  const criteri = corrente ? benefici.flatMap(([caratteristica, b]) => b.criteri.map(([chiave, direzione]) => {
    const percentile = percentileCircuito(catalogo, corrente, chiave, direzione);
    return { caratteristica, criterio: chiave, percentile: percentile === null ? null : arrotonda(percentile * 100, 1),
      rilevante: percentile !== null && percentile >= PERCENTILE_RILEVANZA };
  })) : [];
  // Riusa la lettura dell'evidenza; la pertinenza qui è data dai criteri del circuito.
  const tuttiRilevanti = Object.fromEntries(["efficienzaAerodinamica", "potenzaDeployment", "curvaLenta", "curvaMedia",
    "curvaVeloce", "trazione", "frenata", "cordoli", "gestioneGomme", "stabilitaAssetto"].map(k => [k, 100]));
  const lettura = valutaAggiornamentoTesto(testoOriginale, "it", tuttiRilevanti);
  const stato = Object.hasOwn(testi.stati, statoEditoriale) ? testi.stati[statoEditoriale] : lettura.stato;
  const pertinente = criteri.some(c => c.rilevante) && lettura.evidenza > 0 &&
    lettura.stato !== testiPrevisione("it").stati.soloAffidabilita;
  if (!pertinente) return { pertinente: false, valore: null, stato, nota: lettura.nota, criteri };
  // Aggiornamento senza beneficio reale: penalizza; altrimenti premia in base all'evidenza.
  const valore = lettura.valore < 50 ? lettura.valore : 50 + 40 * lettura.evidenza;
  return { pertinente: true, valore, evidenza: lettura.evidenza, stato, nota: lettura.nota, criteri };
}

// Aggiornamento non pertinente: il suo peso si ridistribuisce in proporzione sugli altri.
function componiFattori(valutazioni, aggiornamentoPertinente, testi) {
  const pesiAttivi = Object.fromEntries(Object.entries(PESI_DINAMICI)
    .filter(([k]) => k !== "aggiornamentiTecnici" || aggiornamentoPertinente));
  const moltiplicatore = 100 / Object.values(pesiAttivi).reduce((s, p) => s + p, 0);
  let indiceBase = 0;
  const fattori = Object.keys(PESI_DINAMICI).map(chiave => {
    const peso = (pesiAttivi[chiave] || 0) * moltiplicatore;
    const valore = valutazioni[chiave] ?? 50;
    indiceBase += valore * peso / 100;
    return { chiave, nome: nomeFattore(testi, chiave), pesoPercentuale: arrotonda(peso), valutazione: arrotonda(valore),
      datiDisponibili: valutazioni[chiave] !== null };
  });
  return { fattori, indiceBase };
}

// Scuderia: ultimi GP/qualifiche con le due vetture (60% la migliore, 40% l'altra).
function valutaRecentiScuderia(ctx, constructorId, gp, quanti, tipo) {
  const gare = ctx.campioni.gare.filter(g => g.year === gp.year && g.round < gp.round)
    .sort((a, b) => a.round - b.round).slice(-quanti);
  const sorgente = tipo === "gara" ? ctx.campioni.risultati : ctx.campioni.qualifiche || [];
  const usate = gare.map((g, i) => {
    const n = tipo === "gara" ? ctx.indici.partecipanti.get(g.id) : ctx.indici.qualificati.get(g.id);
    const valori = sorgente.filter(x => x.raceId === g.id && x.constructorId === constructorId && (tipo !== "gara" || regolare(x)))
      .map(x => scala(x.positionNumber, n)).filter(Number.isFinite).sort((a, b) => b - a);
    const valore = !valori.length ? null : valori.length === 1 ? valori[0] : valori[0] * 0.6 + valori[1] * 0.4;
    return { valore, peso: i + 1 };
  });
  return { valore: media(usate), campione: usate.filter(u => Number.isFinite(u.valore)).length };
}

function valutaStoricoScuderia(ctx, constructorId, annoTarget) {
  const usate = ctx.campioni.risultati.filter(r => r.constructorId === constructorId && r.circuitId === ctx.corrente?.circuitId && ctx.precedente(r))
    .map(r => ({ valore: prestazione(r, ctx.indici), peso: DECADIMENTO_ANNO ** (annoTarget - r.year) }));
  return { valore: media(usate), campione: usate.filter(u => Number.isFinite(u.valore)).length };
}

function creaClassificaScuderie({ ctx, gp, campioni, scuderie, classificaPiloti, valutazioniPiloti, analisiTeam, catalogo, testi, lingua }) {
  return scuderie.map(scuderia => {
    const constructorId = campioni.mappingScuderie[scuderia.slug];
    const piloti = classificaPiloti.filter(p => p.scuderia.slug === scuderia.slug);
    if (!constructorId || !piloti.length) return null;
    const vettura = valutaVettura(ctx, constructorId, gp.year);
    // Compatibilità piloti-circuito: media dei due piloti schierati.
    const valoriPiloti = piloti.map(p => valutazioniPiloti.get(p.pilota.slug)).filter(Number.isFinite);
    const gare4 = valutaRecentiScuderia(ctx, constructorId, gp, 4, "gara");
    const qualifiche4 = valutaRecentiScuderia(ctx, constructorId, gp, 4, "qualifica");
    const storico = valutaStoricoScuderia(ctx, constructorId, gp.year);
    const analisi = analisiTeam.get(scuderia.slug);
    const aggiornamento = valutaAggiornamentoPertinente(analisi?.aggiornamentiInArrivo, catalogo, ctx.corrente, "", testi);
    const { fattori, indiceBase } = componiFattori({
      compatibilitaVetturaCircuito: vettura.valore,
      compatibilitaPilotaCircuito: valoriPiloti.length ? valoriPiloti.reduce((s, v) => s + v, 0) / valoriPiloti.length : null,
      aggiornamentiTecnici: aggiornamento.valore, andamentoUltimi4Gp: gare4.valore,
      andamentoUltime4Qualifiche: qualifiche4.valore, storicoPersonale: storico.valore,
    }, aggiornamento.pertinente, testi);
    for (const f of fattori) f.contributo = arrotonda(f.valutazione * f.pesoPercentuale / 100, 3);
    const attivi = fattori.filter(f => f.pesoPercentuale > 0).sort((x, y) => y.contributo - x.contributo);
    const codiceConfidenza = confidenza({ vettura: vettura.campione, pilota: valoriPiloti.length * 5, ultimi: gare4.campione });
    return { indice: indiceBase, constructorId,
      scuderia: { slug: scuderia.slug, nome: scuderia.nome, abbreviazione: scuderia.abbreviazione, colore: scuderia.colore },
      piloti: piloti.map(p => ({ slug: p.pilota.slug, nome: p.pilota.nome, codice: p.pilota.codice, posizione: p.posizione })),
      confidenza: testi.livelli[codiceConfidenza], confidenzaCodice: codiceConfidenza,
      sintesi: testi.sintesi(attivi[0].nome, attivi[1].nome),
      fattori,
      dettagliFattori: {
        compatibilitaVetturaCircuito: { campione: vettura.campione, edizioniPiuSimili: vettura.edizioni },
        compatibilitaPilotaCircuito: { campione: valoriPiloti.length },
        aggiornamentiTecnici: { pertinente: aggiornamento.pertinente, criteri: aggiornamento.criteri },
        andamentoUltimi4Gp: { campione: gare4.campione }, andamentoUltime4Qualifiche: { campione: qualifiche4.campione },
        storicoPersonale: { campione: storico.campione },
      },
      aggiornamentiTecnici: { stato: aggiornamento.stato,
        nota: valoreLocalizzato(analisi, "aggiornamentiInArrivo", lingua) || aggiornamento.nota } };
  }).filter(Boolean)
    .sort((x, y) => y.indice - x.indice || x.constructorId.localeCompare(y.constructorId))
    .map(({ constructorId, ...s }, i) => ({ ...s, indice: arrotonda(s.indice, 1), posizione: i + 1 }));
}

function confidenza(campioni) {
  const totale = campioni.vettura + campioni.pilota + campioni.ultimi;
  return totale >= 18 ? "alta" : totale >= 8 ? "media" : "bassa";
}

function creaClassificaDinamica({ gara, piloti, scuderie, analisiPiloti, analisiScuderie = [], lingua = "it", meteo = null,
  datiLiveFia = null, catalogo = catalogoBase, meteoGare = meteoGareCorrenti() }) {
  const testi = testiPrevisione(lingua);
  const campioni = require("./runtimeF1db").campioniCorrenti(require("../data/campioni-previsionali-2026.json"));
  const gp = campioni.gare.find(g => g.year === gara.stagione && g.round === gara.ordineCalendario);
  if (!gp) throw new Error(`Scenario previsionale non disponibile: ${gara.slug}`);
  const ctx = creaContesto({ gara, gp, campioni, catalogo, meteo, meteoGare });
  const analisi = new Map(analisiPiloti.map(a => [a.pilota.slug, a]));
  const analisiTeam = new Map(analisiScuderie.map(a => [a.scuderia?.slug, a]));
  const squadre = new Map(scuderie.map(s => [s.slug, s]));

  const valutazioniPiloti = new Map();
  const classifica = piloti.filter(p => analisi.has(p.slug)).map(pilota => {
    const a = analisi.get(pilota.slug);
    const scuderiaSlug = a.scuderia?.slug || pilota.scuderia?.slug;
    const scuderia = squadre.get(scuderiaSlug);
    const driverId = campioni.mappingPiloti[pilota.slug], constructorId = campioni.mappingScuderie[scuderiaSlug];
    if (!driverId || !constructorId || !scuderia) throw new Error(`Mapping mancante per ${pilota.slug}/${scuderiaSlug}`);

    const vettura = valutaVettura(ctx, constructorId, gp.year);
    const pilotaCircuiti = valutaPilotaCircuiti(ctx, driverId, gp.year);
    valutazioniPiloti.set(pilota.slug, pilotaCircuiti.valore);
    const storico = valutaStoricoCircuito(ctx, driverId, gp.year);
    const gare4 = valutaRecenti(ctx, driverId, gp, 4, "gara");
    const qualifiche4 = valutaRecenti(ctx, driverId, gp, 4, "qualifica");
    const aggiornamento = valutaAggiornamentoPertinente(
      a.aggiornamentiInArrivo || analisiTeam.get(scuderiaSlug)?.aggiornamentiInArrivo,
      catalogo, ctx.corrente, a.statoAggiornamentiTecnici, testi);

    const valutazioni = {
      compatibilitaVetturaCircuito: vettura.valore, compatibilitaPilotaCircuito: pilotaCircuiti.valore,
      aggiornamentiTecnici: aggiornamento.valore, andamentoUltimi4Gp: gare4.valore,
      andamentoUltime4Qualifiche: qualifiche4.valore, storicoPersonale: storico.valore,
    };
    const { fattori, indiceBase } = componiFattori(valutazioni, aggiornamento.pertinente, testi);
    const editoriale = valutaPenalita(a.penalita);
    const ufficiale = valutaPenalitaFia(datiLiveFia?.penalitaGriglia, pilota.numero);
    const penalita = ufficiale && (!editoriale || ufficiale.valore <= editoriale.valore) ? ufficiale : editoriale;
    const quotaBase = penalita ? (100 - PESO_PENALITA) / 100 : 1;
    for (const f of fattori) {
      f.pesoPercentuale = arrotonda(f.pesoPercentuale * quotaBase);
      f.contributo = arrotonda(f.valutazione * f.pesoPercentuale / 100, 3);
    }
    for (const chiave of CHIAVI_LEGACY) fattori.push({ chiave, nome: nomeFattore(testi, chiave), pesoPercentuale: 0,
      valutazione: 50, contributo: 0, datiDisponibili: false });
    if (penalita) fattori.push({ chiave: "penalita", nome: testi.fattori.penalita, pesoPercentuale: PESO_PENALITA,
      valutazione: arrotonda(indiceBase * penalita.valore / 100),
      contributo: arrotonda(indiceBase * penalita.valore * PESO_PENALITA / 10000, 3) });
    const indice = indiceBase * (penalita ? quotaBase + PESO_PENALITA / 100 * penalita.valore / 100 : 1);
    const attivi = fattori.filter(f => f.pesoPercentuale > 0 && f.chiave !== "penalita")
      .sort((x, y) => y.contributo - x.contributo);
    const codiceConfidenza = confidenza({ vettura: vettura.campione, pilota: pilotaCircuiti.campione, ultimi: gare4.campione });
    return { indice, driverId,
      pilota: { slug: pilota.slug, nome: pilota.nome, codice: pilota.codice, numero: pilota.numero,
        abbreviazioneNome: pilota.codice, numeroVettura: pilota.numero,
        nazionalitaIso2: pilota.nazionalitaIso2, nazionalitaIso3: pilota.nazionalitaIso3 },
      scuderia: { slug: scuderia.slug, nome: scuderia.nome, abbreviazione: scuderia.abbreviazione, colore: scuderia.colore },
      confidenza: testi.livelli[codiceConfidenza], confidenzaCodice: codiceConfidenza,
      sintesi: testi.sintesi(attivi[0].nome, attivi[1].nome),
      fattori,
      dettagliFattori: {
        compatibilitaVetturaCircuito: { campione: vettura.campione, edizioniPiuSimili: vettura.edizioni },
        compatibilitaPilotaCircuito: { campione: pilotaCircuiti.campione, edizioniPiuSimili: pilotaCircuiti.edizioni },
        aggiornamentiTecnici: { pertinente: aggiornamento.pertinente, criteri: aggiornamento.criteri },
        andamentoUltimi4Gp: { campione: gare4.campione }, andamentoUltime4Qualifiche: { campione: qualifiche4.campione },
        storicoPersonale: { campione: storico.campione },
      },
      aggiornamentiTecnici: { stato: aggiornamento.stato,
        nota: valoreLocalizzato(a, "aggiornamentiInArrivo", lingua) || aggiornamento.nota } };
  }).sort((x, y) => y.indice - x.indice || x.driverId.localeCompare(y.driverId));

  const classificaFinale = classifica.map(({ driverId, ...p }, i) => ({ ...p, indice: arrotonda(p.indice, 1), posizione: i + 1 }));
  const classificaScuderie = creaClassificaScuderie({ ctx, gp, campioni, scuderie, classificaPiloti: classificaFinale,
    valutazioniPiloti, analisiTeam, catalogo, testi, lingua });
  const confronti = [...ctx.confronti.values()].map(({ circuito, ...c }) =>
    ({ slug: circuito.slug, circuitId: circuito.circuitId, nome: circuito.nome, round: circuito.round, ...c }))
    .sort((x, y) => y.similaritaPercentuale - x.similaritaPercentuale);
  return {
    lingua, aggiornatoIl: new Date().toISOString(), calcolatoIl: new Date().toISOString(),
    gara: { slug: gara.slug, nome: valoreLocalizzato(gara, "nome", lingua), circuito: valoreLocalizzato(gara, "circuito", lingua) },
    modello: "dinamico-similarita-meteo-v1", meteo, scenarioMeteo: ctx.scenario,
    circuitiSimili: confronti.filter(c => c.round < gp.round).slice(0, 2),
    confrontoCircuiti: { metodo: "similarita-multicriterio-v2",
      pesoInClassificaPercentuale: PESI_DINAMICI.compatibilitaVetturaCircuito + PESI_DINAMICI.compatibilitaPilotaCircuito, criteri: CRITERI.map(c => ({ chiave: c.chiave, nome: c.nome,
      pesoPercentuale: arrotonda(c.pesoPercentuale, 4) })), confronti },
    pesi: [...Object.entries(PESI_DINAMICI), ...CHIAVI_LEGACY.map(k => [k, 0])]
      .map(([chiave, pesoPercentuale]) => ({ chiave, nome: nomeFattore(testi, chiave), pesoPercentuale })),
    calibrazione: { stato: "riferimento_mondiale", combinazioniEsaminate: 1,
      ultimoRoundTraining: Math.max(0, ...campioni.gare.filter(g => g.year === gp.year && g.round < gp.round).map(g => g.round)),
      fonteMondiale: gp.round > campioni.ultimoRoundIncluso ? "database" : "snapshot_anteriore_al_gp", candidataPromossa: false },
    classifica: classificaFinale,
    classificaScuderie,
  };
}

module.exports = { impostaMeteoGare, meteoGareCorrenti, PESI_DINAMICI, SOGLIA_PIOGGIA, creaClassificaDinamica, scenarioMeteo, concordanzaMeteo,
  similaritaEdizione, percentileCircuito, valutaAggiornamentoPertinente };
