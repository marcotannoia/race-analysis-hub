const fs = require("node:fs");
const path = require("node:path");

const VERSIONE_F1DB = "v2026.12.0";
const PUBBLICATO_IL = "2026-08-23T18:00:49.000Z";
const SHA256_ARCHIVIO =
  "36cd3e85bc169643b8f26e23040298beca92168b9511cb2d57516738bfa81e73";
const URL_REPOSITORY = "https://github.com/f1db/f1db";
const URL_RELEASE = `${URL_REPOSITORY}/releases/tag/${VERSIONE_F1DB}`;
const URL_ARCHIVIO = `${URL_REPOSITORY}/releases/download/${VERSIONE_F1DB}/f1db-json-splitted.zip`;
const URL_LICENZA = "https://creativecommons.org/licenses/by/4.0/";

const percorsoDatiProgetto = path.join(
  __dirname,
  "../data/dati-iniziali.json",
);
const percorsoSnapshot = path.join(
  __dirname,
  `../data/f1db-${VERSIONE_F1DB}-derivato.json`,
);

const pilotiF1db = {
  antonelli: "kimi-antonelli",
  hamilton: "lewis-hamilton",
  russell: "george-russell",
  leclerc: "charles-leclerc",
  norris: "lando-norris",
  max_verstappen: "max-verstappen",
  piastri: "oscar-piastri",
  hadjar: "isack-hadjar",
  lawson: "liam-lawson",
  tsunoda: "yuki-tsunoda",
  gasly: "pierre-gasly",
  arvid_lindblad: "arvid-lindblad",
  colapinto: "franco-colapinto",
  bearman: "oliver-bearman",
  bortoleto: "gabriel-bortoleto",
  sainz: "carlos-sainz-jr",
  albon: "alexander-albon",
  ocon: "esteban-ocon",
  hulkenberg: "nico-hulkenberg",
  alonso: "fernando-alonso",
  stroll: "lance-stroll",
  bottas: "valtteri-bottas",
  perez: "sergio-perez",
};

const circuitiStorici = {
  "olanda-zandvoort": "zandvoort",
  "italia-monza": "monza",
  "spagna-madring": "madring",
  "azerbaigian-baku": "baku",
  "bahrein-sepang": "sepang",
  "singapore-marina-bay": "marina-bay",
  "usa-austin": "austin",
  "messico-citta-del-messico": "mexico-city",
  "brasile-interlagos": "interlagos",
  "usa-las-vegas": "las-vegas",
  "qatar-lusail": "lusail",
  "abu-dhabi-yas-marina": "yas-marina",
};

const etichette2026 = {
  australia: "Australia",
  china: "Cina",
  japan: "Giappone",
  miami: "Miami",
  canada: "Canada",
  monaco: "Monaco",
  "barcelona-catalunya": "Barcellona",
  austria: "Austria",
  "great-britain": "Silverstone",
  belgium: "Spa",
  hungary: "Ungheria",
  netherlands: "Zandvoort",
  italy: "Monza",
  spain: "Madring",
  azerbaijan: "Baku",
  bahrain: "Sepang",
  singapore: "Singapore",
  "united-states": "Austin",
  mexico: "Messico",
  "sao-paulo": "Interlagos",
  "las-vegas": "Las Vegas",
  qatar: "Lusail",
  "abu-dhabi": "Yas Marina",
};

const scuderieF1dbStoriche = {
  mercedes: { 2023: ["mercedes"], 2024: ["mercedes"], 2025: ["mercedes"] },
  ferrari: { 2023: ["ferrari"], 2024: ["ferrari"], 2025: ["ferrari"] },
  mclaren: { 2023: ["mclaren"], 2024: ["mclaren"], 2025: ["mclaren"] },
  red_bull: { 2023: ["red-bull"], 2024: ["red-bull"], 2025: ["red-bull"] },
  rb: { 2023: ["alphatauri"], 2024: ["rb"], 2025: ["racing-bulls"] },
  alpine: { 2023: ["alpine"], 2024: ["alpine"], 2025: ["alpine"] },
  haas: { 2023: ["haas"], 2024: ["haas"], 2025: ["haas"] },
  audi: {
    2023: ["alfa-romeo"],
    2024: ["kick-sauber"],
    2025: ["kick-sauber"],
  },
  williams: { 2023: ["williams"], 2024: ["williams"], 2025: ["williams"] },
  aston_martin: {
    2023: ["aston-martin"],
    2024: ["aston-martin"],
    2025: ["aston-martin"],
  },
  cadillac: { 2023: [], 2024: [], 2025: [] },
};

