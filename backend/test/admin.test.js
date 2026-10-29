const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000";
const app = require("../app");

async function conServer(funzione) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try { await funzione(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((r) => server.close(r)); }
}

test("area admin: disattivata senza token e protetta con token", async () => {
  await conServer(async (base) => {
    delete process.env.ADMIN_TOKEN;
    assert.equal((await fetch(`${base}/api/admin/stato`)).status, 503);
    process.env.ADMIN_TOKEN = "token-di-prova-abbastanza-lungo";
    assert.equal((await fetch(`${base}/api/admin/stato`)).status, 401);
    const errato = await fetch(`${base}/api/admin/prossimo-gp`, { method: "POST", headers: { Authorization: "Bearer sbagliato" } });
    assert.equal(errato.status, 401);
    // Le API pubbliche restano in sola lettura.
    assert.equal((await fetch(`${base}/api/v1/home`, { method: "POST" })).status, 405);
    delete process.env.ADMIN_TOKEN;
  });
});
