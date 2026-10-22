const { badRequest } = require('./errors');

const blank = (v) => v === undefined || v === null || String(v).trim() === '';

/** Verifica que los campos obligatorios existan. labels: { campo: 'Nombre legible' } */
function required(data, labels) {
  for (const [k, label] of Object.entries(labels)) {
    if (blank(data[k])) throw badRequest(`El campo "${label}" es obligatorio`);
  }
}
function positive(value, label) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) throw badRequest(`"${label}" debe ser un número mayor a 0`);
}
function nonNegative(value, label) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0) throw badRequest(`"${label}" no puede ser negativo`);
}
function oneOf(value, list, label) {
  if (!list.includes(value)) throw badRequest(`"${label}" debe ser: ${list.join(', ')}`);
}
function isDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(value)) || Number.isNaN(Date.parse(String(value).slice(0, 10)))) {
    throw badRequest(`"${label}" no es una fecha válida (AAAA-MM-DD)`);
  }
}
function isEmail(value) {
  if (!blank(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw badRequest('El correo electrónico no es válido');
}
/** Normaliza datetime-local ('2026-10-22T07:00') a formato SQL (AAAA-MM-DD HH:mm:ss). */
const toSqlDateTime = (v) => String(v).replace('T', ' ').slice(0, 19).padEnd(19, ':00').slice(0, 19);

module.exports = { blank, required, positive, nonNegative, oneOf, isDate, isEmail, toSqlDateTime };