const scuderieF1db2026 = {
  mercedes: "mercedes",
  ferrari: "ferrari",
  mclaren: "mclaren",
  red_bull: "red-bull",
  rb: "racing-bulls",
  alpine: "alpine",
  haas: "haas",
  audi: "audi",
  williams: "williams",
  aston_martin: "aston-martin",
  cadillac: "cadillac",
};

function leggiJson(percorso) {
  return JSON.parse(fs.readFileSync(percorso, "utf8"));
}

function richiedi(condizione, messaggio) {
  if (!condizione) throw new Error(messaggio);
}

function chiaveRisultato(raceId, driverId) {
  return `${raceId}|${driverId}`;
}

function prioritaRisultato(risultato) {
  const priorita = { DSQ: 5, EX: 4, DNS: 3, DNF: 2, NC: 1 };
  return priorita[risultato.positionText] || 0;
}

function indicizzaRisultati(risultati) {
  const indice = new Map();

  for (const risultato of risultati) {
    const chiave = chiaveRisultato(risultato.raceId, risultato.driverId);
    const precedente = indice.get(chiave);

    if (
      !precedente ||
      prioritaRisultato(risultato) > prioritaRisultato(precedente) ||
      (prioritaRisultato(risultato) === prioritaRisultato(precedente) &&
        risultato.positionDisplayOrder > precedente.positionDisplayOrder)
    ) {
      indice.set(chiave, risultato);
    }
  }

  return indice;
}

function posizione(risultato, prefisso) {
  if (!risultato) return null;
  if (Number.isInteger(risultato.positionNumber)) {
    return `${prefisso}${risultato.positionNumber}`;
  }
  return risultato.positionText || null;
}

function posizioneNumerica(risultato) {
  return Number.isInteger(risultato?.positionNumber)
    ? risultato.positionNumber
    : null;
}

function indicePerRaceId(risultati) {
  const indice = new Map();

  for (const risultato of risultati) {
    if (!indice.has(risultato.raceId)) indice.set(risultato.raceId, []);
    indice.get(risultato.raceId).push(risultato);
  }

  return indice;
}

function formattaPilota({
  gara,
  pilotaId,
  indiceRisultati,
  prefisso,
  costruttoriPerId,
}) {
  const risultato = indiceRisultati.get(chiaveRisultato(gara.id, pilotaId));
  if (!risultato) return "NON CORSO IN F1";

  const valore = posizione(risultato, prefisso);
  const costruttore = costruttoriPerId.get(risultato.constructorId);
  richiedi(valore, `Posizione mancante: gara ${gara.id}, pilota ${pilotaId}`);
  richiedi(
    costruttore,
    `Costruttore F1DB mancante: ${risultato.constructorId}`,
  );

  return `${valore} (${costruttore.name})`;
}

function formattaScuderia({
  gara,
  costruttoriId,
  risultatiPerRaceId,
  prefisso,
  pilotiPerId,
}) {
  const risultati = (risultatiPerRaceId.get(gara.id) || [])
    .filter((risultato) => costruttoriId.includes(risultato.constructorId))
    .sort(
      (primo, secondo) =>
        primo.positionDisplayOrder - secondo.positionDisplayOrder,
    );

  if (!risultati.length) return "NON PRESENTE IN F1";

  return risultati
    .map((risultato) => {
      const pilota = pilotiPerId.get(risultato.driverId);
      const valore = posizione(risultato, prefisso);
      richiedi(pilota?.abbreviation, `Codice pilota mancante: ${risultato.driverId}`);
      richiedi(valore, `Posizione mancante: gara ${gara.id}, pilota ${risultato.driverId}`);
      return `${pilota.abbreviation} ${valore}`;
    })
    .join(" / ");
}

