// CAPA LÓGICA: programación de clases y reservas (aforo, cruces de horario, suscripción vigente).
const { programacionRepo, reservaRepo } = require('../../data/repositories/clasesRepository');
const { suscripcionRepo } = require('../../data/repositories/facturacionRepository');
const { clienteRepo } = require('../../data/repositories/personaRolRepository');
const { sedeRepo, claseRepo } = require('../../data/repositories/catalogos');
const { badRequest, notFound, conflict, forbidden } = require('../errors');
const v = require('../validators');

const ESTADOS_RESERVA = ['Confirmada', 'Asistio', 'Cancelada'];

const programacionService = {
  list: () => programacionRepo.findAll(),
  async get(id) {
    const p = await programacionRepo.findById(id);
    if (!p) throw notFound('Clase programada no encontrada');
    return p;
  },
  async _validar(d, excluirId = 0) {
    v.required(d, { id_clase: 'Clase', id_entrenador: 'Entrenador', id_sede: 'Sede', fecha_hora_inicio: 'Fecha y hora', duracion_minutos: 'Duración' });
    v.positive(d.duracion_minutos, 'Duración (min)');
    const clase = await claseRepo.findById(d.id_clase);
    if (!clase) throw badRequest('La clase no existe');
    const sede = await sedeRepo.findById(d.id_sede);
    if (!sede || sede.estado !== 'Activa') throw badRequest('La sede no existe o está inactiva');
    if (await programacionRepo.hayCruce(d.id_entrenador, d.fecha_hora_inicio, d.duracion_minutos, excluirId)) {
      throw conflict('El entrenador ya tiene otra clase en ese horario');
    }
    return clase;
  },
  async create(data) {
    const d = { ...data, fecha_hora_inicio: v.toSqlDateTime(data.fecha_hora_inicio) };
    await this._validar(d);
    return programacionRepo.findById(await programacionRepo.create(d));
  },
  async update(id, data) {
    const actual = await this.get(id);
    const d = { ...actual, ...data };
    d.fecha_hora_inicio = v.toSqlDateTime(d.fecha_hora_inicio);
    const clase = await this._validar(d, Number(id));
    if ((await programacionRepo.reservasActivas(id)) > clase.capacidad_maxima) throw conflict('Hay más reservas que cupos');
    await programacionRepo.update(id, d);
    return programacionRepo.findById(id);
  },
  async remove(id) {
    await this.get(id);
    if ((await programacionRepo.reservasActivas(id)) > 0) throw conflict('La clase tiene reservas activas. Cancélalas antes de eliminarla.');
    await programacionRepo.remove(id);
  },
};

const reservaService = {
  list: () => reservaRepo.findAll(),
  async get(id) {
    const r = await reservaRepo.findById(id);
    if (!r) throw notFound('Reserva no encontrada');
    return r;
  },
  async create(data) {
    v.required(data, { id_cliente: 'Cliente', id_programacion: 'Clase programada' });
    if (!(await clienteRepo.hasRole(data.id_cliente, 'Cliente'))) throw badRequest('La persona seleccionada no tiene el rol Cliente');
    const prog = await programacionService.get(data.id_programacion);
    if (new Date(prog.fecha_hora_inicio.replace(' ', 'T')) <= new Date()) throw badRequest('La clase ya comenzó o finalizó');
    await suscripcionRepo.marcarVencidas();
    if (!(await suscripcionRepo.tieneActiva(data.id_cliente))) throw forbidden('El cliente no tiene una suscripción activa para reservar');
    const previa = await reservaRepo.findByClienteYProgramacion(data.id_cliente, data.id_programacion);
    if (previa && previa.estado_reserva !== 'Cancelada') throw conflict('El cliente ya tiene reservado este cupo');
    if (prog.reservas >= prog.capacidad_maxima) throw conflict(`Clase llena: ${prog.reservas}/${prog.capacidad_maxima} cupos ocupados`);
    if (previa) {
      await reservaRepo.update(previa.id_reserva, { estado_reserva: 'Confirmada' });
      return reservaRepo.findById(previa.id_reserva);
    }
    return reservaRepo.findById(await reservaRepo.create({ id_cliente: data.id_cliente, id_programacion: data.id_programacion }));
  },
  async update(id, data) {
    const r = await this.get(id);
    v.oneOf(data.estado_reserva, ESTADOS_RESERVA, 'Estado de la reserva');
    if (r.estado_reserva === 'Cancelada' && data.estado_reserva !== 'Cancelada') {
      const prog = await programacionService.get(r.id_programacion);
      if (prog.reservas >= prog.capacidad_maxima) throw conflict('Clase llena: no se puede reactivar la reserva');
    }
    await reservaRepo.update(id, { estado_reserva: data.estado_reserva });
    return reservaRepo.findById(id);
  },
  async remove(id) {
    await this.get(id);
    await reservaRepo.remove(id);
  },
};

module.exports = { programacionService, reservaService };
