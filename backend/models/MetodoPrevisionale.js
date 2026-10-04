const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  versione: { type: String, required: true, unique: true },
  stato: { type: String, enum: ["sperimentale_non_promosso", "validato"], required: true },
  pesi: { type: mongoose.Schema.Types.Mixed, required: true },
  protocollo: { type: mongoose.Schema.Types.Mixed, required: true },
  backtest: { type: mongoose.Schema.Types.Mixed, required: true },
  fonti: [{ type: String }],
}, { collection: "metodiPrevisionali", timestamps: true, versionKey: false });

module.exports = mongoose.model("MetodoPrevisionale", schema);
