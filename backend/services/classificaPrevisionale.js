const snapshotF1db = require("../data/f1db-v2026.11.0-derivato.json");
const { testiPrevisione } = require("../i18n/previsioni");
const { valoreLocalizzato } = require("../i18n/lingue");

const PESI = Object.freeze({
  andamento2026: 10,
  compatibilitaVetturaCircuito: 25,
  aggiornamentiTecnici: 10,
  qualifica2026: 3,
  scuderia2026: 18,
  storicoPersonale: 6,
  passoGaraRecente: 25,
  gestioneGomme: 1,
  affidabilitaERischi: 2,
});

const PESO_PENALITA = 50;

const NOMI_FATTORI = Object.freeze({
  andamento2026: "Andamento 2026",
  compatibilitaVetturaCircuito: "Compatibilità vettura-circuito",
  aggiornamentiTecnici: "Aggiornamenti tecnici pertinenti",
  qualifica2026: "Qualifica 2026",
  scuderia2026: "Andamento scuderia 2026",
  storicoPersonale: "Storico personale",
  passoGaraRecente: "Andamento negli ultimi 3 GP",
  gestioneGomme: "Gestione gomme",
  affidabilitaERischi: "Affidabilità e rischi",
  penalita: "Penalità in griglia",
});

const NESSUN_PACCHETTO_CONFERMATO =
  /non ha (?:ancora )?(?:annunciato|comunicato|confermato).*(?:pacchetto|aggiornament)|non ci sono.*componenti confermati/;

function limita(valore, minimo = 0, massimo = 100) {
  return Math.min(massimo, Math.max(minimo, valore));
}

function arrotonda(valore, cifre = 1) {
  const fattore = 10 ** cifre;
  return Math.round(valore * fattore) / fattore;
}

