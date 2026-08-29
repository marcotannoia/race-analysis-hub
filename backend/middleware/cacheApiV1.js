const ambiente = require("../config/ambiente");
const cachePubblica = require("./cachePubblica");

module.exports = cachePubblica({
  secondiBrowser: 60,
  secondiCondivisi: ambiente.durataCacheApi,
  massimoVoci: ambiente.massimoVociCacheApi,
});
