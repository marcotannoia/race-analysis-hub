const { createHash } = require("crypto");
const DatiLiveFia = require("../models/DatiLiveFia");
const trovaGaraAttuale = require("./garaAttuale");
const { configurazioneEvento } = require("./profiliTecnici");
const { estraiPaginePdf } = require("./aggiornamentiFia");
const cacheApiV1 = require("../middleware/cacheApiV1");

const PAGINA_DOCUMENTI = "https://www.fia.com/documents/season/season-2026-2072/championships/fia-formula-one-world-championship-14";
const INTERVALLO_MS = 5 * 60 * 1000;
const ORA_MS = 60 * 60 * 1000;
const PARTENZE_2026 = Object.freeze({
  "singapore-marina-bay": "2026-10-11T12:00:00Z",
  "usa-austin": "2026-10-25T20:00:00Z",
  "messico-citta-del-messico": "2026-11-01T20:00:00Z",
  "brasile-interlagos": "2026-11-08T17:00:00Z",
  "usa-las-vegas": "2026-11-22T04:00:00Z",
  "qatar-lusail": "2026-11-29T16:00:00Z",
  "abu-dhabi-yas-marina": "2026-12-06T13:00:00Z",
});

function estraiDecisioniEvento(html, nomeEvento) {
  const sezioni = String(html).split(/<div class="event-title[^"]*">/i);
  const sezione = sezioni.find((parte) => {
    const nome = parte.match(/^([^<]+)<\/div>/)?.[1]?.trim();
    return nome === nomeEvento;
  });
  if (!sezione) return null;

  const righe = [...sezione.matchAll(/<li class="document-row[^"]*">([\s\S]*?)<\/li>/gi)];
  if (!righe.length) return null;
  const documenti = [];
  for (const riga of righe) {
    const href = riga[1].match(/<a\s+href="([^"]+\.pdf)"/i)?.[1];
    const titolo = riga[1].match(/<div class="title">([\s\S]*?)<\/div>/i)?.[1]
      ?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!href || !/^Doc \d+ - (?:Infringement|Decision) - Car \d+\b/i.test(titolo || "")) continue;
    documenti.push({ url: new URL(href, PAGINA_DOCUMENTI).href, titolo });
  }
  return documenti;
}

function estraiPenalitaGriglia(testo, documentoUrl) {
  const contenuto = String(testo).replace(/\s+/g, " ");
  const pilota = contenuto.match(/\bNo\s*\/\s*Driver\s+(\d{1,2})\s*-/i);
  if (!pilota) return null;
  const decisione = contenuto.slice(pilota.index).match(/\bDecision\s+(.+?)\s+\bReason\b/i)?.[1];
  if (!decisione) return null;
  if (/\bnext Sprint (?:session|Race)\b/i.test(decisione)) return null;

  const posizioni = decisione.match(/\bDrop of\s+(\d{1,2})\s+grid positions\b/i);
  const partenzaPitLane = /\bstart(?:ing)? (?:the Race )?from (?:the )?pit lane\b/i.test(decisione);
  if (!posizioni && !partenzaPitLane) return null;
  return {
    numeroVettura: Number(pilota[1]),
    posizioni: posizioni ? Number(posizioni[1]) : null,
    partenzaPitLane,
    documentoUrl,
  };
}

async function scaricaFia(url, limiteBytes) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "www.fia.com") {
    throw new Error("Documento FIA con URL non consentito");
  }
  const risposta = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!risposta.ok || new URL(risposta.url).hostname !== "www.fia.com") {
    throw new Error(`Documenti FIA non disponibili: HTTP ${risposta.status}`);
  }
  const dimensione = Number(risposta.headers.get("content-length"));
  if (dimensione > limiteBytes) throw new Error("Documento FIA troppo grande");
  const buffer = Buffer.from(await risposta.arrayBuffer());
  if (buffer.length > limiteBytes) throw new Error("Documento FIA troppo grande");
  return buffer;
}

async function sincronizzaPenalitaFia({
  adesso = new Date(), gara,
  scaricaDocumento = scaricaFia,
  estraiPagine = estraiPaginePdf,
  archivio = DatiLiveFia,
  svuotaCache = cacheApiV1.svuota,
} = {}) {
  const garaAttuale = gara || await trovaGaraAttuale();
  const configurazione = garaAttuale && configurazioneEvento(garaAttuale.slug);
  const partenza = garaAttuale && PARTENZE_2026[garaAttuale.slug];
  if (!configurazione || !partenza) return { stato: "gara_non_configurata" };
  const tempo = adesso.getTime();
  const fp1 = configurazione.fp1At.getTime();
  if (tempo < fp1 - 72 * ORA_MS || tempo >= Date.parse(partenza)) {
    return { stato: "fuori_finestra" };
  }

  const html = (await scaricaDocumento(PAGINA_DOCUMENTI, 5 * 1024 * 1024)).toString("utf8");
  const documenti = estraiDecisioniEvento(html, configurazione.eventoFia);
  if (!documenti) return { stato: "documenti_non_ancora_disponibili" };
  const precedenti = await archivio.findOne({ garaSlug: garaAttuale.slug }).lean();
  const urlAttuali = new Set(documenti.map((documento) => documento.url));
  const esaminati = new Set((precedenti?.decisioniEsaminate || []).filter((url) => urlAttuali.has(url)));
  const penalita = (precedenti?.penalitaGriglia || []).filter((voce) => urlAttuali.has(voce.documentoUrl));

  for (const documento of documenti) {
    if (esaminati.has(documento.url)) continue;
    const pdf = await scaricaDocumento(documento.url, 25 * 1024 * 1024);
    const pagine = await estraiPagine(pdf);
    const testo = pagine.flatMap((pagina) => pagina.elementi.map((elemento) => elemento.testo)).join(" ");
    const rilevata = estraiPenalitaGriglia(testo, documento.url);
    if (rilevata) penalita.push({ ...rilevata, sha256: createHash("sha256").update(pdf).digest("hex") });
    esaminati.add(documento.url);
  }

  const cambiate = JSON.stringify(penalita) !== JSON.stringify(precedenti?.penalitaGriglia || []);
  await archivio.findOneAndUpdate(
    { garaSlug: garaAttuale.slug },
    { $set: { decisioniEsaminate: [...esaminati], penalitaGriglia: penalita, ultimoControlloPenalitaIl: adesso },
      $setOnInsert: { garaSlug: garaAttuale.slug } },
    { upsert: true },
  );
  if (cambiate) svuotaCache();
  return { stato: cambiate ? "aggiornato" : "in_attesa", penalita: penalita.length };
}

function avviaMonitorPenalitaFia() {
  let inCorso = false;
  async function controlla() {
    if (inCorso) return;
    inCorso = true;
    try { await sincronizzaPenalitaFia(); }
    catch (errore) { console.error("Controllo penalità FIA fallito:", errore.message); }
    finally { inCorso = false; }
  }
  void controlla();
  const timer = setInterval(controlla, INTERVALLO_MS);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = { avviaMonitorPenalitaFia, estraiDecisioniEvento, estraiPenalitaGriglia, sincronizzaPenalitaFia };
