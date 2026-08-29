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
  assert.equal(documentoOpenApi.info.version, "1.10.0");
  assert.match(documentoOpenApi.info.description, /adattate nel software/);
  assert.match(documentoOpenApi.info.description, /Race Analysis Hub/);
  assert.match(documentoOpenApi.info.license.name, /CC BY 4\.0/);
  assert.match(documentoOpenApi.info.termsOfService, /LICENSE\.md$/);
  assert.match(
    documentoOpenApi.components.schemas.AnalisiBase.properties
      .aggiornamentiInArrivo.description,
    /senza modificare il database ufficiale/,
  );
  assert.match(
    documentoOpenApi.components.schemas.Andamento.description,
    /snapshot F1DB/,
  );
  assert.deepEqual(
    documentoOpenApi.components.schemas.FonteAndamento.required,
    ["nome", "url", "licenza", "licenzaUrl", "versione", "modifiche"],
  );
});

test("OpenAPI documenta i nuovi dati anagrafici senza cambiare le chiamate", () => {
  const schemi = documentoOpenApi.components.schemas;

  assert.deepEqual(schemi.ScuderiaBreve.required, [
    "slug",
    "nome",
    "abbreviazione",
    "colore",
  ]);
  assert.equal(
    schemi.ScuderiaBreve.properties.colore.pattern,
    "^#[0-9A-F]{6}$",
  );
  assert.ok(schemi.PilotaBreve.required.includes("abbreviazioneNome"));
  assert.ok(schemi.PilotaBreve.required.includes("numeroVettura"));
  assert.ok(schemi.PilotaBreve.required.includes("nazionalitaIso2"));
  assert.ok(schemi.PilotaBreve.required.includes("nazionalitaIso3"));
  assert.equal(
    schemi.PilotaBreve.properties.nazionalitaIso3.pattern,
    "^[A-Z]{3}$",
  );
  assert.ok(documentoOpenApi.paths["/piloti"]);
  assert.ok(documentoOpenApi.paths["/piloti/{pilotaSlug}"]);
});

test("OpenAPI documenta il contratto di localizzazione senza esporre Azure", () => {
  const parametro = documentoOpenApi.components.parameters.Lingua;
  const schemaErrore = documentoOpenApi.components.schemas.Errore;
  const rispostaLingue =
    documentoOpenApi.paths["/lingue"].get.responses[200].content[
      "application/json"
    ];

  assert.deepEqual(parametro.schema.enum, ["it", "en", "fr", "pt", "es", "de"]);
  assert.equal(parametro.schema.default, "it");
  assert.match(parametro.description, /pt-PT/);
  assert.match(parametro.description, /LINGUA_NON_SUPPORTATA/);
  assert.match(documentoOpenApi.info.description, /nessun endpoint pubblico/i);
  assert.ok(documentoOpenApi.components.headers.ContentLanguage);
  assert.ok(documentoOpenApi.components.headers.XAppCache);
  assert.equal(rispostaLingue.example.lingue.length, 6);
  assert.equal(
    schemaErrore.properties.errore.properties.lingueSupportate.items.$ref,
    "#/components/schemas/CodiceLingua",
  );

  for (const [percorso, definizione] of Object.entries(documentoOpenApi.paths)) {
    assert.ok(
      definizione.get.parameters?.some(
        (parametroOperazione) =>
          parametroOperazione.$ref === "#/components/parameters/Lingua",
      ),
      `${percorso} non documenta il parametro lingua`,
    );
  }
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
  assert.equal(
    schemi.Home.properties.classificaPrevisionale.$ref,
    "#/components/schemas/ClassificaPrevisionale",
  );
  assert.ok(schemi.Home.required.includes("classificaPrevisionale"));
  assert.ok(schemi.Home.required.includes("circuitoTecnico"));
  assert.ok(schemi.Home.required.includes("aggiornamentiLive"));
  assert.equal(
    schemi.DettaglioScuderia.properties.profiloTecnico.$ref,
    "#/components/schemas/ProfiloTecnicoScuderia",
  );
  assert.match(schemi.AggiornamentiLiveFia.description, /11 scuderie/);
  assert.equal(
    documentoOpenApi.paths["/previsioni/piloti"].get.responses[200].content[
      "application/json"
    ].schema.$ref,
    "#/components/schemas/ClassificaPrevisionale",
  );
});

test("OpenAPI documenta indicatori percentuali e confronti completi", () => {
  const schemi = documentoOpenApi.components.schemas;
  const indicatori = schemi.IndicatoriProfilo;

  assert.deepEqual(indicatori.required, [
    "bravuraBagnatoPercentuale",
    "gareConPioggiaPositive",
    "gareConPioggiaDisputate",
    "erroriPilotaPercentuale",
    "erroriFataliPercentuale",
  ]);
  assert.match(indicatori.description, /top 10/i);
  assert.match(
    indicatori.properties.erroriFataliPercentuale.description,
    /tutte le partenze/i,
  );
  assert.ok(schemi.DettaglioPilota.required.includes("indicatori"));
  assert.ok(schemi.DettaglioScuderia.required.includes("indicatori"));
  assert.equal(
    documentoOpenApi.paths[
      "/confronti/piloti/{primoPilotaSlug}/{secondoPilotaSlug}"
    ].get.responses[200].content["application/json"].schema.$ref,
    "#/components/schemas/ConfrontoPiloti",
  );
  assert.equal(
    schemi.ConfrontoScuderie.properties.elementi.maxItems,
    2,
  );
});

test("gli esempi Swagger della previsione sono matematicamente coerenti", () => {
  const schemi = documentoOpenApi.components.schemas;
  const pesi = schemi.ClassificaPrevisionale.properties.pesi.example;
  const posizione = schemi.PosizionePrevisionale.properties;
  const fattori = posizione.fattori.example;

  assert.equal(
    pesi.reduce((totale, peso) => totale + peso.pesoPercentuale, 0),
    100,
  );
  assert.equal(fattori.length, 9);
  assert.equal(
    fattori.reduce((totale, fattore) => totale + fattore.contributo, 0),
    posizione.indice.example,
  );
});
