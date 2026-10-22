/**
 * Genera database/seed.sql con datos de ejemplo coherentes.
 * Uso:  npm run seed   (luego cargar seed.sql en PostgreSQL)
 * Todas las fechas son relativas a CURRENT_DATE/LOCALTIMESTAMP para que los informes tengan datos.
 * Contraseña de TODOS los usuarios de ejemplo: Admin123*
 */
const fs = require('fs');
const path = require('path');

const HASH = '$2b$10$WpvrPj9bj6t2AL00XHwtnOyTmlwIBFlcdVnKNqri3im5Xi6NzFeqm';
const IVA = 0.19;
let seed = 7;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const q = (s) => (s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const out = ["SET client_encoding = 'UTF8';"];
const ins = (table, cols, rows) => {
  if (!rows.length) return;
  out.push(`INSERT INTO ${table} (${cols.join(',')}) VALUES\n${rows.map((r) => '  (' + r.join(',') + ')').join(',\n')};`);
};
const dAgo = (d) => `(CURRENT_DATE - ${d})`;
const tsAgo = (d, hh, mm = 0) => `(${dAgo(d)} + TIME '${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00')`;

// ---- Catálogos base
ins('sede', ['nombre', 'direccion', 'telefono', 'estado'], [
  [q('FitManager Centro'), q('Calle 11 # 12-45, Ocaña'), q('3001112233'), q('Activa')],
  [q('FitManager Norte'), q('Carrera 27 # 5-80, Ocaña'), q('3004445566'), q('Activa')],
]);
ins('rol', ['nombre', 'descripcion'], [
  [q('Administrador'), q('Acceso total al sistema')],
  [q('Recepcionista'), q('Gestiona clientes, suscripciones, pagos y accesos')],
  [q('Entrenador'), q('Gestiona rutinas, clases y ejercicios')],
  [q('Cliente'), q('Afiliado del gimnasio: reserva clases y consulta sus rutinas')],
]);

// ---- Personas (1 admin, 2 recepción, 3-5 entrenadores, 6-17 clientes)
const staff = [
  ['1000000001', 'Marcela', 'Quintero Vera', 'admin', 1],
  ['1000000002', 'Pedro', 'Sánchez Ortiz', 'recepcion', 2],
  ['1000000003', 'Carlos', 'Rojas Peña', 'carlos.rojas', 3],
  ['1000000004', 'Laura', 'Méndez Díaz', 'laura.mendez', 3],
  ['1000000005', 'Andrés', 'Pico Lobo', 'andres.pico', 3],
];
const clientes = [
  ['1090100001', 'Dorainy', 'Guerrero Bayona'], ['1090100002', 'Jesús', 'Zapata Lozano'],
  ['1090100003', 'Johan', 'Galán Herrera'], ['1090100004', 'Valentina', 'Cárdenas Ruiz'],
  ['1090100005', 'Sebastián', 'Mora Pacheco'], ['1090100006', 'Camila', 'Arévalo Soto'],
  ['1090100007', 'Daniel', 'Peñaranda Gil'], ['1090100008', 'Isabela', 'Contreras Mejía'],
  ['1090100009', 'Mateo', 'Rincón Duarte'], ['1090100010', 'Sofía', 'Lobo Navarro'],
  ['1090100011', 'Tomás', 'Bayona Quintero'], ['1090100012', 'Natalia', 'Ortiz Castro'],
].map((c, i) => [...c, `cliente${i + 1}`, 4]);
const people = [...staff, ...clientes];
ins('persona', ['documento_identidad', 'nombres', 'apellidos', 'fecha_nacimiento', 'email', 'telefono', 'fecha_registro'],
  people.map((p, i) => [q(p[0]), q(p[1]), q(p[2]), dAgo(7000 + i * 431),
    q(`${p[3].replace('.', '')}@fitmanager.co`), q(`31${String(20000000 + i * 137).slice(0, 8)}`), dAgo(i < 5 ? 400 : 200 - i * 8)]));
ins('usuario', ['id_persona', 'id_rol', 'username', 'password_hash'],
  people.map((p, i) => [i + 1, p[4], q(p[3]), q(HASH)]));

ins('entrenador', ['id_persona', 'id_sede', 'especialidad'], [
  [3, 1, q('Fuerza e hipertrofia')], [4, 1, q('Yoga y pilates')], [5, 2, q('Funcional y crossfit')],
]);

// ---- Membresías
const mem = [
  ['Pase diario', 'Acceso por un día a todas las sedes', 15000, 1],
  ['Mensual', 'Acceso ilimitado por 30 días', 90000, 30],
  ['Trimestral', 'Acceso ilimitado por 90 días con 10% de ahorro', 240000, 90],
  ['Semestral', 'Acceso ilimitado por 180 días más valoración física', 450000, 180],
  ['Anual', 'Acceso ilimitado por 365 días, clases incluidas', 800000, 365],
];
ins('membresia', ['nombre', 'descripcion', 'precio', 'duracion_dias', 'estado'], mem.map((m) => [q(m[0]), q(m[1]), m[2], m[3], q('Activa')]));

// ---- Suscripciones, facturas y pagos
// [persona, membresia(1..5), diasDesdeInicio, pagada]
const subs = [];
[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].forEach((p, i) => {
  // historial (vencidas) para dar volumen a los informes mensuales
  if (i < 8) subs.push([p, 2, 170 + i * 3, true]);
  if (i < 6) subs.push([p, 2, 140 + i * 2, true]);
  if (i < 6) subs.push([p, 2, 110 + i, true]);
  if (i < 4) subs.push([p, 3, 80 + i, true]);
});
// vigentes
subs.push([6, 3, 20, true], [7, 4, 45, true], [8, 5, 60, true], [9, 2, 12, true], [10, 2, 25, true],
  [11, 3, 30, true], [12, 2, 5, true], [13, 2, 10, true], [14, 4, 15, true],
  [15, 2, 2, false], [16, 3, 1, false], [17, 2, 29, true]); // 15 y 16 con pago pendiente; 17 vence mañana
const rows = { sus: [], fac: [], pag: [] };
const activos = new Set();
const metodos = ['Efectivo', 'Tarjeta', 'Transferencia', 'PSE'];
subs.forEach(([p, m, ago, pagada], i) => {
  const id = i + 1;
  const [nom, , precio, dur] = mem[m - 1];
  const vigente = ago < dur;
  const estado = !pagada ? 'Pendiente' : vigente ? 'Activa' : 'Vencida';
  if (estado === 'Activa') activos.add(p);
  rows.sus.push([p, m, dAgo(ago), `(${dAgo(ago)} + ${dur})`, q(estado)]);
  const imp = Math.round(precio * IVA);
  rows.fac.push([id, q(`FAC-${String(id).padStart(5, '0')}`), tsAgo(ago, 9 + (i % 8), 15), precio, 0, imp, precio + imp, q(pagada ? 'Pagada' : 'Pendiente')]);
  if (pagada) rows.pag.push([id, precio + imp, tsAgo(ago, 9 + (i % 8), 20), q(metodos[i % 4]), q('Aprobado'), q(`PAG-${String(id).padStart(5, '0')}`), q(`Pago ${nom}`)]);
});
ins('suscripcion', ['id_cliente', 'id_membresia', 'fecha_inicio', 'fecha_fin', 'estado'], rows.sus);
ins('factura', ['id_suscripcion', 'numero_factura', 'fecha_emision', 'subtotal', 'descuento', 'impuesto', 'total', 'estado'], rows.fac);
ins('pago', ['id_factura', 'monto', 'fecha_pago', 'metodo_pago', 'estado_pago', 'referencia_pago', 'concepto'], rows.pag);
const activosArr = [...activos];

// ---- Control de acceso (últimos 30 días + 3 personas dentro ahora)
const acc = [];
for (let d = 30; d >= 1; d--) {
  const n = 3 + rnd(5);
  for (let k = 0; k < n; k++) {
    const c = activosArr[rnd(activosArr.length)];
    const h = 6 + rnd(15), min = rnd(60), dur = 50 + rnd(70);
    acc.push([c, 1 + rnd(2), tsAgo(d, h, min), `(${tsAgo(d, h, min)} + INTERVAL '${dur} minutes')`]);
  }
}
for (let k = 0; k < 3; k++) acc.push([activosArr[k], 1 + (k % 2), `(LOCALTIMESTAMP(0) - INTERVAL '${20 + k * 15} minutes')`, 'NULL']);
ins('control_acceso', ['id_cliente', 'id_sede', 'fecha_hora_ingreso', 'fecha_hora_salida'], acc);

// ---- Clases, programación y reservas
const clases = [['Spinning', 'Ciclismo indoor de alta intensidad', 20], ['Yoga', 'Flexibilidad, respiración y equilibrio', 15],
  ['Zumba', 'Baile fitness con ritmos latinos', 25], ['Crossfit', 'Entrenamiento funcional de alta intensidad', 12],
  ['Pilates', 'Fortalecimiento del core y postura', 15]];
ins('clase', ['nombre_clase', 'descripcion', 'capacidad_maxima'], clases.map((c) => [q(c[0]), q(c[1]), c[2]]));
const sedeEnt = { 1: 1, 2: 1, 3: 2 };
const prog = [], res = [];
let pid = 0;
for (let off = -14; off <= 7; off++) {
  [[7, 0, 1], [18, 30, 2]].forEach(([h, mi, slot], s) => {
    pid++;
    const idClase = 1 + ((off + 20) * 2 + s) % 5;
    const ent = 1 + ((off + 20) + s) % 3;
    prog.push([idClase, ent, sedeEnt[ent],
      off <= 0 ? tsAgo(-off, h, mi) : `((CURRENT_DATE + ${off}) + TIME '${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00')`,
      slot === 1 ? 60 : 45]);
    const used = new Set();
    const n = 3 + rnd(Math.min(6, clases[idClase - 1][2]));
    for (let k = 0; k < n; k++) {
      const c = activosArr[rnd(activosArr.length)];
      if (used.has(c)) continue;
      used.add(c);
      const past = off < 0 || (off === 0 && h === 7);
      res.push([c, pid, past ? tsAgo(-off + 1, 10 + rnd(8)) : `(LOCALTIMESTAMP(0) - INTERVAL '${rnd(48) + 1} hours')`, q(past ? (rnd(5) === 0 ? 'Cancelada' : 'Asistio') : 'Confirmada')]);
    }
  });
}
ins('programacion_clase', ['id_clase', 'id_entrenador', 'id_sede', 'fecha_hora_inicio', 'duracion_minutos'], prog);
ins('reserva_clase', ['id_cliente', 'id_programacion', 'fecha_reserva', 'estado_reserva'], res);

// ---- Ejercicios, rutinas y detalle
const ej = [['Press de banca', 'Pecho'], ['Sentadilla libre', 'Piernas'], ['Peso muerto', 'Espalda'], ['Dominadas', 'Espalda'],
  ['Press militar', 'Hombros'], ['Curl de bíceps', 'Brazos'], ['Fondos en paralelas', 'Brazos'], ['Plancha abdominal', 'Core'],
  ['Zancadas', 'Piernas'], ['Remo con barra', 'Espalda'], ['Elevaciones laterales', 'Hombros'], ['Hip thrust', 'Glúteos']];
ins('ejercicio', ['nombre_ejercicio', 'grupo_muscular', 'descripcion'], ej.map((e) => [q(e[0]), q(e[1]), q(`Ejercicio de ${e[1].toLowerCase()} con técnica controlada`)]));
const rut = [[6, 1, 'Hipertrofia tren superior', 'Ganar masa muscular'], [7, 1, 'Fuerza base', 'Aumentar fuerza máxima'],
  [8, 3, 'Funcional full body', 'Acondicionamiento general'], [9, 2, 'Tonificación y core', 'Tonificar y mejorar postura'],
  [10, 3, 'Pérdida de grasa', 'Reducir porcentaje graso'], [11, 1, 'Piernas y glúteos', 'Desarrollo de tren inferior']];
ins('rutina', ['id_cliente', 'id_entrenador', 'nombre_rutina', 'objetivo', 'fecha_asignacion'], rut.map((r, i) => [r[0], r[1], q(r[2]), q(r[3]), dAgo(5 + i * 6)]));
const det = [];
rut.forEach((_, i) => {
  const picks = new Set();
  while (picks.size < 5) picks.add(1 + rnd(12));
  [...picks].forEach((e, k) => det.push([i + 1, e, 3 + rnd(2), 8 + rnd(5), 45 + rnd(4) * 15, k + 1]));
});
ins('detalle_rutina', ['id_rutina', 'id_ejercicio', 'series', 'repeticiones', 'descanso_segundos', 'orden'], det);

fs.writeFileSync(path.join(__dirname, 'seed.sql'), out.join('\n') + '\n');
console.log('seed.sql generado');