function normalizzaTesto(valore) {
  return String(valore || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function punteggioPosizione(posizione, totale = 22) {
  if (!Number.isFinite(posizione) || posizione < 1) return 20;
  return limita(((totale + 1 - posizione) / totale) * 100);
}

function mediaPesata(valori) {
  const validi = valori.filter(({ valore }) => Number.isFinite(valore));
  if (!validi.length) return 40;

  const pesoTotale = validi.reduce((totale, elemento) => totale + elemento.peso, 0);
  return validi.reduce(
    (totale, elemento) => totale + elemento.valore * elemento.peso,
    0,
  ) / pesoTotale;
}

function valutaClassifica(classifica, massimoPunti, massimoVittorie, totale) {
  if (!classifica) return 40;

  const punti = massimoPunti > 0 ? (classifica.punti / massimoPunti) * 100 : 0;
  const posizione = punteggioPosizione(classifica.posizione, totale);
  const vittorie =
    massimoVittorie > 0 ? (classifica.vittorie / massimoVittorie) * 100 : 0;

  return limita(punti * 0.6 + posizione * 0.3 + vittorie * 0.1);
}

function risultatiPilota(eventi, pilotaSlug, tipo) {
  return eventi.map((evento) => evento.piloti[pilotaSlug]?.[tipo] ?? null);
}

function valutaRisultatiRecenti(risultati, quanti) {
  const recenti = risultati.slice(-quanti);
  return mediaPesata(
    recenti.map((posizione, indice) => ({
      valore: posizione === null ? 15 : punteggioPosizione(posizione),
      peso: indice + 1,
    })),
  );
}

function estraiPosizioni(valori) {
  return Object.values(valori || {})
    .map((valore) => {
      const corrispondenza = String(valore).match(/\bP(\d{1,2})\b/i);
      return corrispondenza ? Number(corrispondenza[1]) : null;
    })
    .filter(Number.isFinite);
}

function valutaStorico(analisi) {
  const posizioni = estraiPosizioni(analisi?.posizioniStoriche);

  return {
    campione: posizioni.length,
    valore: posizioni.length
      ? mediaPesata(
          posizioni.map((posizione, indice) => ({
            valore: punteggioPosizione(posizione),
            peso: indice + 1,
          })),
        )
      : 40,
  };
}

function valutaEtichetta(testo) {
  const valore = normalizzaTesto(testo).trimStart();

  if (valore.startsWith("favorit")) return 92;
  if (valore.startsWith("molto competitiv")) return 80;
  if (valore.startsWith("outsider di lusso")) return 68;
  if (valore.startsWith("outsider")) return 55;
  if (valore.startsWith("da valutare")) return 40;
  return 50;
}

function valutaCompatibilitaVettura(valoreScuderia, valutazioneCircuito) {
  return arrotonda(
    limita(valoreScuderia * 0.65 + valutazioneCircuito * 0.35),
  );
}

function valutaTestoPrestazione(testi) {
  const testo = normalizzaTesto(Object.values(testi || {}).join(" "));
  let valore = 50;

  const positivi = [
    "ottimo",
    "molto competitiv",
    "passo migliore",
    "buona gestione",
    "degrado controllato",
    "passo forte",
    "ritmo costante",
    "passo competitivo",
  ];
  const negativi = [
    "degrado elevato",
    "mancava di passo",
    "poco stabile",
    "senza il passo",
    "passo limitato",
    "non aveva ritmo",
    "problema tecnico",
  ];

  valore += positivi.filter((frase) => testo.includes(frase)).length * 7;
  valore -= negativi.filter((frase) => testo.includes(frase)).length * 8;
  return limita(valore, 25, 85);
}

function valutaGestioneGomme(analisiPilota, analisiScuderia) {
  return mediaPesata([
    { valore: valutaTestoPrestazione(analisiPilota?.gomme), peso: 2 },
    { valore: valutaTestoPrestazione(analisiScuderia?.gomme), peso: 1 },
  ]);
}

function valutaAffidabilita(risultati, analisiPilota, analisiScuderia) {
  const recenti = risultati.slice(-5);
  const arrivi = recenti.filter(Number.isFinite).length;
  let valore = recenti.length ? 45 + (arrivi / recenti.length) * 45 : 60;
  const testo = normalizzaTesto(
    `${analisiPilota?.affidabilita || ""} ${analisiScuderia?.affidabilita || ""}`,
  );
  if (/nessun problema|affidabilita (?:alta|buona)/.test(testo)) valore += 8;
  if (/guasto|ritiro tecnico|problema di affidabilita/.test(testo)) valore -= 18;

  return limita(valore, 20, 95);
}

function valutaPenalita(testoOriginale) {
  const testo = normalizzaTesto(testoOriginale);
  const confermata =
    testo &&
    !/nessuna penalita|non (?:e stata|risulta) .*penalita|alcuna penalita/.test(
      testo,
    ) &&
    /penalita confermata|arretrera|arretramento|squalifica/.test(testo);

  if (!confermata) return null;

  const corrispondenza = testo.match(/(?:almeno\s+)?(\d{1,2})\s+posizion/);
  const posizioni = corrispondenza ? Number(corrispondenza[1]) : null;

  return {
    posizioni,
    valore: posizioni === null ? 25 : limita(100 - posizioni * 10),
  };
}

function valutaAggiornamento(testoOriginale, lingua = "it") {
  const testi = testiPrevisione(lingua);
  const testo = normalizzaTesto(testoOriginale);

  if (!testo.trim()) {
    return {
      valore: 50,
      evidenza: 0,
      stato: testi.stati.nessunaInformazione,
      nota: testi.note.nessunVantaggio,
    };
  }

  if (
    /(?:solo|esclusivamente|puramente).*affidabilit|intervento.*affidabilit/.test(
      testo,
    ) &&
    /non (?:cerca|produce|introduce|offre).*(?:vantaggio|prestazion|carico aerodinamico)/.test(
      testo,
    )
  ) {
    return {
      valore: 50,
      evidenza: 1,
      stato: testi.stati.soloAffidabilita,
      nota: testi.note.soloAffidabilita,
    };
  }

  if (/non (?:ha|hanno) (?:portato|prodotto).*vantagg|nessun miglioramento reale/.test(testo)) {
    return {
      valore: 35,
      evidenza: 1,
      stato: testi.stati.vantaggioNonRilevato,
      nota: testi.note.vantaggioAssente,
    };
  }

  if (/non pertinent|non riguarda.*(?:circuito|caratteristic)|vantaggio.*non utile/.test(testo)) {
    return {
      valore: 42,
      evidenza: 1,
      stato: testi.stati.pocoPertinente,
      nota: testi.note.pocoPertinente,
    };
  }

  let evidenza = 0.25;
  let stato = testi.stati.possibile;

  if (/ha (?:gia )?introdotto|lavoro gia portato/.test(testo)) {
    evidenza = 0.6;
    stato = testi.stati.giaIntrodotto;
  } else if (NESSUN_PACCHETTO_CONFERMATO.test(testo)) {
    return {
      valore: 50,
      evidenza: 0,
      stato: testi.stati.nessunPacchetto,
      nota: testi.note.nessunPacchetto,
    };
  } else if (/ha confermato per|confermato.*(?:zandvoort|circuito|gran premio)/.test(testo)) {
    evidenza = 0.75;
    stato = testi.stati.confermato;
  } else if (/ha annunciato|prima occasione utile|ha anticipato/.test(testo)) {
    evidenza = 0.35;
    stato = testi.stati.annunciato;
  }

  let pertinenza = 0.45;
  if (
    /direttamente (?:util|pertinent)|particolarmente util|specific[oa].*(?:circuito|gran premio)/.test(
      testo,
    )
  ) {
    pertinenza = 0.9;
  } else if (/puo essere utile|sarebber[oa].*util|sarebbe utile|utile perche/.test(testo)) {
    pertinenza = 0.65;
  }

  let ampiezza = 0.8;
  if (
    /ampio pacchetto|pacchetto esteso|pacchetto (?:di|su) (?:cinque|otto)|(?:cinque|otto) (?:aree|interventi)/.test(
      testo,
    )
  ) {
    ampiezza = 1;
  } else if (
    /intervento mirato|aggiornamento circoscritto|modifica circoscritta|un solo componente/.test(
      testo,
    )
  ) {
    ampiezza = 0.6;
  }

  const valore = limita(
    50 + 50 * evidenza * pertinenza * ampiezza,
    35,
    90,
  );
  return {
    valore,
    evidenza,
    stato,
    nota:
      evidenza >= 0.6
        ? testi.note.evidenzaAlta
        : testi.note.evidenzaBassa,
  };
}

function livelloConfidenza(gara, storico, etichettaPilota) {
  const testoGara = normalizzaTesto(gara?.confidenza);
  let livello = testoGara.includes("alta") ? 3 : testoGara.includes("bassa") ? 1 : 2;

  if (storico.campione === 0 || etichettaPilota <= 40) livello -= 1;
  return ["bassa", "bassa", "media", "alta"][limita(livello, 1, 3)];
}

function creaSintesi(fattori, testi) {
  const migliori = [...fattori]
    .sort((primo, secondo) => secondo.valutazione - primo.valutazione)
    .slice(0, 2)
    .map((fattore) => fattore.nome);

  return testi.sintesi(migliori[0], migliori[1]);
}

function creaFattori(valutazioni, testi, penalita) {
  const moltiplicatore = penalita ? (100 - PESO_PENALITA) / 100 : 1;
  const fattori = Object.entries(PESI).map(([chiave, pesoPercentuale]) => {
    const valutazione = arrotonda(limita(valutazioni[chiave]));
    const pesoEffettivo = arrotonda(pesoPercentuale * moltiplicatore);
    return {
      chiave,
      nome: testi.fattori[chiave],
      pesoPercentuale: pesoEffettivo,
      valutazione,
      contributo: arrotonda((valutazione * pesoEffettivo) / 100),
    };
  });

  if (penalita) {
    fattori.push({
      chiave: "penalita",
      nome: testi.fattori.penalita,
      pesoPercentuale: PESO_PENALITA,
      valutazione: penalita.valore,
      contributo: arrotonda((penalita.valore * PESO_PENALITA) / 100),
    });
  }

  return fattori;
}

function creaClassificaPrevisionale({
  gara,
  piloti,
  scuderie,
  analisiPiloti,
  analisiScuderie,
  snapshot = snapshotF1db,
  lingua = "it",
}) {
  const testi = testiPrevisione(lingua);
  const eventi = snapshot.andamento2026?.eventi || [];
  const analisiPilotaPerSlug = new Map(
    analisiPiloti.map((analisi) => [analisi.pilota.slug, analisi]),
  );
  const analisiScuderiaPerSlug = new Map(
    analisiScuderie.map((analisi) => [analisi.scuderia.slug, analisi]),
  );
  const scuderiaPerSlug = new Map(scuderie.map((scuderia) => [scuderia.slug, scuderia]));
  const massimoPuntiPiloti = Math.max(...piloti.map((pilota) => pilota.classifica2026.punti), 0);
  const massimoVittoriePiloti = Math.max(
    ...piloti.map((pilota) => pilota.classifica2026.vittorie),
    0,
  );
  const massimoPuntiScuderie = Math.max(
    ...scuderie.map((scuderia) => scuderia.classifica2026.punti),
    0,
  );
  const massimoVittorieScuderie = Math.max(
    ...scuderie.map((scuderia) => scuderia.classifica2026.vittorie),
    0,
  );

  const classifica = piloti.map((pilota) => {
    const scuderiaSlug = pilota.scuderia.slug;
    const scuderia = scuderiaPerSlug.get(scuderiaSlug);
    const analisiPilota = analisiPilotaPerSlug.get(pilota.slug);
    const analisiScuderia = analisiScuderiaPerSlug.get(scuderiaSlug);
    const gare2026 = risultatiPilota(eventi, pilota.slug, "gara");
    const qualifiche2026 = risultatiPilota(eventi, pilota.slug, "qualifica");
    const storico = valutaStorico(analisiPilota);
    const penalita = valutaPenalita(analisiPilota?.penalita);
    const aggiornamento = valutaAggiornamento(
      analisiScuderia?.aggiornamentiInArrivo || analisiPilota?.aggiornamentiInArrivo,
      lingua,
    );
    const compatibilitaPilota = valutaEtichetta(analisiPilota?.considerazioni);
    const andamentoScuderia = valutaClassifica(
      scuderia?.classifica2026,
      massimoPuntiScuderie,
      massimoVittorieScuderie,
      scuderie.length,
    );
    const valutazioneCircuitoScuderia = valutaEtichetta(
      analisiScuderia?.considerazioni,
    );

    const valutazioni = {
      andamento2026: valutaClassifica(
        pilota.classifica2026,
        massimoPuntiPiloti,
        massimoVittoriePiloti,
        piloti.length,
      ),
      compatibilitaVetturaCircuito: valutaCompatibilitaVettura(
        andamentoScuderia,
        valutazioneCircuitoScuderia,
      ),
      aggiornamentiTecnici: aggiornamento.valore,
      qualifica2026: valutaRisultatiRecenti(qualifiche2026, 5),
      scuderia2026: andamentoScuderia,
      storicoPersonale: storico.valore,
      passoGaraRecente: valutaRisultatiRecenti(gare2026, 3),
      gestioneGomme: valutaGestioneGomme(analisiPilota, analisiScuderia),
      affidabilitaERischi: valutaAffidabilita(
        gare2026,
        analisiPilota,
        analisiScuderia,
      ),
    };
    const fattoriBase = creaFattori(valutazioni, testi, null);
    const fattori = penalita
      ? creaFattori(valutazioni, testi, penalita)
      : fattoriBase;
    const indiceBase = fattoriBase.reduce(
      (totale, fattore) => totale + fattore.contributo,
      0,
    );
    const confidenzaCodice = livelloConfidenza(
      gara,
      storico,
      compatibilitaPilota,
    );

    return {
      indice: arrotonda(
        penalita
          ? indiceBase * ((100 - PESO_PENALITA) / 100) +
              penalita.valore * (PESO_PENALITA / 100)
          : indiceBase,
      ),
      pilota: {
        slug: pilota.slug,
        nome: pilota.nome,
        codice: pilota.codice,
        numero: pilota.numero,
        abbreviazioneNome: pilota.codice,
        numeroVettura: pilota.numero,
        nazionalitaIso2: pilota.nazionalitaIso2,
        nazionalitaIso3: pilota.nazionalitaIso3,
      },
      scuderia: {
        slug: scuderia.slug,
        nome: scuderia.nome,
        abbreviazione: scuderia.abbreviazione,
        colore: scuderia.colore,
      },
      confidenza: testi.livelli[confidenzaCodice],
      confidenzaCodice,
      sintesi: creaSintesi(fattori, testi),
      fattori,
      aggiornamentiTecnici: {
        stato: aggiornamento.stato,
        nota: aggiornamento.nota,
      },
    };
  });

  classifica.sort(
    (primo, secondo) =>
      secondo.indice - primo.indice ||
      primo.pilota.nome.localeCompare(secondo.pilota.nome, "it"),
  );

  return {
    lingua,
    gara: {
      slug: gara.slug,
      nome: valoreLocalizzato(gara, "nome", lingua),
      circuito: valoreLocalizzato(gara, "circuito", lingua),
    },
    modello: "statistico-editoriale-v2",
    pesi: Object.entries(PESI).map(([chiave, pesoPercentuale]) => ({
      chiave,
      nome: testi.fattori[chiave],
      pesoPercentuale,
    })),
    aggiornatoIl: snapshot.andamento2026?.aggiornatoIl || null,
    classifica: classifica.map((elemento, indice) => ({
      posizione: indice + 1,
      ...elemento,
    })),
  };
}

module.exports = {
  NOMI_FATTORI,
  PESI,
  PESO_PENALITA,
  creaClassificaPrevisionale,
  valutaAggiornamento,
  valutaCompatibilitaVettura,
  valutaPenalita,
};
