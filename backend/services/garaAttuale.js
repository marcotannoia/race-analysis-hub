const { Gara } = require("../repositories/modelli");

async function trovaGaraAttuale() {
  const garaAttuale = await Gara.findOne({ stato: "attuale" })
    .sort({ ordineAnalisi: 1 })
    .lean();

  if (garaAttuale) {
    return { ...garaAttuale, stato: "attuale" };
  }

  // Compatibilita temporanea con database creati prima dell'introduzione
  // dello stato "attuale". Non viene mai usata una gara genericamente futura.
  const garaConStatoPrecedente = await Gara.findOne({ stato: "prossima" })
    .sort({ ordineAnalisi: 1 })
    .lean();

  return garaConStatoPrecedente
    ? { ...garaConStatoPrecedente, stato: "attuale" }
    : null;
}

module.exports = trovaGaraAttuale;
