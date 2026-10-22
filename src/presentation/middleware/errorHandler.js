// Traduce errores de negocio y de PostgreSQL a respuestas HTTP claras para el usuario.
const detalleUnico = (e) => (e.detail || '').match(/Key \((\w+)\)/)?.[1] || e.constraint || 'dato duplicado';

const PG = {
  '23505': [409, (e) => `Ya existe un registro con ese valor único (${detalleUnico(e)})`],
  '23503': [409, (e) => (/still referenced/.test(e.detail || '')
    ? 'No se puede eliminar: el registro está relacionado con otros datos (integridad referencial)'
    : 'Uno de los datos relacionados no existe')],
  '23514': [400, () => 'Algún valor no cumple las restricciones permitidas'],
  '23502': [400, (e) => `Falta un dato obligatorio${e.column ? ` (${e.column})` : ''}`],
  '22001': [400, () => 'Un campo excede la longitud permitida'],
  '22P02': [400, () => 'Un valor tiene un formato inválido'],
  '22003': [400, () => 'Un valor está fuera de rango'],
  '22007': [400, () => 'Una fecha tiene un formato inválido'],
  '22008': [400, () => 'Una fecha está fuera de rango'],
};

// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code && PG[err.code]) {
    const [status, msg] = PG[err.code];
    return res.status(status).json({ error: msg(err) });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
