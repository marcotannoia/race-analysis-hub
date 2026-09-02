const { messaggioErrore } = require("../i18n/lingue");

function convalidaQuery(...parametriPermessi) {
  const permessi = new Set(parametriPermessi);

  return function convalida(richiesta, risposta, next) {
    const nonPermessi = Object.keys(richiesta.query).filter(
      (parametro) => !permessi.has(parametro),
    );

    if (nonPermessi.length > 0) {
      return risposta.status(400).set("Cache-Control", "no-store").json({
        errore: {
          codice: "PARAMETRO_QUERY_NON_VALIDO",
          messaggio: messaggioErrore(
            "PARAMETRO_QUERY_NON_VALIDO",
            risposta.locals.lingua,
            { parametri: nonPermessi.join(", ") },
          ),
          requestId: risposta.locals.requestId,
        },
      });
    }

    next();
  };
}

module.exports = convalidaQuery;