function creaSnapshot(percorsoF1db, datiProgetto) {
  const carica = (nome) => leggiJson(path.join(percorsoF1db, nome));
  const gare = carica("f1db-races.json");
  const risultatiGara = carica("f1db-races-race-results.json");
  const risultatiQualifica = carica("f1db-races-qualifying-results.json");
  const piloti = carica("f1db-drivers.json");
  const costruttori = carica("f1db-constructors.json");
  const stagioniPiloti = carica("f1db-seasons-drivers.json");
  const stagioniScuderie = carica("f1db-seasons-constructors.json");

  const pilotiPerId = new Map(piloti.map((pilota) => [pilota.id, pilota]));
  const costruttoriPerId = new Map(
    costruttori.map((costruttore) => [costruttore.id, costruttore]),
  );
  const garaPerCircuitoAnno = new Map(
    gare.map((gara) => [`${gara.circuitId}|${gara.year}`, gara]),
  );
  const indiceGara = indicizzaRisultati(risultatiGara);
  const indiceQualifica = indicizzaRisultati(risultatiQualifica);
  const garePerId = new Map(gare.map((gara) => [gara.id, gara]));
  const gareRisultatiPerRaceId = indicePerRaceId([...indiceGara.values()]);
  const qualifichePerRaceId = indicePerRaceId([...indiceQualifica.values()]);

  for (const pilotaId of Object.values(pilotiF1db)) {
    richiedi(pilotiPerId.has(pilotaId), `Pilota F1DB mancante: ${pilotaId}`);
  }

  const eventiStorici = [];
  const analisiGare = [];
  const analisiScuderie = [];

  for (const garaProgetto of datiProgetto.gare) {
    const circuitoId = circuitiStorici[garaProgetto.slug];
    richiedi(circuitoId, `Mapping circuito mancante: ${garaProgetto.slug}`);

    const gareStoriche = new Map();
    for (const anno of [2023, 2024, 2025]) {
      const gara = garaPerCircuitoAnno.get(`${circuitoId}|${anno}`) || null;
      gareStoriche.set(anno, gara);
      eventiStorici.push({
        garaSlug: garaProgetto.slug,
        anno,
        raceId: gara?.id || null,
        circuitoId,
        data: gara?.date || null,
        disputata: Boolean(gara),
      });
    }

    for (const pilotaProgetto of datiProgetto.piloti) {
      const pilotaId = pilotiF1db[pilotaProgetto.slug];
      const righeGara = [];
      const righeQualifica = [];

      for (const anno of [2023, 2024, 2025]) {
        const gara = gareStoriche.get(anno);
        if (!gara) {
          righeGara.push(`${anno}: GP NON DISPUTATO SU QUESTO CIRCUITO`);
          righeQualifica.push(
            `${anno}: QUALIFICHE NON DISPUTATE SU QUESTO CIRCUITO`,
          );
          continue;
        }

        righeGara.push(
          `${anno}: ${formattaPilota({
            gara,
            pilotaId,
            indiceRisultati: indiceGara,
            prefisso: "P",
            costruttoriPerId,
          })}`,
        );
        righeQualifica.push(
          `${anno}: ${formattaPilota({
            gara,
            pilotaId,
            indiceRisultati: indiceQualifica,
            prefisso: "Q",
            costruttoriPerId,
          })}`,
        );
      }

      analisiGare.push({
        garaSlug: garaProgetto.slug,
        pilotaSlug: pilotaProgetto.slug,
        risultatiGara: righeGara.join("\n"),
        risultatiQualifica: righeQualifica.join("\n"),
      });
    }

    for (const scuderiaProgetto of datiProgetto.scuderie) {
      const righeGara = [];
      const righeQualifica = [];

      for (const anno of [2023, 2024, 2025]) {
        const gara = gareStoriche.get(anno);
        if (!gara) {
          righeGara.push(`${anno}: GP NON DISPUTATO SU QUESTO CIRCUITO`);
          righeQualifica.push(
            `${anno}: QUALIFICHE NON DISPUTATE SU QUESTO CIRCUITO`,
          );
          continue;
        }

        const costruttoriId =
          scuderieF1dbStoriche[scuderiaProgetto.slug]?.[anno];
        richiedi(
          costruttoriId,
          `Mapping scuderia mancante: ${scuderiaProgetto.slug} ${anno}`,
        );
        righeGara.push(
          `${anno}: ${formattaScuderia({
            gara,
            costruttoriId,
            risultatiPerRaceId: gareRisultatiPerRaceId,
            prefisso: "P",
            pilotiPerId,
          })}`,
        );
        righeQualifica.push(
          `${anno}: ${formattaScuderia({
            gara,
            costruttoriId,
            risultatiPerRaceId: qualifichePerRaceId,
            prefisso: "Q",
            pilotiPerId,
          })}`,
        );
      }

      analisiScuderie.push({
        garaSlug: garaProgetto.slug,
        scuderiaSlug: scuderiaProgetto.slug,
        risultatiGara: righeGara.join("\n"),
        risultatiQualifica: righeQualifica.join("\n"),
      });
    }
  }

  const stagionePiloti2026 = new Map(
    stagioniPiloti
      .filter((pilota) => pilota.year === 2026 && pilota.positionNumber)
      .map((pilota) => [pilota.driverId, pilota]),
  );
  const stagioneScuderie2026 = new Map(
    stagioniScuderie
      .filter((scuderia) => scuderia.year === 2026)
      .map((scuderia) => [scuderia.constructorId, scuderia]),
  );

  const classifichePiloti2026 = datiProgetto.piloti.map((pilota) => {
    const f1db = stagionePiloti2026.get(pilotiF1db[pilota.slug]);
    richiedi(f1db, `Classifica F1DB mancante per ${pilota.slug}`);
    return {
      slug: pilota.slug,
      classifica2026: {
        posizione: f1db.positionNumber,
        punti: f1db.totalPoints,
        vittorie: f1db.totalRaceWins,
      },
    };
  });

  const classificheScuderie2026 = datiProgetto.scuderie.map((scuderia) => {
    const f1db = stagioneScuderie2026.get(
      scuderieF1db2026[scuderia.slug],
    );
    richiedi(f1db, `Classifica F1DB mancante per ${scuderia.slug}`);
    return {
      slug: scuderia.slug,
      classifica2026: {
        posizione: f1db.positionNumber,
        punti: f1db.totalPoints,
        vittorie: f1db.totalRaceWins,
      },
    };
  });

  const gareConcluse2026 = gare
    .filter(
      (gara) =>
        gara.year === 2026 &&
        (gareRisultatiPerRaceId.get(gara.id) || []).length > 0,
    )
    .sort((prima, seconda) => prima.round - seconda.round);

  const andamentoEventi2026 = gareConcluse2026.map((gara) => {
    const pilotiEvento = {};
    const scuderieEvento = {};

    for (const pilotaProgetto of datiProgetto.piloti) {
      const pilotaId = pilotiF1db[pilotaProgetto.slug];
      pilotiEvento[pilotaProgetto.slug] = {
        codice: pilotaProgetto.codice,
        gara: posizioneNumerica(indiceGara.get(chiaveRisultato(gara.id, pilotaId))),
        qualifica: posizioneNumerica(
          indiceQualifica.get(chiaveRisultato(gara.id, pilotaId)),
        ),
      };
    }

    for (const scuderiaProgetto of datiProgetto.scuderie) {
      const costruttoreId = scuderieF1db2026[scuderiaProgetto.slug];
      const risultatiTeam = (gareRisultatiPerRaceId.get(gara.id) || []).filter(
        (risultato) => risultato.constructorId === costruttoreId,
      );
      const qualificheTeam = (qualifichePerRaceId.get(gara.id) || []).filter(
        (risultato) => risultato.constructorId === costruttoreId,
      );
      const codici = new Set(
        [...risultatiTeam, ...qualificheTeam].map((risultato) => {
          const pilota = pilotiPerId.get(risultato.driverId);
          richiedi(pilota?.abbreviation, `Codice pilota mancante: ${risultato.driverId}`);
          return pilota.abbreviation;
        }),
      );

      scuderieEvento[scuderiaProgetto.slug] = {
        gara: Object.fromEntries(
          [...codici].map((codice) => {
            const risultato = risultatiTeam.find(
              (elemento) =>
                pilotiPerId.get(elemento.driverId)?.abbreviation === codice,
            );
            return [codice, posizioneNumerica(risultato)];
          }),
        ),
        qualifica: Object.fromEntries(
          [...codici].map((codice) => {
            const risultato = qualificheTeam.find(
              (elemento) =>
                pilotiPerId.get(elemento.driverId)?.abbreviation === codice,
            );
            return [codice, posizioneNumerica(risultato)];
          }),
        ),
      };
    }

    return {
      raceId: gara.id,
      round: gara.round,
      data: gara.date,
      grandPrixId: gara.grandPrixId,
      circuitoId: gara.circuitId,
      etichetta: etichette2026[gara.grandPrixId] || gara.grandPrixId,
      piloti: pilotiEvento,
      scuderie: scuderieEvento,
    };
  });

  return {
    metadati: {
      fonte: "F1DB",
      versione: VERSIONE_F1DB,
      pubblicatoIl: PUBBLICATO_IL,
      derivatoIl: "2026-09-02",
      releaseUrl: URL_RELEASE,
      archivio: "f1db-json-splitted.zip",
      archivioUrl: URL_ARCHIVIO,
      archivioSha256: SHA256_ARCHIVIO,
      licenza: "CC BY 4.0",
      licenzaUrl: URL_LICENZA,
      trasformazioni:
        "Sottoinsieme filtrato, rinominato e normalizzato da Race Analysis Hub; nessun risultato sportivo è stato stimato.",
    },
    classifiche2026: {
      piloti: classifichePiloti2026,
      scuderie: classificheScuderie2026,
    },
    andamento2026: {
      stagione: 2026,
      eventi: andamentoEventi2026,
    },
    eventiStorici,
    analisiGare,
    analisiScuderie,
  };
}

