// Genera dati e overall verificabili. Non scrive MongoDB: la migrazione è separata.
const fs = require("node:fs");
const path = require("node:path");
const { caricaFonti } = require("./lib/caricaFontiSemantiche");
const { testi, formatta } = require("./lib/testiRevisioneSemantica");
const {
  VERSIONE, FONTE, PESI_SEMANTICI, media, round, descriviCampione,
  campoNonMisurato, completamento, trend, ordinaSemantico,
} = require("../services/overallSemantici");

const cartellaDati = path.join(__dirname, "../data");
const DATA_REVISIONE = "2026-10-05";
const scrivi = (p, d) => fs.writeFileSync(p, `${JSON.stringify(d, null, 2)}\n`);
const pos = (r, prefisso) => !r ? "—" : Number.isInteger(r.positionNumber) ? `${prefisso}${r.positionNumber}` : r.positionText;
const localizzaNumeri = (valori, lingua) => Object.fromEntries(Object.entries(valori).map(([k, v]) =>
  [k, typeof v === "number" ? new Intl.NumberFormat(lingua, { useGrouping: false, maximumFractionDigits: 1 }).format(v) : v]));

function revisione(cartellaF1db) {
  const f = caricaFonti(cartellaF1db);
  const d = JSON.parse(fs.readFileSync(path.join(cartellaDati, "dati-iniziali.json")));
  if (d.metadati.f1db.versione !== "v2026.16.0") throw new Error("Sincronizzare prima la release F1DB v2026.16.0");
  const circuito = require("../data/circuiti-tecnici-2026.json");
  const scuderie = new Map(d.scuderie.map((s) => [s.slug, s]));
  const piloti = new Map(d.piloti.map((p) => [p.slug, p]));
  const correttiArchivi = [];
  const fileDaScrivere = [];
  const archivi = fs.readdirSync(path.join(cartellaDati, "archivio-gp")).filter((n) => n.endsWith(".json"));
  const monzaFile = "2026-02-italia-monza.json";
  if (!archivi.includes(monzaFile)) archivi.push(monzaFile);
  archivi.sort();
  function dettaglio(r, q, t) {
    if (!r && !q) return t.assente;
    return `${pos(r, "P")} / ${pos(q, "Q")}; ${t.griglia} ${r?.gridPositionText ?? "—"}; ${r?.laps ?? "—"} ${t.giri}` +
      (r?.reasonRetired ? `; ${t.causa}: ${r.reasonRetired}` : "") + ".";
  }
  // Corregge gli archivi applicati sopra il JSON base, incluse le note del 2026.
  for (const nome of archivi) {
    const p = path.join(cartellaDati, "archivio-gp", nome);
    const a = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : {
      pronto: true, stagione: 2026, garaConclusaSlug: "italia-monza",
      risultatiPiloti: [], risultatiScuderie: d.scuderie.map((s) => ({ scuderiaSlug: s.slug })),
      fonti: [FONTE], statoClassificazione: "Riscontrata con F1DB v2026.16.0; non misura passo o degrado.",
    };
    const gp = f.gare.find((g) => g.year === a.stagione && g.circuitId === f.circuitiStorici[a.garaConclusaSlug]);
    if (!gp) throw new Error(`Evento non trovato: ${nome}`);
    const presenti = f.risultati.filter((r) => r.raceId === gp.id);
    const slugPerId = new Map(Object.entries(f.pilotiF1db).map(([slug, id]) => [id, slug]));
    const squadraPerId = new Map(Object.entries(f.scuderieF1db2026).map(([slug, id]) => [id, slug]));
    const vecchie = new Map(a.risultatiPiloti.map((p) => [p.pilotaSlug, p]));
    a.classificaPiloti = f.classificaPiloti.filter((r) => r.raceId === gp.id).map((r) => ({
      pilotaSlug: slugPerId.get(r.driverId), posizione: r.positionNumber, punti: r.points,
      vittorie: f.risultati.filter((x) => x.year === gp.year && x.round <= gp.round && x.driverId === r.driverId && x.positionNumber === 1).length,
    }));
    a.classificaScuderie = f.classificaScuderie.filter((r) => r.raceId === gp.id).map((r) => ({
      scuderiaSlug: squadraPerId.get(r.constructorId), posizione: r.positionNumber, punti: r.points,
      vittorie: f.risultati.filter((x) => x.year === gp.year && x.round <= gp.round && x.constructorId === r.constructorId && x.positionNumber === 1).length,
    }));
    a.risultatiPiloti = presenti.map((r) => {
      const slug = slugPerId.get(r.driverId);
      if (!slug) throw new Error(`Mapping pilota mancante: ${r.driverId}`);
      return { ...(vecchie.get(slug) || {}), pilotaSlug: slug, scuderiaSlug: squadraPerId.get(r.constructorId) };
    });
    // Usa l'entry list sportiva di ogni evento concluso, incluse le sostituzioni temporanee.
    const analisiEvento = d.analisiGare.filter((x) => x.garaSlug === a.garaConclusaSlug);
    const obsolete = analisiEvento.filter((x) => !a.risultatiPiloti.some((p) => p.pilotaSlug === x.pilotaSlug));
    for (const voce of a.risultatiPiloti) {
      let scheda = analisiEvento.find((x) => x.pilotaSlug === voce.pilotaSlug);
      if (!scheda) {
        scheda = obsolete.shift();
        if (!scheda) throw new Error(`Scheda partecipante mancante: ${nome}/${voce.pilotaSlug}`);
        scheda.pilotaSlug = voce.pilotaSlug;
        const storico = require("../data/f1db-v2026.16.0-derivato.json").analisiGare.find((x) =>
          x.pilotaSlug === voce.pilotaSlug && x.garaSlug === a.garaConclusaSlug);
        scheda.risultatiGara = storico.risultatiGara;
        scheda.risultatiQualifica = storico.risultatiQualifica;
        for (const [lingua, t] of Object.entries(testi)) for (const campo of ["risultatiGara", "risultatiQualifica"]) {
          const assenze = { en: ["DID NOT RACE IN F1", "NOT PRESENT IN F1"], fr: ["N'A PAS COURU EN F1", "ABSENT DE LA F1"],
            pt: ["NÃO CORREU NA F1", "NÃO PRESENTE NA F1"], es: ["NO COMPITIÓ EN F1", "NO PRESENTE EN F1"],
            de: ["NICHT IN DER F1 GEFAHREN", "NICHT IN DER F1 VERTRETEN"], it: ["NON CORSO IN F1", "NON PRESENTE IN F1"] };
          scheda.traduzioni[lingua][campo] = scheda[campo].replaceAll("NON CORSO IN F1", assenze[lingua][0])
            .replaceAll("NON PRESENTE IN F1", assenze[lingua][1]);
        }
      }
      scheda.scuderiaSlug = voce.scuderiaSlug;
    }
    for (const voce of a.risultatiPiloti || []) {
      const id = f.pilotiF1db[voce.pilotaSlug];
      const r = f.risultati.find((x) => x.raceId === gp.id && x.driverId === id);
      const q = f.qualifiche.find((x) => x.raceId === gp.id && x.driverId === id);
      if (!r) throw new Error(`Risultato archivio non verificabile: ${nome}/${id}`);
      if (voce.posizioneQualifica !== pos(q, "Q") || voce.posizioneGara !== pos(r, "P")) {
        correttiArchivi.push({ archivio: nome, pilota: voce.pilotaSlug,
          prima: { gara: voce.posizioneGara, qualifica: voce.posizioneQualifica },
          dopo: { gara: pos(r, "P"), qualifica: pos(q, "Q") } });
      }
      voce.posizioneGara = pos(r, "P");
      voce.posizioneQualifica = pos(q, "Q");
      voce.posizioneQualificaNumero = q?.positionNumber ?? null;
      voce.faseQualificaRaggiunta = !q ? "" : q.q3 ? "Q3" : q.q2 ? "Q2" : "Q1";
      voce.statoGara = r.reasonRetired ? "ritirato" : r.positionText === "DNS" ? "non_partito" :
        ["DSQ", "EX"].includes(r.positionText) ? "squalificato" : "classificato";
      voce.causaRitiro = r.reasonRetired;
      voce.errorePilota = null;
      voce.verificaErrorePilota = "Attribuzione non verificata: la causa F1DB non stabilisce la responsabilità del pilota.";
      voce.griglia = r.gridPositionText;
      voce.giri = r.laps;
      voce.traduzioni = {};
      for (const [lingua, t] of Object.entries(testi)) {
        const trad = { notaRisultato: `${dettaglio(r, q, t)} ${t.nota}`, passoGara: t.passo,
          gomme: t.gomme, affidabilita: `${pos(r, "P")}; ${t.causa}: ${r.reasonRetired ?? "—"}. ${t.nota}` };
        voce.traduzioni[lingua] = trad;
        if (lingua === "it") Object.assign(voce, { notaRisultato: trad.notaRisultato,
          passoGara: trad.passoGara, gestioneGomme: trad.gomme, affidabilita: trad.affidabilita });
      }
    }
    // Elimina le vecchie note di scuderia non riscontrate, ricavandole dai piloti del GP.
    for (const squadra of a.risultatiScuderie || []) {
      const voci = a.risultatiPiloti.filter((p) => p.scuderiaSlug === squadra.scuderiaSlug);
      squadra.notaRisultato = voci.map((p) => `${piloti.get(p.pilotaSlug).codice}: ${p.notaRisultato}`).join(" ");
      squadra.passoGara = testi.it.passo;
      squadra.gestioneGomme = testi.it.gomme;
      squadra.affidabilita = voci.map((p) => `${piloti.get(p.pilotaSlug).codice}: ${p.affidabilita}`).join(" ");
    }
    a.fonti = [...new Set([...(a.fonti || []), FONTE])];
    a.verificaSemantica = { verificatoIl: DATA_REVISIONE, fonte: FONTE,
      limite: "Posizioni e cause riscontrate su F1DB; fase qualifica separata dalla posizione; nessuna misura di passo o degrado." };
    fileDaScrivere.push([p, a]);
  }

  function righeStoriche(a, team, tipo) {
    const righe = tipo === "gara" ? f.risultati : f.qualifiche;
    return righe.filter((r) => r.year >= 2023 && r.year <= 2025 &&
      r.circuitId === f.circuitiStorici[a.garaSlug] && (team ?
        f.scuderieF1dbStoriche[a.scuderiaSlug][r.year].includes(r.constructorId) :
        r.driverId === f.pilotiF1db[a.pilotaSlug]));
  }
  const scenari = {};
  const classificheSquadre = {};
  for (const g of d.gare) {
    const gp = f.gare.find((r) => r.year === 2026 && r.circuitId === f.circuitiStorici[g.slug]);
    if (!gp) throw new Error(`GP mancante: ${g.slug}`);
    const partecipanti = d.analisiGare.filter((a) => a.garaSlug === g.slug).map((a) => ({
      driverId: f.pilotiF1db[a.pilotaSlug], constructorId: f.scuderieF1db2026[a.scuderiaSlug],
      pilotaSlug: a.pilotaSlug, scuderiaSlug: a.scuderiaSlug, codice: piloti.get(a.pilotaSlug).codice,
    }));
    const classifica = ordinaSemantico({ gara: gp, partecipanti, ...f });
    scenari[g.slug] = { versione: VERSIONE, calcolatoIl: DATA_REVISIONE,
      statoValidazione: "sperimentale_non_promosso",
      limiteRoundEsclusivo: gp.round, ultimoRoundIncluso: Math.min(gp.round - 1, f.ultimiGp.at(-1).round),
      retrospettivo: gp.round <= f.ultimiGp.at(-1).round, pesi: PESI_SEMANTICI, classifica,
      limite: "Risultati antecedenti al GP; formato/meteo/penalità non inseriti perché manca uno snapshot pre-gara verificato. Non è probabilità." };
    const medie = d.scuderie.map((s) => ({ scuderiaSlug: s.slug,
      indice: round(media(classifica.filter((p) => p.scuderiaSlug === s.slug).map((p) => p.indice))) }))
      .sort((a, b) => b.indice - a.indice || a.scuderiaSlug.localeCompare(b.scuderiaSlug))
      .map((s, i) => ({ posizione: i + 1, ...s }));
    classificheSquadre[g.slug] = medie;
    g.previsioneSemantica = { ...scenari[g.slug], classificaScuderie: medie };
    const valori = { ...circuito.circuiti[g.slug].dati };
    const misurati = { lunghezzaKm: gp.courseLength, giri: gp.scheduledLaps || gp.laps,
      distanzaKm: gp.scheduledDistance || gp.distance, curve: gp.turns };
    g.overallSemantici = {
      versione: VERSIONE, verificatoIl: DATA_REVISIONE,
      campi: Object.fromEntries(Object.entries(g).filter(([k, v]) => typeof v === "string" && !k.endsWith("Slug"))
        .map(([k]) => [k, campoNonMisurato("Campo descrittivo: non esprime una prestazione numerica.", "descrittivo")])),
      geometria: Object.fromEntries(Object.entries(valori).map(([k, v]) => [k, {
        valore: v, overall: null, stato: k in misurati ? (v === misurati[k] ? "riscontrato_f1db" : "conflitto_fonti") : "editoriale_non_misurato",
        valoreF1db: misurati[k] ?? null, fonti: [...circuito.circuiti[g.slug].fonti, FONTE],
      }])),
      richiesteTecniche: Object.fromEntries(Object.entries(circuito.circuiti[g.slug].richieste)
        .map(([k, v]) => [k, campoNonMisurato("Stima editoriale delle esigenze; esclusa dal modello semantico perché non calibrata.", "editoriale", v)])),
      pattern: campoNonMisurato("Contesto geometrico non equivale a una correlazione predittiva misurata.", "ipotesi"),
      protocolloRaccolta: {
        versione: 1,
        snapshotPrimaGara: ["data UTC di acquisizione", "versione dei pesi", "input disponibili", "classifica prevista", "hash input"],
        osservazioniGiri: ["raceId/sessione/pilota/giro", "tempo e settori", "mescola ed età", "stint", "meteo e temperature", "traffico", "SC/VSC/red flag", "in/out lap", "specifica vettura", "stima carburante con limite esplicito"],
        regoleQualita: ["Escludere giri non comparabili e registrare il motivo", "Degrado solo entro stint confrontabili; distinguere usura e variazione cronometrica", "Beneficio upgrade senza misura isolata resta null", "Fonte e timestamp per ogni penalità/specifica", "Nessun dato del GP target nei fattori del backtest"],
        documentiWeekend: ["entry list FIA", "Car Presentation Submissions e disponibilità per vettura", "decisioni penalità", "prescrizioni FIA/Pirelli", "meteo nella fascia di sessione"],
        stato: "misure_da_acquisire",
      },
    };
    const gareVecchie = f.gare.filter((r) => r.circuitId === gp.circuitId && r.year >= 2023 && r.year <= 2025);
    for (const [lingua, t] of Object.entries(testi)) {
      const trad = g.traduzioni[lingua];
      const labelPodio = { it: "Podio", en: "Podium", fr: "Podium final", pt: "Pódio", es: "Podio final", de: "Podest" };
      trad.contestoStorico = gareVecchie.map((r) => `${r.year}: ${labelPodio[lingua]} ` + f.risultati.filter((x) => x.raceId === r.id && Number.isInteger(x.positionNumber) && x.positionNumber <= 3)
        .map((x) => `${f.piloti.find((p) => p.id === x.driverId).abbreviation} ${pos(x, "P")}`).join(" / ")).join("\n") || t.assente;
      trad.pilotiFavoriti = t.favorevoli + classifica.slice(0, 4).map((p) => p.codice).join(" • ");
      trad.scuderieFavorite = t.favorevoli + medie.slice(0, 3).map((s) => scuderie.get(s.scuderiaSlug).nome).join(" • ");
      trad.outsider = t.outsider;
      trad.potenzialiDifficolta = t.difficolta + classifica.slice(-4).map((p) => p.codice).join(" • ");
      trad.gommeStrategia = formatta(t.strategia, { mescole: g.slug === "singapore-marina-bay" ? "C3/C4/C5" :
        g.slug === "bahrein-sepang" ? "C2/C3/C4" : t.compoundUnknown });
      trad.rischi = t.rischio;
      trad.confidenza = t.confidenza;
      if (lingua === "it") for (const k of ["contestoStorico", "pilotiFavoriti", "scuderieFavorite", "outsider", "potenzialiDifficolta", "gommeStrategia", "rischi", "confidenza"]) g[k] = trad[k];
    }
    g.fonti = [...new Set([...(g.fonti || []), FONTE,
      ...(g.slug === "singapore-marina-bay" || g.slug === "bahrein-sepang" ? ["https://press.pirelli.com/tyre-compound-selections-for-baku-sepang-and-singapore/"] : [])])];
    g.overallSemantici.campi.pilotiFavoriti = { overall: null, stato: "stima_sperimentale_da_risultati", metodo: VERSIONE };
    g.overallSemantici.campi.scuderieFavorite = { overall: null, stato: "stima_da_risultati", metodo: "Media degli indici dei piloti previsti per questo GP" };
    g.overallSemantici.campi.confidenza = campoNonMisurato("Etichetta di confidenza rimossa: non calibrata.");
  }

  const revisioneCampi = [];
  for (const [sezione, team] of [["analisiGare", false], ["analisiScuderie", true]]) for (const a of d[sezione]) {
    const scenario = scenari[a.garaSlug];
    const limite = scenario.limiteRoundEsclusivo;
    const rs = righeStoriche(a, team, "gara"), qs = righeStoriche(a, team, "qualifica");
    const r2026 = f.risultati.filter((r) => r.year === 2026 && r.round < limite &&
      (team ? r.constructorId === f.scuderieF1db2026[a.scuderiaSlug] : r.driverId === f.pilotiF1db[a.pilotaSlug]));
    const q2026 = f.qualifiche.filter((r) => r.year === 2026 && r.round < limite &&
      (team ? r.constructorId === f.scuderieF1db2026[a.scuderiaSlug] : r.driverId === f.pilotiF1db[a.pilotaSlug]));
    const id = team ? a.scuderiaSlug : a.pilotaSlug;
    const previsto = team ? classificheSquadre[a.garaSlug].find((s) => s.scuderiaSlug === id) :
      scenario.classifica.find((p) => p.pilotaSlug === id);
    const fields = {
      risultatiGara: descriviCampione(rs, "gara", f.numerosita),
      risultatiQualifica: descriviCampione(qs, "qualifica", f.numerosita),
      notaBene: campoNonMisurato("Contesto documentato; non è un indice di prestazione.", "contesto_da_risultati"),
      andamentoPerAnno: trend(r2026, f.numerosita),
      passoGara: campoNonMisurato("Mancano tempi giro, mescola/età, traffico e neutralizzazioni comparabili."),
      gestioneGomme: campoNonMisurato("Mancano stint comparabili e degrado separato da carburante, meteo e traffico."),
      considerazioniFinali: { overall: previsto.indice, stato: "stima_da_risultati", metodo: VERSIONE,
        posizione: previsto.posizione, campione: r2026.length, probabilita: false },
      affidabilita: { ...completamento(r2026), utilizzabilePrevisione: false },
      aggiornamentiInArrivo: campoNonMisurato("Guadagno prestazionale isolato non misurato; stato installazione specifico da verificare.", "beneficio_non_misurato"),
      compatibilitaTecnica: campoNonMisurato("Profili 0–100 editoriali e non validati; non usati nel modello semantico.", "editoriale"),
      esperienzaBagnato: campoNonMisurato("I conteggi locali non hanno un registro completo per-evento; percentuali non certificabili.", "da_verificare"),
      erroriPilota: campoNonMisurato("Manca un registro di attribuzione; un ritiro non dimostra un errore del pilota.", "da_verificare"),
    };
    if (!team) fields.penalita = { overall: null, stato: a.penalita ? "testo_pre_esistente_da_riscontrare" : "non_documentato",
      motivo: "Validità per singolo GP da confrontare con decisione FIA; non dedotta da qualifica-griglia." };
    a.overallSemantici = { versione: VERSIONE, verificatoIl: DATA_REVISIONE,
      limiteRoundEsclusivo: limite, ultimoRoundIncluso: scenario.ultimoRoundIncluso,
      campi: fields, stagioneCorrente: { rendimento: descriviCampione(r2026, "gara", f.numerosita),
        qualifica: descriviCampione(q2026, "qualifica", f.numerosita), completamento: completamento(r2026) },
      limite: "Storico 2023–2025 cambia vetture e regolamenti. Rendimento dai risultati non misura capacità di pilota o vettura isolatamente." };
    for (const [campo, valore] of Object.entries(fields)) revisioneCampi.push({ sezione, id, gp: a.garaSlug, campo, ...valore });
    for (const [lingua, t] of Object.entries(testi)) {
      const trad = a.traduzioni[lingua];
      trad.notaBene = [2023, 2024, 2025].map((year) => {
        const ri = rs.filter((r) => r.year === year), qi = qs.filter((q) => q.year === year);
        const summary = ri.length ? ri.map((r) => `${team ? f.piloti.find((p) => p.id === r.driverId).abbreviation + ": " : ""}` +
          dettaglio(r, qi.find((q) => q.driverId === r.driverId), t)).join(" ") : t.assente;
        return `${year}: ${summary} ${t.nota}`;
      }).join("\n");
      trad.passoGara = [2023, 2024, 2025, 2026].map((year) => `${year}: ${t.passo}`).join("\n");
      trad.gestioneGomme = [2023, 2024, 2025, 2026].map((year) => `${year}: ${t.gomme}`).join("\n");
      trad.andamentoPerAnno = `2026: ${t.stagione}`;
      trad.considerazioniFinali = formatta(t.conclusione, localizzaNumeri({ indice: previsto.indice,
        posizione: previsto.posizione, totale: team ? 11 : 22 }, lingua)) + (scenario.retrospettivo ? " " + t.retro : "");
      const c = fields.affidabilita;
      trad.affidabilita = c.overall === null ? t.ignoto : formatta(t.affidabilita,
        localizzaNumeri({ completate: c.completate, partenze: c.campione, percentuale: c.overall }, lingua));
      trad.aggiornamentiInArrivo = t.aggiornamenti;
      if (lingua === "it") for (const k of ["notaBene", "passoGara", "gestioneGomme", "andamentoPerAnno", "considerazioniFinali", "affidabilita", "aggiornamentiInArrivo"]) a[k] = trad[k];
    }
    if (!team) { a.vantaggioAggiornamentiTecnici = 50; a.statoAggiornamentiTecnici = ""; }
    a.fonti = [...new Set([...a.fonti, FONTE])];
  }
  for (const [sezione, team] of [["piloti", false], ["scuderie", true]]) for (const entita of d[sezione]) {
    const righe = f.risultati.filter((r) => r.year === 2026 && (team ?
      r.constructorId === f.scuderieF1db2026[entita.slug] : r.driverId === f.pilotiF1db[entita.slug]));
    const q = f.qualifiche.filter((r) => r.year === 2026 && (team ?
      r.constructorId === f.scuderieF1db2026[entita.slug] : r.driverId === f.pilotiF1db[entita.slug]));
    entita.overallSemantici = { versione: VERSIONE, verificatoIl: DATA_REVISIONE, ultimoRoundIncluso: f.ultimiGp.at(-1).round,
      campi: { rendimento: descriviCampione(righe, "gara", f.numerosita), qualifica: descriviCampione(q, "qualifica", f.numerosita),
        trend: trend(righe, f.numerosita), completamento: completamento(righe),
        passoGara: campoNonMisurato("Giri comparabili mancanti."), gestioneGomme: campoNonMisurato("Stint comparabili mancanti."),
        aggiornamenti: campoNonMisurato("Guadagno isolato non misurato."),
        compatibilita: campoNonMisurato("Capacità tecniche editoriali non validate.", "editoriale") } };
  }
  d.metadati.revisioneSemantica = { versione: VERSIONE, verificatoIl: DATA_REVISIONE,
    ultimoRoundIncluso: f.ultimiGp.at(-1).round, fonti: [FONTE], hashFonti: f.hash,
    campiMancanti: "overall=null; non è zero né 50 osservato", pesi: PESI_SEMANTICI,
    metodo: "Indici da risultati, con campioni e cutoff; nessun voto telemetrico inventato. Valutazione cronologica separata dai profili editoriali." };
  for (const [p, a] of fileDaScrivere) scrivi(p, a);
  scrivi(path.join(cartellaDati, "dati-iniziali.json"), d);
  scrivi(path.join(cartellaDati, "revisione-semantica-2026-10-05.json"), {
    metadati: d.metadati.revisioneSemantica, correzioniArchivi: correttiArchivi, campi: revisioneCampi,
    copertura: { circuiti: d.gare.length, piloti: d.piloti.length, scuderie: d.scuderie.length,
      analisiPiloti: d.analisiGare.length, analisiScuderie: d.analisiScuderie.length, campiSemantici: revisioneCampi.length },
  });
  console.log(JSON.stringify({ archiviCorretti: correttiArchivi.length, schede: d.analisiGare.length + d.analisiScuderie.length,
    campiSemantici: revisioneCampi.length, versione: VERSIONE }));
}
if (require.main === module) {
  try { revisione(process.argv[2]); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { revisione };
