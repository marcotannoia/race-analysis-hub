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
    assert.equal(corpo.versione, "1.9.0");
    assert.equal(corpo.linguaPredefinita, "it");
    assert.equal(corpo.lingueSupportate.length, 6);
    assert.equal(corpo.endpoint.lingue, "/api/v1/lingue");
    assert.equal(
      corpo.endpoint.classificaPrevisionale,
      "/api/v1/previsioni/piloti",
    );
    assert.equal(corpo.documentazione, "/api/docs");
    assert.deepEqual(corpo.attribuzioneDati, {
      nome: "F1DB",
      url: "https://github.com/f1db/f1db/releases/tag/v2026.11.0",
      licenza: "CC BY 4.0",
      licenzaUrl: "https://creativecommons.org/licenses/by/4.0/",
      versione: "v2026.11.0",
      modifiche:
        "Sottoinsieme F1DB filtrato, rinominato e normalizzato; il GP d'Olanda 2026 è integrato dai risultati ufficiali Formula 1. Nessun risultato sportivo è stato stimato.",
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

    const lingua = await fetch(`${baseUrl}/api/v1?lingua=nl`);
    const linguaCorpo = await lingua.json();
    assert.equal(lingua.status, 400);
    assert.equal(linguaCorpo.errore.codice, "LINGUA_NON_SUPPORTATA");
  });
});

test("l'API v1 espone e seleziona le sei lingue", async () => {
  await conServer(async (baseUrl) => {
    const elenco = await fetch(`${baseUrl}/api/v1/lingue`);
    const corpoElenco = await elenco.json();
    assert.equal(elenco.status, 200);
    assert.equal(corpoElenco.linguaPredefinita, "it");
    assert.deepEqual(
      corpoElenco.lingue.map((lingua) => lingua.codice),
      ["it", "en", "fr", "pt", "es", "de"],
    );

    const francese = await fetch(`${baseUrl}/api/v1?lingua=fr`);
    const corpoFrancese = await francese.json();
    assert.equal(francese.status, 200);
    assert.equal(corpoFrancese.lingua, "fr");
    assert.equal(francese.headers.get("content-language"), "fr");
  });
});

test("l'API v1 localizza anche i messaggi di errore", async () => {
  await conServer(async (baseUrl) => {
    const metodo = await fetch(`${baseUrl}/api/v1/piloti?lingua=de`, {
      method: "POST",
    });
    const corpoMetodo = await metodo.json();
    assert.equal(metodo.status, 405);
    assert.equal(metodo.headers.get("content-language"), "de");
    assert.equal(
      corpoMetodo.errore.messaggio,
      "Diese öffentliche API erlaubt ausschließlich Lesezugriffe",
    );

    const query = await fetch(`${baseUrl}/api/v1?lingua=fr&pagina=2`);
    const corpoQuery = await query.json();
    assert.equal(query.status, 400);
    assert.equal(
      corpoQuery.errore.messaggio,
      "Paramètres de requête non pris en charge : pagina",
    );
  });
});

test("specifica OpenAPI e documentazione Swagger sono pubbliche", async () => {
  await conServer(async (baseUrl) => {
    const specifica = await fetch(`${baseUrl}/api/v1/openapi.json`);
    const corpo = await specifica.json();
    assert.equal(specifica.status, 200);
    assert.equal(corpo.openapi, "3.1.0");
    assert.equal(corpo.info.version, "1.9.0");
    assert.ok(corpo.paths["/lingue"]);
    assert.ok(corpo.paths["/gare/attuale"]);
    assert.ok(corpo.paths["/previsioni/piloti"]);
    assert.equal(
      corpo.components.schemas.Home.properties.classificaPrevisionale.$ref,
      "#/components/schemas/ClassificaPrevisionale",
    );
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
