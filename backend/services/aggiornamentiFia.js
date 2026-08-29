const { createHash } = require("crypto");
const DatiLiveFia = require("../models/DatiLiveFia");
const trovaGaraAttuale = require("./garaAttuale");
const cacheApiV1 = require("../middleware/cacheApiV1");
const { configurazioneEvento } = require("./profiliTecnici");

const DURATA_TIMEOUT_MS = 15000;
const DIMENSIONE_MASSIMA_HTML = 5 * 1024 * 1024;
const DIMENSIONE_MASSIMA_PDF = 25 * 1024 * 1024;
const INTERVALLO_CONTROLLO_MS = 5 * 60 * 1000;
const ORE = 60 * 60 * 1000;

const SCUDERIE = [
  { slug: "mclaren", nome: "McLaren", firme: ["mclarenmastercardf1team"] },
  {
    slug: "mercedes",
    nome: "Mercedes",
    firme: ["mercedesamgpetronasf1team"],
  },
  {
    slug: "red_bull",
    nome: "Red Bull",
    firme: ["oracleredbullracing"],
  },
  {
    slug: "ferrari",
    nome: "Ferrari",
    firme: ["scuderiaferrarihp", "scuderiaferrari", "ferrarihp"],
  },
  { slug: "williams", nome: "Williams", firme: ["williams"] },
  {
    slug: "rb",
    nome: "Racing Bulls",
    firme: ["visacashappracingbulls"],
  },
  {
    slug: "aston_martin",
    nome: "Aston Martin",
    firme: ["astonmartinaramcof1team", "astonmartinf1team"],
  },
  { slug: "haas", nome: "Haas", firme: ["tgrhaasf1team"] },
  { slug: "audi", nome: "Audi", firme: ["audirevolutf1team"] },
  { slug: "alpine", nome: "Alpine", firme: ["bwtalpinef1team"] },
  { slug: "cadillac", nome: "Cadillac", firme: ["cadillac"] },
];

