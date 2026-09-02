const {
  normalizzaNotaBene,
  normalizzaTestiAnnuali,
} = require("../utils/normalizzaNotaBene");
const {
  traduzioneDocumento,
  valoreLocalizzato,
} = require("../i18n/lingue");
const {
  localizzaEtichettaGara,
  localizzaModificheF1db,
} = require("../i18n/andamento");

function dataIso(valore) {
  if (!valore) return null;

  const data = valore instanceof Date ? valore : new Date(valore);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function normalizzaUrlHttps(valore) {
  if (typeof valore !== "string") return null;

  try {
    const url = new URL(valore);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function presentaFonti(fonti) {
  return (fonti || []).map(normalizzaUrlHttps).filter(Boolean);
}

function presentaClassifica(classifica) {
  if (!classifica) return null;

  return {
    posizione: classifica.posizione,
    punti: classifica.punti,
    vittorie: classifica.vittorie,
  };
}

function presentaScuderiaBreve(scuderia) {
  if (!scuderia) return null;

  return {
    slug: scuderia.slug,
    nome: scuderia.nome,
    abbreviazione: scuderia.abbreviazione,
    colore: scuderia.colore,
  };
}

function presentaPilotaBreve(pilota) {
  if (!pilota) return null;

  return {
    slug: pilota.slug,
    nome: pilota.nome,
    codice: pilota.codice,
    numero: pilota.numero,
    abbreviazioneNome: pilota.codice,
    numeroVettura: pilota.numero,
    nazionalitaIso2: pilota.nazionalitaIso2,
    nazionalitaIso3: pilota.nazionalitaIso3,
  };
}

function presentaPilota(pilota, lingua = "it") {
  if (!pilota) return null;

  return {
    ...presentaPilotaBreve(pilota),
    nazionalita: valoreLocalizzato(pilota, "nazionalita", lingua),
    scuderia: presentaScuderiaBreve(pilota.scuderia),
    classifica: presentaClassifica(pilota.classifica2026),
  };
}

function presentaScuderia(scuderia, lingua = "it") {
  if (!scuderia) return null;

  return {
    ...presentaScuderiaBreve(scuderia),
    nomeClassifica: scuderia.nomeClassifica,
    nazionalita: valoreLocalizzato(scuderia, "nazionalita", lingua),
    denominazioniStoriche: scuderia.denominazioniStoriche || {},
    classifica: presentaClassifica(scuderia.classifica2026),
  };
}

function presentaGaraBreve(gara, lingua = "it") {
  if (!gara) return null;

  return {
    slug: gara.slug,
    nome: valoreLocalizzato(gara, "nome", lingua),
    circuito: valoreLocalizzato(gara, "circuito", lingua),
    paese: valoreLocalizzato(gara, "paese", lingua),
    stagione: gara.stagione,
    ordineAnalisi: gara.ordineAnalisi,
    ordineCalendario: gara.ordineCalendario,
    stato: "attuale",
  };
}

function presentaGara(gara, lingua = "it") {
  if (!gara) return null;

  return {
    ...presentaGaraBreve(gara, lingua),
    contestoStorico: valoreLocalizzato(gara, "contestoStorico", lingua),
    pilotiFavoriti: valoreLocalizzato(gara, "pilotiFavoriti", lingua),
    scuderieFavorite: valoreLocalizzato(gara, "scuderieFavorite", lingua),
    outsider: valoreLocalizzato(gara, "outsider", lingua),
    potenzialiDifficolta: valoreLocalizzato(
      gara,
      "potenzialiDifficolta",
      lingua,
    ),
    gommeStrategia: valoreLocalizzato(gara, "gommeStrategia", lingua),
    rischi: valoreLocalizzato(gara, "rischi", lingua),
    confidenza: valoreLocalizzato(gara, "confidenza", lingua),
    fonti: presentaFonti(gara.fonti),
  };
}

function presentaStoricoEdizioni(storicoEdizioni, lingua = "it") {
  return (storicoEdizioni || []).map((edizione) => {
    const traduzione = traduzioneDocumento(edizione, lingua);

    return {
      stagione: edizione.stagione,
      posizioneGara: edizione.posizioneGara,
      posizioneQualifica: edizione.posizioneQualifica,
      notaRisultato:
        traduzione.notaRisultato ?? edizione.notaRisultato ?? "",
      passoGara: traduzione.passoGara ?? edizione.passoGara ?? "",
      gestioneGomme:
        traduzione.gestioneGomme ?? traduzione.gomme ?? edizione.gomme ?? "",
      affidabilita: traduzione.affidabilita ?? edizione.affidabilita ?? "",
    };
  });
}

function serializzaTestiAnnuali(contenuti) {
  return Object.entries(contenuti)
    .map(([anno, testo]) => (anno === "generale" ? testo : `${anno}: ${testo}`))
    .join("\n");
}

function presentaAnalisiBase(analisi, lingua = "it") {
  if (!analisi) return null;

  const contenuti = {
    ...analisi,
    ...traduzioneDocumento(analisi, lingua),
  };

  const risultatiGaraPerAnno = normalizzaTestiAnnuali(
    contenuti.posizioniStoriche,
  );
  const notaPredefinita = {
    it: "Nessun evento particolare da trattare",
    en: "No noteworthy event to report",
    fr: "Aucun événement particulier à signaler",
    pt: "Nenhum acontecimento relevante a assinalar",
    es: "Ningún acontecimiento relevante que señalar",
    de: "Kein besonderes Ereignis zu berichten",
  }[lingua];
  const notaBenePerAnno = normalizzaNotaBene(
    contenuti.spiegazionePosizioni,
    notaPredefinita,
  );
  const risultatiQualificaPerAnno = normalizzaTestiAnnuali(
    contenuti.qualificheStoriche,
  );
  const andamentoPerAnno = normalizzaTestiAnnuali(
    contenuti.andamentoPerAnno || "",
  );
  const passoGaraPerAnno = normalizzaTestiAnnuali(contenuti.passoGara);
  const gestioneGommePerAnno = normalizzaTestiAnnuali(contenuti.gomme);

  return {
    gara: presentaGaraBreve(analisi.gara, lingua),
    risultatiGara: serializzaTestiAnnuali(risultatiGaraPerAnno),
    notaBene: serializzaTestiAnnuali(notaBenePerAnno),
    risultatiQualifica: serializzaTestiAnnuali(risultatiQualificaPerAnno),
    andamentoPerAnno: serializzaTestiAnnuali(andamentoPerAnno),
    prestazioni: {
      passoGara: serializzaTestiAnnuali(passoGaraPerAnno),
      gestioneGomme: serializzaTestiAnnuali(gestioneGommePerAnno),
      affidabilita: contenuti.affidabilita || "",
    },
    datiPerAnno: {
      risultatiGara: risultatiGaraPerAnno,
      spiegazioneRisultatiPassati: notaBenePerAnno,
      notaBene: notaBenePerAnno,
      risultatiQualifica: risultatiQualificaPerAnno,
      andamento: andamentoPerAnno,
      prestazioni: {
        passoGara: passoGaraPerAnno,
        gestioneGomme: gestioneGommePerAnno,
      },
    },
    considerazioniFinali: contenuti.considerazioni,
    aggiornamentiInArrivo: contenuti.aggiornamentiInArrivo || "",
    storicoEdizioni: presentaStoricoEdizioni(
      contenuti.storicoEdizioni || analisi.storicoEdizioni,
      lingua,
    ),
    fonti: presentaFonti(analisi.fonti),
  };
}

function presentaAnalisiPilota(analisi, lingua = "it") {
  if (!analisi) return null;

  return {
    pilota: presentaPilotaBreve(analisi.pilota),
    scuderia: presentaScuderiaBreve(analisi.scuderia),
    ...presentaAnalisiBase(analisi, lingua),
    penalita:
      traduzioneDocumento(analisi, lingua).penalita ?? analisi.penalita ?? "",
  };
}

function presentaAnalisiScuderia(analisi, lingua = "it") {
  if (!analisi) return null;

  return {
    scuderia: presentaScuderiaBreve(analisi.scuderia),
    ...presentaAnalisiBase(analisi, lingua),
  };
}

function presentaAndamento(andamento, lingua = "it") {
  return {
    stagione: andamento.stagione,
    etichette: (andamento.etichette || []).map((etichetta) =>
      localizzaEtichettaGara(etichetta, lingua),
    ),
    qualifica: (andamento.qualifica || []).map((serie) => ({
      nome: serie.nome,
      valori: [...serie.valori],
    })),
    gara: (andamento.gara || []).map((serie) => ({
      nome: serie.nome,
      valori: [...serie.valori],
    })),
    fonte: andamento.fonte
      ? {
          nome: andamento.fonte.nome,
          url: normalizzaUrlHttps(andamento.fonte.url),
          ...(andamento.fonte.licenza
            ? { licenza: andamento.fonte.licenza }
            : {}),
          ...(andamento.fonte.licenzaUrl
            ? {
                licenzaUrl: normalizzaUrlHttps(
                  andamento.fonte.licenzaUrl,
                ),
              }
            : {}),
          ...(andamento.fonte.versione
            ? { versione: andamento.fonte.versione }
            : {}),
          ...(andamento.fonte.modifiche
            ? {
                modifiche: localizzaModificheF1db(
                  andamento.fonte.modifiche,
                  lingua,
                ),
              }
            : {}),
        }
      : null,
  };
}

module.exports = {
  presentaAnalisiPilota,
  presentaAnalisiScuderia,
  presentaAndamento,
  presentaGara,
  presentaGaraBreve,
  presentaPilota,
  presentaPilotaBreve,
  presentaScuderia,
  presentaScuderiaBreve,
};
