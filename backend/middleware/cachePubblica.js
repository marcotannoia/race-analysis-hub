const { createHash } = require("crypto");

function cachePubblica({
  secondiBrowser = 60,
  secondiCondivisi = 300,
  massimoVoci = 500,
} = {}) {
  const risposte = new Map();
  const richiesteInCorso = new Map();

  function chiaveCache(richiesta, risposta) {
    const parametri = Object.keys(richiesta.query);

    // L'assenza di `lingua` equivale esplicitamente all'italiano. Condividere
    // la stessa voce evita due elaborazioni identiche per i client che omettono
    // il valore predefinito e per quelli che inviano `?lingua=it`.
    if (
      parametri.length === 0 ||
      (parametri.length === 1 && parametri[0] === "lingua")
    ) {
      const lingua = risposta.locals.lingua || "it";
      return `${richiesta.baseUrl}${richiesta.path}?lingua=${lingua}`;
    }

    // Le richieste con query non previste restano separate: una voce lecita
    // non deve mai permettere di saltare la validazione dei parametri.
    return richiesta.originalUrl;
  }

  function leggiRisposta(chiave) {
    const voce = risposte.get(chiave);

    if (!voce) return null;

    if (voce.scadeIl <= Date.now()) {
      risposte.delete(chiave);
      return null;
    }

    // Reinserire la voce mantiene in fondo gli elementi usati più di recente.
    risposte.delete(chiave);
    risposte.set(chiave, voce);
    return voce;
  }

  function salvaRisposta(chiave, corpo) {
    while (risposte.size >= massimoVoci) {
      const chiaveMenoRecente = risposte.keys().next().value;
      risposte.delete(chiaveMenoRecente);
    }

    const serializzato = JSON.stringify(corpo);
    const hash = createHash("sha256").update(serializzato).digest("base64url");

    risposte.set(chiave, {
      corpo,
      etag: `W/"${Buffer.byteLength(serializzato).toString(16)}-${hash}"`,
      scadeIl: Date.now() + secondiCondivisi * 1000,
    });
  }

  function etagCorrisponde(richiesta, etag) {
    const condizione = richiesta.get("If-None-Match");
    if (!condizione) return false;
    if (condizione.trim() === "*") return true;

    const normalizza = (valore) => valore.trim().replace(/^W\//, "");
    const etagNormalizzato = normalizza(etag);
    return condizione
      .split(",")
      .some((candidato) => normalizza(candidato) === etagNormalizzato);
  }

  function inviaVoce(richiesta, risposta, voce, statoCache) {
    risposta.set("X-App-Cache", statoCache);
    risposta.set("ETag", voce.etag);

    if (etagCorrisponde(richiesta, voce.etag)) {
      return risposta.status(304).end();
    }

    return risposta.json(voce.corpo);
  }

  async function configuraCache(richiesta, risposta, next) {
    risposta.set(
      "Cache-Control",
      `public, max-age=${secondiBrowser}, s-maxage=${secondiCondivisi}, ` +
        `stale-while-revalidate=${secondiBrowser}`,
    );
    risposta.vary("Accept-Encoding");

    if (richiesta.method !== "GET" || richiesta.path === "/health") {
      return next();
    }

    const chiave = chiaveCache(richiesta, risposta);
    const voceInCache = leggiRisposta(chiave);

    if (voceInCache) {
      return inviaVoce(richiesta, risposta, voceInCache, "HIT");
    }

    const richiestaInCorso = richiesteInCorso.get(chiave);

    if (richiestaInCorso) {
      await richiestaInCorso;
      const voceCondivisa = leggiRisposta(chiave);

      if (voceCondivisa) {
        return inviaVoce(richiesta, risposta, voceCondivisa, "COALESCED");
      }
    }

    let completaRichiesta;
    const completamento = new Promise((risolvi) => {
      completaRichiesta = risolvi;
    });
    richiesteInCorso.set(chiave, completamento);

    const jsonOriginale = risposta.json.bind(risposta);
    risposta.json = function jsonConCache(corpo) {
      if (risposta.statusCode >= 200 && risposta.statusCode < 300) {
        salvaRisposta(chiave, corpo);
        const voce = leggiRisposta(chiave);
        risposta.set("ETag", voce.etag);

        if (etagCorrisponde(richiesta, voce.etag)) {
          risposta.status(304);
          return risposta.end();
        }
      } else {
        risposta.set("Cache-Control", "no-store");
      }

      return jsonOriginale(corpo);
    };

    risposta.set("X-App-Cache", "MISS");

    let completata = false;
    function termina() {
      if (completata) return;
      completata = true;

      if (richiesteInCorso.get(chiave) === completamento) {
        richiesteInCorso.delete(chiave);
      }

      completaRichiesta();
    }

    risposta.once("finish", termina);
    risposta.once("close", termina);
    return next();
  }

  configuraCache.svuota = () => {
    risposte.clear();
    richiesteInCorso.clear();
  };

  return configuraCache;
}

module.exports = cachePubblica;
