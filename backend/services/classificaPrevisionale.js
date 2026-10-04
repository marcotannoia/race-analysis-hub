const snapshotF1db = require("../data/f1db-v2026.16.0-derivato.json");
const { testiPrevisione } = require("../i18n/previsioni");
const { valoreLocalizzato } = require("../i18n/lingue");
const { creaProfiloCircuito } = require("./profiliTecnici");
const circuitiTecnici = require("../data/circuiti-tecnici-2026.json");
const statisticheContesto = require("../data/statistiche-contesto.json");

const PESI = Object.freeze({
  compatibilitaVetturaCircuito: 34,
  risultatiCircuitiSimili: 26,
  qualifica2026: 3,
  storicoPersonale: 2,
  aggiornamentiTecnici: 10,
  andamento2026: 5,
  passoGaraRecente: 8,
  andamentoScuderiaRecente: 2,
  meteoEsperienzaPilota: 8,
  meteoScuderia: 2,
});
const PESI_SENZA_METEO = Object.freeze({
  ...PESI,
  compatibilitaVetturaCircuito: 42,
  risultatiCircuitiSimili: 28,
  meteoEsperienzaPilota: 0,
  meteoScuderia: 0,
});

const PESO_PENALITA = 35;

const NOMI_FATTORI = Object.freeze({
  andamento2026: "Andamento 2026",
  compatibilitaVetturaCircuito: "Compatibilità vettura-circuito",
  risultatiCircuitiSimili: "Risultati su circuiti simili",
  aggiornamentiTecnici: "Aggiornamenti tecnici pertinenti",
  qualifica2026: "Qualifica 2026",
  andamentoScuderiaRecente: "Andamento scuderia negli ultimi 3 GP",
  storicoPersonale: "Storico personale",
  passoGaraRecente: "Andamento pilota negli ultimi 3 GP",
  penalita: "Penalità in griglia",
  meteoEsperienzaPilota: "Esperienza del pilota sul bagnato",
  meteoScuderia: "Storico sul bagnato della coppia piloti",
});

function valutaEsperienzaBagnato(valori) {
  if (!valori) return 50;
  const gare = valori.gareConPioggiaDisputate || 0;
  const positive = valori.gareConPioggiaPositive || 0;
  return limita(((positive + 3) / (gare + 6)) * 100);
}

function combinaEsperienzaBagnato(voci) {
  const note = voci.filter(Boolean);
  if (!note.length || note.length !== voci.length) return 50;
  return valutaEsperienzaBagnato({
    gareConPioggiaDisputate: note.reduce((n, v) => n + v.gareConPioggiaDisputate, 0),
    gareConPioggiaPositive: note.reduce((n, v) => n + v.gareConPioggiaPositive, 0),
  });
}

const GARA_SLUG_PER_GRAND_PRIX_ID = Object.freeze({
  netherlands: "olanda-zandvoort",
  italy: "italia-monza",
  spain: "spagna-madring",
  azerbaijan: "azerbaigian-baku",
  bahrain: "bahrein-sepang",
  singapore: "singapore-marina-bay",
  "united-states": "usa-austin",
  mexico: "messico-citta-del-messico",
  "sao-paulo": "brasile-interlagos",
  "las-vegas": "usa-las-vegas",
  qatar: "qatar-lusail",
  "abu-dhabi": "abu-dhabi-yas-marina",
});

const NUMERO_CIRCUITI_SIMILI = 2;

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
  if (!Number.isFinite(posizione) || posizione < 1) return 50;
  return limita(((totale + 1 - posizione) / totale) * 100);
}

function mediaPesata(valori) {
  const validi = valori.filter(({ valore, peso }) => Number.isFinite(valore) && Number.isFinite(peso) && peso > 0);
  if (!validi.length) return 50;

  const pesoTotale = validi.reduce((totale, elemento) => totale + elemento.peso, 0);
  return validi.reduce(
    (totale, elemento) => totale + elemento.valore * elemento.peso,
    0,
  ) / pesoTotale;
}

function valutaClassifica(classifica, massimoPunti, massimoVittorie, totale) {
  if (!classifica) return 50;

  const punti = massimoPunti > 0 ? (classifica.punti / massimoPunti) * 100 : 0;
  const posizione = punteggioPosizione(classifica.posizione, totale);
  const vittorie =
    massimoVittorie > 0 ? (classifica.vittorie / massimoVittorie) * 100 : 0;

  return limita(punti * 0.6 + posizione * 0.3 + vittorie * 0.1);
}

