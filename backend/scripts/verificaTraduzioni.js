const dati = require("../data/dati-iniziali.json");

const LINGUE = ["it", "en", "fr", "pt", "es", "de"];
const CAMPI_LOCALIZZABILI = {
  piloti: ["nazionalita"],
  scuderie: ["nazionalita"],
  gare: [
    "nome",
    "circuito",
    "paese",
    "etichettaExcel",
    "contestoStorico",
    "pilotiFavoriti",
    "scuderieFavorite",
    "outsider",
    "potenzialiDifficolta",
    "gommeStrategia",
    "rischi",
    "confidenza",
  ],
  analisiGare: [
    "risultatiGara",
    "notaBene",
    "andamentoPerAnno",
    "risultatiQualifica",
    "passoGara",
    "gestioneGomme",
    "considerazioniFinali",
    "affidabilita",
    "aggiornamentiInArrivo",
    "penalita",
  ],
  analisiScuderie: [
    "risultatiGara",
    "notaBene",
    "andamentoPerAnno",
    "risultatiQualifica",
    "passoGara",
    "gestioneGomme",
    "considerazioniFinali",
    "affidabilita",
    "aggiornamentiInArrivo",
  ],
};

const { verificaProfiliTecnici } = require("../i18n/verificaProfiliTecnici");
const errori = verificaProfiliTecnici();
let campiVerificati = 0;
let stringheVerificate = 0;
const CODICI_SPORTIVI = new Set([
  ...dati.piloti.map((pilota) => pilota.codice),
  ...dati.scuderie.map((scuderia) => scuderia.abbreviazione),
  "DNF",
  "DNS",
  "DSQ",
  "NC",
  "F1",
  "FIA",
  "DRS",
  "VSC",
  "RIC",
  "ZHO",
  "MAG",
  "SAR",
  "TSU",
  "DEV",
  "DOO",
]);
const NOMI_PROPRI = new Set([
  ...dati.piloti.flatMap((pilota) => [
    pilota.nome,
    ...pilota.nome.split(/\s+/).filter((parte) => parte.length >= 4),
  ]),
  ...dati.scuderie.flatMap((scuderia) => [
    scuderia.nome,
    ...scuderia.nome.split(/\s+/).filter((parte) => parte.length >= 5),
  ]),
  ...dati.gare.map((gara) => gara.circuito),
  "Pirelli",
]);

const SCHEMI_SOSPETTI = {
  en: /\b(?:games?|skates?|new bottom|personal union|retreat|royal step|rounds? per set|hard roads|classification mainly|No retired|average arrival|sports management|speed error|technical sheet|support changes|regular pace|result in qualifying|mountain comebacks|passing comebacks)\b/i,
  fr: /\b(?:matchs?|union personnelle|sous-minage|retraite|montée en Hongrie|débarquements?|pas royal|manches par série|moto historique|surface compromise|pénalité accordée|Aucun F1 échantillons|Cadre neutre|routes difficiles|sous-crochet|un simple stop|le abandon|derniers courses|remontées aériennes|retours? en montagne|rythme et stratégie transformés)\b/i,
  pt: /\b(?:jogos?|reforma|fundo do jogo|ascensão húngara|formulário|não [A-Z]{2,3} partido|passo real|rondas por conjunto|classificação principalmente|superfície comprometida|Não F1 amostras|Quadro neutro|Gasly gerir|Alonso tive|dupla abandono|sua abandono|recuperações? de passe|regressos? de montanha|ritmo e estratégia convertidos)\b/i,
  es: /\b(?:partidos?|jubilación|subida húngara|formulario|aterrizajes?|no [A-Z]{2,3} abandonado|paso real|asaltos por set|clasificación principalmente|superficie comprometida|Russell error|No hay F1 muestras|Marco neutral|remontadas por pases|regresos? de montaña|ritmo y estrategia convertidos|obstáculo en pit lane)\b/i,
  de: /\b(?:Spiele?|Ruhestand|Rücktritte?|Schlittschuh|Straftritt|Selbstbewusstsein|Motorrad\w*|Formular|Haltestelle|Kettenpassform|königlichen Schritt|Zwischenklassen|persönliche Union|Keine F1 aktuellen Proben|Neutrales\/variables Einzelbild|Neutraler Rahmen|Gute jüngste Reifenabbau|Guter kürzlicher Reifenabbau|Zuverlässigkeit PU Risiken|wichtigste Hilfe|chronometrische Degradierung)\b/i,
};

