// CAPA FÍSICA: conexión al servidor PostgreSQL (pool) y utilidad de transacciones.
const { Pool, types } = require('pg');
const { db } = require('./env');

// Tipos que PostgreSQL devuelve como texto/objetos: los normalizamos para la interfaz.
types.setTypeParser(1700, (v) => parseFloat(v));   // NUMERIC  -> número
types.setTypeParser(20, (v) => parseInt(v, 10));   // BIGINT   -> número
types.setTypeParser(1082, (v) => v);               // DATE     -> 'AAAA-MM-DD'
types.setTypeParser(1114, (v) => v.slice(0, 19));  // TIMESTAMP-> 'AAAA-MM-DD HH:mm:ss'

const raw = new Pool({ ...db, max: 10 });

// Convierte los marcadores ? en $1, $2, ... (formato de parámetros de PostgreSQL).
const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

/** Envuelve un Pool/Client: query(sql, params) -> [filas, { affectedRows }] */
const wrap = (client) => ({
  async query(sql, params = []) {
    const r = await client.query(toPg(sql), params);
    return [r.rows, { affectedRows: r.rowCount }];
  },
});

const pool = wrap(raw);

/** Ejecuta fn(conn) dentro de una transacción; hace COMMIT o ROLLBACK automáticamente. */
async function tx(fn) {
  const client = await raw.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(wrap(client));
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** INSERT con RETURNING: devuelve el valor de la clave primaria generada. */
async function insertRow(conn, table, data, pk) {
  const keys = Object.keys(data);
  const sql = keys.length
    ? `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')}) RETURNING ${pk}`
    : `INSERT INTO ${table} DEFAULT VALUES RETURNING ${pk}`;
  const [rows] = await conn.query(sql, keys.map((k) => data[k]));
  return rows[0][pk];
}

/** UPDATE de columnas de un objeto filtrando por una columna. */
async function updateRow(conn, table, data, whereCol, whereVal) {
  const keys = Object.keys(data);
  if (!keys.length) return 0;
  const [, meta] = await conn.query(
    `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE ${whereCol} = ?`, [...keys.map((k) => data[k]), whereVal]);
  return meta.affectedRows;
}

module.exports = { pool, tx, insertRow, updateRow };