function applicaSnapshot(dati, snapshot) {
  const pilotaPerSlug = new Map(
    snapshot.classifiche2026.piloti.map((pilota) => [pilota.slug, pilota]),
  );
  const scuderiaPerSlug = new Map(
    snapshot.classifiche2026.scuderie.map((scuderia) => [
      scuderia.slug,
      scuderia,
    ]),
  );
  const analisiGaraPerChiave = new Map(
    snapshot.analisiGare.map((analisi) => [
      `${analisi.garaSlug}|${analisi.pilotaSlug}`,
      analisi,
    ]),
  );
  const analisiScuderiaPerChiave = new Map(
    snapshot.analisiScuderie.map((analisi) => [
      `${analisi.garaSlug}|${analisi.scuderiaSlug}`,
      analisi,
    ]),
  );

  dati.metadati.origine = `Race Analysis Hub + F1DB ${VERSIONE_F1DB}`;
  dati.metadati.descrizione =
    `Classifiche 2026 e risultati F1 2023-2025 derivati da F1DB ${VERSIONE_F1DB}; ` +
    "analisi descrittive e previsioni originali di Race Analysis Hub.";
  dati.metadati.f1db = snapshot.metadati;

  for (const pilota of dati.piloti) {
    const sorgente = pilotaPerSlug.get(pilota.slug);
    richiedi(sorgente, `Classifica pilota non generata: ${pilota.slug}`);
    pilota.classifica2026 = sorgente.classifica2026;
  }

  for (const scuderia of dati.scuderie) {
    const sorgente = scuderiaPerSlug.get(scuderia.slug);
    richiedi(sorgente, `Classifica scuderia non generata: ${scuderia.slug}`);
    scuderia.classifica2026 = sorgente.classifica2026;
  }

  function sostituisciFonti(fonti = []) {
    return [
      URL_ARCHIVIO,
      ...fonti.filter(
        (fonte) =>
          !/^https:\/\/github\.com\/f1db\/f1db\/releases\/download\/v[^/]+\/f1db-json-splitted\.zip$/.test(
            fonte,
          ),
      ),
    ].filter((fonte, indice, elenco) => elenco.indexOf(fonte) === indice);
  }

  for (const analisi of dati.analisiGare) {
    const sorgente = analisiGaraPerChiave.get(
      `${analisi.garaSlug}|${analisi.pilotaSlug}`,
    );
    richiedi(
      sorgente,
      `Storico pilota non generato: ${analisi.garaSlug}/${analisi.pilotaSlug}`,
    );
    analisi.risultatiGara = sorgente.risultatiGara;
    analisi.risultatiQualifica = sorgente.risultatiQualifica;
    analisi.fonti = sostituisciFonti(analisi.fonti);
  }

  for (const analisi of dati.analisiScuderie) {
    const sorgente = analisiScuderiaPerChiave.get(
      `${analisi.garaSlug}|${analisi.scuderiaSlug}`,
    );
    richiedi(
      sorgente,
      `Storico scuderia non generato: ${analisi.garaSlug}/${analisi.scuderiaSlug}`,
    );
    analisi.risultatiGara = sorgente.risultatiGara;
    analisi.risultatiQualifica = sorgente.risultatiQualifica;
    analisi.fonti = sostituisciFonti(analisi.fonti);
  }

  return dati;
}

function main() {
  const percorsoF1db = process.argv[2];
  richiedi(
    percorsoF1db,
    "Uso: node scripts/sincronizzaF1db.js /percorso/f1db-json-splitted",
  );
  richiedi(
    fs.existsSync(path.join(percorsoF1db, "f1db-races.json")),
    `Distribuzione F1DB non trovata in ${percorsoF1db}`,
  );

  const dati = leggiJson(percorsoDatiProgetto);
  const snapshot = creaSnapshot(percorsoF1db, dati);
  const datiAggiornati = applicaSnapshot(dati, snapshot);

  fs.writeFileSync(percorsoSnapshot, `${JSON.stringify(snapshot, null, 2)}\n`);
  fs.writeFileSync(
    percorsoDatiProgetto,
    `${JSON.stringify(datiAggiornati, null, 2)}\n`,
  );

  console.log(`F1DB ${VERSIONE_F1DB}: snapshot generato in ${percorsoSnapshot}`);
  console.log("Classifiche 2026 e risultati storici sincronizzati.");
}

try {
  main();
} catch (errore) {
  console.error(`Sincronizzazione F1DB fallita: ${errore.message}`);
  process.exitCode = 1;
}
