// Keep model composition on the server, including when returning cached forecasts.
function previsionePubblica(value) {
  if (Array.isArray(value)) return value.map(previsionePubblica);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['pesi', 'fattori', 'dettagliFattori', 'pesoPercentuale', 'contributo'].includes(key))
    .map(([key, item]) => [key, previsionePubblica(item)]));
}

module.exports = previsionePubblica;
