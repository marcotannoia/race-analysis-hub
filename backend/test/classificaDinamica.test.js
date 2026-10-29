const test = require("node:test");
const assert = require("node:assert/strict");
const { creaClassificaPrevisionale } = require("../services/classificaPrevisionale");
const { PESI_DINAMICI, scenarioMeteo, concordanzaMeteo, similaritaEdizione, valutaAggiornamentoPertinente } = require("../services/classificaDinamica");
const { testiPrevisione } = require("../i18n/previsioni");
const catalogo = require("../data/similarita-circuiti-2026.json");

function argomenti() {
  const { creaDatiEffettivi } = require("../utils/datiEffettivi");
  const dati = creaDatiEffettivi(require("../data/dati-iniziali.json"));
  const teams = new Map(dati.scuderie.map((s) => [s.slug, s]));
  const piloti = dati.piloti.map((p) => ({ ...p, scuderia: teams.get(p.scuderiaSlug) }));
  const pm = new Map(piloti.map((p) => [p.slug, p]));
  const gara = dati.gare.find((g) => g.stato === "attuale");
  const analisiPiloti = dati.analisiGare.filter((a) => a.garaSlug === gara.slug).map((a) =>
    ({ ...a, pilota: pm.get(a.pilotaSlug), scuderia: teams.get(a.scuderiaSlug) }));
  return { gara, piloti, scuderie: dati.scuderie, analisiPiloti };
}

test("pesi base richiesti e somma 100 per ogni pilota", () => {
  assert.deepEqual({ ...PESI_DINAMICI }, { compatibilitaVetturaCircuito: 42, compatibilitaPilotaCircuito: 25,
    aggiornamentiTecnici: 8, andamentoUltimi4Gp: 10, andamentoUltime4Qualifiche: 10, storicoPersonale: 5 });
  const output = creaClassificaPrevisionale(argomenti());
  assert.equal(output.modello, "dinamico-similarita-meteo-v1");
  assert.equal(output.confrontoCircuiti.criteri.length, 22);
  for (const p of output.classifica) {
    assert.ok(Math.abs(p.fattori.reduce((s, f) => s + f.pesoPercentuale, 0) - 100) < 0.05);
    assert.ok(Math.abs(p.fattori.reduce((s, f) => s + f.contributo, 0) - p.indice) <= 0.06);
    const agg = p.fattori.find((f) => f.chiave === "aggiornamentiTecnici");
    // Aggiornamento non pertinente: peso a zero e gli altri crescono in proporzione.
    if (!p.dettagliFattori.aggiornamentiTecnici.pertinente) {
      assert.equal(agg.pesoPercentuale, 0);
      assert.equal(p.fattori.find((f) => f.chiave === "compatibilitaVetturaCircuito").pesoPercentuale, 45.65);
    }
  }
});

test("la pioggia riconosciuta sposta la somiglianza verso le edizioni bagnate", () => {
  const asciutto = scenarioMeteo({ probabilitaPioggiaPercentuale: 10 });
  const bagnato = scenarioMeteo({ probabilitaPioggiaPercentuale: 20, probabilitaPioggiaQualificaPercentuale: 70 });
  assert.equal(asciutto.pioggiaRiconosciuta, false);
  assert.equal(bagnato.pioggiaRiconosciuta, true);
  assert.equal(scenarioMeteo(null).probabilitaRiferimentoPercentuale, null);
  const conBagnato = similaritaEdizione(80, concordanzaMeteo(true, 70), bagnato);
  const conAsciutto = similaritaEdizione(80, concordanzaMeteo(false, 70), bagnato);
  assert.equal(conBagnato - conAsciutto, 20);
  assert.ok(similaritaEdizione(80, concordanzaMeteo(false, 10), asciutto) > similaritaEdizione(80, concordanzaMeteo(true, 10), asciutto));
  assert.equal(similaritaEdizione(80, null, scenarioMeteo(null)), 80);
  const args = argomenti();
  const secco = creaClassificaPrevisionale({ ...args, meteo: { probabilitaPioggiaPercentuale: 0 } });
  const pioggia = creaClassificaPrevisionale({ ...args, meteo: { probabilitaPioggiaPercentuale: 100 } });
  assert.notDeepEqual(secco.classifica.map((p) => p.fattori[1].valutazione), pioggia.classifica.map((p) => p.fattori[1].valutazione));
});

test("aggiornamento pertinente solo se i criteri del circuito sono rilevanti", () => {
  const testi = testiPrevisione("it");
  const testo = "La squadra ha confermato per il circuito un'ala posteriore a basso carico per migliorare la velocita sui rettilinei e l'efficienza aerodinamica.";
  const monza = valutaAggiornamentoPertinente(testo, catalogo, catalogo.circuiti["italia-monza"], "", testi);
  const monaco = valutaAggiornamentoPertinente(testo, catalogo, catalogo.circuiti["monaco-montecarlo"], "", testi);
  assert.equal(monza.pertinente, true);
  assert.ok(monza.valore > 50);
  assert.equal(monaco.pertinente, false);
  assert.equal(valutaAggiornamentoPertinente("", catalogo, catalogo.circuiti["italia-monza"], "", testi).pertinente, false);
});

test("l'esito osservato delle gare 2026 rende dinamica anche la vettura", () => {
  const meteoGare = require("../data/meteo-gare-2026.json");
  assert.ok(meteoGare.edizioni.some((e) => e.pioggia) && meteoGare.edizioni.some((e) => !e.pioggia));
  const { creaClassificaDinamica } = require("../services/classificaDinamica");
  const args = argomenti();
  const vettura = (o) => o.classifica.map((p) => p.fattori[0].valutazione);
  const secco = creaClassificaDinamica({ ...args, meteo: { probabilitaPioggiaPercentuale: 0 } });
  const pioggia = creaClassificaDinamica({ ...args, meteo: { probabilitaPioggiaPercentuale: 100 } });
  const senzaEsiti = creaClassificaDinamica({ ...args, meteo: { probabilitaPioggiaPercentuale: 100 }, meteoGare: { edizioni: [] } });
  assert.notDeepEqual(vettura(secco), vettura(pioggia));
  assert.notDeepEqual(vettura(pioggia), vettura(senzaEsiti));
});
