const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

const collegaDatabase = require("../config/database");
const Gara = require("../models/Gara");
const Pilota = require("../models/Pilota");
const Scuderia = require("../models/Scuderia");
const AnalisiGara = require("../models/AnalisiGara");
const AnalisiScuderia = require("../models/AnalisiScuderia");

const percorsoPredefinito = path.join(
  __dirname,
  "../data/aggiornamento-gp.json",
);
const percorsoStatisticheContesto = path.join(
  __dirname,
  "../data/statistiche-contesto.json",
);
const argomenti = process.argv.slice(2);
const soloControllo = argomenti.includes("--controlla");
const forzaPreparazione = argomenti.includes("--prepara");
const sovrascrivi = argomenti.includes("--sovrascrivi");
const argomentoPercorso = argomenti.find(
  (argomento) => !argomento.startsWith("--"),
);
const percorsoAggiornamento = argomentoPercorso
  ? path.resolve(process.cwd(), argomentoPercorso)
  : percorsoPredefinito;

function leggiJson(percorso) {
  try {
    return JSON.parse(fs.readFileSync(percorso, "utf8"));
  } catch (errore) {
    if (errore instanceof SyntaxError) {
      throw new Error(`JSON non valido in ${percorso}: ${errore.message}`);
    }

    throw errore;
  }
}

function scriviJson(percorso, contenuto) {
  fs.mkdirSync(path.dirname(percorso), { recursive: true });
  fs.writeFileSync(percorso, `${JSON.stringify(contenuto, null, 2)}\n`, "utf8");
}

function scriviJsonAtomico(percorso, contenuto) {
  const percorsoTemporaneo = `${percorso}.${process.pid}.tmp`;
  scriviJson(percorsoTemporaneo, contenuto);
  fs.renameSync(percorsoTemporaneo, percorso);
}

function campoTestuale(valore) {
  return typeof valore === "string" ? valore.trim() : "";
}

function verificaRisultatiPiloti(risultati) {
  if (!Array.isArray(risultati)) {
    throw new Error("Il campo risultatiPiloti deve essere un array");
  }

  const slugVisti = new Set();
  const formatoGara = /^(?:P\d+|DNF|DNS|DSQ|NC)$/i;
  const formatoQualifica = /^(?:Q\d+|DNS|DSQ|NC)$/i;
  const gravitaErroreAmmesse = new Set([
    "nessuno",
    "non_fatale",
    "fatale",
  ]);

  risultati.forEach((risultato, indice) => {
    const slug = campoTestuale(risultato.pilotaSlug);
    const posizioneGara = campoTestuale(risultato.posizioneGara);
    const posizioneQualifica = campoTestuale(risultato.posizioneQualifica);
    const errorePilota = campoTestuale(risultato.errorePilota);

    if (!slug || !posizioneGara || !posizioneQualifica) {
      throw new Error(
        `Pilota ${indice + 1}: pilotaSlug, posizioneGara e ` +
          "posizioneQualifica sono obbligatori",
      );
    }

    if (!formatoGara.test(posizioneGara)) {
      throw new Error(
        `${slug}: posizioneGara non valida. Usa P1, P2, DNF, DNS, DSQ o NC`,
      );
    }

    if (!formatoQualifica.test(posizioneQualifica)) {
      throw new Error(
        `${slug}: posizioneQualifica non valida. Usa Q1, Q2, DNS, DSQ o NC`,
      );
    }

    if (!gravitaErroreAmmesse.has(errorePilota)) {
      throw new Error(
        `${slug}: errorePilota non valido. Usa nessuno, non_fatale o fatale`,
      );
    }

    if (posizioneGara.toUpperCase() === "DNS" && errorePilota !== "nessuno") {
      throw new Error(
        `${slug}: un pilota che non ha preso il via non può avere un errore di gara`,
      );
    }

    if (slugVisti.has(slug)) {
      throw new Error(`Risultati piloti: lo slug ${slug} è duplicato`);
    }

    slugVisti.add(slug);
  });
}

