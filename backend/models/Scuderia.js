const mongoose = require("mongoose");

const classificaSchema = new mongoose.Schema(
  {
    posizione: { type: Number, required: true },
    punti: { type: Number, required: true },
    vittorie: { type: Number, required: true },
  },
  { _id: false },
);

const denominazioniStoricheSchema = new mongoose.Schema(
  {
    2023: { type: String, default: null },
    2024: { type: String, default: null },
    2025: { type: String, default: null },
  },
  { _id: false },
);

const scuderiaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    nome: { type: String, required: true, trim: true },
    nomeClassifica: { type: String, required: true, trim: true },
    abbreviazione: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{2,3}$/,
    },
    colore: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^#[0-9A-F]{6}$/,
    },
    nazionalita: { type: String, required: true, trim: true },
    denominazioniStoriche: {
      type: denominazioniStoricheSchema,
      required: true,
    },
    classifica2026: { type: classificaSchema, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "scuderie",
  },
);

module.exports = mongoose.model("Scuderia", scuderiaSchema);
