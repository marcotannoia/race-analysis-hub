const {
  normalizzaNotaBene,
  normalizzaTestiAnnuali,
} = require("../utils/normalizzaNotaBene");

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

function presentaPilota(pilota) {
  if (!pilota) return null;

  return {
    ...presentaPilotaBreve(pilota),
    nazionalita: pilota.nazionalita,
    scuderia: presentaScuderiaBreve(pilota.scuderia),
    classifica: presentaClassifica(pilota.classifica2026),
    aggiornatoIl: dataIso(pilota.updatedAt),
  };
}

function presentaScuderia(scuderia) {
  if (!scuderia) return null;

  return {
    ...presentaScuderiaBreve(scuderia),
    nomeClassifica: scuderia.nomeClassifica,
    nazionalita: scuderia.nazionalita,
    denominazioniStoriche: scuderia.denominazioniStoriche || {},
    classifica: presentaClassifica(scuderia.classifica2026),
    aggiornatoIl: dataIso(scuderia.updatedAt),
  };
}

function presentaGaraBreve(gara) {
  if (!gara) return null;

  return {
    slug: gara.slug,
    nome: gara.nome,
    circuito: gara.circuito,
    paese: gara.paese,
    stagione: gara.stagione,
    ordineAnalisi: gara.ordineAnalisi,
    stato: "attuale",
  };
}

function presentaGara(gara) {
  if (!gara) return null;

  return {
    ...presentaGaraBreve(gara),
    contestoStorico: gara.contestoStorico,
    pilotiFavoriti: gara.pilotiFavoriti,
    scuderieFavorite: gara.scuderieFavorite,
    outsider: gara.outsider,
    potenzialiDifficolta: gara.potenzialiDifficolta,
    gommeStrategia: gara.gommeStrategia,
    rischi: gara.rischi,
    confidenza: gara.confidenza,
    fonti: presentaFonti(gara.fonti),
    aggiornatoIl: dataIso(gara.updatedAt),
  };
}

function presentaStoricoEdizioni(storicoEdizioni) {
  return (storicoEdizioni || []).map((edizione) => ({
    stagione: edizione.stagione,
    posizioneGara: edizione.posizioneGara,
    posizioneQualifica: edizione.posizioneQualifica,
    notaRisultato: edizione.notaRisultato || "",
    passoGara: edizione.passoGara || "",
    gestioneGomme: edizione.gomme || "",
    affidabilita: edizione.affidabilita || "",
  }));
}

function serializzaTestiAnnuali(contenuti) {
  return Object.entries(contenuti)
    .map(([anno, testo]) => (anno === "generale" ? testo : `${anno}: ${testo}`))
    .join("\n");
}

function presentaAnalisiBase(analisi) {
  if (!analisi) return null;

  const risultatiGaraPerAnno = normalizzaTestiAnnuali(
    analisi.posizioniStoriche,
  );
  const notaBenePerAnno = normalizzaNotaBene(analisi.spiegazionePosizioni);
  const risultatiQualificaPerAnno = normalizzaTestiAnnuali(
    analisi.qualificheStoriche,
  );
  const andamentoPerAnno = normalizzaTestiAnnuali(
    analisi.andamentoPerAnno || "",
  );
  const passoGaraPerAnno = normalizzaTestiAnnuali(analisi.passoGara);
  const gestioneGommePerAnno = normalizzaTestiAnnuali(analisi.gomme);

  return {
    gara: presentaGaraBreve(analisi.gara),
    risultatiGara: serializzaTestiAnnuali(risultatiGaraPerAnno),
    notaBene: serializzaTestiAnnuali(notaBenePerAnno),
    risultatiQualifica: serializzaTestiAnnuali(risultatiQualificaPerAnno),
    andamentoPerAnno: serializzaTestiAnnuali(andamentoPerAnno),
    prestazioni: {
      passoGara: serializzaTestiAnnuali(passoGaraPerAnno),
      gestioneGomme: serializzaTestiAnnuali(gestioneGommePerAnno),
      affidabilita: analisi.affidabilita || "",
    },
    datiPerAnno: {
      risultatiGara: risultatiGaraPerAnno,
      notaBene: notaBenePerAnno,
      risultatiQualifica: risultatiQualificaPerAnno,
      andamento: andamentoPerAnno,
      prestazioni: {
        passoGara: passoGaraPerAnno,
        gestioneGomme: gestioneGommePerAnno,
      },
    },
    considerazioniFinali: analisi.considerazioni,
    aggiornamentiInArrivo: analisi.aggiornamentiInArrivo || "",
    storicoEdizioni: presentaStoricoEdizioni(analisi.storicoEdizioni),
    fonti: presentaFonti(analisi.fonti),
    aggiornatoIl: dataIso(analisi.updatedAt),
  };
}

function presentaAnalisiPilota(analisi) {
  if (!analisi) return null;

  return {
    pilota: presentaPilotaBreve(analisi.pilota),
    scuderia: presentaScuderiaBreve(analisi.scuderia),
    ...presentaAnalisiBase(analisi),
    penalita: analisi.penalita || "",
  };
}

function presentaAnalisiScuderia(analisi) {
  if (!analisi) return null;

  return {
    scuderia: presentaScuderiaBreve(analisi.scuderia),
    ...presentaAnalisiBase(analisi),
  };
}

function presentaAndamento(andamento) {
  return {
    stagione: andamento.stagione,
    etichette: [...(andamento.etichette || [])],
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
            ? { modifiche: andamento.fonte.modifiche }
            : {}),
        }
      : null,
    aggiornatoIl: dataIso(andamento.aggiornatoIl),
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
