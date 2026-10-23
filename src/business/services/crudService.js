// CAPA LÓGICA: servicio CRUD genérico con validaciones de negocio inyectables.
const { notFound } = require('../errors');

function makeCrudService(repo, { validate = () => {}, nombre = 'Registro' } = {}) {
  const get = async (id) => {
    const row = await repo.findById(id);
    if (!row) throw notFound(`${nombre} no encontrado`);
    return row;
  };
  return {
    list: (query) => repo.findAll(query),
    get,
    async create(data) {
      await validate(data, 'create');
      return repo.findById(await repo.create(data));
    },
    async update(id, data) {
      const actual = await get(id);
      await validate({ ...actual, ...data }, 'update', id);
      await repo.update(id, data);
      return repo.findById(id);
    },
    async remove(id) {
      await get(id);
      await repo.remove(id);
    },
  };
}
module.exports = { makeCrudService };
