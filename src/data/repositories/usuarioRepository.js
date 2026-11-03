const { pool } = require('../../config/db');

const usuarioRepo = {
  // Busca por usuario, documento o correo (en ese orden de prioridad).
  async findByLogin(login) {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_persona, u.username, u.password_hash, r.nombre AS rol,
              CONCAT(p.nombres,' ',p.apellidos) AS nombre
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol JOIN persona p ON p.id_persona = u.id_persona
        WHERE u.username = $1 OR p.documento_identidad = $1 OR LOWER(p.email) = LOWER($1)
        ORDER BY u.username = $1 DESC, p.documento_identidad = $1 DESC LIMIT 1`, [login]);
    return rows[0] || null;
  },
};
module.exports = { usuarioRepo };
