// CAPA LÓGICA: control de acceso físico (valida suscripción activa antes de permitir el ingreso).
const { accesoRepo } = require('../../data/repositories/accesoRepository');
const { suscripcionRepo } = require('../../data/repositories/facturacionRepository');
const { clienteRepo } = require('../../data/repositories/personaRolRepository');
const { sedeRepo } = require('../../data/repositories/catalogos');
const { badRequest, notFound, conflict, forbidden } = require('../errors');
const v = require('../validators');

module.exports = {
  list: () => accesoRepo.findRecientes(),
  aforo: () => accesoRepo.aforo(),
  async ingreso(data) {
    v.required(data, { id_cliente: 'Cliente', id_sede: 'Sede' });
    if (!(await clienteRepo.hasRole(data.id_cliente, 'Cliente'))) throw badRequest('La persona seleccionada no tiene el rol Cliente');
    const sede = await sedeRepo.findById(data.id_sede);
    if (!sede || sede.estado !== 'Activa') throw badRequest('La sede no existe o está inactiva');
    await suscripcionRepo.marcarVencidas();
    if (!(await suscripcionRepo.tieneActiva(data.id_cliente))) throw forbidden('Acceso denegado: el cliente no tiene una suscripción activa');
    if (await accesoRepo.abiertoDe(data.id_cliente)) throw conflict('El cliente ya está dentro del gimnasio (falta registrar su salida)');
    const id = await accesoRepo.create({ id_cliente: data.id_cliente, id_sede: data.id_sede });
    return accesoRepo.findById(id);
  },
  async salida(id) {
    const a = await accesoRepo.findById(id);
    if (!a) throw notFound('Registro de acceso no encontrado');
    if (a.fecha_hora_salida) throw conflict('La salida ya fue registrada');
    await accesoRepo.registrarSalida(id);
    return accesoRepo.findById(id);
  },
  async remove(id) {
    if (!(await accesoRepo.findById(id))) throw notFound('Registro de acceso no encontrado');
    await accesoRepo.remove(id);
  },
};
