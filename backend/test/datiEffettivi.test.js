const test = require("node:test");
const assert = require("node:assert/strict");

const { creaDatiEffettivi } = require("../utils/datiEffettivi");

function sorgenteMinima() {
  return {
    piloti: [
      { slug: "lawson", codice: "LAW", classifica2026: {} },
      { slug: "tsunoda", codice: "TSU", classifica2026: {} },
      { slug: "hadjar", codice: "HAD", classifica2026: {} },
    ],
    scuderie: [
      { slug: "red_bull", classifica2026: {} },
      { slug: "rb", classifica2026: {} },
    ],
    gare: [
      { slug: "madrid", stagione: 2026, ordineAnalisi: 1, stato: "attuale" },
      { slug: "baku", stagione: 2026, ordineAnalisi: 2, stato: "futura" },
    ],
    analisiGare: [
      { pilotaSlug: "lawson", garaSlug: "madrid", scuderiaSlug: "red_bull" },
      { pilotaSlug: "tsunoda", garaSlug: "madrid", scuderiaSlug: "rb" },
    ],
    analisiScuderie: [
      { scuderiaSlug: "red_bull", garaSlug: "madrid" },
      { scuderiaSlug: "rb", garaSlug: "madrid" },
    ],
  };
}

test("gli archivi rendono riproducibili classifiche, stato e storico GP", () => {
  const risultato = (pilotaSlug, posizioneGara) => ({
    pilotaSlug,
    posizioneGara,
    posizioneQualifica: "Q3",
    notaRisultato: "Risultato verificato",
    passoGara: "Passo verificato",
    gestioneGomme: "Gomme verificate",
    affidabilita: "Affidabilità verificata",
  });
  const archivio = {
    stagione: 2026,
    garaConclusaSlug: "madrid",
    conclusaIl: "2026-09-13T14:47:04Z",
    risultatiPiloti: [risultato("lawson", "P6"), risultato("tsunoda", "P14")],
    risultatiScuderie: [],
    classificaPiloti: [
      { pilotaSlug: "lawson", posizione: 1, punti: 59, vittorie: 0 },
      { pilotaSlug: "tsunoda", posizione: 2, punti: 1, vittorie: 0 },
    ],
    classificaScuderie: [
      { scuderiaSlug: "red_bull", posizione: 1, punti: 230, vittorie: 0 },
      { scuderiaSlug: "rb", posizione: 2, punti: 77, vittorie: 0 },
    ],
  };

  const dati = creaDatiEffettivi(sorgenteMinima(), [archivio]);

  assert.equal(dati.gare[0].stato, "conclusa");
  assert.equal(dati.gare[1].stato, "attuale");
  assert.equal(dati.piloti[0].classifica2026.punti, 59);
  assert.equal(dati.scuderie[1].classifica2026.punti, 77);
  assert.equal(dati.analisiGare[0].storicoEdizioni[0].posizioneGara, "P6");
  assert.equal(
    dati.analisiScuderie[0].storicoEdizioni[0].posizioneGara,
    "LAW P6",
  );
  assert.equal(
    dati.analisiScuderie[1].storicoEdizioni[0].posizioneGara,
    "TSU P14",
  );
  assert.equal(dati.piloti[2].classifica2026.punti, undefined);
});

test("un archivio precedente allo snapshot aggiunge lo storico senza regredire la classifica", () => {
  const sorgente = sorgenteMinima();
  sorgente.gare.unshift({
    slug: "zandvoort",
    stagione: 2026,
    ordineAnalisi: 0,
    stato: "conclusa",
  });
  sorgente.piloti[0].classifica2026 = { posizione: 1, punti: 51, vittorie: 0 };
  sorgente.analisiGare.push({
    pilotaSlug: "lawson",
    garaSlug: "zandvoort",
    scuderiaSlug: "rb",
  });
  sorgente.analisiScuderie.push({
    scuderiaSlug: "rb",
    garaSlug: "zandvoort",
  });

  const archivio = {
    stagione: 2026,
    garaConclusaSlug: "zandvoort",
    risultatiPiloti: [
      {
        pilotaSlug: "lawson",
        posizioneGara: "P8",
        posizioneQualifica: "Q2",
      },
    ],
    risultatiScuderie: [],
    classificaPiloti: [
      { pilotaSlug: "lawson", posizione: 2, punti: 43, vittorie: 0 },
    ],
    classificaScuderie: [],
  };

  const dati = creaDatiEffettivi(sorgente, [archivio]);

  assert.equal(dati.piloti[0].classifica2026.punti, 51);
  assert.equal(dati.gare.find((gara) => gara.slug === "madrid").stato, "attuale");
  assert.equal(
    dati.analisiGare.find((analisi) => analisi.garaSlug === "zandvoort")
      .storicoEdizioni[0].posizioneGara,
    "P8",
  );
});