function segnala(condizione, messaggio) {
  if (!condizione) errori.push(messaggio);
}

function stringhe(valore) {
  if (typeof valore === "string") return [valore];
  if (!valore || typeof valore !== "object" || Array.isArray(valore)) return [];
  return Object.values(valore).flatMap(stringhe);
}

function stessaStruttura(originale, traduzione) {
  if (typeof originale === "string") return typeof traduzione === "string";
  if (!originale || typeof originale !== "object" || Array.isArray(originale)) {
    return false;
  }
  if (!traduzione || typeof traduzione !== "object" || Array.isArray(traduzione)) {
    return false;
  }

  const chiaviOriginali = Object.keys(originale).sort();
  const chiaviTradotte = Object.keys(traduzione).sort();
  return (
    JSON.stringify(chiaviOriginali) === JSON.stringify(chiaviTradotte) &&
    chiaviOriginali.every((chiave) =>
      stessaStruttura(originale[chiave], traduzione[chiave]),
    )
  );
}

function tokenSportivi(testo) {
  return (
    String(testo).match(
      /\b(?:P|Q)\d{1,2}\b|\b(?:DNF|DNS|DSQ|NC|F1)\b|\b[A-Z]{3}\b/g,
    ) || []
  ).filter(
    (token) => /^(?:P|Q)\d{1,2}$/.test(token) || CODICI_SPORTIVI.has(token),
  ).sort();
}

function anni(testo) {
  return (String(testo).match(/\b(?:19|20)\d{2}\b/g) || []).sort();
}

function numeri(testo, lingua = "it") {
  const normalizzato = lingua === "fr"
    ? String(testo).replace(/\b(\d+)(?:er|e)\b/g, "$1")
    : String(testo);
  const schemi = {
    en: /\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\b/g,
    fr: /\b\d{1,3}(?: \d{3})+\b|\b\d+(?:,\d+)?\b/g,
    it: /\b\d{1,3}(?:\.\d{3})+\b|\b\d+(?:,\d+)?\b/g,
    pt: /\b\d{1,3}(?:\.\d{3})+\b|\b\d+(?:[,.]\d+)?\b/g,
    es: /\b\d{1,3}(?:\.\d{3})+\b|\b\d+(?:[,.]\d+)?\b/g,
    de: /\b\d{1,3}(?:\.\d{3})+\b|\b\d+(?:[,.]\d+)?\b/g,
  };
  return (normalizzato.match(schemi[lingua]) || [])
    .map((numero) => {
      const separatoreMigliaia = lingua === "en" ? "," : lingua === "fr" ? " " : ".";
      const parti = numero.split(separatoreMigliaia);
      if (
        parti.length > 1 &&
        parti[0] !== "0" &&
        parti.slice(1).every((parte) => parte.length === 3)
      ) {
        return parti.join("");
      }
      return numero.replace(",", ".");
    })
    .sort();
}

function nomiPropri(testo) {
  return [...NOMI_PROPRI]
    .filter((nome) => String(testo).includes(nome))
    .sort();
}

