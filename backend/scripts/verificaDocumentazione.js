const fs = require("fs");
const path = require("path");
const documentoOpenApi = require("../docs/openapi");

const radice = path.resolve(__dirname, "../..");
const documenti = [
  "README.md",
  "API.md",
  "CHANGELOG.md",
  "DEPLOYMENT.md",
  "LICENSE.md",
  "LOCALIZZAZIONE.md",
  "NOTICE.md",
  "SECURITY.md",
  "fix-frontend.md",
  "post-gp.md",
  "frontend/README.md",
];
const errori = [];

function leggi(percorsoRelativo) {
  const percorso = path.join(radice, percorsoRelativo);
  if (!fs.existsSync(percorso)) {
    errori.push(`documento mancante: ${percorsoRelativo}`);
    return "";
  }
  return fs.readFileSync(percorso, "utf8");
}

const pacchetti = [
  "package.json",
  "backend/package.json",
  "frontend/package.json",
].map((percorso) => ({
  percorso,
  dati: JSON.parse(leggi(percorso)),
}));
const versione = pacchetti[0].dati.version;

for (const pacchetto of pacchetti.slice(1)) {
  if (pacchetto.dati.version !== versione) {
    errori.push(
      `versione non allineata in ${pacchetto.percorso}: ${pacchetto.dati.version}`,
    );
  }
}

for (const documento of [
  "README.md",
  "API.md",
  "SECURITY.md",
  "DEPLOYMENT.md",
]) {
  if (!leggi(documento).includes(`\`${versione}\``)) {
    errori.push(`${documento} non dichiara la versione corrente ${versione}`);
  }
}

for (const documento of documenti) {
  const contenuto = leggi(documento);
  const collegamenti = contenuto.matchAll(/\[[^\]]*\]\(([^)]+)\)/g);

  for (const corrispondenza of collegamenti) {
    const destinazione = corrispondenza[1].trim().replace(/^<|>$/g, "");
    if (
      destinazione.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(destinazione)
    ) {
      continue;
    }

    const file = decodeURIComponent(destinazione.split("#", 1)[0]);
    const percorso = path.resolve(radice, path.dirname(documento), file);
    if (!fs.existsSync(percorso)) {
      errori.push(`${documento}: collegamento locale non trovato: ${destinazione}`);
    }
  }
}

const guidaApi = leggi("API.md");
const endpointAttesi = Object.keys(documentoOpenApi.paths)
  .map((percorso) => (percorso === "/" ? "/api/v1" : `/api/v1${percorso}`))
  .sort();
const endpointDocumentati = [
  ...guidaApi.matchAll(/\| `GET` \| `([^`]+)` \|/g),
]
  .map((corrispondenza) => corrispondenza[1])
  .sort();

if (JSON.stringify(endpointDocumentati) !== JSON.stringify(endpointAttesi)) {
  errori.push(
    `API.md documenta endpoint diversi da OpenAPI: attesi ${endpointAttesi.length}, trovati ${endpointDocumentati.length}`,
  );
}

if (errori.length > 0) {
  console.error(`Documentazione non valida (${errori.length} problemi):`);
  errori.forEach((errore) => console.error(`- ${errore}`));
  process.exitCode = 1;
} else {
  console.log(
    `OK documentazione: ${documenti.length} file, ${Object.keys(documentoOpenApi.paths).length} endpoint e versione ${versione} allineati.`,
  );
}
