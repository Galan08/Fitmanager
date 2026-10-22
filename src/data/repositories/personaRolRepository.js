// CAPA FÍSICA: personas que cumplen un rol (Cliente, Entrenador, Administrador, Recepcionista).
// Sustituye a la antigua tabla CLIENTE: un cliente = persona + usuario con rol 'Cliente'.
const { pool, insertRow, updateRow } = require('../../config/db');

const PERSONA_COLS = ['documento_identidad', 'nombres', 'apellidos', 'fecha_nacimiento', 'email', 'telefono'];
const pickCols = (data, cols) => Object.fromEntries(cols.filter((c) => data[c] !== undefined).map((c) => [c, data[c] === '' ? null : data[c]]));

class PersonaRolRepository {
  /** @param {string[]} roles roles incluidos; @param {boolean} entrenador une la tabla entrenador */
  constructor(roles, entrenador = false) {
    this.roles = roles;
    this.entrenador = entrenador;
    this.select = `SELECT p.id_persona, p.documento_identidad, p.nombres, p.apellidos,
        CONCAT(p.nombres,' ',p.apellidos) AS nombre_completo, p.fecha_nacimiento, p.email, p.telefono, p.fecha_registro,
        u.id_usuario, u.username, r.nombre AS rol
        ${entrenador ? ', e.id_entrenador, e.id_sede, e.especialidad, s.nombre AS sede' : ''}
      FROM persona p
      JOIN usuario u ON u.id_persona = p.id_persona
      JOIN rol r ON r.id_rol = u.id_rol
      ${entrenador ? 'JOIN entrenador e ON e.id_persona = p.id_persona JOIN sede s ON s.id_sede = e.id_sede' : ''}
      WHERE r.nombre = ANY(?)`;
  }
  async findAll(conn) {
    const [rows] = await (conn || pool).query(`${this.select} ORDER BY p.id_persona DESC`, [this.roles]);
    return rows;
  }
  async findById(id, conn) {
    const [rows] = await (conn || pool).query(`${this.select} AND p.id_persona = ?`, [this.roles, id]);
    return rows[0] || null;
  }
  async rolId(nombre, conn) {
    const [rows] = await (conn || pool).query('SELECT id_rol FROM rol WHERE nombre = ?', [nombre]);
    return rows[0]?.id_rol;
  }
  async create(data, passwordHash, rolNombre, conn) {                       // INSERT persona + usuario (+ entrenador)
    const idPersona = await insertRow(conn, 'persona', pickCols(data, PERSONA_COLS), 'id_persona');
    const idRol = await this.rolId(rolNombre, conn);
    await insertRow(conn, 'usuario', { id_persona: idPersona, id_rol: idRol, username: data.username, password_hash: passwordHash }, 'id_usuario');
    if (this.entrenador) {
      await insertRow(conn, 'entrenador', { id_persona: idPersona, id_sede: data.id_sede, especialidad: data.especialidad || null }, 'id_entrenador');
    }
    return idPersona;
  }
  async update(id, data, passwordHash, conn) {                              // UPDATE
    const persona = pickCols(data, PERSONA_COLS);
    await updateRow(conn, 'persona', persona, 'id_persona', id);
    const usuario = {};
    if (data.username) usuario.username = data.username;
    if (passwordHash) usuario.password_hash = passwordHash;
    if (data.rol && this.roles.length > 1) usuario.id_rol = await this.rolId(data.rol, conn);
    await updateRow(conn, 'usuario', usuario, 'id_persona', id);
    if (this.entrenador) {
      const e = pickCols(data, ['id_sede', 'especialidad']);
      await updateRow(conn, 'entrenador', e, 'id_persona', id);
    }
  }
  async remove(id, conn) {                                                  // DELETE (respeta integridad referencial)
    if (this.entrenador) await conn.query('DELETE FROM entrenador WHERE id_persona = ?', [id]);
    await conn.query('DELETE FROM usuario WHERE id_persona = ?', [id]);
    const [, meta] = await conn.query('DELETE FROM persona WHERE id_persona = ?', [id]);
    return meta.affectedRows;
  }
  async hasRole(idPersona, rolNombre, conn) {
    const [rows] = await (conn || pool).query(
      `SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.id_persona = ? AND r.nombre = ?`, [idPersona, rolNombre]);
    return rows.length > 0;
  }
}

const clienteRepo = new PersonaRolRepository(['Cliente']);
const entrenadorRepo = new PersonaRolRepository(['Entrenador'], true);
const personalRepo = new PersonaRolRepository(['Administrador', 'Recepcionista']);

module.exports = { PersonaRolRepository, clienteRepo, entrenadorRepo, personalRepo };
