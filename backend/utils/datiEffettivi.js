const fs = require("fs");
const path = require("path");

const cartellaArchivioPredefinita = path.join(
  __dirname,
  "../data/archivio-gp",
);

function campoTestuale(valore) {
  return typeof valore === "string" ? valore.trim() : "";
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

function sostituisciEdizione(analisi, stagione, risultato) {
  analisi.storicoEdizioni = (analisi.storicoEdizioni || []).filter(
    (edizione) => edizione.stagione !== stagione,
  );
  analisi.storicoEdizioni.push(creaEdizione(stagione, risultato));
}

function leggiArchivi(cartellaArchivio = cartellaArchivioPredefinita) {
  if (!fs.existsSync(cartellaArchivio)) return [];

  return fs
    .readdirSync(cartellaArchivio)
    .filter((nomeFile) => nomeFile.endsWith(".json"))
    .sort()
    .map((nomeFile) =>
      JSON.parse(fs.readFileSync(path.join(cartellaArchivio, nomeFile), "utf8")),
    );
}

function aggiornaClassifica(entita, classifica, campoSlug) {
  const perSlug = new Map(entita.map((elemento) => [elemento.slug, elemento]));

  for (const voce of classifica || []) {
    const elemento = perSlug.get(voce[campoSlug]);
    if (!elemento) continue;
    elemento.classifica2026 = {
      posizione: voce.posizione,
      punti: voce.punti,
      vittorie: voce.vittorie,
    };
  }
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

function creaRisultatoScuderia(
  scuderiaSlug,
  dettaglio,
  pilotiScuderia,
  risultatiPerSlug,
) {
  const unisciPosizione = (campo) =>
    pilotiScuderia
      .map((pilota) =>
        `${pilota.codice} ${campoTestuale(
          risultatiPerSlug.get(pilota.slug)?.[campo],
        ).toUpperCase()}`,
      )
      .join(" / ");

  return {
    scuderiaSlug,
    posizioneGara: unisciPosizione("posizioneGara"),
    posizioneQualifica: unisciPosizione("posizioneQualifica"),
    notaRisultato:
      campoTestuale(dettaglio?.notaRisultato) ||
      combinaTestiPiloti(pilotiScuderia, risultatiPerSlug, "notaRisultato"),
    passoGara:
      campoTestuale(dettaglio?.passoGara) ||
      combinaTestiPiloti(pilotiScuderia, risultatiPerSlug, "passoGara"),
    gestioneGomme:
      campoTestuale(dettaglio?.gestioneGomme) ||
      combinaTestiPiloti(pilotiScuderia, risultatiPerSlug, "gestioneGomme"),
    affidabilita:
      campoTestuale(dettaglio?.affidabilita) ||
      combinaTestiPiloti(pilotiScuderia, risultatiPerSlug, "affidabilita"),
  };
}

function applicaArchivio(dati, archivio, { aggiornaContesto = true } = {}) {
  const garaConclusa = dati.gare.find(
    (gara) => gara.slug === archivio.garaConclusaSlug,
  );
  if (!garaConclusa) return;

  if (aggiornaContesto) {
    aggiornaClassifica(dati.piloti, archivio.classificaPiloti, "pilotaSlug");
    aggiornaClassifica(
      dati.scuderie,
      archivio.classificaScuderie,
      "scuderiaSlug",
    );

    for (const gara of dati.gare) {
      if (["attuale", "prossima"].includes(gara.stato)) gara.stato = "futura";
    }
    garaConclusa.stato = "conclusa";
    if (archivio.conclusaIl) {
      garaConclusa.conclusaIl = new Date(archivio.conclusaIl).toISOString();
    }

    const garaSuccessiva = [...dati.gare]
      .filter(
        (gara) =>
          gara.stagione === archivio.stagione &&
          gara.ordineAnalisi > garaConclusa.ordineAnalisi &&
          gara.stato !== "conclusa",
      )
      .sort((prima, seconda) => prima.ordineAnalisi - seconda.ordineAnalisi)[0];
    if (garaSuccessiva) garaSuccessiva.stato = "attuale";
  }

  const pilotaPerSlug = new Map(
    dati.piloti.map((pilota) => [pilota.slug, pilota]),
  );
  const risultatiPerSlug = new Map(
    (archivio.risultatiPiloti || []).map((risultato) => [
      risultato.pilotaSlug,
      risultato,
    ]),
  );
  const analisiEvento = dati.analisiGare.filter(
    (analisi) => analisi.garaSlug === archivio.garaConclusaSlug,
  );

  for (const analisi of analisiEvento) {
    const risultato = risultatiPerSlug.get(analisi.pilotaSlug);
    if (risultato) sostituisciEdizione(analisi, archivio.stagione, risultato);
  }

  const dettagliScuderie = new Map(
    (archivio.risultatiScuderie || []).map((risultato) => [
      risultato.scuderiaSlug,
      risultato,
    ]),
  );
  const pilotiEventoPerScuderia = new Map();
  for (const risultato of archivio.risultatiPiloti || []) {
    const analisi = analisiEvento.find(
      (elemento) => elemento.pilotaSlug === risultato.pilotaSlug,
    );
    const pilota = pilotaPerSlug.get(risultato.pilotaSlug);
    if (!analisi || !pilota) continue;
    const elenco = pilotiEventoPerScuderia.get(analisi.scuderiaSlug) || [];
    elenco.push(pilota);
    pilotiEventoPerScuderia.set(analisi.scuderiaSlug, elenco);
  }

  for (const analisi of dati.analisiScuderie.filter(
    (elemento) => elemento.garaSlug === archivio.garaConclusaSlug,
  )) {
    const risultato = creaRisultatoScuderia(
      analisi.scuderiaSlug,
      dettagliScuderie.get(analisi.scuderiaSlug),
      pilotiEventoPerScuderia.get(analisi.scuderiaSlug) || [],
      risultatiPerSlug,
    );
    sostituisciEdizione(analisi, archivio.stagione, risultato);
  }
}

function creaDatiEffettivi(datiSorgente, archivi = leggiArchivi()) {
  const dati = structuredClone(datiSorgente);
  const ordineBase = Math.min(
    ...dati.gare
      .filter((gara) => ["attuale", "prossima"].includes(gara.stato))
      .map((gara) => gara.ordineAnalisi),
  );

  for (const archivio of archivi) {
    const gara = dati.gare.find(
      (elemento) => elemento.slug === archivio.garaConclusaSlug,
    );
    applicaArchivio(dati, archivio, {
      aggiornaContesto: !Number.isFinite(ordineBase) || gara?.ordineAnalisi >= ordineBase,
    });
  }
  return dati;
}

module.exports = {
  applicaArchivio,
  creaDatiEffettivi,
  leggiArchivi,
};
