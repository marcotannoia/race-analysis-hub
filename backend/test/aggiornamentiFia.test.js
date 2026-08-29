const assert = require("node:assert/strict");
const test = require("node:test");
const {
  estraiAggiornamentiDaPagine,
  estraiDatiCircuitoDaTesto,
  estraiDocumentiFia,
} = require("../services/aggiornamentiFia");

const SCUDERIE_FIA = [
  "McLaren Mastercard F1 Team",
  "Mercedes-AMG PETRONAS F1 Team",
  "Oracle Red Bull Racing",
  "SCUDERIA FERRARI HP",
  "Williams",
  "Visa Cash App Racing Bulls",
  "Aston Martin Aramco F1 Team",
  "TGR HAAS F1 TEAM",
  "Audi Revolut F1 Team",
  "BWT Alpine F1 Team",
  "Cadillac",
];

function elemento(testo, x, y, larghezza = testo.length * 5) {
  return { testo, x, y, larghezza };
}

test("estrae i due documenti ufficiali dalla pagina evento FIA", () => {
  const html = `
    <a href="/system/files/car_presentation_submissions.pdf">
      <div class="field-item even">Doc 10 - Car Presentation Submissions</div>
      <span class="date-display-single">21.08.26 10:02</span>
    </a>
    <a href="/system/files/circuit_map_pit_lane_drawing.pdf">
      <div class="field-item even">Doc 6 - Competition Notes - Circuit Map, Pit Lane Drawing</div>
      <span class="date-display-single">20.08.26 16:57</span>
    </a>`;
  const documenti = estraiDocumentiFia(
    html,
    "https://www.fia.com/documents/event/Dutch%20Grand%20Prix",
  );

  assert.equal(documenti.length, 2);
  assert.equal(
    documenti[0].url,
    "https://www.fia.com/system/files/car_presentation_submissions.pdf",
  );
  assert.equal(documenti[0].pubblicatoIl.toISOString(), "2026-08-21T10:02:00.000Z");
});

test("pubblica il Live soltanto quando tutte le 11 scuderie sono presenti", () => {
  const pagine = SCUDERIE_FIA.map((nome, indice) => ({
    numero: indice + 1,
    elementi: [
      elemento(nome, 320, 468),
      ...(indice === 0
        ? [
            elemento("1", 84, 390),
            elemento("Rear Wing", 117, 390),
            elemento("A revised assembly increases local load.", 531, 390),
          ]
        : [elemento("No updates submitted for this event.", 72, 425)]),
    ],
  }));

  const aggiornamenti = estraiAggiornamentiDaPagine(pagine);
  assert.equal(aggiornamenti.length, 11);
  assert.deepEqual(aggiornamenti[0].componenti, ["Rear Wing"]);
  assert.equal(aggiornamenti[1].nessunAggiornamento, true);

  assert.throws(
    () => estraiAggiornamentiDaPagine(pagine.slice(0, 10)),
    /Documento FIA incompleto: Cadillac/,
  );
});

test("conta le zone Straight Mode senza duplicati", () => {
  assert.deepEqual(
    estraiDatiCircuitoDaTesto(
      "OVERTAKE STRAIGHT MODE ZONE A1 ZONE A2 ZONE A1 OVERTAKE DETECTION",
    ),
    { zoneStraightMode: 2, rilevamentiOvertakeMode: 1 },
  );
});
