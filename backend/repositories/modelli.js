const { usaPostgres } = require('../config/database');
const pg = require('./postgresCompat');
const names = ['Gara', 'Pilota', 'Scuderia', 'AnalisiGara', 'AnalisiScuderia', 'DatiLiveFia'];
module.exports = Object.fromEntries(names.map((name) => [name,
  usaPostgres() ? pg.model(name) : require(`../models/${name}`)]));
