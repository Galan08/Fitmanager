// CAPA LÓGICA: gestión de clientes, entrenadores y personal (persona + usuario + rol).
const bcrypt = require('bcryptjs');
const { tx } = require('../../config/db');
const { clienteRepo, entrenadorRepo, personalRepo } = require('../../data/repositories/personaRolRepository');
const { sedeRepo } = require('../../data/repositories/catalogos');
const { badRequest, notFound } = require('../errors');
const v = require('../validators');

function makePersonaService(repo, { rolFijo, entrenador = false, nombre }) {
  const validar = async (d, creando) => {
    v.required(d, { documento_identidad: 'Documento', nombres: 'Nombres', apellidos: 'Apellidos' });
    v.isEmail(d.email);
    if (d.fecha_nacimiento) {
      v.isDate(d.fecha_nacimiento, 'Fecha de nacimiento');
      if (new Date(d.fecha_nacimiento) > new Date()) throw badRequest('La fecha de nacimiento no puede ser futura');
    }
    if (d.password && String(d.password).length < 6) throw badRequest('La contraseña debe tener mínimo 6 caracteres');
    if (!rolFijo) v.oneOf(d.rol, ['Administrador', 'Recepcionista'], 'Rol');
    if (entrenador) {
      if (creando) v.required(d, { id_sede: 'Sede' });
      if (d.id_sede && !(await sedeRepo.findById(d.id_sede))) throw badRequest('La sede indicada no existe');
    }
  };
  const get = async (id) => {
    const row = await repo.findById(id);
    if (!row) throw notFound(`${nombre} no encontrado`);
    return row;
  };
  return {
    list: (query) => repo.findAll(query),
    get,
    async create(data) {
      await validar(data, true);
      const username = data.username?.trim() || String(data.documento_identidad).trim();
      const hash = await bcrypt.hash(data.password || String(data.documento_identidad), 10);
      const id = await tx((conn) => repo.create({ ...data, username }, hash, rolFijo || data.rol, conn));
      return repo.findById(id);
    },
    async update(id, data) {
      const actual = await get(id);
      await validar({ ...actual, ...data }, false);
      const hash = data.password ? await bcrypt.hash(data.password, 10) : null;
      await tx((conn) => repo.update(id, data, hash, conn));
      return repo.findById(id);
    },
    async remove(id) {
      await get(id);
      await tx((conn) => repo.remove(id, conn));
    },
  };
}

module.exports = {
  clienteService: makePersonaService(clienteRepo, { rolFijo: 'Cliente', nombre: 'Cliente' }),
  entrenadorService: makePersonaService(entrenadorRepo, { rolFijo: 'Entrenador', entrenador: true, nombre: 'Entrenador' }),
  personalService: makePersonaService(personalRepo, { nombre: 'Usuario' }),
};
