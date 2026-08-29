const TESTI_PREVISIONI = Object.freeze({
  it: {
    fattori: {
      andamento2026: "Andamento 2026",
      compatibilitaVetturaCircuito: "Compatibilità vettura-circuito",
      aggiornamentiTecnici: "Aggiornamenti tecnici pertinenti",
      confidenzaPilotaCircuito: "Confidenza pilota-circuito",
      qualifica2026: "Qualifica 2026",
      scuderia2026: "Andamento scuderia 2026",
      storicoPersonale: "Storico personale",
      passoGaraRecente: "Andamento negli ultimi 3 GP",
      gestioneGomme: "Gestione gomme",
      affidabilitaERischi: "Affidabilità e rischi",
      penalita: "Penalità in griglia",
    },
    stati: {
      nessunaInformazione: "Nessuna informazione",
      vantaggioNonRilevato: "Vantaggio non rilevato",
      pocoPertinente: "Poco pertinente",
      possibile: "Possibile, da verificare",
      giaIntrodotto: "Già introdotto, effetto da confermare",
      nessunPacchetto: "Nessun pacchetto confermato",
      confermato: "Confermato per il circuito",
      annunciato: "Annunciato, da verificare",
      soloAffidabilita: "Intervento di affidabilità",
    },
    note: {
      nessunVantaggio: "Non viene attribuito alcun vantaggio tecnico.",
      vantaggioAssente: "L'aggiornamento non ha mostrato un beneficio reale.",
      pocoPertinente:
        "Il possibile beneficio riguarda aspetti poco rilevanti per questo circuito.",
      nessunPacchetto:
        "Le migliorie ipotetiche non vengono conteggiate come vantaggio.",
      evidenzaAlta:
        "Il vantaggio è pesato in base ad ampiezza e pertinenza con le caratteristiche della pista.",
      evidenzaBassa:
        "Il beneficio resta ridotto finché componenti ed effetto non sono verificati in pista.",
      soloAffidabilita:
        "L'intervento non riceve un bonus prestazionale perché riguarda soltanto l'affidabilità.",
    },
    livelli: { bassa: "bassa", media: "media", alta: "alta" },
    sintesi: (primo, secondo) =>
      `I fattori più favorevoli sono ${primo} e ${secondo}.`,
  },
  en: {
    fattori: {
      andamento2026: "2026 driver performance",
      compatibilitaVetturaCircuito: "Car-circuit compatibility",
      aggiornamentiTecnici: "Relevant technical upgrades",
      confidenzaPilotaCircuito: "Driver-circuit confidence",
      qualifica2026: "2026 qualifying",
      scuderia2026: "2026 team performance",
      storicoPersonale: "Personal track record",
      passoGaraRecente: "Trend over the last 3 Grands Prix",
      gestioneGomme: "Tyre management",
      affidabilitaERischi: "Reliability and risks",
      penalita: "Grid penalty",
    },
    stati: {
      nessunaInformazione: "No information available",
      vantaggioNonRilevato: "No benefit observed",
      pocoPertinente: "Limited relevance",
      possibile: "Possible, to be verified",
      giaIntrodotto: "Already introduced, effect to be confirmed",
      nessunPacchetto: "No upgrade package confirmed",
      confermato: "Confirmed for this circuit",
      annunciato: "Announced, to be verified",
      soloAffidabilita: "Reliability-only change",
    },
    note: {
      nessunVantaggio: "No technical advantage is assigned.",
      vantaggioAssente: "The upgrade has not shown a tangible benefit.",
      pocoPertinente:
        "The potential benefit concerns aspects of limited relevance to this circuit.",
      nessunPacchetto:
        "Hypothetical improvements are not counted as an advantage.",
      evidenzaAlta:
        "The advantage is weighted according to its scope and relevance to the circuit characteristics.",
      evidenzaBassa:
        "The benefit remains limited until the components and their effect are verified on track.",
      soloAffidabilita:
        "No performance bonus is assigned because the change only concerns reliability.",
    },
    livelli: { bassa: "low", media: "medium", alta: "high" },
    sintesi: (primo, secondo) =>
      `The strongest factors are ${primo} and ${secondo}.`,
  },
  fr: {
    fattori: {
      andamento2026: "Performance du pilote en 2026",
      compatibilitaVetturaCircuito: "Compatibilité voiture-circuit",
      aggiornamentiTecnici: "Évolutions techniques pertinentes",
      confidenzaPilotaCircuito: "Confiance pilote-circuit",
      qualifica2026: "Qualifications 2026",
      scuderia2026: "Performance de l'écurie en 2026",
      storicoPersonale: "Historique personnel",
      passoGaraRecente: "Tendance sur les 3 derniers Grands Prix",
      gestioneGomme: "Gestion des pneus",
      affidabilitaERischi: "Fiabilité et risques",
      penalita: "Pénalité sur la grille",
    },
    stati: {
      nessunaInformazione: "Aucune information disponible",
      vantaggioNonRilevato: "Aucun avantage constaté",
      pocoPertinente: "Pertinence limitée",
      possibile: "Possible, à vérifier",
      giaIntrodotto: "Déjà introduite, effet à confirmer",
      nessunPacchetto: "Aucun ensemble d'évolutions confirmé",
      confermato: "Confirmé pour ce circuit",
      annunciato: "Annoncé, à vérifier",
      soloAffidabilita: "Modification de fiabilité uniquement",
    },
    note: {
      nessunVantaggio: "Aucun avantage technique n'est attribué.",
      vantaggioAssente: "L'évolution n'a pas montré de bénéfice réel.",
      pocoPertinente:
        "Le bénéfice potentiel concerne des aspects peu pertinents pour ce circuit.",
      nessunPacchetto:
        "Les améliorations hypothétiques ne sont pas comptabilisées comme un avantage.",
      evidenzaAlta:
        "L'avantage est pondéré selon son ampleur et sa pertinence pour les caractéristiques du circuit.",
      evidenzaBassa:
        "Le bénéfice reste limité tant que les composants et leur effet ne sont pas vérifiés en piste.",
      soloAffidabilita:
        "Aucun bonus de performance n'est attribué, car la modification concerne uniquement la fiabilité.",
    },
    livelli: { bassa: "faible", media: "moyenne", alta: "élevée" },
    sintesi: (primo, secondo) =>
      `Les facteurs les plus favorables sont ${primo} et ${secondo}.`,
  },
  pt: {
    fattori: {
      andamento2026: "Desempenho do piloto em 2026",
      compatibilitaVetturaCircuito: "Compatibilidade carro-circuito",
      aggiornamentiTecnici: "Atualizações técnicas relevantes",
      confidenzaPilotaCircuito: "Confiança piloto-circuito",
      qualifica2026: "Qualificação de 2026",
      scuderia2026: "Desempenho da equipa em 2026",
      storicoPersonale: "Histórico pessoal",
      passoGaraRecente: "Tendência nos últimos 3 Grandes Prémios",
      gestioneGomme: "Gestão dos pneus",
      affidabilitaERischi: "Fiabilidade e riscos",
      penalita: "Penalização na grelha",
    },
    stati: {
      nessunaInformazione: "Nenhuma informação disponível",
      vantaggioNonRilevato: "Nenhum benefício observado",
      pocoPertinente: "Relevância limitada",
      possibile: "Possível, a verificar",
      giaIntrodotto: "Já introduzida, efeito a confirmar",
      nessunPacchetto: "Nenhum pacote de atualizações confirmado",
      confermato: "Confirmado para este circuito",
      annunciato: "Anunciado, a verificar",
      soloAffidabilita: "Alteração apenas de fiabilidade",
    },
    note: {
      nessunVantaggio: "Não é atribuída qualquer vantagem técnica.",
      vantaggioAssente: "A atualização não demonstrou um benefício real.",
      pocoPertinente:
        "O possível benefício diz respeito a aspetos pouco relevantes para este circuito.",
      nessunPacchetto:
        "As melhorias hipotéticas não são contabilizadas como vantagem.",
      evidenzaAlta:
        "A vantagem é ponderada de acordo com a dimensão e a relevância para as características do circuito.",
      evidenzaBassa:
        "O benefício permanece reduzido até que os componentes e o seu efeito sejam verificados em pista.",
      soloAffidabilita:
        "Não é atribuído qualquer bónus de desempenho, porque a alteração diz respeito apenas à fiabilidade.",
    },
    livelli: { bassa: "baixa", media: "média", alta: "alta" },
    sintesi: (primo, secondo) =>
      `Os fatores mais favoráveis são ${primo} e ${secondo}.`,
  },
  es: {
    fattori: {
      andamento2026: "Rendimiento del piloto en 2026",
      compatibilitaVetturaCircuito: "Compatibilidad coche-circuito",
      aggiornamentiTecnici: "Actualizaciones técnicas relevantes",
      confidenzaPilotaCircuito: "Confianza piloto-circuito",
      qualifica2026: "Clasificación de 2026",
      scuderia2026: "Rendimiento del equipo en 2026",
      storicoPersonale: "Historial personal",
      passoGaraRecente: "Tendencia en los últimos 3 Grandes Premios",
      gestioneGomme: "Gestión de neumáticos",
      affidabilitaERischi: "Fiabilidad y riesgos",
      penalita: "Penalización en parrilla",
    },
    stati: {
      nessunaInformazione: "No hay información disponible",
      vantaggioNonRilevato: "No se ha observado ninguna ventaja",
      pocoPertinente: "Relevancia limitada",
      possibile: "Posible, pendiente de verificación",
      giaIntrodotto: "Ya introducida, efecto pendiente de confirmación",
      nessunPacchetto: "No hay ningún paquete de mejoras confirmado",
      confermato: "Confirmado para este circuito",
      annunciato: "Anunciado, pendiente de verificación",
      soloAffidabilita: "Cambio exclusivo de fiabilidad",
    },
    note: {
      nessunVantaggio: "No se asigna ninguna ventaja técnica.",
      vantaggioAssente: "La actualización no ha mostrado un beneficio real.",
      pocoPertinente:
        "El posible beneficio afecta a aspectos poco relevantes para este circuito.",
      nessunPacchetto:
        "Las mejoras hipotéticas no se contabilizan como una ventaja.",
      evidenzaAlta:
        "La ventaja se pondera según su alcance y relevancia para las características del circuito.",
      evidenzaBassa:
        "El beneficio sigue siendo limitado hasta que los componentes y su efecto se verifiquen en pista.",
      soloAffidabilita:
        "No se asigna ninguna bonificación de rendimiento porque el cambio solo afecta a la fiabilidad.",
    },
    livelli: { bassa: "baja", media: "media", alta: "alta" },
    sintesi: (primo, secondo) =>
      `Los factores más favorables son ${primo} y ${secondo}.`,
  },
  de: {
    fattori: {
      andamento2026: "Fahrerleistung 2026",
      compatibilitaVetturaCircuito: "Fahrzeug-Strecken-Kompatibilität",
      aggiornamentiTecnici: "Relevante technische Updates",
      confidenzaPilotaCircuito: "Fahrer-Strecken-Vertrauen",
      qualifica2026: "Qualifying 2026",
      scuderia2026: "Teamleistung 2026",
      storicoPersonale: "Persönliche Streckenbilanz",
      passoGaraRecente: "Trend der letzten 3 Grand Prix",
      gestioneGomme: "Reifenmanagement",
      affidabilitaERischi: "Zuverlässigkeit und Risiken",
      penalita: "Startplatzstrafe",
    },
    stati: {
      nessunaInformazione: "Keine Informationen verfügbar",
      vantaggioNonRilevato: "Kein Vorteil erkennbar",
      pocoPertinente: "Begrenzte Relevanz",
      possibile: "Möglich, noch zu überprüfen",
      giaIntrodotto: "Bereits eingeführt, Wirkung noch zu bestätigen",
      nessunPacchetto: "Kein Update-Paket bestätigt",
      confermato: "Für diese Strecke bestätigt",
      annunciato: "Angekündigt, noch zu überprüfen",
      soloAffidabilita: "Reine Zuverlässigkeitsänderung",
    },
    note: {
      nessunVantaggio: "Es wird kein technischer Vorteil angerechnet.",
      vantaggioAssente: "Das Update hat keinen tatsächlichen Vorteil gezeigt.",
      pocoPertinente:
        "Der mögliche Vorteil betrifft Aspekte, die für diese Strecke wenig relevant sind.",
      nessunPacchetto:
        "Hypothetische Verbesserungen werden nicht als Vorteil gewertet.",
      evidenzaAlta:
        "Der Vorteil wird entsprechend seinem Umfang und seiner Relevanz für die Streckencharakteristik gewichtet.",
      evidenzaBassa:
        "Der Vorteil bleibt begrenzt, bis die Komponenten und ihre Wirkung auf der Strecke überprüft wurden.",
      soloAffidabilita:
        "Es wird kein Leistungsvorteil angerechnet, da die Änderung nur die Zuverlässigkeit betrifft.",
    },
    livelli: { bassa: "niedrig", media: "mittel", alta: "hoch" },
    sintesi: (primo, secondo) =>
      `Die günstigsten Faktoren sind ${primo} und ${secondo}.`,
  },
});

function testiPrevisione(lingua = "it") {
  return TESTI_PREVISIONI[lingua] || TESTI_PREVISIONI.it;
}

module.exports = { TESTI_PREVISIONI, testiPrevisione };
