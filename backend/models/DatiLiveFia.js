const mongoose = require("mongoose");

const documentoSchema = new mongoose.Schema(
  {
    documentoUrl: { type: String, required: true, trim: true },
    pubblicatoIl: { type: Date, default: null },
    acquisitoIl: { type: Date, required: true },
    sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  },
  { _id: false },
);

const aggiornamentoScuderiaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    nomeFia: { type: String, required: true, trim: true },
    nessunAggiornamento: { type: Boolean, required: true },
    componenti: [{ type: String, trim: true }],
    descrizione: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const datiLiveFiaSchema = new mongoose.Schema(
  {
    garaSlug: { type: String, required: true, unique: true, trim: true },
    circuito: {
      type: new mongoose.Schema(
        {
          ...documentoSchema.obj,
          zoneStraightMode: { type: Number, min: 0, required: true },
          rilevamentiOvertakeMode: { type: Number, min: 0, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    aggiornamenti: {
      type: new mongoose.Schema(
        {
          ...documentoSchema.obj,
          scuderie: {
            type: [aggiornamentoScuderiaSchema],
            validate: {
              validator: (valore) => valore.length === 11,
              message: "Il documento deve contenere tutte le 11 scuderie",
            },
            required: true,
          },
        },
        { _id: false },
      ),
      default: null,
    },
    ultimoControlloIl: { type: Date, default: null },
    ultimoErrore: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "dati_live_fia",
  },
);

module.exports = mongoose.model("DatiLiveFia", datiLiveFiaSchema);
