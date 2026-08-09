const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const documentoOpenApi = require("../docs/openapi");

function risolviRiferimento(riferimento) {
  assert.match(riferimento, /^#\//);

  return riferimento
    .slice(2)
    .split("/")
    .map((parte) => parte.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((valore, parte) => valore?.[parte], documentoOpenApi);
}

function visita(valore, funzione) {
  if (!valore || typeof valore !== "object") return;

  funzione(valore);
  Object.values(valore).forEach((figlio) => visita(figlio, funzione));
}

test("OpenAPI dichiara correttamente l'accesso pubblico e il referente", () => {
  assert.deepEqual(documentoOpenApi.security, []);
  assert.equal(documentoOpenApi.components.securitySchemes, undefined);
  assert.deepEqual(documentoOpenApi.info.contact, {
    name: "Marco Tannoia",
    email: "marco.tannoia@gmail.com",
  });
  assert.ok(
    documentoOpenApi.servers.some(
      (server) => server.url === "/api/v1",
    ),
  );
  assert.equal(documentoOpenApi.info.title, "Race Analysis Hub API");
  assert.match(
    documentoOpenApi.components.schemas.Andamento.description,
    /registrate manualmente/,
  );
});

test("tutte le route GET v1 sono documentate una sola volta", () => {
  const percorsoRoute = path.join(__dirname, "../routes/v1/apiRoutes.js");
  const sorgenteRoute = fs.readFileSync(percorsoRoute, "utf8");
  const route = [...sorgenteRoute.matchAll(/router\.get\(\s*"([^"]+)"/g)]
    .map((corrispondenza) =>
      corrispondenza[1].replace(
        /:([A-Za-z][A-Za-z0-9_]*)/g,
        "{$1}",
      ),
    )
    .sort();
  const percorsiDocumentati = Object.keys(documentoOpenApi.paths).sort();

  assert.deepEqual(percorsiDocumentati, route);
});

test("ogni operazione ha identificatore, risposte comuni e schema di successo", () => {
  const identificatori = [];

  for (const [percorso, definizione] of Object.entries(
    documentoOpenApi.paths,
  )) {
    const operazione = definizione.get;
    identificatori.push(operazione.operationId);

    assert.ok(operazione.operationId, `${percorso} senza operationId`);
    assert.ok(operazione.responses[200], `${percorso} senza risposta 200`);
    assert.ok(operazione.responses[400], `${percorso} senza risposta 400`);
    assert.ok(operazione.responses[500], `${percorso} senza risposta 500`);

    if (percorso !== "/health") {
      assert.ok(operazione.responses[429], `${percorso} senza risposta 429`);
    }

    const rispostaSuccesso = operazione.responses[200];
    assert.ok(
      rispostaSuccesso.content?.["application/json"]?.schema,
      `${percorso} senza schema JSON della risposta 200`,
    );
  }

  assert.equal(new Set(identificatori).size, identificatori.length);
});

test("tutti i riferimenti interni OpenAPI esistono", () => {
  visita(documentoOpenApi, (valore) => {
    if (typeof valore.$ref === "string") {
      assert.ok(
        risolviRiferimento(valore.$ref),
        `Riferimento non risolto: ${valore.$ref}`,
      );
    }
  });
});

test("classifiche, andamento e metadati espongono schemi strutturati", () => {
  const schemi = documentoOpenApi.components.schemas;

  assert.equal(
    schemi.ClassificaPiloti.properties.classifica.items.$ref,
    "#/components/schemas/PosizioneClassificaPilota",
  );
  assert.equal(
    schemi.ClassificaScuderie.properties.classifica.items.$ref,
    "#/components/schemas/PosizioneClassificaScuderia",
  );
  assert.equal(
    schemi.Andamento.properties.gara.items.$ref,
    "#/components/schemas/SerieAndamento",
  );
  assert.equal(
    schemi.Home.properties.metadati.$ref,
    "#/components/schemas/MetadatiHome",
  );
});
