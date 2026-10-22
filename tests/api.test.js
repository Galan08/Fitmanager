/**
 * Pruebas de integración rápidas de la API.  Uso: con el servidor en marcha -> node tests/api.test.js
 * Recorre INSERT / SELECT / UPDATE / DELETE y las reglas de negocio principales.
 */
const B = process.env.API || 'http://localhost:3000/api';
let T;
let fallos = 0;
const call = async (m, p, b) => {
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(T ? { Authorization: 'Bearer ' + T } : {}) }, body: b ? JSON.stringify(b) : undefined });
  let j; try { j = await r.json(); } catch { j = null; }
  return [r.status, j];
};
const check = (label, [status, body], esperado) => {
  const ok = status === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(34)} ${status} ${JSON.stringify(body).slice(0, 110)}`);
  return body;
};
const login = async (u) => { T = (await call('POST', '/auth/login', { username: u, password: 'Admin123*' }))[1].token; };

(async () => {
  check('login incorrecto', await call('POST', '/auth/login', { username: 'admin', password: 'x' }), 401);
  await login('admin');
  const doc = String(Date.now()).slice(-9);
  const c = check('crear cliente (INSERT)', await call('POST', '/clientes', { documento_identidad: doc, nombres: 'Prueba', apellidos: 'Uno', email: 'a@b.co' }), 201);
  check('documento duplicado', await call('POST', '/clientes', { documento_identidad: doc, nombres: 'X', apellidos: 'Y' }), 409);
  check('email inválido', await call('POST', '/clientes', { documento_identidad: doc + '1', nombres: 'X', apellidos: 'Y', email: 'zz' }), 400);
  check('actualizar cliente (UPDATE)', await call('PUT', '/clientes/' + c.id_persona, { telefono: '3000000000' }), 200);

  const sus = check('crear suscripción + factura', await call('POST', '/suscripciones', { id_cliente: c.id_persona, id_membresia: 2, fecha_inicio: new Date().toISOString().slice(0, 10) }), 201);
  check('acceso sin pago (denegado)', await call('POST', '/accesos', { id_cliente: c.id_persona, id_sede: 1 }), 403);
  check('suscripción solapada', await call('POST', '/suscripciones', { id_cliente: c.id_persona, id_membresia: 2, fecha_inicio: new Date().toISOString().slice(0, 10) }), 409);
  check('pago mayor al saldo', await call('POST', '/pagos', { id_factura: sus.id_factura, monto: 999999999, metodo_pago: 'Efectivo' }), 400);
  check('pago parcial', await call('POST', '/pagos', { id_factura: sus.id_factura, monto: 50000, metodo_pago: 'Efectivo' }), 201);
  const f = (await call('GET', '/facturas/' + sus.id_factura))[1];
  check('pago del saldo -> factura pagada', await call('POST', '/pagos', { id_factura: sus.id_factura, monto: f.saldo, metodo_pago: 'PSE' }), 201);
  const s2 = check('suscripción pasa a Activa', await call('GET', '/suscripciones/' + sus.id_suscripcion), 200);
  if (s2.estado !== 'Activa') { fallos++; console.log('FAIL estado esperado Activa, fue', s2.estado); }

  const acc = check('ingreso al gimnasio', await call('POST', '/accesos', { id_cliente: c.id_persona, id_sede: 1 }), 201);
  check('ingreso doble', await call('POST', '/accesos', { id_cliente: c.id_persona, id_sede: 1 }), 409);
  check('registrar salida (UPDATE)', await call('PUT', `/accesos/${acc.id_acceso}/salida`), 200);
  check('eliminar acceso (DELETE)', await call('DELETE', '/accesos/' + acc.id_acceso), 200);

  const pr = (await call('GET', '/lookups/programaciones'))[1][0];
  const res = check('reservar clase', await call('POST', '/reservas', { id_cliente: c.id_persona, id_programacion: pr.value }), 201);
  check('reserva duplicada', await call('POST', '/reservas', { id_cliente: c.id_persona, id_programacion: pr.value }), 409);
  check('cancelar reserva (UPDATE)', await call('PUT', '/reservas/' + res.id_reserva, { estado_reserva: 'Cancelada' }), 200);
  check('eliminar reserva (DELETE)', await call('DELETE', '/reservas/' + res.id_reserva), 200);

  const rut = check('crear rutina', await call('POST', '/rutinas', { id_cliente: c.id_persona, id_entrenador: 1, nombre_rutina: 'Rutina prueba', objetivo: 'x' }), 201);
  check('agregar ejercicio a rutina', await call('POST', `/rutinas/${rut.id_rutina}/detalle`, { id_ejercicio: 1, series: 3, repeticiones: 10 }), 201);
  check('series = 0 rechazado', await call('POST', `/rutinas/${rut.id_rutina}/detalle`, { id_ejercicio: 1, series: 0, repeticiones: 10 }), 400);
  check('eliminar rutina (cascada)', await call('DELETE', '/rutinas/' + rut.id_rutina), 200);

  check('eliminar suscripción con pagos', await call('DELETE', '/suscripciones/' + sus.id_suscripcion), 409);
  check('eliminar cliente con historial', await call('DELETE', '/clientes/' + c.id_persona), 409);

  const c2 = check('crear 2º cliente', await call('POST', '/clientes', { documento_identidad: doc + '2', nombres: 'Dos', apellidos: 'Dos' }), 201);
  const s3 = check('suscripción cobrada al crear', await call('POST', '/suscripciones', { id_cliente: c2.id_persona, id_membresia: 2, fecha_inicio: new Date().toISOString().slice(0, 10), metodo_pago: 'Tarjeta' }), 201);
  if (s3.estado !== 'Activa') { fallos++; console.log('FAIL estado esperado Activa, fue', s3.estado); }
  const c3 = check('crear 3er cliente', await call('POST', '/clientes', { documento_identidad: doc + '3', nombres: 'Tres', apellidos: 'Tres' }), 201);
  const s4 = check('suscripción sin cobrar', await call('POST', '/suscripciones', { id_cliente: c3.id_persona, id_membresia: 2, fecha_inicio: new Date().toISOString().slice(0, 10) }), 201);
  check('eliminar suscripción sin pagos', await call('DELETE', '/suscripciones/' + s4.id_suscripcion), 200);
  check('eliminar cliente sin historial', await call('DELETE', '/clientes/' + c3.id_persona), 200);

  const ult = (await call('GET', '/programacion'))[1][0];
  check('cruce de horario del entrenador', await call('POST', '/programacion', { id_clase: 1, id_entrenador: ult.id_entrenador, id_sede: 1, fecha_hora_inicio: ult.fecha_hora_inicio.replace(' ', 'T'), duracion_minutos: 30 }), 409);

  for (const k of ['ingresos_mensuales', 'membresias_vendidas', 'por_vencer', 'cartera_pendiente', 'ocupacion_clases', 'actividad_entrenadores', 'accesos_por_hora', 'clientes_frecuentes']) {
    check('informe ' + k, await call('GET', '/informes/' + k), 200);
  }

  await login('cliente1');
  check('cliente no ve /clientes', await call('GET', '/clientes'), 403);
  check('portal del cliente', await call('GET', '/portal/resumen'), 200);
  await login('recepcion');
  check('recepción no crea sedes', await call('POST', '/sedes', { nombre: 'x', direccion: 'y' }), 403);
  await login('carlos.rojas');
  check('entrenador crea su rutina', await call('POST', '/rutinas', { id_cliente: c2.id_persona, nombre_rutina: 'Auto' }), 201);

  console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
  process.exit(fallos ? 1 : 0);
})();
