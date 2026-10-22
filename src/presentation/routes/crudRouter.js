const express = require('express');

/** Genera las rutas REST de un recurso: GET /, GET /:id, POST /, PUT /:id, DELETE /:id */
module.exports = (service) => {
  const r = express.Router();
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
  r.get('/', wrap(async (_q, res) => res.json(await service.list())));
  r.get('/:id', wrap(async (q, res) => res.json(await service.get(q.params.id))));
  r.post('/', wrap(async (q, res) => res.status(201).json(await service.create(q.body, q.user))));
  r.put('/:id', wrap(async (q, res) => res.json(await service.update(q.params.id, q.body))));
  r.delete('/:id', wrap(async (q, res) => { await service.remove(q.params.id); res.json({ ok: true }); }));
  return r;
};
