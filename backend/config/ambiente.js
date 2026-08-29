function primaVariabileDisponibile(...nomi) {
  for (const nome of nomi) {
    const valore = process.env[nome]?.trim()

    if (valore) {
      return valore
    }
  }

  return undefined
}

function leggiIntero(valore, valorePredefinito, minimo, massimo) {
  if (!valore) {
    return valorePredefinito
  }

  const numero = Number.parseInt(valore, 10)

  if (!Number.isInteger(numero) || numero < minimo || numero > massimo) {
    throw new Error(`Configurazione numerica non valida: ${valore}`)
  }

  return numero
}

function leggiBooleano(valore, valorePredefinito) {
  if (valore === undefined) {
    return valorePredefinito
  }

  const valoreNormalizzato = valore.toLowerCase()

  if (!["true", "false"].includes(valoreNormalizzato)) {
    throw new Error(`Configurazione booleana non valida: ${valore}`)
  }

  return valoreNormalizzato === "true"
}

const modalita = process.env.NODE_ENV || "development"
const produzione = modalita === "production"
const valoreFrontend = primaVariabileDisponibile("FRONTEND_URL", "frontend_url")

const ambiente = Object.freeze({
  modalita,
  produzione,
  mongoUrl: primaVariabileDisponibile("MONGO_URL", "mongo_url"),
  nomeDatabase:
    primaVariabileDisponibile("DATABASE_NAME", "nome_database") || "f1_stats",
  porta: leggiIntero(
    primaVariabileDisponibile("PORT", "porta"),
    5002,
    1,
    65535,
  ),
  host: primaVariabileDisponibile("HOST") || (produzione ? "0.0.0.0" : "127.0.0.1"),
  originiFrontend: (valoreFrontend || (produzione ? "" : "http://localhost:5173"))
    .split(",")
    .map((origine) => origine.trim().replace(/\/$/, ""))
    .filter(Boolean),
  trustProxy: leggiIntero(
    primaVariabileDisponibile("TRUST_PROXY"),
    produzione ? 1 : 0,
    0,
    10,
  ),
  limiteRichieste: leggiIntero(
    primaVariabileDisponibile("RATE_LIMIT_MAX"),
    1000,
    10,
    10000,
  ),
  durataCacheApi: leggiIntero(
    primaVariabileDisponibile("API_CACHE_TTL_SECONDS"),
    300,
    30,
    3600,
  ),
  massimoVociCacheApi: leggiIntero(
    primaVariabileDisponibile("API_CACHE_MAX_ENTRIES"),
    500,
    50,
    5000,
  ),
  serviFrontend: leggiBooleano(
    primaVariabileDisponibile("SERVE_FRONTEND"),
    produzione,
  ),
  monitorFiaAbilitato: leggiBooleano(
    primaVariabileDisponibile("FIA_MONITOR_ENABLED"),
    produzione,
  ),
})

module.exports = ambiente
