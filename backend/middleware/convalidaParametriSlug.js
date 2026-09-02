const { messaggioErrore } = require("../i18n/lingue");

const FORMATO_SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

function convalidaParametriSlug(...nomiParametri) {
  return function convalida(richiesta, risposta, next) {
    for (const nome of nomiParametri) {
      const valore = richiesta.params[nome];

      if (!valore || valore.length > 80 || !FORMATO_SLUG.test(valore)) {
        return risposta.status(400).set("Cache-Control", "no-store").json({
          errore: {
            codice: "IDENTIFICATORE_NON_VALIDO",
            messaggio: messaggioErrore(
              "IDENTIFICATORE_NON_VALIDO",
              risposta.locals.lingua,
              { parametro: nome },
            ),
            requestId: risposta.locals.requestId,
          },
        });
      }
    }

    next();
  };
}

module.exports = convalidaParametriSlug;
