const NOTA_PREDEFINITA = "Nessun evento particolare da trattare";

function normalizzaTestiAnnuali(valore, testoPredefinito = "") {
  if (valore instanceof Map) valore = Object.fromEntries(valore);

  if (typeof valore === "string") {
    const contenuti = {};
    const espressione = /(?:^|\r?\n)(\d{4})\s*:\s*([\s\S]*?)(?=\r?\n\d{4}\s*:|$)/g;

    for (const corrispondenza of valore.matchAll(espressione)) {
      contenuti[corrispondenza[1]] =
        corrispondenza[2].trim() || testoPredefinito;
    }

    if (Object.keys(contenuti).length || !valore.trim()) return contenuti;

    return { generale: valore.trim() };
  }

  if (!valore || Array.isArray(valore) || typeof valore !== "object") {
    throw new TypeError(
      "Il contenuto deve essere una stringa o un oggetto diviso per anno",
    );
  }

  return Object.fromEntries(
    Object.entries(valore)
      .map(([anno, testo]) => {
        if (!/^\d{4}$/.test(anno) && anno !== "generale") {
          throw new TypeError(`Anno non valido: ${anno}`);
        }

        return [anno, String(testo || "").trim() || testoPredefinito];
      })
      .sort(([primoAnno], [secondoAnno]) => {
        if (primoAnno === "generale") return 1;
        if (secondoAnno === "generale") return -1;
        return Number(primoAnno) - Number(secondoAnno);
      }),
  );
}

function normalizzaNotaBene(notaBene, testoPredefinito = NOTA_PREDEFINITA) {
  return normalizzaTestiAnnuali(notaBene, testoPredefinito);
}

module.exports = {
  NOTA_PREDEFINITA,
  normalizzaNotaBene,
  normalizzaTestiAnnuali,
};
