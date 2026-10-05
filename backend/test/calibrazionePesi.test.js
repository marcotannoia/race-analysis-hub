const test = require("node:test");
const assert = require("node:assert/strict");
const { CHIAVI, verificaPesi, creaFattori, creaScenario, valutaScenario, cercaPesi, erroreVeloce } = require("../services/calibrazionePesi");
const r = (driverId, round, posizione, extra = {}) => ({ driverId, constructorId: "team", raceId: round,
  round, year: 2026, circuitId: "c", positionNumber: posizione, positionText: String(posizione),
  positionDisplayOrder: posizione, laps: 50, reasonRetired: null, ...extra });
const p = ["a", "b", "c"].map((driverId) => ({ driverId, constructorId: "team" }));
const args = { gara: { id: 3, round: 3, year: 2026, circuitId: "c" }, partecipanti: p,
  gare: [1,2,3].map((id) => ({ id, round: id, year: 2026 })),
  risultati: [r("a",1,1),r("b",1,2),r("c",1,3),r("a",2,2),r("b",2,1),r("c",2,3),
    r("a",3,3),r("b",3,1),r("c",3,2)],
  qualifiche: [r("a",1,1),r("b",1,2),r("c",1,3)],
  classificaPiloti: [r("a",2,1),r("b",2,2),r("c",2,3)], numerosita: new Map([[1,3],[2,3],[3,3]]) };

test("pesi invalidi, negativi o senza somma 100 sono rifiutati", () => {
  assert.doesNotThrow(() => verificaPesi([0,0,0,0,100]));
  for (const ps of [[50,50],[-1,1,0,0,100],[NaN,0,0,0,100],[0,0,0,0,99]]) assert.throws(() => verificaPesi(ps), /Pesi/);
});

test("risultati, qualifiche e mondiale target o futuri non alterano i fattori", () => {
  const prima = creaFattori(args);
  const dopo = creaFattori({ ...args, risultati: [...args.risultati, r("a",4,1)],
    qualifiche: [...args.qualifiche,r("b",3,1)], classificaPiloti: [...args.classificaPiloti,r("b",3,1)] });
  assert.deepEqual(dopo, prima);
  assert.ok(prima.every((p) => p.campi.andamento2026.roundFonte === 2));
});

test("gli outlier sono esclusi per stato documentato e non per errore della previsione", () => {
  const s = creaScenario({ ...args, risultati: args.risultati.map((r) => r.raceId === 3 && r.driverId === "a" ?
    { ...r, reasonRetired: "Power loss" } : r) });
  assert.equal(s.regolari.size,2);
  assert.deepEqual(s.esclusi.map((p) => p.driverId),["a"]);
  assert.equal(s.esclusi[0].causa,"Power loss");
  const v = valutaScenario(s,[0,0,0,0,100]);
  assert.equal(v.completa.piloti,3);
  assert.equal(v.regolari.piloti,2);
});

test("la ricerca visita l'intero simplesso della griglia e il punteggio veloce coincide con quello pubblico", () => {
  const s = creaScenario(args);
  const ricerca = cercaPesi([s],25);
  assert.equal(ricerca.combinazioni,70); // C(4+4,4).
  assert.equal(ricerca.singoli[0].pesi.reduce((a,b) => a+b,0),100);
  for (const ps of [[0,0,0,0,100],[45,30,20,5,0],[0,25,50,25,0]])
    assert.equal(erroreVeloce(s,ps),valutaScenario(s,ps).regolari.sommaErroriAssoluti);
});

test("i pesi progressivi non dipendono da una gara ancora da prevedere", () => {
  const prima = creaScenario(args);
  const dopo = { ...prima, reali: [...prima.reali].reverse() };
  const soloPassato = cercaPesi([prima],25).cumulativi[0];
  assert.deepEqual(cercaPesi([prima,dopo],25).cumulativi[0],soloPassato);
  assert.equal(CHIAVI.length,5);
});

test("la previsione pubblica conserva gli otto campi e usa il metodo selezionato dal backtest", () => {
  const { creaClassificaPrevisionale } = require("../services/classificaPrevisionale");
  const { creaDatiEffettivi } = require("../utils/datiEffettivi");
  const dati = creaDatiEffettivi(require("../data/dati-iniziali.json"));
  const calibrazione = require("../data/valutazione-forma-recente-2026-10-05.json");
  const teams = new Map(dati.scuderie.map((s) => [s.slug,s]));
  const piloti = dati.piloti.map((p) => ({ ...p, scuderia: teams.get(p.scuderiaSlug) }));
  const pm = new Map(piloti.map((p) => [p.slug,p]));
  const gara = dati.gare.find((g) => g.stato === "attuale");
  const analisiPiloti = dati.analisiGare.filter((a) => a.garaSlug === gara.slug).map((a) =>
    ({ ...a,pilota:pm.get(a.pilotaSlug),scuderia:teams.get(a.scuderiaSlug) }));
  const args = { gara,piloti,scuderie:dati.scuderie,analisiPiloti };
  const output = creaClassificaPrevisionale(args);
  assert.equal(output.modello,calibrazione.versione);
  assert.equal(output.classifica.length,22);
  assert.equal(output.pesi.length,8);
  assert.equal(output.pesi.reduce((s,p) => s+p.pesoPercentuale,0),100);
  for (const p of output.classifica) {
    assert.ok(Number.isFinite(p.indice));
    assert.equal(p.fattori.length,8);
    assert.ok(Math.abs(p.fattori.reduce((s,f) => s+f.contributo,0)-p.indice) <= 0.051);
  }
  const meteo = creaClassificaPrevisionale({ ...args,meteo:{ probabilitaPioggiaPercentuale:100 } });
  assert.deepEqual(meteo.classifica,output.classifica);
  assert.equal(output.calibrazione.candidataPromossa,true);
  assert.equal(output.calibrazione.fonteMondiale,"database");
  const invertiti = piloti.map((p) => ({ ...p,classifica2026:{ ...p.classifica2026, posizione:24-p.classifica2026.posizione } }));
  assert.notEqual(creaClassificaPrevisionale({ ...args,piloti:invertiti }).classifica[0].pilota.slug,output.classifica[0].pilota.slug);
  const passato = dati.gare.find((g) => g.ordineCalendario === 12);
  const analisiPassato = dati.analisiGare.filter((a) => a.garaSlug === passato.slug).map((a) =>
    ({ ...a,pilota:pm.get(a.pilotaSlug),scuderia:teams.get(a.scuderiaSlug) }));
  const argsPassato = { ...args,gara:passato,analisiPiloti:analisiPassato };
  assert.deepEqual(creaClassificaPrevisionale({ ...argsPassato,piloti:invertiti }).classifica,
    creaClassificaPrevisionale(argsPassato).classifica);
  const primo = output.classifica[0];
  const penalizzato = creaClassificaPrevisionale({ ...args,datiLiveFia:{ penalitaGriglia:[{ numeroVettura:Number(primo.pilota.numero),posizioni:3 }] } });
  assert.ok(penalizzato.classifica.find((p) => p.pilota.slug === primo.pilota.slug).indice < primo.indice);
});
