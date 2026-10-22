class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const badRequest = (m) => new AppError(400, m);
const notFound = (m = 'Registro no encontrado') => new AppError(404, m);
const conflict = (m) => new AppError(409, m);
const forbidden = (m = 'No tienes permiso para esta acción') => new AppError(403, m);
module.exports = { AppError, badRequest, notFound, conflict, forbidden };
