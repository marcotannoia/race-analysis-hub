const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const documentoOpenApi = require("../docs/openapi");

const cartellaTemporanea = fs.mkdtempSync(
  path.join(os.tmpdir(), "race-analysis-hub-openapi-"),
);
const percorsoSpecifica = path.join(cartellaTemporanea, "openapi.json");

try {
  fs.writeFileSync(
    percorsoSpecifica,
    `${JSON.stringify(documentoOpenApi, null, 2)}\n`,
    "utf8",
  );

  const comando = process.platform === "win32" ? "redocly.cmd" : "redocly";
  const risultato = spawnSync(
    comando,
    ["lint", percorsoSpecifica, "--format=stylish"],
    { stdio: "inherit" },
  );

  if (risultato.error) throw risultato.error;
  process.exitCode = risultato.status ?? 1;
} finally {
  fs.rmSync(cartellaTemporanea, { recursive: true, force: true });
}
