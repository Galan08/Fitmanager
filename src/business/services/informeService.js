// CAPA LÓGICA: parámetros y validación de los informes.
const { informeRepo } = require('../../data/repositories/informeRepository');
const { lookupRepo } = require('../../data/repositories/lookupRepository');
const { badRequest, notFound } = require('../errors');
const v = require('../validators');

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

module.exports = {
  catalogo: () => informeRepo.catalogo(),
  resumen: () => informeRepo.resumen(),
  async ejecutar(key, query) {
    if (!informeRepo.existe(key)) throw notFound('Informe no encontrado');
    const desde = query.desde || addDays(-180);
    const hasta = query.hasta || addDays(30);
    const dias = Number(query.dias || 15);
    v.isDate(desde, 'Desde');
    v.isDate(hasta, 'Hasta');
    if (desde > hasta) throw badRequest('La fecha "Desde" no puede ser posterior a "Hasta"');
    if (!Number.isInteger(dias) || dias < 1 || dias > 365) throw badRequest('Los días deben estar entre 1 y 365');
    return informeRepo.ejecutar(key, { desde, hasta, dias });
  },
  lookup(name) {
    if (!lookupRepo[name]) throw notFound('Lista no encontrada');
    return lookupRepo[name]();
  },
};
