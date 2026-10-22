// CAPA LÓGICA: autenticación (login con JWT).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { usuarioRepo } = require('../../data/repositories/usuarioRepository');
const { AppError } = require('../errors');

module.exports = {
  async login(username, password) {
    const u = username ? await usuarioRepo.findByUsername(String(username).trim()) : null;
    if (!u || !(await bcrypt.compare(String(password || ''), u.password_hash))) {
      throw new AppError(401, 'Usuario o contraseña incorrectos');
    }
    const user = { id_usuario: u.id_usuario, id_persona: u.id_persona, username: u.username, nombre: u.nombre, rol: u.rol };
    const token = jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpires });
    return { token, user };
  },
};