function risultatiPilota(eventi, pilotaSlug, tipo) {
  return eventi.map((evento) => {
    const r = evento.piloti?.[pilotaSlug];
    return tipo === "gara" && r?.garaRegolare === false ? null : r?.[tipo] ?? null;
  });
}

function valutaRisultatiRecenti(risultati, quanti) {
  const recenti = risultati.slice(-quanti);
  return mediaPesata(
    recenti.map((posizione, indice) => ({
      valore: Number.isFinite(posizione) ? punteggioPosizione(posizione) : null,
      peso: indice + 1,
    })),
  );
}

function valutaAndamentoScuderia(eventi, slug) {
  return mediaPesata(eventi.slice(-3).map((evento, indice) => {
    const team = evento.scuderie?.[slug];
    const posizioni = Object.entries(team?.gara || {}).filter(([codice]) =>
      team?.garaRegolare?.[codice] !== false).map(([, posizione]) => posizione).filter(Number.isFinite);
    return {
      valore: posizioni.length ? mediaPesata(posizioni.map((posizione) => ({
        valore: Number.isFinite(posizione) ? punteggioPosizione(posizione) : null, peso: 1,
      }))) : null,
      peso: indice + 1,
    };
  }));
}

function calcolaSimilaritaCircuiti(richiesteCorrenti, richiesteConfronto) {
  const dimensioni = circuitiTecnici.dimensioni.filter(
    (dimensione) =>
      Number.isFinite(richiesteCorrenti?.[dimensione]) &&
      Number.isFinite(richiesteConfronto?.[dimensione]),
  );
  if (!dimensioni.length) return 0;

  const pesoTotale = dimensioni.reduce(
    (totale, dimensione) => totale + richiesteCorrenti[dimensione],
    0,
  );
  if (!pesoTotale) return 0;

  const distanzaPesata = dimensioni.reduce(
    (totale, dimensione) =>
      totale +
      Math.abs(
        richiesteCorrenti[dimensione] - richiesteConfronto[dimensione],
      ) *
        richiesteCorrenti[dimensione],
    0,
  );

  return arrotonda(limita(100 - distanzaPesata / pesoTotale));
}

function selezionaCircuitiSimili(garaSlug, eventi, limite = NUMERO_CIRCUITI_SIMILI) {
  const richiesteCorrenti = circuitiTecnici.circuiti[garaSlug]?.richieste;
  if (!richiesteCorrenti) return [];

  return eventi
    .map((evento) => {
      const slug = GARA_SLUG_PER_GRAND_PRIX_ID[evento.grandPrixId];
      const richieste = circuitiTecnici.circuiti[slug]?.richieste;
      if (!slug || slug === garaSlug || !richieste) return null;

      return {
        evento,
        slug,
        nome: evento.etichetta,
        round: evento.round,
        similaritaPercentuale: calcolaSimilaritaCircuiti(
          richiesteCorrenti,
          richieste,
        ),
      };
    })
    .filter(Boolean)
    .sort(
      (primo, secondo) =>
        secondo.similaritaPercentuale - primo.similaritaPercentuale ||
        secondo.round - primo.round,
    )
    .slice(0, limite);
}

function pilotaHaPartecipato(evento, codicePilota) {
  return Object.values(evento.scuderie || {}).some((scuderia) =>
    Object.prototype.hasOwnProperty.call(scuderia.gara || {}, codicePilota) ||
    Object.prototype.hasOwnProperty.call(scuderia.qualifica || {}, codicePilota),
  );
}

function valutaPrestazioneEvento(posizioneGara, posizioneQualifica) {
  const gara = Number.isFinite(posizioneGara)
    ? punteggioPosizione(posizioneGara)
    : null;
  const qualifica = Number.isFinite(posizioneQualifica)
    ? punteggioPosizione(posizioneQualifica)
    : null;

  if (gara === null) return qualifica;
  if (qualifica === null) return gara;
  return gara * 0.7 + qualifica * 0.3;
}

