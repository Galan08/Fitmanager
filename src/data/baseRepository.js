// CAPA FÍSICA: acceso genérico a datos (INSERT / SELECT / UPDATE / DELETE) para una tabla.
const { pool, insertRow, updateRow } = require('../config/db');

class BaseRepository {
  /**
   * @param {string} table   nombre de la tabla
   * @param {string} pk      clave primaria
   * @param {string[]} cols  columnas escribibles (lista blanca)
   * @param {string} select  SELECT base con alias "t" (permite JOINs de lectura)
   */
  constructor(table, pk, cols, select) {
    this.table = table;
    this.pk = pk;
    this.cols = cols;
    this.select = select || `SELECT t.* FROM ${table} t`;
  }
  _pick(data) {
    return Object.fromEntries(this.cols.filter((c) => data[c] !== undefined).map((c) => [c, data[c] === '' ? null : data[c]]));
  }
  async findAll(conn) {
    const [rows] = await (conn || pool).query(`${this.select} ORDER BY t.${this.pk} DESC`);
    return rows;
  }
  async findById(id, conn) {
    const [rows] = await (conn || pool).query(`${this.select} WHERE t.${this.pk} = ?`, [id]);
    return rows[0] || null;
  }
  async create(data, conn) {                       // INSERT
    return insertRow(conn || pool, this.table, this._pick(data), this.pk);
  }
  async update(id, data, conn) {                   // UPDATE
    return updateRow(conn || pool, this.table, this._pick(data), this.pk, id);
  }
  async remove(id, conn) {                         // DELETE
    const [, meta] = await (conn || pool).query(`DELETE FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
    return meta.affectedRows;
  }
}

module.exports = BaseRepository;
