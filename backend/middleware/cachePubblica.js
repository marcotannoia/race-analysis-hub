function cachePubblica({
  secondiBrowser = 60,
  secondiCondivisi = 300,
  massimoVoci = 500,
} = {}) {
  const risposte = new Map();
  const richiesteInCorso = new Map();

  function chiaveCache(richiesta) {
    // L'URL completo mantiene separate anche le richieste non valide: una voce
    // lecita non deve mai permettere di saltare la validazione delle query.
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
    return voce.corpo;
  }

  function salvaRisposta(chiave, corpo) {
    while (risposte.size >= massimoVoci) {
      const chiaveMenoRecente = risposte.keys().next().value;
      risposte.delete(chiaveMenoRecente);
    }

    risposte.set(chiave, {
      corpo,
      scadeIl: Date.now() + secondiCondivisi * 1000,
    });
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

    const chiave = chiaveCache(richiesta);
    const corpoInCache = leggiRisposta(chiave);

    if (corpoInCache) {
      risposta.set("X-App-Cache", "HIT");
      return risposta.json(corpoInCache);
    }

    const richiestaInCorso = richiesteInCorso.get(chiave);

    if (richiestaInCorso) {
      await richiestaInCorso;
      const corpoCondiviso = leggiRisposta(chiave);

      if (corpoCondiviso) {
        risposta.set("X-App-Cache", "COALESCED");
        return risposta.json(corpoCondiviso);
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
