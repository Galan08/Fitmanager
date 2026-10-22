// CAPA FÍSICA: rutinas de entrenamiento y su detalle (tabla intermedia N:M con ejercicio).
const { pool } = require('../../config/db');
const BaseRepository = require('../baseRepository');

class RutinaRepository extends BaseRepository {
  constructor() {
    super('rutina', 'id_rutina', ['id_cliente', 'id_entrenador', 'nombre_rutina', 'objetivo', 'fecha_asignacion'],
      `SELECT t.*, CONCAT(pc.nombres,' ',pc.apellidos) AS cliente, CONCAT(pe.nombres,' ',pe.apellidos) AS entrenador,
              (SELECT COUNT(*) FROM detalle_rutina d WHERE d.id_rutina = t.id_rutina) AS ejercicios
         FROM rutina t
         JOIN persona pc ON pc.id_persona = t.id_cliente
         JOIN entrenador e ON e.id_entrenador = t.id_entrenador
         JOIN persona pe ON pe.id_persona = e.id_persona`);
  }
  async idEntrenadorDePersona(idPersona) {
    const [rows] = await pool.query('SELECT id_entrenador FROM entrenador WHERE id_persona = ?', [idPersona]);
    return rows[0]?.id_entrenador || null;
  }
  async findByCliente(idCliente) {
    const [rows] = await pool.query(`${this.select} WHERE t.id_cliente = ? ORDER BY t.fecha_asignacion DESC`, [idCliente]);
    return rows;
  }
}

class DetalleRutinaRepository extends BaseRepository {
  constructor() {
    super('detalle_rutina', 'id_detalle', ['id_rutina', 'id_ejercicio', 'series', 'repeticiones', 'descanso_segundos', 'orden'],
      `SELECT t.*, e.nombre_ejercicio, e.grupo_muscular
         FROM detalle_rutina t JOIN ejercicio e ON e.id_ejercicio = t.id_ejercicio`);
  }
  async findByRutina(idRutina) {
    const [rows] = await pool.query(`${this.select} WHERE t.id_rutina = ? ORDER BY t.orden, t.id_detalle`, [idRutina]);
    return rows;
  }
  async siguienteOrden(idRutina) {
    const [rows] = await pool.query('SELECT COALESCE(MAX(orden),0)+1 AS n FROM detalle_rutina WHERE id_rutina = ?', [idRutina]);
    return rows[0].n;
  }
}

module.exports = { rutinaRepo: new RutinaRepository(), detalleRepo: new DetalleRutinaRepository() };