function valutaRisultatiCircuitiSimili(
  circuitiSimili,
  pilotaSlug,
  codicePilota,
  scuderiaSlug,
) {
  const campioni = circuitiSimili.map(({ evento, similaritaPercentuale }) => {
    const risultatoPilota = evento.piloti?.[pilotaSlug];
    const haPartecipato = pilotaHaPartecipato(evento, codicePilota);
    const risultatoScuderia = evento.scuderie?.[scuderiaSlug];
    const codiciScuderia = new Set([
      ...Object.keys(risultatoScuderia?.gara || {}),
      ...Object.keys(risultatoScuderia?.qualifica || {}),
    ]);
    const prestazioniScuderia = [...codiciScuderia]
      .map((codice) =>
        valutaPrestazioneEvento(
          risultatoScuderia?.garaRegolare?.[codice] === false ? null : risultatoScuderia?.gara?.[codice],
          risultatoScuderia?.qualifica?.[codice],
        ),
      )
      .filter(Number.isFinite)
      .sort((prima, seconda) => seconda - prima);
    const valoreScuderia = prestazioniScuderia.length
      ? prestazioniScuderia.length === 1
        ? prestazioniScuderia[0]
        : prestazioniScuderia[0] * 0.6 + prestazioniScuderia[1] * 0.4
      : null;
    const valorePilota = haPartecipato
      ? valutaPrestazioneEvento(
          risultatoPilota?.garaRegolare === false ? null : risultatoPilota?.gara,
          risultatoPilota?.qualifica,
        )
      : null;

    const valore = Number.isFinite(valorePilota)
      ? Number.isFinite(valoreScuderia)
        ? valorePilota * 0.6 + valoreScuderia * 0.4
        : valorePilota
      : valoreScuderia;

    return {
      valore,
      peso: similaritaPercentuale ** 2,
    };
  });

  return arrotonda(mediaPesata(campioni));
}

// Match esplicito delle caratteristiche, non della sola parola "aggiornamento".
const CARATTERISTICHE_AGGIORNAMENTI = {
  efficienzaAerodinamica: /efficienza aerodinamica|riduzion[^.]*drag|resistenza all.avanzamento|basso carico/,
  potenzaDeployment: /potenza|deployment|recupero (?:di )?energia|erogazione/,
  curvaLenta: /curve? lent[ae]|bassa velocita/,
  curvaMedia: /curve? medi[ae]|media velocita/,
  curvaVeloce: /curve? veloc[ei]|alta velocita|curve in appoggio/,
  trazione: /trazione/,
  frenata: /frenata|staccata/,
  cordoli: /cordoli/,
  gestioneGomme: /gestione (?:delle )?gomme|degrado|pneumatici/,
  stabilitaAssetto: /stabilita|bilanciamento|assetto/,
};