function compattaTesto(testo) {
  return String(testo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pulisciTesto(testo) {
  return String(testo || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([(-])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function decodificaHtml(testo) {
  return String(testo || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ");
}

function dataPubblicazioneFia(valore) {
  const parti = String(valore || "").match(
    /(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/,
  );
  if (!parti) return null;

  const [, giorno, mese, anno, ore, minuti] = parti;
  return new Date(
    Date.UTC(2000 + Number(anno), Number(mese) - 1, Number(giorno), ore, minuti),
  );
}

function estraiDocumentiFia(html, paginaFia) {
  const documenti = [];
  const espressione =
    /<a\s+href="([^"]+\.pdf)"[\s\S]{0,1600}?<div\s+class="field-item even">([^<]+)<\/div>[\s\S]{0,800}?date-display-single[^>]*>([^<]+)/gi;

  for (const corrispondenza of String(html).matchAll(espressione)) {
    documenti.push({
      url: new URL(decodificaHtml(corrispondenza[1]), paginaFia).href,
      titolo: pulisciTesto(decodificaHtml(corrispondenza[2])),
      pubblicatoIl: dataPubblicazioneFia(corrispondenza[3]),
    });
  }

  return documenti;
}

function dominioFia(url) {
  const host = new URL(url).hostname.toLowerCase();
  return host === "fia.com" || host.endsWith(".fia.com");
}

async function scarica(url, dimensioneMassima) {
  if (!dominioFia(url)) {
    throw new Error("URL esterno al dominio FIA");
  }

  const controllo = new AbortController();
  const timeout = setTimeout(() => controllo.abort(), DURATA_TIMEOUT_MS);
  timeout.unref();

  try {
    const risposta = await fetch(url, {
      headers: { Accept: "text/html,application/pdf" },
      redirect: "follow",
      signal: controllo.signal,
    });

    if (!risposta.ok) {
      throw new Error(`FIA ha risposto con HTTP ${risposta.status}`);
    }
    if (!dominioFia(risposta.url)) {
      throw new Error("Reindirizzamento esterno al dominio FIA");
    }

    const lunghezza = Number(risposta.headers.get("content-length"));
    if (lunghezza && lunghezza > dimensioneMassima) {
      throw new Error("Documento FIA oltre il limite di dimensione");
    }

    const corpo = Buffer.from(await risposta.arrayBuffer());
    if (corpo.length > dimensioneMassima) {
      throw new Error("Documento FIA oltre il limite di dimensione");
    }

    return corpo;
  } finally {
    clearTimeout(timeout);
  }
}

function unisciElementi(elementi) {
  const ordinati = [...elementi].sort((primo, secondo) => primo.x - secondo.x);
  let risultato = "";
  let finePrecedente = null;

  for (const elemento of ordinati) {
    const testo = elemento.testo.trim();
    if (!testo) continue;

    const distanza = finePrecedente === null ? 0 : elemento.x - finePrecedente;
    const separatore =
      risultato && distanza > 1.5 && !/^[,.;:!?)]/.test(testo) ? " " : "";
    risultato += `${separatore}${testo}`;
    finePrecedente = elemento.x + elemento.larghezza;
  }

  return pulisciTesto(risultato);
}

function raggruppaRighe(elementi) {
  const righe = [];

  for (const elemento of [...elementi].sort(
    (primo, secondo) => secondo.y - primo.y || primo.x - secondo.x,
  )) {
    let riga = righe.find((voce) => Math.abs(voce.y - elemento.y) <= 1.5);

    if (!riga) {
      riga = { y: elemento.y, elementi: [] };
      righe.push(riga);
    }
    riga.elementi.push(elemento);
  }

  return righe
    .sort((prima, seconda) => seconda.y - prima.y)
    .map((riga) => ({ ...riga, testo: unisciElementi(riga.elementi) }));
}

function trovaScuderia(elementi) {
  const intestazione = compattaTesto(
    elementi
      .filter((elemento) => elemento.y >= 445)
      .map((elemento) => elemento.testo)
      .join(" "),
  );

  return SCUDERIE.find((scuderia) =>
    scuderia.firme.some((firma) => intestazione.includes(firma)),
  );
}

function righeAggiornamento(elementi) {
  const marcatori = elementi
    .filter(
      (elemento) =>
        elemento.x >= 70 &&
        elemento.x < 100 &&
        elemento.y < 420 &&
        /^\d{1,2}$/.test(elemento.testo.trim()),
    )
    .sort((primo, secondo) => secondo.y - primo.y);

  return marcatori.map((marcatore, indice) => {
    const limiteSuperiore = Math.min(
      marcatore.y + 20,
      indice === 0 ? 420 : (marcatori[indice - 1].y + marcatore.y) / 2,
    );
    const limiteInferiore =
      indice === marcatori.length - 1
        ? 0
        : (marcatore.y + marcatori[indice + 1].y) / 2;
    const nellaRiga = (elemento) =>
      elemento.y <= limiteSuperiore && elemento.y > limiteInferiore;
    const componente = raggruppaRighe(
      elementi.filter(
        (elemento) => nellaRiga(elemento) && elemento.x >= 100 && elemento.x < 180,
      ),
    )
      .map((riga) => riga.testo)
      .join(" ");
    const descrizione = raggruppaRighe(
      elementi.filter((elemento) => nellaRiga(elemento) && elemento.x >= 525),
    )
      .map((riga) => riga.testo)
      .join(" ");

    return {
      numero: Number(marcatore.testo),
      componente: pulisciTesto(componente),
      descrizione: pulisciTesto(descrizione),
    };
  });
}

function estraiAggiornamentiDaPagine(pagine) {
  const risultati = new Map();
  let scuderiaCorrente = null;

  for (const pagina of pagine) {
    const elementi = pagina.elementi || [];
    const rilevata = trovaScuderia(elementi);
    if (rilevata) scuderiaCorrente = rilevata;
    if (!scuderiaCorrente || !elementi.length) continue;

    const testoPagina = raggruppaRighe(elementi)
      .map((riga) => riga.testo)
      .join(" ");
    const nessunAggiornamento = /\bno\s+updates?\b/i.test(testoPagina);
    const righe = righeAggiornamento(elementi);

    if (!nessunAggiornamento && !righe.length) continue;

    const precedente = risultati.get(scuderiaCorrente.slug) || {
      slug: scuderiaCorrente.slug,
      nomeFia: scuderiaCorrente.nome,
      nessunAggiornamento: false,
      componenti: [],
      descrizioni: [],
    };

    precedente.nessunAggiornamento =
      precedente.nessunAggiornamento || nessunAggiornamento;
    for (const riga of righe) {
      if (riga.componente && !precedente.componenti.includes(riga.componente)) {
        precedente.componenti.push(riga.componente);
      }
      if (riga.descrizione) {
        precedente.descrizioni.push(
          riga.componente
            ? `${riga.componente}: ${riga.descrizione}`
            : riga.descrizione,
        );
      }
    }
    risultati.set(scuderiaCorrente.slug, precedente);
  }

  const mancanti = SCUDERIE.filter((scuderia) => !risultati.has(scuderia.slug));
  if (mancanti.length) {
    throw new Error(
      `Documento FIA incompleto: ${mancanti.map((voce) => voce.nome).join(", ")}`,
    );
  }

  return SCUDERIE.map((scuderia) => {
    const risultato = risultati.get(scuderia.slug);
    return {
      slug: risultato.slug,
      nomeFia: risultato.nomeFia,
      nessunAggiornamento: risultato.nessunAggiornamento,
      componenti: risultato.componenti,
      descrizione: [...new Set(risultato.descrizioni)].join("\n"),
    };
  });
}

async function estraiPaginePdf(buffer) {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Il documento FIA non e un PDF valido");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const documento = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
  }).promise;
  const pagine = [];

  try {
    for (let numero = 1; numero <= documento.numPages; numero += 1) {
      const pagina = await documento.getPage(numero);
      const contenuto = await pagina.getTextContent();
      pagine.push({
        numero,
        elementi: contenuto.items
          .filter((elemento) => elemento.str?.trim())
          .map((elemento) => ({
            testo: elemento.str,
            x: elemento.transform[4],
            y: elemento.transform[5],
            larghezza: elemento.width || 0,
          })),
      });
    }
  } finally {
    await documento.destroy();
  }

  return pagine;
}

function estraiDatiCircuitoDaTesto(testo) {
  const zone = [
    ...String(testo).matchAll(/\bZONE\s+([A-Z]\d+)\b/gi),
  ].map((corrispondenza) => corrispondenza[1].toUpperCase());

  return {
    zoneStraightMode: new Set(zone).size,
    rilevamentiOvertakeMode: /\bOVERTAKE\s+DETECTION\b/i.test(testo) ? 1 : 0,
  };
}

async function preparaDocumento(documento, tipo) {
  const buffer = await scarica(documento.url, DIMENSIONE_MASSIMA_PDF);
  const pagine = await estraiPaginePdf(buffer);
  const base = {
    documentoUrl: documento.url,
    pubblicatoIl: documento.pubblicatoIl,
    acquisitoIl: new Date(),
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };

  if (tipo === "aggiornamenti") {
    return {
      ...base,
      scuderie: estraiAggiornamentiDaPagine(pagine),
    };
  }

  const testo = pagine
    .flatMap((pagina) => pagina.elementi.map((elemento) => elemento.testo))
    .join(" ");
  return { ...base, ...estraiDatiCircuitoDaTesto(testo) };
}

function finestraAttiva(adesso, fp1At, orePrima) {
  const tempo = adesso.getTime();
  return tempo >= fp1At.getTime() - orePrima * ORE && tempo <= fp1At.getTime() + 6 * ORE;
}

async function salvaErrore(garaSlug, errore) {
  await DatiLiveFia.findOneAndUpdate(
    { garaSlug },
    {
      $set: {
        ultimoControlloIl: new Date(),
        ultimoErrore: String(errore.message || errore).slice(0, 500),
      },
      $setOnInsert: { garaSlug },
    },
    { upsert: true },
  );
}

async function sincronizzaAggiornamentiFia({ adesso = new Date(), gara } = {}) {
  const garaAttiva = gara || (await trovaGaraAttuale());
  if (!garaAttiva) return { stato: "nessuna_gara" };

  const configurazione = configurazioneEvento(garaAttiva.slug);
  if (!configurazione) return { stato: "gara_non_configurata" };

  const controllaCircuito = finestraAttiva(adesso, configurazione.fp1At, 72);
  const controllaAggiornamenti = finestraAttiva(adesso, configurazione.fp1At, 12);
  if (!controllaCircuito && !controllaAggiornamenti) {
    return { stato: "fuori_finestra" };
  }

  try {
    const html = (
      await scarica(configurazione.paginaFia, DIMENSIONE_MASSIMA_HTML)
    ).toString("utf8");
    const documenti = estraiDocumentiFia(html, configurazione.paginaFia);
    const esistente = await DatiLiveFia.findOne({ garaSlug: garaAttiva.slug }).lean();
    const aggiornamento = {
      ultimoControlloIl: new Date(),
      ultimoErrore: "",
    };

    const documentoCircuito = documenti.find((documento) =>
      /circuit map.*pit lane drawing/i.test(documento.titolo),
    );
    if (
      controllaCircuito &&
      documentoCircuito &&
      documentoCircuito.url !== esistente?.circuito?.documentoUrl
    ) {
      aggiornamento.circuito = await preparaDocumento(
        documentoCircuito,
        "circuito",
      );
    }

    const documentoAggiornamenti = documenti.find((documento) =>
      /car presentation submissions/i.test(documento.titolo),
    );
    if (
      controllaAggiornamenti &&
      documentoAggiornamenti &&
      documentoAggiornamenti.url !== esistente?.aggiornamenti?.documentoUrl
    ) {
      aggiornamento.aggiornamenti = await preparaDocumento(
        documentoAggiornamenti,
        "aggiornamenti",
      );
    }

    await DatiLiveFia.findOneAndUpdate(
      { garaSlug: garaAttiva.slug },
      { $set: aggiornamento, $setOnInsert: { garaSlug: garaAttiva.slug } },
      { upsert: true },
    );

    if (aggiornamento.circuito || aggiornamento.aggiornamenti) {
      cacheApiV1.svuota();
    }

    return {
      stato:
        aggiornamento.circuito || aggiornamento.aggiornamenti
          ? "aggiornato"
          : "in_attesa",
      circuito: Boolean(aggiornamento.circuito),
      aggiornamenti: Boolean(aggiornamento.aggiornamenti),
    };
  } catch (errore) {
    await salvaErrore(garaAttiva.slug, errore);
    throw errore;
  }
}

function avviaMonitorAggiornamentiFia() {
  let controlloInCorso = false;

  async function controlla() {
    if (controlloInCorso) return;
    controlloInCorso = true;
    try {
      const esito = await sincronizzaAggiornamentiFia();
      if (esito.stato === "aggiornato") {
        console.log("Documenti FIA ufficiali acquisiti", esito);
      }
    } catch (errore) {
      console.error("Controllo documenti FIA fallito:", errore.message);
    } finally {
      controlloInCorso = false;
    }
  }

  void controlla();
  const intervallo = setInterval(controlla, INTERVALLO_CONTROLLO_MS);
  intervallo.unref();
  return () => clearInterval(intervallo);
}

module.exports = {
  avviaMonitorAggiornamentiFia,
  estraiAggiornamentiDaPagine,
  estraiDatiCircuitoDaTesto,
  estraiDocumentiFia,
  estraiPaginePdf,
  sincronizzaAggiornamentiFia,
};
