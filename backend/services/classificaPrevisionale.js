const snapshotF1db = require("../data/f1db-v2026.11.0-derivato.json");

const PESI = Object.freeze({
  andamento2026: 20,
  compatibilitaVetturaCircuito: 18,
  aggiornamentiTecnici: 12,
  confidenzaPilotaCircuito: 7,
  qualifica2026: 8,
  scuderia2026: 26,
  storicoPersonale: 3,
  passoGaraRecente: 2,
  gestioneGomme: 2,
  affidabilitaERischi: 2,
});

const NOMI_FATTORI = Object.freeze({
  andamento2026: "Andamento 2026",
  compatibilitaVetturaCircuito: "Compatibilità vettura-circuito",
  aggiornamentiTecnici: "Aggiornamenti tecnici pertinenti",
  confidenzaPilotaCircuito: "Confidenza pilota-circuito",
  qualifica2026: "Qualifica 2026",
  scuderia2026: "Andamento scuderia 2026",
  storicoPersonale: "Storico personale",
  passoGaraRecente: "Passo gara recente",
  gestioneGomme: "Gestione gomme",
  affidabilitaERischi: "Affidabilità e rischi",
});

const NESSUN_PACCHETTO_CONFERMATO =
  /non ha (?:annunciato|comunicato|confermato).*(?:pacchetto|aggiornament)|non ci sono.*componenti confermati/;

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
  const penalita = normalizzaTesto(analisiPilota?.penalita);

  if (/nessun problema|affidabilita (?:alta|buona)/.test(testo)) valore += 8;
  if (/guasto|ritiro tecnico|problema di affidabilita/.test(testo)) valore -= 18;
  if (
    penalita &&
    !/nessuna penalita|non (?:e stata|risulta) .*penalita|alcuna penalita/.test(
      penalita,
    ) &&
    /penalita confermata|arretramento|squalifica/.test(penalita)
  ) {
    valore -= 20;
  }

  return limita(valore, 20, 95);
}

function valutaAggiornamento(testoOriginale) {
  const testo = normalizzaTesto(testoOriginale);

  if (!testo.trim()) {
    return {
      valore: 50,
      evidenza: 0,
      stato: "Nessuna informazione",
      nota: "Non viene attribuito alcun vantaggio tecnico.",
    };
  }

  if (/non (?:ha|hanno) (?:portato|prodotto).*vantagg|nessun miglioramento reale/.test(testo)) {
    return {
      valore: 35,
      evidenza: 1,
      stato: "Vantaggio non rilevato",
      nota: "L'aggiornamento non ha mostrato un beneficio reale.",
    };
  }

  if (/non pertinent|non riguarda.*(?:circuito|caratteristic)|vantaggio.*non utile/.test(testo)) {
    return {
      valore: 42,
      evidenza: 1,
      stato: "Poco pertinente",
      nota: "Il possibile beneficio riguarda aspetti poco rilevanti per questo circuito.",
    };
  }

  let evidenza = 0.25;
  let stato = "Possibile, da verificare";

  if (/ha (?:gia )?introdotto|lavoro gia portato/.test(testo)) {
    evidenza = 0.6;
    stato = "Già introdotto, effetto da confermare";
  } else if (NESSUN_PACCHETTO_CONFERMATO.test(testo)) {
    return {
      valore: 50,
      evidenza: 0,
      stato: "Nessun pacchetto confermato",
      nota: "Le migliorie ipotetiche non vengono conteggiate come vantaggio.",
    };
  } else if (/ha confermato per|confermato.*(?:zandvoort|circuito|gran premio)/.test(testo)) {
    evidenza = 0.75;
    stato = "Confermato per il circuito";
  } else if (/ha annunciato|prima occasione utile|ha anticipato/.test(testo)) {
    evidenza = 0.35;
    stato = "Annunciato, da verificare";
  }

  let pertinenza = 0.45;
  if (/direttamente util|particolarmente util|specific[oa].*(?:circuito|gran premio)/.test(testo)) {
    pertinenza = 0.9;
  } else if (/puo essere utile|sarebber[oa].*util|sarebbe utile|utile perche/.test(testo)) {
    pertinenza = 0.65;
  }

  const valore = limita(50 + 50 * evidenza * pertinenza, 35, 90);
  return {
    valore,
    evidenza,
    stato,
    nota:
      evidenza >= 0.6
        ? "Il vantaggio è pesato in base alla pertinenza con le caratteristiche della pista."
        : "Il beneficio resta ridotto finché componenti ed effetto non sono verificati in pista.",
  };
}

function livelloConfidenza(gara, storico, etichettaPilota) {
  const testoGara = normalizzaTesto(gara?.confidenza);
  let livello = testoGara.includes("alta") ? 3 : testoGara.includes("bassa") ? 1 : 2;

  if (storico.campione === 0 || etichettaPilota <= 40) livello -= 1;
  return ["bassa", "bassa", "media", "alta"][limita(livello, 1, 3)];
}

function creaSintesi(fattori) {
  const migliori = [...fattori]
    .sort((primo, secondo) => secondo.valutazione - primo.valutazione)
    .slice(0, 2)
    .map((fattore) => fattore.nome.toLowerCase());

  return `I fattori più favorevoli sono ${migliori.join(" e ")}.`;
}

function creaFattori(valutazioni) {
  return Object.entries(PESI).map(([chiave, pesoPercentuale]) => {
    const valutazione = arrotonda(limita(valutazioni[chiave]));
    return {
      chiave,
      nome: NOMI_FATTORI[chiave],
      pesoPercentuale,
      valutazione,
      contributo: arrotonda((valutazione * pesoPercentuale) / 100),
    };
  });
}

function creaClassificaPrevisionale({
  gara,
  piloti,
  scuderie,
  analisiPiloti,
  analisiScuderie,
  snapshot = snapshotF1db,
}) {
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
    const aggiornamento = valutaAggiornamento(
      analisiScuderia?.aggiornamentiInArrivo || analisiPilota?.aggiornamentiInArrivo,
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
      confidenzaPilotaCircuito: compatibilitaPilota,
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
    const fattori = creaFattori(valutazioni);

    return {
      indice: arrotonda(
        fattori.reduce((totale, fattore) => totale + fattore.contributo, 0),
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
      confidenza: livelloConfidenza(
        gara,
        storico,
        compatibilitaPilota,
      ),
      sintesi: creaSintesi(fattori),
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
    gara: {
      slug: gara.slug,
      nome: gara.nome,
      circuito: gara.circuito,
    },
    modello: "statistico-editoriale-v1",
    avvertenza:
      "Queste sono previsioni statistiche ed editoriali, non certezze sportive. " +
      "Possono contenere errori e cambiare dopo aggiornamenti tecnici, meteo, " +
      "prove libere, penalità o altri eventi del weekend.",
    pesi: Object.entries(PESI).map(([chiave, pesoPercentuale]) => ({
      chiave,
      nome: NOMI_FATTORI[chiave],
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
  creaClassificaPrevisionale,
  valutaAggiornamento,
  valutaCompatibilitaVettura,
};
