const mongoose = require("mongoose");

const garaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    nome: { type: String, required: true, trim: true },
    circuito: { type: String, required: true, trim: true },
    paese: { type: String, required: true, trim: true },
    etichettaExcel: { type: String, required: true, trim: true },
    stagione: { type: Number, required: true },
    ordineAnalisi: { type: Number, required: true },
    ordineCalendario: { type: Number, required: true },
    stato: {
      type: String,
      // "prossima" resta accettato solo per leggere database creati prima
      // della versione API v1. I nuovi aggiornamenti usano "attuale".
      enum: ["conclusa", "attuale", "prossima", "futura"],
      default: "futura",
      index: true,
    },
    conclusaIl: { type: Date, default: null },
    contestoStorico: { type: String, required: true },
    pilotiFavoriti: { type: String, required: true },
    scuderieFavorite: { type: String, required: true },
    outsider: { type: String, required: true },
    potenzialiDifficolta: { type: String, required: true },
    gommeStrategia: { type: String, required: true },
    rischi: { type: String, required: true },
    confidenza: { type: String, required: true },
    traduzioni: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    fonti: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "gare",
  },
);

module.exports = mongoose.model("Gara", garaSchema);
