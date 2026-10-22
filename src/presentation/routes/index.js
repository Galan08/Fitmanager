// CAPA DE PRESENTACIÓN (API): rutas HTTP. Solo traducen petición -> servicio -> respuesta.
const express = require('express');
const { authenticate, guard } = require('../middleware/auth');
const crudRouter = require('./crudRouter');
const authService = require('../../business/services/authService');
const { sedeService, membresiaService, claseService, ejercicioService } = require('../../business/services/catalogoService');
const { clienteService, entrenadorService, personalService } = require('../../business/services/personaService');
const { suscripcionService, facturaService, pagoService } = require('../../business/services/facturacionService');
const accesoService = require('../../business/services/accesoService');
const { programacionService, reservaService } = require('../../business/services/clasesService');
const { rutinaService, detalleService } = require('../../business/services/rutinasService');
const informeService = require('../../business/services/informeService');
const portalService = require('../../business/services/portalService');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const A = 'Administrador', R = 'Recepcionista', E = 'Entrenador';
const api = express.Router();

// ---- Público
api.post('/auth/login', wrap(async (req, res) => res.json(await authService.login(req.body.username, req.body.password))));

// ---- Todo lo demás exige sesión
api.use(authenticate);
api.get('/auth/me', (req, res) => res.json(req.user));

// ---- Portal del cliente (solo sus propios datos)
const soloCliente = (req, _res, next) => (req.user.rol === 'Cliente' ? next() : next(Object.assign(new Error('Solo para clientes'), { status: 403 })));
api.get('/portal/resumen', soloCliente, wrap(async (q, s) => s.json(await portalService.resumen(q.user.id_persona))));
api.get('/portal/rutinas', soloCliente, wrap(async (q, s) => s.json(await portalService.rutinas(q.user.id_persona))));
api.get('/portal/rutinas/:id/detalle', soloCliente, wrap(async (q, s) => s.json(await portalService.detalleRutina(q.user.id_persona, Number(q.params.id)))));
api.get('/portal/reservas', soloCliente, wrap(async (q, s) => s.json(await portalService.reservas(q.user.id_persona))));
api.post('/portal/reservas', soloCliente, wrap(async (q, s) => s.status(201).json(await portalService.reservar(q.user.id_persona, q.body.id_programacion))));
api.put('/portal/reservas/:id/cancelar', soloCliente, wrap(async (q, s) => s.json(await portalService.cancelarReserva(q.user.id_persona, Number(q.params.id)))));

// ---- Listas para selectores y datos de apoyo (cualquier rol del personal)
api.get('/lookups/:name', wrap(async (q, s) => {
  // Un cliente solo puede ver las clases programadas (no datos de otros clientes)
  if (q.user.rol === 'Cliente' && q.params.name !== 'programaciones') throw Object.assign(new Error('Tu rol no tiene permiso'), { status: 403 });
  s.json(await informeService.lookup(q.params.name));
}));

// ---- Informes
api.get('/informes', guard({ read: [R, E] }), (_q, s) => s.json(informeService.catalogo()));
api.get('/informes/resumen', guard({ read: [R, E] }), wrap(async (_q, s) => s.json(await informeService.resumen())));
api.get('/informes/:key', guard({ read: [R, E] }), wrap(async (q, s) => s.json(await informeService.ejecutar(q.params.key, q.query))));

// ---- Módulos CRUD (lectura/escritura por rol)
api.use('/sedes', guard({ read: [R, E], write: [] }), crudRouter(sedeService));
api.use('/membresias', guard({ read: [R, E], write: [] }), crudRouter(membresiaService));
api.use('/clases', guard({ read: [R, E], write: [E] }), crudRouter(claseService));
api.use('/ejercicios', guard({ read: [R, E], write: [E] }), crudRouter(ejercicioService));
api.use('/clientes', guard({ read: [R, E], write: [R] }), crudRouter(clienteService));
api.use('/entrenadores', guard({ read: [R, E], write: [] }), crudRouter(entrenadorService));
api.use('/personal', guard({ read: [], write: [] }), crudRouter(personalService));
api.use('/suscripciones', guard({ read: [R], write: [R] }), crudRouter(suscripcionService));
api.use('/pagos', guard({ read: [R], write: [R] }), crudRouter(pagoService));
api.use('/programacion', guard({ read: [R, E], write: [E] }), crudRouter(programacionService));
api.use('/reservas', guard({ read: [R, E], write: [R] }), crudRouter(reservaService));
api.use('/rutinas', guard({ read: [R, E], write: [E] }), crudRouter(rutinaService));

// Facturas: se generan con la suscripción; aquí solo se consultan y anulan
const facturas = express.Router();
facturas.get('/', wrap(async (_q, s) => s.json(await facturaService.list())));
facturas.get('/:id', wrap(async (q, s) => s.json(await facturaService.get(q.params.id))));
facturas.put('/:id/anular', wrap(async (q, s) => s.json(await facturaService.anular(q.params.id))));
api.use('/facturas', guard({ read: [R], write: [R] }), facturas);

// Accesos: ingreso (INSERT), salida (UPDATE), consulta (SELECT), eliminación (DELETE)
const accesos = express.Router();
accesos.get('/', wrap(async (_q, s) => s.json(await accesoService.list())));
accesos.post('/', wrap(async (q, s) => s.status(201).json(await accesoService.ingreso(q.body))));
accesos.put('/:id/salida', wrap(async (q, s) => s.json(await accesoService.salida(q.params.id))));
accesos.delete('/:id', wrap(async (q, s) => { await accesoService.remove(q.params.id); s.json({ ok: true }); }));
api.get('/accesos/aforo', guard({ read: [R, E] }), wrap(async (_q, s) => s.json(await accesoService.aforo())));
api.use('/accesos', guard({ read: [R], write: [R] }), accesos);

// Detalle de rutina (tabla intermedia rutina <-> ejercicio)
const rutGuard = guard({ read: [R, E], write: [E] });
api.get('/rutinas/:id/detalle', rutGuard, wrap(async (q, s) => s.json(await rutinaService.detalle(q.params.id))));
api.post('/rutinas/:id/detalle', rutGuard, wrap(async (q, s) => s.status(201).json(await detalleService.add(q.params.id, q.body))));
api.put('/detalle-rutina/:id', rutGuard, wrap(async (q, s) => s.json(await detalleService.update(q.params.id, q.body))));
api.delete('/detalle-rutina/:id', rutGuard, wrap(async (q, s) => { await detalleService.remove(q.params.id); s.json({ ok: true }); }));

api.use((_q, _s, next) => next(Object.assign(new Error('Ruta no encontrada'), { status: 404 })));
module.exports = api;
