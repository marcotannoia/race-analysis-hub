const test = require("node:test");
const assert = require("node:assert/strict");
const { estraiDecisioniEvento, estraiPenalitaGriglia, sincronizzaPenalitaFia } = require("../services/penalitaFia");

test("legge solo le decisioni dei commissari per il GP richiesto", () => {
  const html = `
    <div class="event-title active">Singapore Grand Prix</div>
    <li class="document-row key-17"><a href="/system/files/decision-document/singapore-car-41.pdf">
      <div class="title">Doc 17 - Infringement - Car 41 - Changes to PU elements</div></a></li>
    <li class="document-row key-18"><a href="/system/files/decision-document/singapore-summons.pdf">
      <div class="title">Doc 18 - Summons - Car 41</div></a></li>
    <div class="event-title">Bahrain Grand Prix</div>
    <li class="document-row key-26"><a href="/system/files/decision-document/bahrain-car-44.pdf">
      <div class="title">Doc 26 - Infringement - Car 44 - Impeding</div></a></li>`;
  const decisioni = estraiDecisioniEvento(html, "Singapore Grand Prix");
  assert.equal(decisioni.length, 1);
  assert.equal(decisioni[0].url, "https://www.fia.com/system/files/decision-document/singapore-car-41.pdf");
  assert.equal(estraiDecisioniEvento(html, "Qatar Grand Prix"), null);
});

test("applica solo una penalità di griglia esplicita nella decisione FIA", () => {
  const url = "https://www.fia.com/system/files/decision-document/singapore-car-41.pdf";
  assert.deepEqual(
    estraiPenalitaGriglia(
      "No / Driver 41 - Arvid Lindblad Competitor Racing Bulls Decision Drop of 30 grid positions for the next Race in which the driver participates. Reason Extra power unit elements.",
      url,
    ),
    { numeroVettura: 41, posizioni: 30, partenzaPitLane: false, documentoUrl: url },
  );
  assert.equal(
    estraiPenalitaGriglia(
      "No / Driver 44 - Lewis Hamilton Decision Driver: Warning. Reason The standard grid penalty was considered but not imposed.",
      url,
    ),
    null,
  );
  assert.equal(
    estraiPenalitaGriglia("Summons - Car 41 - Alleged grid infringement", url),
    null,
  );
  assert.equal(
    estraiPenalitaGriglia(
      "No / Driver 41 - Arvid Lindblad Decision Drop of 3 grid positions for the next Sprint session. Reason Impeding.",
      url,
    ),
    null,
  );
});

test("il monitor salva la penalità, evita duplicati e rimuove un documento ritirato", async () => {
  const riga = `<div class="event-title active">Singapore Grand Prix</div>
    <li class="document-row key-17"><a href="/system/files/decision-document/singapore-car-41.pdf">
    <div class="title">Doc 17 - Infringement - Car 41 - Changes to PU elements</div></a></li>`;
  let html = riga;
  let downloadPdf = 0;
  let svuotamenti = 0;
  let salvato = null;
  const archivio = {
    findOne: () => ({ lean: async () => salvato }),
    findOneAndUpdate: async (_filtro, aggiornamento) => { salvato = aggiornamento.$set; },
  };
  const opzioni = {
    adesso: new Date("2026-10-10T12:00:00Z"),
    gara: { slug: "singapore-marina-bay" },
    archivio,
    svuotaCache: () => { svuotamenti += 1; },
    scaricaDocumento: async (url) => {
      if (url.endsWith(".pdf")) { downloadPdf += 1; return Buffer.from("pdf"); }
      return Buffer.from(html);
    },
    estraiPagine: async () => [{ elementi: [{ testo:
      "No / Driver 41 - Arvid Lindblad Decision Drop of 10 grid positions for the next Race. Reason Extra elements." }] }],
  };

  assert.equal((await sincronizzaPenalitaFia(opzioni)).stato, "aggiornato");
  assert.equal(salvato.penalitaGriglia[0].numeroVettura, 41);
  assert.equal(downloadPdf, 1);
  assert.equal(svuotamenti, 1);
  assert.equal((await sincronizzaPenalitaFia(opzioni)).stato, "in_attesa");
  assert.equal(downloadPdf, 1);

  html = `<div class="event-title active">Singapore Grand Prix</div>`;
  assert.equal((await sincronizzaPenalitaFia(opzioni)).stato, "documenti_non_ancora_disponibili");
  assert.equal(salvato.penalitaGriglia.length, 1);
  assert.equal(svuotamenti, 1);

  html = `<div class="event-title active">Singapore Grand Prix</div>
    <li class="document-row key-18"><a href="/system/files/decision-document/singapore-summons.pdf">
    <div class="title">Doc 18 - Summons - Car 41</div></a></li>`;
  assert.equal((await sincronizzaPenalitaFia(opzioni)).stato, "aggiornato");
  assert.deepEqual(salvato.penalitaGriglia, []);
  assert.equal(svuotamenti, 2);
});
