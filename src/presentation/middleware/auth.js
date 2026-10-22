// CAPA DE PRESENTACIÓN (API): autenticación JWT y autorización por rol.
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { AppError } = require('../../business/errors');

function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'Sesión no iniciada'));
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new AppError(401, 'Sesión expirada o inválida'));
  }
}

/** guard({ read: [...roles], write: [...roles] }): el Administrador siempre tiene acceso. */
const guard = ({ read = [], write = [] } = {}) => (req, _res, next) => {
  const roles = ['GET', 'HEAD'].includes(req.method) ? read : write;
  if (req.user.rol === 'Administrador' || roles.includes(req.user.rol)) return next();
  next(new AppError(403, 'Tu rol no tiene permiso para esta acción'));
};

module.exports = { authenticate, guard };
