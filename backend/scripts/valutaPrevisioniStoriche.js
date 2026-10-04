const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { caricaFonti } = require("./lib/caricaFontiSemantiche");
const { PESI_SEMANTICI, VERSIONE, FONTE, media, round, ordinaSemantico, metricheOrdine } = require("../services/overallSemantici");
const { creaClassificaPrevisionale, PESI } = require("../services/classificaPrevisionale");
const { normalizzaTestiAnnuali } = require("../utils/normalizzaNotaBene");

function valuta(cartella) {
  const f = caricaFonti(cartella);
  const d = require("../data/dati-iniziali.json");
  const snapshot = require("../data/f1db-v2026.16.0-derivato.json");
  const slugPerDriver = new Map(Object.entries(f.pilotiF1db).map(([slug, id]) => [id, slug]));
  const slugPerTeam = new Map(Object.entries(f.scuderieF1db2026).map(([slug, id]) => [id, slug]));
  const risultati = [];
  for (const gp of f.ultimiGp.filter((g) => g.round >= 4)) {
    const reali = f.risultati.filter((r) => r.raceId === gp.id).sort((a, b) => a.positionDisplayOrder - b.positionDisplayOrder);
    const presenti = reali.map((r) => ({ driverId: r.driverId, constructorId: r.constructorId,
      pilotaSlug: slugPerDriver.get(r.driverId), scuderiaSlug: slugPerTeam.get(r.constructorId) }));
    const semantica = ordinaSemantico({ gara: gp, partecipanti: presenti, ...f });
    const precedente = f.ultimiGp.find((g) => g.round === gp.round - 1);
    const mondiale = f.classificaPiloti.filter((r) => r.raceId === precedente.id);
    const baseline = [...presenti].sort((a, b) =>
      (mondiale.find((r) => r.driverId === a.driverId)?.positionNumber ?? 99) -
      (mondiale.find((r) => r.driverId === b.driverId)?.positionNumber ?? 99) || a.driverId.localeCompare(b.driverId));
    const dettaglio = semantica.map((p) => {
      const r = reali.find((x) => x.driverId === p.driverId);
      return { pilota: p.pilotaSlug, scuderia: p.scuderiaSlug, prevista: p.posizione,
        realeOrdineClassificazione: r.positionDisplayOrder, classificazione: r.positionText,
        causaRitiro: r.reasonRetired, indice: p.indice, campi: p.campi, coperturaPesi: p.coperturaPesi };
    });
    const finisherIds = new Set(reali.filter((r) => !r.reasonRetired && Number.isInteger(r.positionNumber) &&
      !["DSQ", "EX", "DNS", "DNF", "NC"].includes(r.positionText)).map((r) => r.driverId));
    const evento = {
      round: gp.round, circuito: gp.circuitId, data: gp.date,
      limiteRoundEsclusivo: gp.round, ultimoRoundInput: gp.round - 1,
      risultati: dettaglio,
      modelloSemantico: metricheOrdine(semantica, reali),
      riferimentoMondiale: metricheOrdine(baseline, reali),
      soloEsitiRegolari: { semantico: metricheOrdine(semantica.filter((p) => finisherIds.has(p.driverId)), reali.filter((r) => finisherIds.has(r.driverId))),
        riferimentoMondiale: metricheOrdine(baseline.filter((p) => finisherIds.has(p.driverId)), reali.filter((r) => finisherIds.has(r.driverId))) },
    };
    // Pesi correnti, con input sportivi anteriori ma profili tecnici di oggi:
    // questo confronto contiene informazione editoriale post-gara, quindi è solo diagnostico.
    const garaProgetto = d.gare.find((g) => g.ordineCalendario === gp.round);
    if (garaProgetto) {
      const teams = d.scuderie.map((s) => {
        const id = f.scuderieF1db2026[s.slug];
        const st = f.classificaScuderie.find((r) => r.raceId === precedente.id && r.constructorId === id);
        return { ...s, classifica2026: { posizione: st?.positionNumber ?? 11, punti: st?.points ?? 0,
          vittorie: f.risultati.filter((r) => r.year === 2026 && r.round < gp.round && r.constructorId === id && r.positionNumber === 1).length } };
      });
      const tm = new Map(teams.map((s) => [s.slug, s]));
      const drivers = presenti.map((p) => {
        const source = d.piloti.find((x) => x.slug === p.pilotaSlug);
        const st = mondiale.find((r) => r.driverId === p.driverId);
        return { ...source, scuderia: tm.get(p.scuderiaSlug), classifica2026: {
          posizione: st?.positionNumber ?? 23, punti: st?.points ?? 0,
          vittorie: f.risultati.filter((r) => r.year === 2026 && r.round < gp.round && r.driverId === p.driverId && r.positionNumber === 1).length } };
      });
      const analisi = presenti.map((p) => {
        const originale = d.analisiGare.find((a) => a.garaSlug === garaProgetto.slug && a.pilotaSlug === p.pilotaSlug);
        if (!originale) throw new Error(`Schieramento storico non coperto: ${gp.circuitId}/${p.driverId}`);
        return { pilota: drivers.find((p2) => p2.slug === p.pilotaSlug), scuderia: tm.get(p.scuderiaSlug),
          overallSemantici: { campi: { risultatiGara: originale.overallSemantici.campi.risultatiGara } },
          posizioniStoriche: normalizzaTestiAnnuali(originale.risultatiGara), considerazioni: "",
          penalita: "", aggiornamentiInArrivo: "", vantaggioAggiornamentiTecnici: 50, statoAggiornamentiTecnici: "" };
      });
      const output = creaClassificaPrevisionale({ gara: garaProgetto, piloti: drivers, scuderie: teams,
        analisiPiloti: analisi, analisiScuderie: teams.map((s) => ({ scuderia: s, considerazioni: "" })),
        snapshot: { ...snapshot, andamento2026: { stagione: 2026, eventi: snapshot.andamento2026.eventi.filter((e) => e.round < gp.round) } } });
      const ordine = output.classifica.map((p) => ({ driverId: f.pilotiF1db[p.pilota.slug] }));
      evento.pesiCorrentiDiagnostico = {
        limite: "Profili tecnici aggiornati dopo diversi GP; etichette e bonus resi neutri; non è una previsione originale né una validazione fuori campione.",
        pesiEffettivi: output.pesi, metriche: metricheOrdine(ordine, reali),
        classifica: output.classifica.map((p) => ({ pilota: p.pilota.slug, posizione: p.posizione, indice: p.indice })),
      };
    }
    risultati.push(evento);
  }
  const aggrega = (elenco, k) => ({
    gp: elenco.length, piloti: elenco.reduce((s, g) => s + g[k].piloti, 0),
    erroreAssolutoMedio: Math.round(elenco.reduce((s, g) => s + g[k].sommaErroriAssoluti, 0) /
      elenco.reduce((s, g) => s + g[k].piloti, 0) * 1000) / 1000,
    spearmanMedio: Math.round(media(elenco.map((g) => g[k].spearman)) * 1000) / 1000,
    vincitoriIndovinati: elenco.filter((g) => g[k].vincitoreCorretto).length,
    podiIndovinati: elenco.reduce((s, g) => s + g[k].podioIndovinati, 0),
    postiPodioTotali: elenco.length * 3,
    top10Indovinati: elenco.reduce((s, g) => s + g[k].top10Indovinati, 0),
  });
  const res = {
    versione: VERSIONE, calcolatoIl: "2026-10-05", fonte: FONTE, hashFonti: f.hash,
    pesi: PESI_SEMANTICI, pesiModelloEsistenteConMeteo: PESI,
    protocollo: { primiTreGp: "Warm-up escluso dal confronto", limite: "Solo risultati precedenti al GP; nessun dato della gara target nei fattori. Pesi fissati prima del calcolo, non ottimizzati su questi risultati.",
      caveat: "Simulazione cronologica ricostruita oggi, non storico delle previsioni pubblicate. Release sportiva revisionata a posteriori; entry list finale usata come universo noto del weekend. L'accuratezza futura resta da verificare.",
      datiEsclusi: ["meteo", "penalità non archiviate prima del GP", "beneficio aggiornamenti", "passo cronometrico", "degrado gomme", "capacità tecniche editoriali"],
      ordineReale: "Ordine della classificazione F1DB, inclusi ritiri/DSQ; non è un ordinamento del passo. Il filtro soli esiti regolari è diagnostico e usa uno stato noto dopo la gara.",
      aggregazioneScuderie: "Media dell'indice dei due piloti; non è una previsione dei punti costruttori." },
    totale: { semantico: aggrega(risultati, "modelloSemantico"), mondiale: aggrega(risultati, "riferimentoMondiale") },
    ultimiCinque: { semantico: aggrega(risultati.slice(-5), "modelloSemantico"), mondiale: aggrega(risultati.slice(-5), "riferimentoMondiale") },
    gp: risultati,
    fonteProfiliEditorialiSha256: createHash("sha256").update(fs.readFileSync(path.join(__dirname, "../data/profili-tecnici-2026.json"))).digest("hex"),
  };
  fs.writeFileSync(path.join(__dirname, "../data/backtest-semantico-2026-10-05.json"), `${JSON.stringify(res, null, 2)}\n`);
  console.log(JSON.stringify({ totale: res.totale, ultimiCinque: res.ultimiCinque,
    gp: risultati.map((g) => ({ gp: g.circuito, semantico: g.modelloSemantico,
      correnteDiagnostico: g.pesiCorrentiDiagnostico?.metriche })) }, null, 2));
  return res;
}
if (require.main === module) {
  try { valuta(process.argv[2]); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { valuta };