function verificaRisultatiScuderie(risultati) {
  if (risultati === undefined) return;

  if (!Array.isArray(risultati)) {
    throw new Error("Il campo risultatiScuderie deve essere un array");
  }

  const slugVisti = new Set();

  risultati.forEach((risultato, indice) => {
    const slug = campoTestuale(risultato.scuderiaSlug);

    if (!slug) {
      throw new Error(`Scuderia ${indice + 1}: scuderiaSlug è obbligatorio`);
    }

    if (slugVisti.has(slug)) {
      throw new Error(`Risultati scuderie: lo slug ${slug} è duplicato`);
    }

    slugVisti.add(slug);
  });
}

function verificaClassifica(classifica, campoSlug, etichetta) {
  if (!Array.isArray(classifica)) {
    throw new Error(`${etichetta} deve essere un array completo`);
  }

  const slugVisti = new Set();
  const posizioniViste = new Set();

  classifica.forEach((elemento, indice) => {
    const slug = campoTestuale(elemento[campoSlug]);
    const posizioneValida =
      Number.isInteger(elemento.posizione) && elemento.posizione > 0;
    const puntiValidi = Number.isFinite(elemento.punti) && elemento.punti >= 0;
    const vittorieValide =
      Number.isInteger(elemento.vittorie) && elemento.vittorie >= 0;

    if (!slug || !posizioneValida || !puntiValidi || !vittorieValide) {
      throw new Error(
        `${etichetta} ${indice + 1}: slug, posizione, punti e vittorie ` +
          "devono contenere valori validi",
      );
    }

    if (slugVisti.has(slug)) {
      throw new Error(`${etichetta}: lo slug ${slug} è duplicato`);
    }

    if (posizioniViste.has(elemento.posizione)) {
      throw new Error(
        `${etichetta}: la posizione ${elemento.posizione} è duplicata`,
      );
    }

    slugVisti.add(slug);
    posizioniViste.add(elemento.posizione);
  });
}

function verificaCopertura(elementi, entita, campoSlug, etichetta) {
  const slugRicevuti = new Set(elementi.map((elemento) => elemento[campoSlug]));
  const mancanti = entita
    .filter((elemento) => !slugRicevuti.has(elemento.slug))
    .map((elemento) => elemento.slug);
  const sconosciuti = [...slugRicevuti].filter(
    (slug) => !entita.some((elemento) => elemento.slug === slug),
  );

  if (
    mancanti.length ||
    sconosciuti.length ||
    elementi.length !== entita.length
  ) {
    const dettagli = [];
    if (mancanti.length) dettagli.push(`mancanti: ${mancanti.join(", ")}`);
    if (sconosciuti.length) {
      dettagli.push(`sconosciuti: ${sconosciuti.join(", ")}`);
    }
    throw new Error(`${etichetta} incompleti (${dettagli.join("; ")})`);
  }
}

function creaEdizione(stagione, risultato) {
  return {
    stagione,
    posizioneGara: campoTestuale(risultato.posizioneGara),
    posizioneQualifica: campoTestuale(risultato.posizioneQualifica),
    notaRisultato: campoTestuale(risultato.notaRisultato),
    passoGara: campoTestuale(risultato.passoGara),
    gomme: campoTestuale(risultato.gestioneGomme),
    affidabilita: campoTestuale(risultato.affidabilita),
  };
}

function combinaTestiPiloti(piloti, risultatiPerSlug, campo) {
  return piloti
    .map((pilota) => {
      const testo = campoTestuale(risultatiPerSlug.get(pilota.slug)?.[campo]);
      return testo ? `${pilota.codice}: ${testo}` : "";
    })
    .filter(Boolean)
    .join(" ");
}

