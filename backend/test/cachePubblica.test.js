const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cachePubblica = require("../middleware/cachePubblica");

async function conServer(app, funzione) {
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

test("la cache condivide una sola elaborazione tra richieste simultanee", async () => {
  const app = express();
  let elaborazioni = 0;

  app.use((richiesta, risposta, next) => {
    risposta.locals.lingua = richiesta.query.lingua || "it";
    next();
  });
  app.use(
    "/api/v1",
    cachePubblica({
      secondiBrowser: 60,
      secondiCondivisi: 300,
      massimoVoci: 50,
    }),
  );
  app.get("/api/v1/dati", async (richiesta, risposta) => {
    elaborazioni += 1;
    await new Promise((risolvi) => setTimeout(risolvi, 30));
    risposta.json({ lingua: risposta.locals.lingua, valore: 42 });
  });

  await conServer(app, async (baseUrl) => {
    const risposte = await Promise.all(
      Array.from({ length: 20 }, () =>
        fetch(`${baseUrl}/api/v1/dati?lingua=it`),
      ),
    );
    const corpi = await Promise.all(risposte.map((risposta) => risposta.json()));

    assert.equal(elaborazioni, 1);
    assert.ok(corpi.every((corpo) => corpo.valore === 42));
    assert.ok(
      risposte.every((risposta) =>
        ["MISS", "COALESCED", "HIT"].includes(
          risposta.headers.get("x-app-cache"),
        ),
      ),
    );

    const cacheIt = await fetch(`${baseUrl}/api/v1/dati?lingua=it`);
    assert.equal(cacheIt.headers.get("x-app-cache"), "HIT");

    const cacheEn = await fetch(`${baseUrl}/api/v1/dati?lingua=en`);
    assert.equal(cacheEn.headers.get("x-app-cache"), "MISS");
    assert.equal(elaborazioni, 2);

    const italianoPredefinito = await fetch(`${baseUrl}/api/v1/dati`);
    assert.equal(italianoPredefinito.headers.get("x-app-cache"), "HIT");
    assert.equal(elaborazioni, 2);
  });
});

test("la cache supporta la rivalidazione condizionale tramite ETag", async () => {
  const app = express();

  app.use((richiesta, risposta, next) => {
    risposta.locals.lingua = "it";
    next();
  });
  app.use("/api/v1", cachePubblica());
  app.get("/api/v1/dati", (richiesta, risposta) => {
    risposta.json({ valore: 42 });
  });

  await conServer(app, async (baseUrl) => {
    const prima = await fetch(`${baseUrl}/api/v1/dati`);
    const etag = prima.headers.get("etag");
    assert.ok(etag);

    const rivalidata = await fetch(`${baseUrl}/api/v1/dati`, {
      headers: { "If-None-Match": etag },
    });

    assert.equal(rivalidata.status, 304);
    assert.equal(await rivalidata.text(), "");
    assert.equal(rivalidata.headers.get("etag"), etag);
  });
});

test("la cache non conserva risposte di errore", async () => {
  const app = express();
  let elaborazioni = 0;

  app.use("/api/v1", cachePubblica());
  app.get("/api/v1/errore", (richiesta, risposta) => {
    elaborazioni += 1;
    risposta.status(503).json({ errore: true });
  });

  await conServer(app, async (baseUrl) => {
    const prima = await fetch(`${baseUrl}/api/v1/errore`);
    const seconda = await fetch(`${baseUrl}/api/v1/errore`);

    assert.equal(prima.headers.get("cache-control"), "no-store");
    assert.equal(seconda.headers.get("cache-control"), "no-store");
    assert.equal(elaborazioni, 2);
  });
});
