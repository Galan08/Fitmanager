// CAPA LÓGICA: rutinas personalizadas y su detalle de ejercicios.
const { rutinaRepo, detalleRepo } = require('../../data/repositories/rutinasRepository');
const { ejercicioRepo } = require('../../data/repositories/catalogos');
const { clienteRepo } = require('../../data/repositories/personaRolRepository');
const { badRequest, notFound } = require('../errors');
const v = require('../validators');

const rutinaService = {
  list: () => rutinaRepo.findAll(),
  async get(id) {
    const r = await rutinaRepo.findById(id);
    if (!r) throw notFound('Rutina no encontrada');
    return r;
  },
  async create(data, user) {
    const d = { ...data };
    if (!d.id_entrenador && user?.rol === 'Entrenador') d.id_entrenador = await rutinaRepo.idEntrenadorDePersona(user.id_persona);
    v.required(d, { id_cliente: 'Cliente', id_entrenador: 'Entrenador', nombre_rutina: 'Nombre de la rutina' });
    if (!(await clienteRepo.hasRole(d.id_cliente, 'Cliente'))) throw badRequest('La persona seleccionada no tiene el rol Cliente');
    if (d.fecha_asignacion) v.isDate(d.fecha_asignacion, 'Fecha de asignación');
    return rutinaRepo.findById(await rutinaRepo.create(d));
  },
  async update(id, data) {
    const actual = await this.get(id);
    const d = { ...actual, ...data };
    v.required(d, { nombre_rutina: 'Nombre de la rutina' });
    if (data.id_cliente && !(await clienteRepo.hasRole(d.id_cliente, 'Cliente'))) throw badRequest('La persona seleccionada no tiene el rol Cliente');
    await rutinaRepo.update(id, d);
    return rutinaRepo.findById(id);
  },
  async remove(id) {                        // el detalle se elimina en cascada (ON DELETE CASCADE)
    await this.get(id);
    await rutinaRepo.remove(id);
  },
  async detalle(idRutina) {
    await this.get(idRutina);
    return detalleRepo.findByRutina(idRutina);
  },
};

const detalleService = {
  _validar(d) {
    v.required(d, { id_ejercicio: 'Ejercicio', series: 'Series', repeticiones: 'Repeticiones' });
    v.positive(d.series, 'Series');
    v.positive(d.repeticiones, 'Repeticiones');
    if (d.descanso_segundos !== undefined && d.descanso_segundos !== '') v.nonNegative(d.descanso_segundos, 'Descanso (s)');
  },
  async add(idRutina, data) {
    await rutinaService.get(idRutina);
    this._validar(data);
    if (!(await ejercicioRepo.findById(data.id_ejercicio))) throw badRequest('El ejercicio no existe');
    const orden = data.orden || (await detalleRepo.siguienteOrden(idRutina));
    const id = await detalleRepo.create({ ...data, id_rutina: idRutina, orden });
    return detalleRepo.findById(id);
  },
  async update(id, data) {
    const actual = await detalleRepo.findById(id);
    if (!actual) throw notFound('Detalle no encontrado');
    const d = { ...actual, ...data };
    this._validar(d);
    await detalleRepo.update(id, { id_ejercicio: d.id_ejercicio, series: d.series, repeticiones: d.repeticiones, descanso_segundos: d.descanso_segundos, orden: d.orden });
    return detalleRepo.findById(id);
  },
  async remove(id) {
    if (!(await detalleRepo.findById(id))) throw notFound('Detalle no encontrado');
    await detalleRepo.remove(id);
  },
};

module.exports = { rutinaService, detalleService };
