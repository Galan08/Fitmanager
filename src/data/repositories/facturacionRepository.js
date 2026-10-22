// CAPA FÍSICA: suscripciones, facturas y pagos.
const { pool } = require('../../config/db');
const BaseRepository = require('../baseRepository');

const PAGADO = (alias = 't') =>
  `COALESCE((SELECT SUM(x.monto) FROM pago x WHERE x.id_factura = ${alias}.id_factura AND x.estado_pago = 'Aprobado'), 0)`;

class SuscripcionRepository extends BaseRepository {
  constructor() {
    super('suscripcion', 'id_suscripcion', ['id_cliente', 'id_membresia', 'fecha_inicio', 'fecha_fin', 'estado'],
      `SELECT t.*, CONCAT(p.nombres,' ',p.apellidos) AS cliente, p.documento_identidad, m.nombre AS membresia, m.precio,
              (SELECT f.id_factura FROM factura f WHERE f.id_suscripcion = t.id_suscripcion ORDER BY f.id_factura DESC LIMIT 1) AS id_factura
         FROM suscripcion t
         JOIN persona p ON p.id_persona = t.id_cliente
         JOIN membresia m ON m.id_membresia = t.id_membresia`);
  }
  async marcarVencidas(conn) {
    await (conn || pool).query(`UPDATE suscripcion SET estado = 'Vencida' WHERE estado = 'Activa' AND fecha_fin < CURRENT_DATE`);
  }
  async tieneActiva(idCliente, conn) {
    const [rows] = await (conn || pool).query(
      `SELECT id_suscripcion FROM suscripcion WHERE id_cliente = ? AND estado = 'Activa' AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin LIMIT 1`, [idCliente]);
    return rows.length > 0;
  }
  async setEstado(id, estado, conn) {
    await conn.query('UPDATE suscripcion SET estado = ? WHERE id_suscripcion = ?', [estado, id]);
  }
  /** Deja la suscripción Activa/Vencida si tiene alguna factura pagada, o Pendiente si no (salvo Cancelada). */
  async sincronizarEstado(id, pagadas, conn) {
    await conn.query(
      `UPDATE suscripcion SET estado = CASE WHEN ?::int > 0 THEN CASE WHEN fecha_fin < CURRENT_DATE THEN 'Vencida' ELSE 'Activa' END ELSE 'Pendiente' END
        WHERE id_suscripcion = ? AND estado <> 'Cancelada'`, [pagadas, id]);
  }
  async haySolape(idCliente, inicio, fin, conn) {
    const [rows] = await (conn || pool).query(
      `SELECT id_suscripcion FROM suscripcion WHERE id_cliente = ? AND estado IN ('Activa','Pendiente') AND fecha_inicio <= ? AND fecha_fin >= ? LIMIT 1`,
      [idCliente, fin, inicio]);
    return rows.length > 0;
  }
  async facturasPagadas(id, conn) {
    const [rows] = await conn.query(`SELECT COUNT(*) n FROM factura WHERE id_suscripcion = ? AND estado = 'Pagada'`, [id]);
    return rows[0].n;
  }
}

class FacturaRepository extends BaseRepository {
  constructor() {
    super('factura', 'id_factura', ['id_suscripcion', 'numero_factura', 'subtotal', 'descuento', 'impuesto', 'total', 'estado'],
      `SELECT t.*, s.id_cliente, CONCAT(p.nombres,' ',p.apellidos) AS cliente, m.nombre AS membresia,
              ${PAGADO()} AS pagado, t.total - ${PAGADO()} AS saldo
         FROM factura t
         JOIN suscripcion s ON s.id_suscripcion = t.id_suscripcion
         JOIN persona p ON p.id_persona = s.id_cliente
         JOIN membresia m ON m.id_membresia = s.id_membresia`);
  }
  async pagadoDe(id, conn) {
    const [rows] = await (conn || pool).query(`SELECT ${PAGADO('f')} AS pagado FROM factura f WHERE f.id_factura = ?`, [id]);
    return rows[0]?.pagado ?? 0;
  }
  async setEstado(id, estado, conn) {
    await conn.query('UPDATE factura SET estado = ? WHERE id_factura = ?', [estado, id]);
  }
  async removeBySuscripcion(idSuscripcion, conn) {
    await conn.query('DELETE FROM factura WHERE id_suscripcion = ?', [idSuscripcion]);
  }
  async countPagosDeSuscripcion(idSuscripcion, conn) {
    const [rows] = await conn.query(
      'SELECT COUNT(*) n FROM pago p JOIN factura f ON f.id_factura = p.id_factura WHERE f.id_suscripcion = ?', [idSuscripcion]);
    return rows[0].n;
  }
}

class PagoRepository extends BaseRepository {
  constructor() {
    super('pago', 'id_pago', ['id_factura', 'monto', 'fecha_pago', 'metodo_pago', 'estado_pago', 'referencia_pago', 'concepto'],
      `SELECT t.*, f.numero_factura, CONCAT(p.nombres,' ',p.apellidos) AS cliente
         FROM pago t
         JOIN factura f ON f.id_factura = t.id_factura
         JOIN suscripcion s ON s.id_suscripcion = f.id_suscripcion
         JOIN persona p ON p.id_persona = s.id_cliente`);
  }
}

module.exports = {
  suscripcionRepo: new SuscripcionRepository(),
  facturaRepo: new FacturaRepository(),
  pagoRepo: new PagoRepository(),
};
