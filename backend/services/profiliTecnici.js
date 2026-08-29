const profili = require("../data/profili-tecnici-2026.json");
const circuiti = require("../data/circuiti-tecnici-2026.json");

function ordinaCapacita(capacita) {
  return profili.dimensioni
    .map((dimensione) => ({
      dimensione,
      valore: capacita[dimensione],
    }))
    .sort((prima, seconda) => seconda.valore - prima.valore);
}

function creaProfiloScuderia(scuderiaSlug) {
  const profilo = profili.scuderie[scuderiaSlug];
  if (!profilo) return null;

  const capacita = ordinaCapacita(profilo.capacita);

  return {
    stagione: profili.metadati.stagione,
    aggiornatoIl: profili.metadati.aggiornatoIl,
    metodo: profili.metadati.metodo,
    capacita,
    puntiForza: capacita.slice(0, 3),
    areeSensibili: capacita.slice(-2).reverse(),
    fonti: [...profilo.fonti],
  };
}

function calcolaIndice(capacita, richieste) {
  const totalePesi = circuiti.dimensioni.reduce(
    (totale, dimensione) => totale + richieste[dimensione],
    0,
  );
  const totalePonderato = circuiti.dimensioni.reduce(
    (totale, dimensione) =>
      totale + capacita[dimensione] * richieste[dimensione],
    0,
  );

  return Math.round(totalePonderato / totalePesi);
}

function creaCompatibilita(scuderia, profilo, richieste) {
  const corrispondenze = circuiti.dimensioni
    .map((dimensione) => ({
      dimensione,
      contributo: profilo.capacita[dimensione] * richieste[dimensione],
    }))
    .sort((prima, seconda) => seconda.contributo - prima.contributo)
    .slice(0, 2)
    .map(({ dimensione }) => dimensione);

  return {
    scuderia: {
      slug: scuderia.slug,
      nome: scuderia.nome,
      abbreviazione: scuderia.abbreviazione,
      colore: scuderia.colore,
    },
    indice: calcolaIndice(profilo.capacita, richieste),
    corrispondenze,
  };
}

function creaProfiloCircuito(garaSlug, scuderie, datiLiveFia = null) {
  const circuito = circuiti.circuiti[garaSlug];
  if (!circuito) return null;

  const compatibilita = scuderie
    .map((scuderia) => {
      const profilo = profili.scuderie[scuderia.slug];
      return profilo
        ? creaCompatibilita(scuderia, profilo, circuito.richieste)
        : null;
    })
    .filter(Boolean)
    .sort((prima, seconda) => seconda.indice - prima.indice);

  const documentoCircuito = datiLiveFia?.circuito?.documentoUrl
    ? {
        documentoUrl: datiLiveFia.circuito.documentoUrl,
        pubblicatoIl: datiLiveFia.circuito.pubblicatoIl || null,
        acquisitoIl: datiLiveFia.circuito.acquisitoIl || null,
        zoneStraightMode: datiLiveFia.circuito.zoneStraightMode,
        rilevamentiOvertakeMode:
          datiLiveFia.circuito.rilevamentiOvertakeMode,
      }
    : null;

  return {
    stagione: circuiti.metadati.stagione,
    aggiornatoIl: circuiti.metadati.aggiornatoIl,
    metodo: circuiti.metadati.metodo,
    fp1At: circuito.fp1At,
    dati: { ...circuito.dati },
    caratteristiche: [...circuito.caratteristiche],
    puntiSorpassoPrincipali: circuito.puntiSorpassoPrincipali,
    richieste: circuiti.dimensioni.map((dimensione) => ({
      dimensione,
      valore: circuito.richieste[dimensione],
    })),
    compatibilita,
    documentoCircuito,
    fonti: [...circuito.fonti],
  };
}

function creaAggiornamentiLive(datiLiveFia, scuderie) {
  const documento = datiLiveFia?.aggiornamenti;
  if (!documento?.documentoUrl || documento.scuderie?.length !== 11) {
    return null;
  }

  const scuderiePerSlug = new Map(
    scuderie.map((scuderia) => [scuderia.slug, scuderia]),
  );

  return {
    stato: "ufficiale",
    fonte: "FIA",
    documentoUrl: documento.documentoUrl,
    pubblicatoIl: documento.pubblicatoIl || null,
    acquisitoIl: documento.acquisitoIl,
    scuderie: documento.scuderie.map((aggiornamento) => {
      const scuderia = scuderiePerSlug.get(aggiornamento.slug);
      return {
        scuderia: scuderia
          ? {
              slug: scuderia.slug,
              nome: scuderia.nome,
              abbreviazione: scuderia.abbreviazione,
              colore: scuderia.colore,
            }
          : {
              slug: aggiornamento.slug,
              nome: aggiornamento.nomeFia,
              abbreviazione: aggiornamento.nomeFia.slice(0, 3).toUpperCase(),
              colore: "#777777",
            },
        nessunAggiornamento: aggiornamento.nessunAggiornamento,
        componenti: [...aggiornamento.componenti],
        descrizione: aggiornamento.descrizione,
      };
    }),
  };
}

function configurazioneEvento(garaSlug) {
  const circuito = circuiti.circuiti[garaSlug];
  if (!circuito) return null;

  return {
    garaSlug,
    fp1At: new Date(circuito.fp1At),
    eventoFia: circuito.eventoFia,
    paginaFia:
      "https://www.fia.com/documents/championships/" +
      "fia-formula-one-world-championship-14/season/season-2026-2072/event/" +
      encodeURIComponent(circuito.eventoFia),
  };
}

module.exports = {
  calcolaIndice,
  configurazioneEvento,
  creaAggiornamentiLive,
  creaProfiloCircuito,
  creaProfiloScuderia,
};