function soloDatiSportivi(testo) {
  return String(testo)
    .split("\n")
    .every((riga) =>
      /^\d{4}: (?:(?:P|Q)\d{1,2}|DNF|DNS|DSQ|NC)(?: \([^)]+\))?$/.test(riga) ||
      /^\d{4}: (?:[A-Z]{3} (?:(?:P|Q)\d{1,2}|DNF|DNS|DSQ|NC))(?: \/ [A-Z]{3} (?:(?:P|Q)\d{1,2}|DNF|DNS|DSQ|NC))?$/.test(riga) ||
      /^\d{4}: (?:QUALIFICHE |GP )?(?:NON |N['’]A |DID |NOT |ABSENT |NICHT |NÃO |NO ).+$/i.test(riga),
    );
}

segnala(
  JSON.stringify(dati.metadati?.localizzazione?.lingueSupportate) ===
    JSON.stringify(LINGUE),
  "Metadati delle lingue mancanti o incompleti",
);
segnala(
  dati.metadati?.localizzazione?.servizio === "Azure Translator" &&
    dati.metadati?.localizzazione?.pianoGenerazione === "F0" &&
    dati.metadati?.localizzazione?.portoghese === "pt-PT",
  "Metadati del servizio di traduzione mancanti o incoerenti",
);

for (const [sezione, campi] of Object.entries(CAMPI_LOCALIZZABILI)) {
  for (const [indice, documento] of dati[sezione].entries()) {
    for (const lingua of LINGUE) {
      const traduzione = documento.traduzioni?.[lingua];
      segnala(Boolean(traduzione), `${sezione}[${indice}]: traduzione ${lingua} mancante`);
      if (!traduzione) continue;

      for (const campo of campi) {
        const originale = documento[campo] ?? "";
        const localizzato = traduzione[campo];
        campiVerificati += 1;
        segnala(
          stessaStruttura(originale, localizzato),
          `${sezione}[${indice}].${campo}: struttura ${lingua} non valida`,
        );
        if (!stessaStruttura(originale, localizzato)) continue;

        const originali = stringhe(originale);
        const localizzati = stringhe(localizzato);
        for (let posizione = 0; posizione < originali.length; posizione += 1) {
          const testoOriginale = originali[posizione];
          const testoLocalizzato = localizzati[posizione];
          stringheVerificate += 1;
          segnala(
            !testoOriginale || Boolean(testoLocalizzato.trim()),
            `${sezione}[${indice}].${campo}: testo ${lingua} vuoto`,
          );
          if (
            lingua !== "it" &&
            testoOriginale.length >= 60 &&
            !soloDatiSportivi(testoOriginale)
          ) {
            const rapporto = testoLocalizzato.length / testoOriginale.length;
            segnala(
              testoLocalizzato !== testoOriginale,
              `${sezione}[${indice}].${campo}: testo lungo non tradotto in ${lingua}`,
            );
            segnala(
              rapporto >= 0.35 && rapporto <= 2.5,
              `${sezione}[${indice}].${campo}: lunghezza anomala in ${lingua}`,
            );
          }
          segnala(
            JSON.stringify(tokenSportivi(testoOriginale)) ===
              JSON.stringify(tokenSportivi(testoLocalizzato)),
            `${sezione}[${indice}].${campo}: codici sportivi alterati in ${lingua}`,
          );
          segnala(
            JSON.stringify(anni(testoOriginale)) ===
              JSON.stringify(anni(testoLocalizzato)),
            `${sezione}[${indice}].${campo}: anni alterati in ${lingua}`,
          );
          segnala(
            JSON.stringify(numeri(testoOriginale, "it")) ===
              JSON.stringify(numeri(testoLocalizzato, lingua)),
            `${sezione}[${indice}].${campo}: numeri alterati in ${lingua}`,
          );
          const nomiOriginali = nomiPropri(testoOriginale);
          const nomiLocalizzati = nomiPropri(testoLocalizzato);
          segnala(
            nomiOriginali.every((nome) => nomiLocalizzati.includes(nome)),
            `${sezione}[${indice}].${campo}: nomi propri alterati in ${lingua}`,
          );
          segnala(
            testoOriginale.split("\n").length ===
              testoLocalizzato.split("\n").length,
            `${sezione}[${indice}].${campo}: righe alterate in ${lingua}`,
          );
          segnala(
            !/(?:__RAH\d+__|RAHDET\d+)/i.test(testoLocalizzato),
            `${sezione}[${indice}].${campo}: segnaposto rimasto in ${lingua}`,
          );
          if (lingua !== "it") {
            segnala(
              !/(?:NON CORSO(?: IN F1)?|NON PRESENTE IN F1|(?:GP|QUALIFICHE) NON DISPUTAT[OE])/.test(
                testoLocalizzato,
              ),
              `${sezione}[${indice}].${campo}: stato italiano non tradotto in ${lingua}`,
            );
            segnala(
              !SCHEMI_SOSPETTI[lingua].test(testoLocalizzato),
              `${sezione}[${indice}].${campo}: terminologia sospetta in ${lingua}`,
            );
          }
        }
      }
    }
  }
}

if (errori.length) {
  console.error(`Verifica traduzioni fallita: ${errori.length} errori`);
  for (const errore of errori.slice(0, 100)) console.error(`- ${errore}`);
  process.exitCode = 1;
} else {
  console.log(
    `OK profili tecnici: metodi e caratteristiche di 12 circuiti in 6 lingue.\n` +
    `OK traduzioni: ${campiVerificati} campi e ${stringheVerificate} testi ` +
      `verificati in ${LINGUE.length} lingue.`,
  );
}