function creaRisultatiScuderie(
  aggiornamento,
  piloti,
  scuderie,
  risultatiPerPilota,
) {
  const dettagliPerScuderia = new Map(
    (aggiornamento.risultatiScuderie || []).map((elemento) => [
      elemento.scuderiaSlug,
      elemento,
    ]),
  );

  return scuderie.map((scuderia) => {
    const pilotiScuderia = piloti.filter(
      (pilota) => String(pilota.scuderia) === String(scuderia._id),
    );
    const dettaglio = dettagliPerScuderia.get(scuderia.slug) || {};
    const posizioneGara = pilotiScuderia
      .map((pilota) => {
        const risultato = risultatiPerPilota.get(pilota.slug);
        return `${pilota.codice} ${risultato.posizioneGara.toUpperCase()}`;
      })
      .join(" / ");
    const posizioneQualifica = pilotiScuderia
      .map((pilota) => {
        const risultato = risultatiPerPilota.get(pilota.slug);
        return `${pilota.codice} ${risultato.posizioneQualifica.toUpperCase()}`;
      })
      .join(" / ");

    return {
      scuderiaSlug: scuderia.slug,
      posizioneGara,
      posizioneQualifica,
      notaRisultato:
        campoTestuale(dettaglio.notaRisultato) ||
        combinaTestiPiloti(pilotiScuderia, risultatiPerPilota, "notaRisultato"),
      passoGara:
        campoTestuale(dettaglio.passoGara) ||
        combinaTestiPiloti(pilotiScuderia, risultatiPerPilota, "passoGara"),
      gestioneGomme:
        campoTestuale(dettaglio.gestioneGomme) ||
        combinaTestiPiloti(
          pilotiScuderia,
          risultatiPerPilota,
          "gestioneGomme",
        ),
      affidabilita:
        campoTestuale(dettaglio.affidabilita) ||
        combinaTestiPiloti(pilotiScuderia, risultatiPerPilota, "affidabilita"),
    };
  });
}

function sostituisciEdizione(analisi, stagione, risultato) {
  analisi.storicoEdizioni = (analisi.storicoEdizioni || []).filter(
    (edizione) => edizione.stagione !== stagione,
  );
  analisi.storicoEdizioni.push(creaEdizione(stagione, risultato));
}

function operazioniClassifica(aggiornamenti, entitaPerSlug, campoSlug) {
  return aggiornamenti.map((elemento) => ({
    updateOne: {
      filter: { _id: entitaPerSlug.get(elemento[campoSlug])._id },
      update: {
        $set: {
          classifica2026: {
            posizione: elemento.posizione,
            punti: elemento.punti,
            vittorie: elemento.vittorie,
          },
        },
      },
    },
  }));
}

async function trovaContestoCalendario() {
  let garaCorrente = await Gara.findOne({ stato: "attuale" }).sort({
    ordineAnalisi: 1,
  });

  if (!garaCorrente) {
    garaCorrente = await Gara.findOne({ stato: "prossima" }).sort({
      ordineAnalisi: 1,
    });
  }

  if (!garaCorrente) {
    throw new Error("Non ci sono altri Gran Premi da elaborare");
  }

  const garaSuccessiva = await Gara.findOne({
    stagione: garaCorrente.stagione,
    ordineAnalisi: { $gt: garaCorrente.ordineAnalisi },
    stato: { $ne: "conclusa" },
  }).sort({ ordineAnalisi: 1 });

  return { garaCorrente, garaSuccessiva };
}

function creaTemplate(garaCorrente, piloti, scuderie) {
  const ordinaClassifica = (prima, seconda) =>
    prima.classifica2026.posizione - seconda.classifica2026.posizione;

  return {
    pronto: false,
    stagione: garaCorrente.stagione,
    garaConclusaSlug: garaCorrente.slug,
    conclusaIl: "",
    condizioniGara: "",
    fonteIndicatori: "",
    risultatiPiloti: [...piloti].sort(ordinaClassifica).map((pilota) => ({
      pilotaSlug: pilota.slug,
      posizioneGara: "",
      posizioneQualifica: "",
      notaRisultato: "",
      passoGara: "",
      gestioneGomme: "",
      affidabilita: "",
      errorePilota: "",
    })),
    risultatiScuderie: [...scuderie].sort(ordinaClassifica).map((scuderia) => ({
      scuderiaSlug: scuderia.slug,
      notaRisultato: "",
      passoGara: "",
      gestioneGomme: "",
      affidabilita: "",
    })),
    classificaPiloti: [...piloti].sort(ordinaClassifica).map((pilota) => ({
      pilotaSlug: pilota.slug,
      posizione: pilota.classifica2026.posizione,
      punti: pilota.classifica2026.punti,
      vittorie: pilota.classifica2026.vittorie,
    })),
    classificaScuderie: [...scuderie].sort(ordinaClassifica).map((scuderia) => ({
      scuderiaSlug: scuderia.slug,
      posizione: scuderia.classifica2026.posizione,
      punti: scuderia.classifica2026.punti,
      vittorie: scuderia.classifica2026.vittorie,
    })),
  };
}

