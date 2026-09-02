const snapshotF1db = require("../data/f1db-v2026.12.0-derivato.json");

function creaSeriePilota(eventi, pilotaSlug) {
  const primoRisultato = eventi
    .map((evento) => evento.piloti[pilotaSlug])
    .find(Boolean);

  if (!primoRisultato) return { qualifica: [], gara: [] };

  return {
    qualifica: [
      {
        nome: primoRisultato.codice,
        valori: eventi.map(
          (evento) => evento.piloti[pilotaSlug]?.qualifica ?? null,
        ),
      },
    ],
    gara: [
      {
        nome: primoRisultato.codice,
        valori: eventi.map(
          (evento) => evento.piloti[pilotaSlug]?.gara ?? null,
        ),
      },
    ],
  };
}

function creaSerieScuderia(eventi, scuderiaSlug) {
  const codici = [
    ...new Set(
      eventi.flatMap((evento) => [
        ...Object.keys(evento.scuderie[scuderiaSlug]?.gara || {}),
        ...Object.keys(evento.scuderie[scuderiaSlug]?.qualifica || {}),
      ]),
    ),
  ];

  function crea(tipo) {
    return codici.map((codice) => ({
      nome: codice,
      valori: eventi.map(
        (evento) => evento.scuderie[scuderiaSlug]?.[tipo]?.[codice] ?? null,
      ),
    }));
  }

  return {
    qualifica: crea("qualifica"),
    gara: crea("gara"),
  };
}

function creaAndamentoAnnuale({
  stagione,
  pilotaSlug = null,
  scuderiaSlug = null,
  snapshot = snapshotF1db,
}) {
  const andamento = snapshot.andamento2026;
  const metadati = snapshot.metadati;

  if (stagione !== andamento.stagione) {
    return {
      stagione,
      etichette: [],
      qualifica: [],
      gara: [],
      fonte: null,
    };
  }

  const serie = pilotaSlug
    ? creaSeriePilota(andamento.eventi, pilotaSlug)
    : creaSerieScuderia(andamento.eventi, scuderiaSlug);

  return {
    stagione,
    etichette: andamento.eventi.map((evento) => evento.etichetta),
    qualifica: serie.qualifica,
    gara: serie.gara,
    fonte: {
      nome: metadati.fonte,
      url: metadati.releaseUrl,
      licenza: metadati.licenza,
      licenzaUrl: metadati.licenzaUrl,
      versione: metadati.versione,
      modifiche: metadati.trasformazioni,
    },
  };
}

module.exports = creaAndamentoAnnuale;
