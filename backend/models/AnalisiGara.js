const mongoose = require("mongoose");

const testiAnnuali = {
  type: mongoose.Schema.Types.Mixed,
  required: true,
};

const edizioneStoricaSchema = new mongoose.Schema(
  {
    stagione: { type: Number, required: true },
    posizioneGara: { type: String, required: true, trim: true },
    posizioneQualifica: { type: String, required: true, trim: true },
    notaRisultato: { type: String, default: "", trim: true },
    passoGara: { type: String, default: "", trim: true },
    gomme: { type: String, default: "", trim: true },
    affidabilita: { type: String, default: "", trim: true },
    traduzioni: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false },
);

const analisiGaraSchema = new mongoose.Schema(
  {
    pilota: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pilota",
      required: true,
    },
    gara: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gara",
      required: true,
    },
    scuderia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scuderia",
      required: true,
    },
    posizioniStoriche: testiAnnuali,
    spiegazionePosizioni: testiAnnuali,
    qualificheStoriche: testiAnnuali,
    andamentoPerAnno: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    passoGara: testiAnnuali,
    gomme: testiAnnuali,
    considerazioni: { type: String, required: true },
    penalita: { type: String, default: "" },
    affidabilita: { type: String, default: "" },
    aggiornamentiInArrivo: { type: String, default: "" },
    traduzioni: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    storicoEdizioni: { type: [edizioneStoricaSchema], default: [] },
    fonti: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "analisiGare",
  },
);

analisiGaraSchema.index({ pilota: 1, gara: 1 }, { unique: true });
analisiGaraSchema.index({ gara: 1, scuderia: 1 });

module.exports = mongoose.model("AnalisiGara", analisiGaraSchema);
