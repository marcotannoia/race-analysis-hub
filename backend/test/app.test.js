const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000";

const app = require("../app");

async function conServer(funzione) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((risolvi) => server.once("listening", risolvi));

  try {
    const indirizzo = server.address();
    await funzione(`http://127.0.0.1:${indirizzo.port}`);
  } finally {
    await new Promise((risolvi, rifiuta) => {
      server.close((errore) => (errore ? rifiuta(errore) : risolvi()));
    });
  }
}

test("l'indice v1 espone versione, documentazione e header di sicurezza", async () => {
  await conServer(async (baseUrl) => {
    const risposta = await fetch(`${baseUrl}/api/v1`, {
      headers: { Origin: "https://app.example.com" },
    });
    const corpo = await risposta.json();

    assert.equal(risposta.status, 200);
    assert.equal(corpo.nome, "Race Analysis Hub API");
    assert.equal(corpo.versione, "1.2.0");
    assert.equal(corpo.documentazione, "/api/docs");
    assert.deepEqual(corpo.attribuzioneDati, {
      nome: "F1DB",
      url: "https://github.com/f1db/f1db/releases/tag/v2026.11.0",
      licenza: "CC BY 4.0",
      licenzaUrl: "https://creativecommons.org/licenses/by/4.0/",
      versione: "v2026.11.0",
      modifiche:
        "Sottoinsieme filtrato, rinominato e normalizzato da Race Analysis Hub; nessun risultato sportivo è stato stimato.",
    });
    assert.equal(risposta.headers.get("access-control-allow-origin"), "*");
    assert.match(risposta.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
    assert.equal(risposta.headers.get("x-content-type-options"), "nosniff");
  });
});

test("l'API v1 rifiuta metodi di scrittura", async () => {
  await conServer(async (baseUrl) => {
    const risposta = await fetch(`${baseUrl}/api/v1/piloti`, {
      method: "POST",
    });
    const corpo = await risposta.json();

    assert.equal(risposta.status, 405);
    assert.equal(corpo.errore.codice, "METODO_NON_CONSENTITO");
    assert.equal(risposta.headers.get("allow"), "GET, HEAD, OPTIONS");
  });
});

test("gli endpoint non versionati non espongono piu i documenti MongoDB", async () => {
  await conServer(async (baseUrl) => {
    const risposta = await fetch(`${baseUrl}/api/piloti/leclerc`);
    const corpo = await risposta.json();

    assert.equal(risposta.status, 410);
    assert.equal(corpo.errore.codice, "VERSIONE_API_OBSOLETA");
    assert.equal(JSON.stringify(corpo).includes("_id"), false);
  });
});

test("l'API v1 rifiuta query e identificatori non previsti", async () => {
  await conServer(async (baseUrl) => {
    const query = await fetch(`${baseUrl}/api/v1?stato=futura`);
    const queryCorpo = await query.json();
    assert.equal(query.status, 400);
    assert.equal(queryCorpo.errore.codice, "PARAMETRO_QUERY_NON_VALIDO");

    const slug = await fetch(`${baseUrl}/api/v1/piloti/slug%20non%20valido`);
    const slugCorpo = await slug.json();
    assert.equal(slug.status, 400);
    assert.equal(slugCorpo.errore.codice, "IDENTIFICATORE_NON_VALIDO");
  });
});

test("specifica OpenAPI e documentazione Swagger sono pubbliche", async () => {
  await conServer(async (baseUrl) => {
    const specifica = await fetch(`${baseUrl}/api/v1/openapi.json`);
    const corpo = await specifica.json();
    assert.equal(specifica.status, 200);
    assert.equal(corpo.openapi, "3.1.0");
    assert.equal(corpo.info.version, "1.2.0");
    assert.ok(corpo.paths["/gare/attuale"]);
    assert.equal(
      corpo.components.schemas.AnalisiBase.properties.datiPerAnno.$ref,
      "#/components/schemas/DatiAnalisiPerAnno",
    );
    assert.equal(
      corpo.components.schemas.AnalisiBase.properties.notaBene.deprecated,
      true,
    );

    const documentazione = await fetch(`${baseUrl}/api/docs/`);
    assert.equal(documentazione.status, 200);
    assert.match(await documentazione.text(), /id="swagger-ui"/);
    assert.match(
      documentazione.headers.get("content-security-policy"),
      /default-src 'none'/,
    );
  });
});
