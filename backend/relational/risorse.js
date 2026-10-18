// Contratto condiviso tra router e OpenAPI: gli elenchi restano paginati.
module.exports = {
  piloti: { tabella: 'f1_piloti', filtri: [] },
  scuderie: { tabella: 'f1_scuderie', filtri: [] },
  gare: { tabella: 'f1_gare', filtri: ['anno', 'stato'] },
  circuiti: { tabella: 'f1_circuiti', filtri: [] },
  iscrizioni: { tabella: 'f1_iscrizioni', filtri: ['anno', 'gara', 'pilota', 'scuderia'] },
  risultati: { tabella: 'f1_risultati', filtri: ['anno', 'gara', 'pilota', 'scuderia', 'sessione'] },
  metriche: { tabella: 'f1_metriche', filtri: [] },
  valutazioni: { tabella: 'f1_valutazioni', filtri: ['anno', 'metrica', 'gara', 'pilota', 'scuderia'] },
};
