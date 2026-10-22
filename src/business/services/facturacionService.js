// CAPA LÓGICA: suscripciones, facturación y pagos (reglas del ciclo de cobro).
const { tx } = require('../../config/db');
const env = require('../../config/env');
const { suscripcionRepo, facturaRepo, pagoRepo } = require('../../data/repositories/facturacionRepository');
const { membresiaRepo } = require('../../data/repositories/catalogos');
const { clienteRepo } = require('../../data/repositories/personaRolRepository');
const { badRequest, notFound, conflict } = require('../errors');
const v = require('../validators');

const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia', 'PSE'];
const ESTADOS_PAGO = ['Pendiente', 'Aprobado', 'Rechazado', 'Anulado'];
const ESTADOS_SUS = ['Pendiente', 'Activa', 'Vencida', 'Cancelada'];
const code = (p) => `${p}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
const sumarDias = (fecha, dias) => {
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(dias));
  return d.toISOString().slice(0, 10);
};

/** Recalcula el estado de la factura según lo pagado y sincroniza la suscripción. */
async function recalcular(idFactura, conn) {
  const f = await facturaRepo.findById(idFactura, conn);
  if (!f || f.estado === 'Anulada') return;
  const pagado = await facturaRepo.pagadoDe(idFactura, conn);
  await facturaRepo.setEstado(idFactura, pagado >= f.total ? 'Pagada' : 'Pendiente', conn);
  const pagadas = await suscripcionRepo.facturasPagadas(f.id_suscripcion, conn);
  await suscripcionRepo.sincronizarEstado(f.id_suscripcion, pagadas, conn);
}

async function registrarPago(data, conn) {
  v.required(data, { id_factura: 'Factura', monto: 'Monto', metodo_pago: 'Método de pago' });
  v.positive(data.monto, 'Monto');
  v.oneOf(data.metodo_pago, METODOS, 'Método de pago');
  const f = await facturaRepo.findById(data.id_factura, conn);
  if (!f) throw notFound('Factura no encontrada');
  if (f.estado === 'Anulada') throw conflict('La factura está anulada');
  if (f.estado === 'Pagada') throw conflict('La factura ya está pagada');
  if (Number(data.monto) > f.saldo) throw badRequest(`El monto supera el saldo pendiente ($${f.saldo.toLocaleString('es-CO')})`);
  const id = await pagoRepo.create({
    id_factura: f.id_factura, monto: data.monto, metodo_pago: data.metodo_pago,
    estado_pago: data.estado_pago || 'Aprobado',
    referencia_pago: data.referencia_pago || code('PAG'),
    concepto: data.concepto || `Pago factura ${f.numero_factura}`,
  }, conn);
  await recalcular(f.id_factura, conn);
  return id;
}

const suscripcionService = {
  async list() {
    await suscripcionRepo.marcarVencidas();
    return suscripcionRepo.findAll();
  },
  async get(id) {
    const s = await suscripcionRepo.findById(id);
    if (!s) throw notFound('Suscripción no encontrada');
    return s;
  },
  /** Crea la suscripción + su factura; si viene metodo_pago, registra el cobro total en la misma transacción. */
  async create(data) {
    v.required(data, { id_cliente: 'Cliente', id_membresia: 'Membresía', fecha_inicio: 'Fecha de inicio' });
    v.isDate(data.fecha_inicio, 'Fecha de inicio');
    if (!(await clienteRepo.hasRole(data.id_cliente, 'Cliente'))) throw badRequest('La persona seleccionada no tiene el rol Cliente');
    const m = await membresiaRepo.findById(data.id_membresia);
    if (!m) throw notFound('Membresía no encontrada');
    if (m.estado !== 'Activa') throw badRequest('La membresía seleccionada está inactiva');
    const inicio = String(data.fecha_inicio).slice(0, 10);
    const fin = sumarDias(inicio, m.duracion_dias);
    if (await suscripcionRepo.haySolape(data.id_cliente, inicio, fin)) {
      throw conflict('El cliente ya tiene una suscripción activa o pendiente en ese período');
    }
    const descuento = Number(data.descuento || 0);
    if (descuento < 0 || descuento > m.precio) throw badRequest('El descuento debe estar entre 0 y el precio de la membresía');
    const id = await tx(async (conn) => {
      const idSus = await suscripcionRepo.create({ id_cliente: data.id_cliente, id_membresia: m.id_membresia, fecha_inicio: inicio, fecha_fin: fin, estado: 'Pendiente' }, conn);
      const impuesto = Math.round(((m.precio - descuento) * env.iva) / 100);
      const total = m.precio - descuento + impuesto;
      const idFac = await facturaRepo.create({
        id_suscripcion: idSus, numero_factura: code('FAC'), subtotal: m.precio, descuento, impuesto, total, estado: 'Pendiente',
      }, conn);
      if (data.metodo_pago && total > 0) {
        const f = await facturaRepo.findById(idFac, conn);
        await registrarPago({ id_factura: idFac, monto: f.total, metodo_pago: data.metodo_pago }, conn);
      } else {
        await recalcular(idFac, conn);   // una factura en $0 (descuento total) queda pagada y activa la suscripción
      }
      return idSus;
    });
    return suscripcionRepo.findById(id);
  },
  async update(id, data) {
    const s = await this.get(id);
    const d = { ...s, ...data };
    if (data.estado) v.oneOf(data.estado, ESTADOS_SUS, 'Estado');
    v.isDate(d.fecha_inicio, 'Fecha de inicio');
    v.isDate(d.fecha_fin, 'Fecha de fin');
    if (String(d.fecha_fin) < String(d.fecha_inicio)) throw badRequest('La fecha de fin no puede ser anterior al inicio');
    await suscripcionRepo.update(id, { estado: d.estado, fecha_inicio: String(d.fecha_inicio).slice(0, 10), fecha_fin: String(d.fecha_fin).slice(0, 10) });
    return suscripcionRepo.findById(id);
  },
  async remove(id) {
    await this.get(id);
    await tx(async (conn) => {
      if ((await facturaRepo.countPagosDeSuscripcion(id, conn)) > 0) {
        throw conflict('No se puede eliminar: la suscripción tiene pagos registrados. Cámbiala a "Cancelada".');
      }
      await facturaRepo.removeBySuscripcion(id, conn);
      await suscripcionRepo.remove(id, conn);
    });
  },
};

const facturaService = {
  list: () => facturaRepo.findAll(),
  async get(id) {
    const f = await facturaRepo.findById(id);
    if (!f) throw notFound('Factura no encontrada');
    return f;
  },
  async anular(id) {
    const f = await this.get(id);
    if (f.pagado > 0) throw conflict('No se puede anular una factura con pagos aprobados. Anula primero los pagos.');
    await tx(async (conn) => {
      await facturaRepo.setEstado(id, 'Anulada', conn);
      await suscripcionRepo.sincronizarEstado(f.id_suscripcion, await suscripcionRepo.facturasPagadas(f.id_suscripcion, conn), conn);
    });
    return this.get(id);
  },
};

const pagoService = {
  list: () => pagoRepo.findAll(),
  async get(id) {
    const p = await pagoRepo.findById(id);
    if (!p) throw notFound('Pago no encontrado');
    return p;
  },
  async create(data) {
    const id = await tx((conn) => registrarPago(data, conn));
    return pagoRepo.findById(id);
  },
  async update(id, data) {
    const p = await this.get(id);
    if (data.estado_pago) v.oneOf(data.estado_pago, ESTADOS_PAGO, 'Estado del pago');
    if (data.estado_pago === 'Aprobado' && p.estado_pago !== 'Aprobado') {
      const f = await facturaService.get(p.id_factura);
      if (f.estado === 'Anulada') throw conflict('La factura está anulada');
      if (p.monto > f.saldo) throw badRequest(`El monto supera el saldo pendiente ($${f.saldo.toLocaleString('es-CO')})`);
    }
    await tx(async (conn) => {
      await pagoRepo.update(id, { estado_pago: data.estado_pago, concepto: data.concepto, metodo_pago: data.metodo_pago }, conn);
      await recalcular(p.id_factura, conn);
    });
    return pagoRepo.findById(id);
  },
  async remove(id) {
    const p = await this.get(id);
    await tx(async (conn) => {
      await pagoRepo.remove(id, conn);
      await recalcular(p.id_factura, conn);
    });
  },
};

module.exports = { suscripcionService, facturaService, pagoService };