function aggiornamentoPertinente(testo, richieste) {
  const frasi = normalizzaTesto(testo).split(/[.!?;]/).filter(
    (frase) => !/\bnon\b|nessun|senza benefici/.test(frase),
  );
  return Object.entries(CARATTERISTICHE_AGGIORNAMENTI).some(
    ([dimensione, espressione]) => richieste[dimensione] >= 85 &&
      frasi.some((frase) => espressione.test(frase)),
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
  const verificato = analisi?.overallSemantici?.campi?.risultatiGara;
  if (verificato) return { campione: verificato.campione,
    valore: Number.isFinite(verificato.overall) ? verificato.overall : 50 };
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
      : 50,
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
  const fondoGriglia = /(?:fondo|fine) della griglia|pit lane/.test(testo);

  return {
    posizioni,
    valore: fondoGriglia ? 0 : posizioni === null ? 25 : limita(100 - posizioni * 10),
  };
}

function valutaPenalitaFia(decisioni, numeroVettura) {
  const pertinenti = (decisioni || []).filter((voce) =>
    Number(voce.numeroVettura) === Number(numeroVettura),
  );
  if (!pertinenti.length) return null;
  const posizioni = pertinenti.reduce((totale, voce) => totale + (voce.posizioni || 0), 0);
  const partenzaPitLane = pertinenti.some((voce) => voce.partenzaPitLane);
  return {
    posizioni: posizioni || null,
    valore: partenzaPitLane ? 0 : limita(100 - posizioni * 10),
  };
}

function valutaAggiornamentoTesto(testoOriginale, lingua = "it", richieste = {}) {
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
    /non (?:e )?ancora.*ufficial|not yet.*official|pas encore.*officiel|ainda nao.*oficial|todavia no.*oficial|noch nicht.*offiziell/.test(
      testo,
    )
  ) {
    return {
      valore: 50,
      evidenza: 0,
      stato: testi.stati.possibile,
      nota: testi.note.evidenzaBassa,
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

  if (!aggiornamentoPertinente(testo, richieste)) {
    return { valore: 50, evidenza: 0, stato: testi.stati.pocoPertinente, nota: testi.note.pocoPertinente };
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
      valore: 50,
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

  return { valore: 50, evidenza, stato, nota: testi.note.nessunVantaggio };
}

function valutaAggiornamento(testoOriginale, lingua = "it", richieste = {}, _vantaggioEditoriale = null, statoEditoriale = "") {
  const valutazione = valutaAggiornamentoTesto(testoOriginale, lingua, richieste);
  const testi = testiPrevisione(lingua);
  // La disponibilità per vettura può prevalere sul testo generale della squadra.
  // Il voto editoriale non misura il beneficio: resta neutro anche se installato.
  const stato = Object.hasOwn(testi.stati, statoEditoriale) ? testi.stati[statoEditoriale] : valutazione.stato;
  return { ...valutazione, stato, valore: 50, nota: testi.note.nessunVantaggio };
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

function creaFattori(valutazioni, testi, penalita, pesi, indiceBase = 0) {
  const moltiplicatore = penalita ? (100 - PESO_PENALITA) / 100 : 1;
  const fattori = Object.entries(pesi).filter(([, peso]) => peso > 0).map(([chiave, pesoPercentuale]) => {
    const valutazione = arrotonda(limita(valutazioni[chiave]), 2);
    const pesoEffettivo = arrotonda(pesoPercentuale * moltiplicatore, 2);
    return {
      chiave,
      nome: testi.fattori[chiave],
      pesoPercentuale: pesoEffettivo,
      valutazione,
      contributo: arrotonda((valutazione * pesoEffettivo) / 100, 3),
    };
  });

  if (penalita) {
    fattori.push({
      chiave: "penalita",
      nome: testi.fattori.penalita,
      pesoPercentuale: PESO_PENALITA,
      valutazione: arrotonda(indiceBase * penalita.valore / 100, 2),
      contributo: arrotonda(indiceBase * penalita.valore * PESO_PENALITA / 10000, 3),
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
  meteo = null,
  datiLiveFia = null,
}) {
  const testi = testiPrevisione(lingua);
  const profiloCircuito = creaProfiloCircuito(gara.slug, scuderie);
  const richieste = Object.fromEntries(
    (profiloCircuito?.richieste || []).map(({ dimensione, valore }) => [dimensione, valore]),
  );
  const compatibilitaTecniche = new Map(
    (profiloCircuito?.compatibilita || []).map(
      ({ scuderia, indice }) => [scuderia.slug, indice],
    ),
  );
  // Il servizio è usato anche nelle ricostruzioni: escludi il GP target e i successivi.
  const eventi = (snapshot.andamento2026?.eventi || []).filter((evento) =>
    !Number.isFinite(gara.ordineCalendario) || evento.round < gara.ordineCalendario)
    .slice().sort((a, b) => (a.round || 0) - (b.round || 0));
  const circuitiSimili = selezionaCircuitiSimili(gara.slug, eventi);
  const analisiPilotaPerSlug = new Map(
    analisiPiloti.map((analisi) => [analisi.pilota.slug, analisi]),
  );
  const analisiScuderiaPerSlug = new Map(
    analisiScuderie.map((analisi) => [analisi.scuderia.slug, analisi]),
  );
  const pilotiPartecipanti = piloti.filter((pilota) =>
    analisiPilotaPerSlug.has(pilota.slug),
  );
  const pesi = meteo ? PESI : PESI_SENZA_METEO;
  const probabilitaPioggia = meteo?.probabilitaPioggiaPercentuale || 0;
  const pilotiPerScuderia = new Map();
  for (const analisi of analisiPiloti) {
    const slug = analisi.scuderia?.slug || analisi.pilota.scuderia?.slug;
    if (!pilotiPerScuderia.has(slug)) pilotiPerScuderia.set(slug, []);
    pilotiPerScuderia.get(slug).push(statisticheContesto.piloti[analisi.pilota.slug]);
  }
  const scuderiaPerSlug = new Map(scuderie.map((scuderia) => [scuderia.slug, scuderia]));
  const massimoPuntiPiloti = Math.max(
    ...pilotiPartecipanti.map((pilota) => pilota.classifica2026.punti),
    0,
  );
  const massimoVittoriePiloti = Math.max(
    ...pilotiPartecipanti.map((pilota) => pilota.classifica2026.vittorie),
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

  const classifica = pilotiPartecipanti.map((pilota) => {
    const analisiPilota = analisiPilotaPerSlug.get(pilota.slug);
    const scuderiaSlug = analisiPilota.scuderia?.slug || pilota.scuderia.slug;
    const scuderia = scuderiaPerSlug.get(scuderiaSlug);
    const analisiScuderia = analisiScuderiaPerSlug.get(scuderiaSlug);
    const gare2026 = risultatiPilota(eventi, pilota.slug, "gara");
    const qualifiche2026 = risultatiPilota(eventi, pilota.slug, "qualifica");
    const storico = valutaStorico(analisiPilota);
    const penalitaEditoriale = valutaPenalita(analisiPilota?.penalita);
    const penalitaUfficiale = valutaPenalitaFia(datiLiveFia?.penalitaGriglia, pilota.numero);
    const penalita = penalitaUfficiale &&
      (!penalitaEditoriale || penalitaUfficiale.valore <= penalitaEditoriale.valore)
      ? penalitaUfficiale : penalitaEditoriale;
    const aggiornamento = valutaAggiornamento(
      analisiPilota?.aggiornamentiInArrivo ||
        analisiScuderia?.aggiornamentiInArrivo,
      lingua,
      richieste,
      analisiPilota?.vantaggioAggiornamentiTecnici,
      analisiPilota?.statoAggiornamentiTecnici,
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
        pilotiPartecipanti.length,
      ),
      compatibilitaVetturaCircuito:
        compatibilitaTecniche.get(scuderiaSlug) ??
        valutaCompatibilitaVettura(andamentoScuderia, valutazioneCircuitoScuderia),
      risultatiCircuitiSimili: valutaRisultatiCircuitiSimili(
        circuitiSimili,
        pilota.slug,
        pilota.codice,
        scuderiaSlug,
      ),
      aggiornamentiTecnici: aggiornamento.valore,
      qualifica2026: valutaRisultatiRecenti(qualifiche2026, 5),
      andamentoScuderiaRecente: valutaAndamentoScuderia(eventi, scuderiaSlug),
      storicoPersonale: storico.valore,
      passoGaraRecente: valutaRisultatiRecenti(gare2026, 3),
      meteoEsperienzaPilota: 50 +
        (valutaEsperienzaBagnato(statisticheContesto.piloti[pilota.slug]) - 50) *
        probabilitaPioggia / 100,
      meteoScuderia: 50 +
        (combinaEsperienzaBagnato(pilotiPerScuderia.get(scuderiaSlug) || []) - 50) *
        probabilitaPioggia / 100,
    };
    const fattoriBase = creaFattori(valutazioni, testi, null, pesi);
    const indiceBase = fattoriBase.reduce((totale, fattore) => totale + fattore.contributo, 0);
    const fattori = penalita
      ? creaFattori(valutazioni, testi, penalita, pesi, indiceBase)
      : fattoriBase;
    const confidenzaCodice = livelloConfidenza(
      gara,
      storico,
      compatibilitaPilota,
    );

    return {
      indice: (
        penalita
          ? indiceBase * ((100 - PESO_PENALITA) / 100) +
              indiceBase * penalita.valore / 100 * (PESO_PENALITA / 100)
          : indiceBase
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
    modello: "statistico-editoriale-v4.1",
    meteo,
    circuitiSimili: circuitiSimili.map(
      ({ slug, nome, round, similaritaPercentuale }) => ({
        slug,
        nome,
        round,
        similaritaPercentuale,
      }),
    ),
    pesi: Object.entries(pesi).filter(([, peso]) => peso > 0).map(([chiave, pesoPercentuale]) => ({
      chiave,
      nome: testi.fattori[chiave],
      pesoPercentuale,
    })),
    classifica: classifica.map((elemento, indice) => ({
      posizione: indice + 1,
      ...elemento,
      indice: arrotonda(elemento.indice),
    })),
  };
}

module.exports = {
  NOMI_FATTORI,
  PESI,
  PESO_PENALITA,
  calcolaSimilaritaCircuiti,
  creaClassificaPrevisionale,
  selezionaCircuitiSimili,
  valutaAggiornamento,
  valutaAndamentoScuderia,
  valutaCompatibilitaVettura,
  valutaPenalita,
  valutaPenalitaFia,
  valutaRisultatiCircuitiSimili,
};
