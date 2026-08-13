const {
  normalizzaTestiAnnuali,
} = require("./normalizzaNotaBene");

function normalizzaTraduzioniAnalisi(traduzioni = {}) {
  return Object.fromEntries(
    Object.entries(traduzioni).map(([lingua, contenuti]) => [
      lingua,
      {
        posizioniStoriche: normalizzaTestiAnnuali(contenuti.risultatiGara),
        // I testi vuoti devono restare vuoti: il presentatore applica il
        // fallback nella lingua richiesta al momento della risposta.
        spiegazionePosizioni: normalizzaTestiAnnuali(contenuti.notaBene),
        qualificheStoriche: normalizzaTestiAnnuali(
          contenuti.risultatiQualifica,
        ),
        andamentoPerAnno: normalizzaTestiAnnuali(
          contenuti.andamentoPerAnno || "",
        ),
        passoGara: normalizzaTestiAnnuali(contenuti.passoGara),
        gomme: normalizzaTestiAnnuali(contenuti.gestioneGomme),
        considerazioni: contenuti.considerazioniFinali,
        penalita: contenuti.penalita || "",
        affidabilita: contenuti.affidabilita || "",
        aggiornamentiInArrivo: contenuti.aggiornamentiInArrivo || "",
      },
    ]),
  );
}

module.exports = { normalizzaTraduzioniAnalisi };