function preparaFile(garaCorrente, garaSuccessiva, piloti, scuderie) {
  if (fs.existsSync(percorsoAggiornamento) && !sovrascrivi) {
    throw new Error(
      `Il file esiste già: ${percorsoAggiornamento}. ` +
        "Usa --sovrascrivi soltanto se vuoi rigenerarlo.",
    );
  }

  scriviJson(
    percorsoAggiornamento,
    creaTemplate(garaCorrente, piloti, scuderie),
  );

  console.log(`Template creato: ${percorsoAggiornamento}`);
  console.log(`GP da chiudere: ${garaCorrente.nome}.`);
  console.log(
    garaSuccessiva
      ? `GP che verrà pubblicato: ${garaSuccessiva.nome}.`
      : "Questo è l'ultimo GP presente nel calendario.",
  );
  console.log("Compila i campi, imposta pronto a true e rilancia npm run gp.");
}

function verificaAggiornamento(aggiornamento, garaCorrente, piloti, scuderie) {
  if (!Number.isInteger(aggiornamento.stagione)) {
    throw new Error("Il campo stagione deve essere un numero intero");
  }

  if (aggiornamento.stagione !== garaCorrente.stagione) {
    throw new Error(
      `Stagione errata: il GP corrente appartiene al ${garaCorrente.stagione}`,
    );
  }

  if (aggiornamento.garaConclusaSlug !== garaCorrente.slug) {
    throw new Error(
      `Il file riguarda ${aggiornamento.garaConclusaSlug || "nessun GP"}, ` +
        `ma il GP corrente è ${garaCorrente.slug}`,
    );
  }

  if (
    aggiornamento.conclusaIl &&
    Number.isNaN(Date.parse(aggiornamento.conclusaIl))
  ) {
    throw new Error("Il campo conclusaIl non contiene una data valida");
  }

  if (
    !new Set(["asciutto", "misto", "bagnato"]).has(
      aggiornamento.condizioniGara,
    )
  ) {
    throw new Error(
      "condizioniGara deve essere asciutto, misto o bagnato",
    );
  }

  try {
    const fonteIndicatori = new URL(aggiornamento.fonteIndicatori);
    if (fonteIndicatori.protocol !== "https:") throw new Error();
  } catch {
    throw new Error("fonteIndicatori deve contenere un URL HTTPS verificabile");
  }

  verificaRisultatiPiloti(aggiornamento.risultatiPiloti);
  verificaRisultatiScuderie(aggiornamento.risultatiScuderie);
  verificaClassifica(
    aggiornamento.classificaPiloti,
    "pilotaSlug",
    "Classifica piloti",
  );
  verificaClassifica(
    aggiornamento.classificaScuderie,
    "scuderiaSlug",
    "Classifica scuderie",
  );
  verificaCopertura(
    aggiornamento.risultatiPiloti,
    piloti,
    "pilotaSlug",
    "Risultati piloti",
  );
  verificaCopertura(
    aggiornamento.classificaPiloti,
    piloti,
    "pilotaSlug",
    "Classifica piloti",
  );
  verificaCopertura(
    aggiornamento.classificaScuderie,
    scuderie,
    "scuderiaSlug",
    "Classifica scuderie",
  );

  const scuderieNote = aggiornamento.risultatiScuderie || [];
  const slugScuderie = new Set(scuderie.map((scuderia) => scuderia.slug));
  const scuderieSconosciute = scuderieNote
    .map((elemento) => elemento.scuderiaSlug)
    .filter((slug) => !slugScuderie.has(slug));

  if (scuderieSconosciute.length) {
    throw new Error(
      `Risultati scuderie: slug sconosciuti ${scuderieSconosciute.join(", ")}`,
    );
  }
}

