const { messaggioErrore } = require("../i18n/lingue");

function inviaErrore(risposta, stato, codice, messaggio, valori = {}) {
  const lingua = risposta.locals?.lingua;
  const messaggioFinale = lingua
    ? messaggioErrore(codice, lingua, valori)
    : messaggio;

  return risposta.status(stato).json({
    errore: {
      codice,
      messaggio: messaggioFinale,
      requestId: risposta.locals.requestId,
    },
  });
}

module.exports = { inviaErrore };
