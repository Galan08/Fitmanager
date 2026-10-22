const { pool } = require('../../config/db');

const usuarioRepo = {
  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.id_persona, u.username, u.password_hash, r.nombre AS rol,
              CONCAT(p.nombres,' ',p.apellidos) AS nombre
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol JOIN persona p ON p.id_persona = u.id_persona
        WHERE u.username = ?`, [username]);
    return rows[0] || null;
  },
};
module.exports = { usuarioRepo };
