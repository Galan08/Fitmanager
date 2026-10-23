// CAPA LÓGICA: portal del cliente (solo accede a su propia información).
const { suscripcionRepo } = require('../../data/repositories/facturacionRepository');
const { rutinaRepo, detalleRepo } = require('../../data/repositories/rutinasRepository');
const { reservaRepo } = require('../../data/repositories/clasesRepository');
const { clienteRepo } = require('../../data/repositories/personaRolRepository');
const { reservaService } = require('./clasesService');
const { forbidden, notFound, conflict } = require('../errors');

module.exports = {
  async resumen(idPersona) {
    await suscripcionRepo.marcarVencidas();
    const perfil = await clienteRepo.findById(idPersona);
    const suscripciones = await suscripcionRepo.findByCliente(idPersona);
    return { perfil, suscripciones, activa: await suscripcionRepo.tieneActiva(idPersona) };
  },
  rutinas: (idPersona) => rutinaRepo.findByCliente(idPersona),
  async detalleRutina(idPersona, idRutina) {
    const r = await rutinaRepo.findById(idRutina);
    if (!r || r.id_cliente !== idPersona) throw notFound('Rutina no encontrada');
    return detalleRepo.findByRutina(idRutina);
  },
  reservas: (idPersona) => reservaRepo.findByCliente(idPersona),
  reservar: (idPersona, idProgramacion) => reservaService.create({ id_cliente: idPersona, id_programacion: idProgramacion }),
  async cancelarReserva(idPersona, idReserva) {
    const r = await reservaRepo.findById(idReserva);
    if (!r) throw notFound('Reserva no encontrada');
    if (r.id_cliente !== idPersona) throw forbidden();
    if (r.estado_reserva !== 'Confirmada') throw conflict('Solo se pueden cancelar reservas confirmadas');
    return reservaService.update(idReserva, { estado_reserva: 'Cancelada' });
  },
};
