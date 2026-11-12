const test = require("node:test");
const assert = require("node:assert/strict");
const servizio = require("../services/qualificaGp");
const { creaClassificaPrevisionale } = require("../services/classificaPrevisionale");

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

const rispostaJson = (corpo, status = 200) => ({ ok: status < 400, status, json: async () => corpo });

test("OpenF1: numero vettura mappato sul catalogo, ordine per posizione ed esiti", () => {
  const piloti = [{ slug: "norris", numero: "1" }, { slug: "russell", numero: 63 }, { slug: "leclerc", numero: "16" }];
  const classifica = servizio.normalizzaOpenF1([
    { position: 2, driver_number: 63, duration: [90.1, 89.2, 87.6] },
    { position: 1, driver_number: 1, duration: [90.9, 89.2, 87.4] },
    { position: 3, driver_number: 16, duration: [91, null, null], dnf: true },
  ], piloti);
  assert.deepEqual(classifica.map((r) => r.pilotaSlug), ["norris", "russell", "leclerc"]);
  assert.deepEqual(classifica[0].tempi, { q1: 90.9, q2: 89.2, q3: 87.4 });
  assert.equal(classifica[2].esito, "DNF");
  assert.throws(() => servizio.normalizzaOpenF1([{ position: 1, driver_number: 99 }], piloti), /99/);
});

test("ordine manuale: solo piloti iscritti, senza duplicati", () => {
  const piloti = Array.from({ length: 12 }, (_, i) => ({ slug: `p${i}`, numero: String(i) }));
  const ordine = piloti.map((p) => p.slug).reverse();
  assert.equal(servizio.normalizzaManuale(ordine, piloti)[0].pilotaSlug, "p11");
  assert.throws(() => servizio.normalizzaManuale([...ordine.slice(1), ordine[1]], piloti), /duplicati/);
  assert.throws(() => servizio.normalizzaManuale([...ordine.slice(1), "intruso"], piloti), /non iscritti/);
  assert.throws(() => servizio.normalizzaManuale(ordine.slice(0, 5), piloti), /non valido/);
});

test("acquisizione OpenF1 solo a qualifica conclusa e senza sovrascrivere l'inserimento manuale", async () => {
  const { gara, piloti } = argomenti();
  const orari = servizio.orariGp(gara);
  assert.ok(Number.isFinite(orari.qualifica));
  const iscritti = piloti.filter((p) => p.numero).slice(0, 12);
  const sessioni = [{ session_key: 42, date_start: `${orari.dataQualifica}T10:00:00+00:00` }];
  const risultati = iscritti.map((p, i) => ({ position: i + 1, driver_number: Number(p.numero), duration: [80 + i, null, null] }));
  const chiamate = [];
  const fetchImpl = async (url) => { chiamate.push(url); return rispostaJson(url.includes("/sessions") ? sessioni : risultati); };
  servizio._imposta(null);
  const presto = await servizio.aggiornaDaOpenF1(gara, iscritti, { adesso: orari.qualifica + 60000, fetchImpl });
  assert.equal(presto.motivo, "qualifica_non_conclusa");
  assert.equal(chiamate.length, 0);
  const dopo = await servizio.aggiornaDaOpenF1(gara, iscritti, { adesso: orari.qualifica + 2 * 3600000, fetchImpl });
  assert.equal(dopo.aggiornato, true);
  assert.equal(dopo.qualifica.fonte, "openf1");
  assert.equal(dopo.qualifica.sessionKey, 42);
  assert.equal(servizio.qualificaCorrente(gara.slug).classifica[0].pilotaSlug, iscritti[0].slug);
  await servizio.impostaManuale(gara, iscritti, iscritti.map((p) => p.slug).reverse());
  const protetta = await servizio.aggiornaDaOpenF1(gara, iscritti, { adesso: orari.qualifica + 2 * 3600000, fetchImpl });
  assert.equal(protetta.motivo, "inserimento_manuale_presente");
  assert.equal(servizio.qualificaCorrente("altro-gp"), null);
  servizio._imposta(null);
});

test("previsione del sabato: fase post_qualifica, qualifica al 50% e pesi coerenti", () => {
  const args = argomenti();
  const prima = creaClassificaPrevisionale(args);
  assert.equal(prima.fase, "pre_qualifica");
  assert.equal(prima.qualifica.disponibile, false);
  // La qualifica rovescia l'ordine del modello: l'ultimo previsto parte in pole.
  const ordine = [...prima.classifica].reverse().map((p) => p.pilota.slug);
  const qualifica = { garaSlug: args.gara.slug, fonte: "manuale", aggiornatoIl: "2026-11-21T06:00:00Z",
    classifica: ordine.map((slug, i) => ({ posizione: i + 1, pilotaSlug: slug })) };
  const dopo = creaClassificaPrevisionale({ ...args, qualifica });
  assert.equal(dopo.fase, "post_qualifica");
  assert.deepEqual(dopo.qualifica, { disponibile: true, fonte: "manuale", aggiornatoIl: "2026-11-21T06:00:00Z", pesoPercentuale: 50 });
  for (const p of dopo.classifica) {
    const q = p.fattori.find((f) => f.chiave === "qualificaGp");
    assert.equal(q.pesoPercentuale, 50);
    assert.ok(Math.abs(p.fattori.reduce((s, f) => s + f.pesoPercentuale, 0) - 100) < 0.05);
    assert.ok(Math.abs(p.fattori.reduce((s, f) => s + f.contributo, 0) - p.indice) <= 0.06);
  }
  const pole = ordine[0];
  const posizione = (o) => o.classifica.find((p) => p.pilota.slug === pole).posizione;
  assert.ok(posizione(dopo) < posizione(prima), "chi parte in pole guadagna posizioni");
  assert.ok(dopo.classificaScuderie.every((s) => s.fattori.some((f) => f.chiave === "scuderiaQualificaGp")));
  // Una qualifica di un altro GP non viene usata.
  assert.equal(creaClassificaPrevisionale({ ...args, qualifica: { ...qualifica, garaSlug: "altro" } }).fase, "pre_qualifica");
});