function posizioneGaraNumerica(risultato) {
  const corrispondenza = campoTestuale(risultato?.posizioneGara)
    .toUpperCase()
    .match(/^P(\d+)$/);

  return corrispondenza ? Number(corrispondenza[1]) : null;
}

function prestazionePioggiaPositiva(
  pilota,
  piloti,
  risultatiPerPilota,
  classificaPiloti,
) {
  const posizionePilota = posizioneGaraNumerica(
    risultatiPerPilota.get(pilota.slug),
  );
  if (!posizionePilota) return false;
  if (posizionePilota === 1) return true;

  const compagni = piloti.filter(
    (altroPilota) =>
      altroPilota.slug !== pilota.slug &&
      String(altroPilota.scuderia) === String(pilota.scuderia),
  );
  const haBattutoCompagno = compagni.some((compagno) => {
    const posizioneCompagno = posizioneGaraNumerica(
      risultatiPerPilota.get(compagno.slug),
    );
    return posizioneCompagno && posizionePilota < posizioneCompagno;
  });
  if (haBattutoCompagno) return true;

  const slugTop10 = new Set(
    classificaPiloti
      .filter((voce) => voce.posizione <= 10)
      .map((voce) => voce.pilotaSlug),
  );
  const slugCompagni = new Set(compagni.map((compagno) => compagno.slug));
  const posizioniRivali = piloti
    .filter(
      (rivale) =>
        rivale.slug !== pilota.slug &&
        !slugCompagni.has(rivale.slug) &&
        slugTop10.has(rivale.slug),
    )
    .map((rivale) =>
      posizioneGaraNumerica(risultatiPerPilota.get(rivale.slug)),
    )
    .filter(Boolean);

  if (!posizioniRivali.length) return false;

  const rivaliBattuti = posizioniRivali.filter(
    (posizioneRivale) => posizionePilota < posizioneRivale,
  ).length;

  return rivaliBattuti >= Math.ceil(posizioniRivali.length / 2);
}

function aggiornaStatisticheContesto(
  aggiornamento,
  garaCorrente,
  piloti,
  risultatiPerPilota,
) {
  const statistiche = leggiJson(percorsoStatisticheContesto);
  const identificatore = `${aggiornamento.stagione}:${garaCorrente.slug}`;
  const applicati = statistiche.metadati.aggiornamentiApplicati || [];

  if (applicati.includes(identificatore)) return false;

  for (const pilota of piloti) {
    const risultato = risultatiPerPilota.get(pilota.slug);
    const valori = statistiche.piloti[pilota.slug];
    if (!valori) {
      throw new Error(`Statistiche cumulative mancanti per ${pilota.slug}`);
    }

    const haPresoIlVia = risultato.posizioneGara.toUpperCase() !== "DNS";
    if (haPresoIlVia) valori.gareDisputate += 1;

    const garaConPioggia =
      aggiornamento.condizioniGara === "bagnato" ||
      aggiornamento.condizioniGara === "misto";

    if (haPresoIlVia && garaConPioggia) {
      valori.gareConPioggiaDisputate += 1;
      if (risultato.posizioneGara.toUpperCase() === "P1") {
        valori.vittorieConPioggia += 1;
      }
      if (
        prestazionePioggiaPositiva(
          pilota,
          piloti,
          risultatiPerPilota,
          aggiornamento.classificaPiloti,
        )
      ) {
        valori.gareConPioggiaPositive += 1;
      }
    }

    if (risultato.errorePilota !== "nessuno") valori.erroriPilota += 1;
    if (risultato.errorePilota === "fatale") valori.erroriFatali += 1;

    if (valori.erroriFatali > valori.erroriPilota) {
      throw new Error(`Errori fatali incoerenti per ${pilota.slug}`);
    }
  }

  statistiche.metadati.aggiornatoAl = aggiornamento.conclusaIl
    ? new Date(aggiornamento.conclusaIl).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  statistiche.metadati.ultimoGpIncluso = identificatore;
  statistiche.metadati.descrizione =
    `Statistiche cumulative fino a ${garaCorrente.nome} ` +
    `${aggiornamento.stagione} incluso. La percentuale sul bagnato misura ` +
    "le gare con pioggia concluse con una prestazione positiva, non la sola " +
    "percentuale di vittorie.";
  statistiche.metadati.aggiornamentiApplicati = [
    ...applicati,
    identificatore,
  ];
  if (!statistiche.metadati.fonti.includes(aggiornamento.fonteIndicatori)) {
    statistiche.metadati.fonti.push(aggiornamento.fonteIndicatori);
  }

  scriviJsonAtomico(percorsoStatisticheContesto, statistiche);
  return true;
}

