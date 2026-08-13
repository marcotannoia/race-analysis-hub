const mongoose = require("mongoose");

const classificaSchema = new mongoose.Schema(
  {
    posizione: { type: Number, required: true },
    punti: { type: Number, required: true },
    vittorie: { type: Number, required: true },
  },
  { _id: false },
);

const pilotaSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    nome: { type: String, required: true, trim: true },
    codice: { type: String, required: true, unique: true, trim: true },
    numero: { type: String, required: true, trim: true },
    nazionalita: { type: String, required: true, trim: true },
    nazionalitaIso2: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{2}$/,
    },
    nazionalitaIso3: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },
    scuderia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scuderia",
      required: true,
    },
    classifica2026: { type: classificaSchema, required: true },
    traduzioni: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "piloti",
  },
);

module.exports = mongoose.model("Pilota", pilotaSchema);
