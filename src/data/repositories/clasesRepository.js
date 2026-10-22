// CAPA FÍSICA: programación de clases grupales y reservas.
const { pool } = require('../../config/db');
const BaseRepository = require('../baseRepository');

const OCUPADOS = `r.estado_reserva <> 'Cancelada'`;

class ProgramacionRepository extends BaseRepository {
  constructor() {
    super('programacion_clase', 'id_programacion', ['id_clase', 'id_entrenador', 'id_sede', 'fecha_hora_inicio', 'duracion_minutos'],
      `SELECT t.*, c.nombre_clase, c.capacidad_maxima, CONCAT(p.nombres,' ',p.apellidos) AS entrenador, s.nombre AS sede,
              (SELECT COUNT(*) FROM reserva_clase r WHERE r.id_programacion = t.id_programacion AND ${OCUPADOS}) AS reservas
         FROM programacion_clase t
         JOIN clase c ON c.id_clase = t.id_clase
         JOIN entrenador e ON e.id_entrenador = t.id_entrenador
         JOIN persona p ON p.id_persona = e.id_persona
         JOIN sede s ON s.id_sede = t.id_sede`);
  }
  async findAll(conn) {
    const [rows] = await (conn || pool).query(`${this.select} ORDER BY t.fecha_hora_inicio DESC`);
    return rows;
  }
  /** ¿El entrenador ya tiene otra clase que se cruza con [inicio, inicio+duración)? */
  async hayCruce(idEntrenador, inicio, duracion, excluirId = 0) {
    const [rows] = await pool.query(
      `SELECT id_programacion FROM programacion_clase
        WHERE id_entrenador = ? AND id_programacion <> ?
          AND fecha_hora_inicio < (?::timestamp + ?::int * INTERVAL '1 minute')
          AND (fecha_hora_inicio + duracion_minutos * INTERVAL '1 minute') > ?::timestamp LIMIT 1`,
      [idEntrenador, excluirId, inicio, duracion, inicio]);
    return rows.length > 0;
  }
  async reservasActivas(id) {
    const [rows] = await pool.query(`SELECT COUNT(*) n FROM reserva_clase r WHERE r.id_programacion = ? AND ${OCUPADOS}`, [id]);
    return rows[0].n;
  }
}

class ReservaRepository extends BaseRepository {
  constructor() {
    super('reserva_clase', 'id_reserva', ['id_cliente', 'id_programacion', 'estado_reserva'],
      `SELECT t.*, CONCAT(p.nombres,' ',p.apellidos) AS cliente, c.nombre_clase, pc.fecha_hora_inicio, s.nombre AS sede
         FROM reserva_clase t
         JOIN persona p ON p.id_persona = t.id_cliente
         JOIN programacion_clase pc ON pc.id_programacion = t.id_programacion
         JOIN clase c ON c.id_clase = pc.id_clase
         JOIN sede s ON s.id_sede = pc.id_sede`);
  }
  async findByClienteYProgramacion(idCliente, idProgramacion) {
    const [rows] = await pool.query('SELECT * FROM reserva_clase WHERE id_cliente = ? AND id_programacion = ?', [idCliente, idProgramacion]);
    return rows[0] || null;
  }
  async findByCliente(idCliente) {
    const [rows] = await pool.query(`${this.select} WHERE t.id_cliente = ? ORDER BY pc.fecha_hora_inicio DESC`, [idCliente]);
    return rows;
  }
}

module.exports = { programacionRepo: new ProgramacionRepository(), reservaRepo: new ReservaRepository() };