async function databaseSupportaTransazioni() {
  try {
    const informazioni = await mongoose.connection.db
      .admin()
      .command({ hello: 1 });
    return Boolean(informazioni.setName || informazioni.msg === "isdbgrid");
  } catch {
    return false;
  }
}

function archiviaAggiornamento(aggiornamento, garaCorrente) {
  const cartellaArchivio = path.join(__dirname, "../data/archivio-gp");
  const nomeFile = `${aggiornamento.stagione}-${String(
    garaCorrente.ordineAnalisi,
  ).padStart(2, "0")}-${garaCorrente.slug}.json`;
  const percorsoArchivio = path.join(cartellaArchivio, nomeFile);

  scriviJson(percorsoArchivio, aggiornamento);

  if (path.resolve(percorsoAggiornamento) === path.resolve(percorsoPredefinito)) {
    fs.unlinkSync(percorsoAggiornamento);
  }

  return percorsoArchivio;
}

async function registraGpConcluso() {
  try {
    await collegaDatabase();

    const [{ garaCorrente, garaSuccessiva }, piloti, scuderie] =
      await Promise.all([
        trovaContestoCalendario(),
        Pilota.find().sort("classifica2026.posizione"),
        Scuderia.find().sort("classifica2026.posizione"),
      ]);

    const fileAssente = !fs.existsSync(percorsoAggiornamento);

    if (forzaPreparazione || (!argomentoPercorso && fileAssente)) {
      preparaFile(garaCorrente, garaSuccessiva, piloti, scuderie);
      return;
    }

    if (fileAssente) {
      throw new Error(`File non trovato: ${percorsoAggiornamento}`);
    }

    const aggiornamento = leggiJson(percorsoAggiornamento);
    verificaAggiornamento(aggiornamento, garaCorrente, piloti, scuderie);

    if (!soloControllo && aggiornamento.pronto !== true) {
      throw new Error(
        "Il file non è ancora pronto. Compilalo e imposta il campo pronto a true.",
      );
    }

    const risultatiPerPilota = new Map(
      aggiornamento.risultatiPiloti.map((risultato) => [
        risultato.pilotaSlug,
        risultato,
      ]),
    );
    const risultatiScuderie = creaRisultatiScuderie(
      aggiornamento,
      piloti,
      scuderie,
      risultatiPerPilota,
    );
    const [analisiPiloti, analisiScuderie] = await Promise.all([
      AnalisiGara.find({ gara: garaCorrente._id }),
      AnalisiScuderia.find({ gara: garaCorrente._id }),
    ]);

    if (analisiPiloti.length !== piloti.length) {
      throw new Error(
        `Copertura analisi piloti incompleta: ${analisiPiloti.length}/${piloti.length}`,
      );
    }

    if (analisiScuderie.length !== scuderie.length) {
      throw new Error(
        `Copertura analisi scuderie incompleta: ${analisiScuderie.length}/${scuderie.length}`,
      );
    }

    const analisiPilotaPerId = new Map(
      analisiPiloti.map((analisi) => [String(analisi.pilota), analisi]),
    );
    const analisiScuderiaPerId = new Map(
      analisiScuderie.map((analisi) => [String(analisi.scuderia), analisi]),
    );

    piloti.forEach((pilota) => {
      const analisi = analisiPilotaPerId.get(String(pilota._id));
      if (!analisi) throw new Error(`Analisi mancante per ${pilota.slug}`);
      sostituisciEdizione(
        analisi,
        aggiornamento.stagione,
        risultatiPerPilota.get(pilota.slug),
      );
    });

    scuderie.forEach((scuderia, indice) => {
      const analisi = analisiScuderiaPerId.get(String(scuderia._id));
      if (!analisi) throw new Error(`Analisi mancante per ${scuderia.slug}`);
      sostituisciEdizione(
        analisi,
        aggiornamento.stagione,
        risultatiScuderie[indice],
      );
    });

    console.log(`Controllo completato: ${garaCorrente.nome}.`);
    console.log(
      garaSuccessiva
        ? `Passaggio previsto: ${garaCorrente.nome} -> ${garaSuccessiva.nome}.`
        : `${garaCorrente.nome} è l'ultimo GP del calendario.`,
    );

    if (soloControllo) {
      console.log("Nessun dato modificato (--controlla).");
      return;
    }

    const pilotaPerSlug = new Map(
      piloti.map((pilota) => [pilota.slug, pilota]),
    );
    const scuderiaPerSlug = new Map(
      scuderie.map((scuderia) => [scuderia.slug, scuderia]),
    );
    const operazioniPiloti = operazioniClassifica(
      aggiornamento.classificaPiloti,
      pilotaPerSlug,
      "pilotaSlug",
    );
    const operazioniScuderie = operazioniClassifica(
      aggiornamento.classificaScuderie,
      scuderiaPerSlug,
      "scuderiaSlug",
    );

    const eseguiScritture = async (sessione = null) => {
      const opzioni = sessione ? { session: sessione } : {};

      if (sessione) {
        // MongoDB non supporta operazioni parallele nella stessa transazione.
        for (const analisi of analisiPiloti) await analisi.save(opzioni);
        for (const analisi of analisiScuderie) await analisi.save(opzioni);
        await Pilota.bulkWrite(operazioniPiloti, opzioni);
        await Scuderia.bulkWrite(operazioniScuderie, opzioni);
      } else {
        await Promise.all([
          ...analisiPiloti.map((analisi) => analisi.save(opzioni)),
          ...analisiScuderie.map((analisi) => analisi.save(opzioni)),
          Pilota.bulkWrite(operazioniPiloti, opzioni),
          Scuderia.bulkWrite(operazioniScuderie, opzioni),
        ]);
      }

      await Gara.updateMany(
        { stato: { $in: ["attuale", "prossima"] } },
        { $set: { stato: "futura" } },
        opzioni,
      );
      await Gara.updateOne(
        { _id: garaCorrente._id },
        {
          $set: {
            stato: "conclusa",
            conclusaIl: aggiornamento.conclusaIl
              ? new Date(aggiornamento.conclusaIl)
              : new Date(),
          },
        },
        opzioni,
      );

      if (garaSuccessiva) {
        await Gara.updateOne(
          { _id: garaSuccessiva._id },
          { $set: { stato: "attuale", conclusaIl: null } },
          opzioni,
        );
      }
    };

    if (await databaseSupportaTransazioni()) {
      const sessione = await mongoose.startSession();
      try {
        await sessione.withTransaction(() => eseguiScritture(sessione));
      } finally {
        await sessione.endSession();
      }
    } else {
      await eseguiScritture();
    }

    const statisticheAggiornate = aggiornaStatisticheContesto(
      aggiornamento,
      garaCorrente,
      piloti,
      risultatiPerPilota,
    );
    const percorsoArchivio = archiviaAggiornamento(
      aggiornamento,
      garaCorrente,
    );

    console.log(
      `Archiviati ${analisiPiloti.length} piloti e ${analisiScuderie.length} scuderie.`,
    );
    console.log(
      statisticheAggiornate
        ? "Indicatori bagnato/errori aggiornati senza azzerare lo storico."
        : "Indicatori già aggiornati per questo GP: nessun duplicato creato.",
    );
    console.log(
      garaSuccessiva
        ? `Prossimo GP pubblicato: ${garaSuccessiva.nome}.`
        : "Calendario completato: nessun prossimo GP da pubblicare.",
    );
    console.log(`File editoriale conservato in: ${percorsoArchivio}`);
  } catch (errore) {
    console.error("Aggiornamento fallito:", errore.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  registraGpConcluso();
}

module.exports = {
  aggiornaStatisticheContesto,
  creaRisultatiScuderie,
  prestazionePioggiaPositiva,
  verificaAggiornamento,
};
