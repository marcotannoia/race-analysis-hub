const ETICHETTE_GARE = Object.freeze({
  Cina: { en: "China", fr: "Chine", pt: "China", es: "China", de: "China" },
  Giappone: {
    en: "Japan",
    fr: "Japon",
    pt: "Japão",
    es: "Japón",
    de: "Japan",
  },
  Barcellona: {
    en: "Barcelona",
    fr: "Barcelone",
    pt: "Barcelona",
    es: "Barcelona",
    de: "Barcelona",
  },
  Ungheria: {
    en: "Hungary",
    fr: "Hongrie",
    pt: "Hungria",
    es: "Hungría",
    de: "Ungarn",
  },
});

const MODIFICHE_F1DB = Object.freeze({
  en: "Subset filtered, renamed and normalized by Race Analysis Hub; no sporting result was estimated.",
  fr: "Sous-ensemble filtré, renommé et normalisé par Race Analysis Hub ; aucun résultat sportif n'a été estimé.",
  pt: "Subconjunto filtrado, renomeado e normalizado pelo Race Analysis Hub; nenhum resultado desportivo foi estimado.",
  es: "Subconjunto filtrado, renombrado y normalizado por Race Analysis Hub; no se ha estimado ningún resultado deportivo.",
  de: "Von Race Analysis Hub gefilterte, umbenannte und normalisierte Teilmenge; es wurden keine Sportergebnisse geschätzt.",
});

function localizzaEtichettaGara(etichetta, lingua = "it") {
  return ETICHETTE_GARE[etichetta]?.[lingua] || etichetta;
}

function localizzaModificheF1db(testo, lingua = "it") {
  if (lingua === "it") return testo;
  return MODIFICHE_F1DB[lingua] || testo;
}

module.exports = { localizzaEtichettaGara, localizzaModificheF1db };
