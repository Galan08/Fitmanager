// CAPA FÍSICA: control de acceso físico a las sedes.
const { pool } = require('../../config/db');
const BaseRepository = require('../baseRepository');

// Un ingreso sin salida con más de 12 h se considera cerrado (olvido de marcar salida).
const ABIERTO = `a.fecha_hora_salida IS NULL AND a.fecha_hora_ingreso >= LOCALTIMESTAMP - INTERVAL '12 hours'`;

class AccesoRepository extends BaseRepository {
  constructor() {
    super('control_acceso', 'id_acceso', ['id_cliente', 'id_sede', 'fecha_hora_ingreso', 'fecha_hora_salida'],
      `SELECT t.*, CONCAT(p.nombres,' ',p.apellidos) AS cliente, p.documento_identidad, s.nombre AS sede,
              FLOOR(EXTRACT(EPOCH FROM (t.fecha_hora_salida - t.fecha_hora_ingreso)) / 60)::int AS minutos
         FROM control_acceso t
         JOIN persona p ON p.id_persona = t.id_cliente
         JOIN sede s ON s.id_sede = t.id_sede`);
  }
  async findRecientes(limit = 200) {
    const [rows] = await pool.query(`${this.select} ORDER BY t.fecha_hora_ingreso DESC LIMIT ?`, [limit]);
    return rows;
  }
  async abiertoDe(idCliente) {
    const [rows] = await pool.query(
      `SELECT a.id_acceso FROM control_acceso a WHERE a.id_cliente = ? AND ${ABIERTO} LIMIT 1`, [idCliente]);
    return rows[0] || null;
  }
  async registrarSalida(id) {
    const [, r] = await pool.query('UPDATE control_acceso SET fecha_hora_salida = LOCALTIMESTAMP(0) WHERE id_acceso = ? AND fecha_hora_salida IS NULL', [id]);
    return r.affectedRows;
  }
  async aforo() {
    const [rows] = await pool.query(
      `SELECT s.id_sede, s.nombre, COUNT(a.id_acceso) AS dentro
         FROM sede s LEFT JOIN control_acceso a ON a.id_sede = s.id_sede AND ${ABIERTO}
        WHERE s.estado = 'Activa' GROUP BY s.id_sede, s.nombre ORDER BY s.id_sede`);
    return rows;
  }
}
module.exports = { accesoRepo: new AccesoRepository() };
