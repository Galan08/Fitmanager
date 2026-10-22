// CAPA FÍSICA: consultas de informes (SQL de PostgreSQL) (JOIN de varias tablas, filtros, agrupaciones y cálculos).
const { pool } = require('../../config/db');

const q = async (sql, params = []) => (await pool.query(sql, params))[0];
const NOMBRE = (a) => `CONCAT(${a}.nombres,' ',${a}.apellidos)`;
const SALDO = `f.total - COALESCE((SELECT SUM(x.monto) FROM pago x WHERE x.id_factura = f.id_factura AND x.estado_pago = 'Aprobado'), 0)`;

const informes = {
  ingresos_mensuales: {
    titulo: 'Ingresos mensuales',
    descripcion: 'Pagos aprobados agrupados por mes (cantidad, total y promedio).',
    filtros: ['rango'],
    columns: [{ key: 'mes', label: 'Mes' }, { key: 'pagos', label: 'Pagos' }, { key: 'ingresos', label: 'Ingresos', type: 'money' }, { key: 'promedio', label: 'Pago promedio', type: 'money' }],
    run: ({ desde, hasta }) => q(
      `SELECT to_char(p.fecha_pago,'YYYY-MM') AS mes, COUNT(*) AS pagos, SUM(p.monto) AS ingresos, ROUND(AVG(p.monto)) AS promedio
         FROM pago p WHERE p.estado_pago = 'Aprobado' AND p.fecha_pago::date BETWEEN ?::date AND ?::date
        GROUP BY to_char(p.fecha_pago,'YYYY-MM') ORDER BY mes`, [desde, hasta]),
  },
  membresias_vendidas: {
    titulo: 'Membresías más vendidas',
    descripcion: 'Suscripciones iniciadas por plan y valor facturado en el período.',
    filtros: ['rango'],
    columns: [{ key: 'membresia', label: 'Membresía' }, { key: 'suscripciones', label: 'Suscripciones' }, { key: 'facturado', label: 'Facturado', type: 'money' }],
    run: ({ desde, hasta }) => q(
      `SELECT m.nombre AS membresia, COUNT(DISTINCT s.id_suscripcion) AS suscripciones, COALESCE(SUM(f.total), 0) AS facturado
         FROM membresia m
         LEFT JOIN suscripcion s ON s.id_membresia = m.id_membresia AND s.fecha_inicio BETWEEN ?::date AND ?::date
         LEFT JOIN factura f ON f.id_suscripcion = s.id_suscripcion AND f.estado <> 'Anulada'
        GROUP BY m.id_membresia, m.nombre ORDER BY suscripciones DESC, facturado DESC`, [desde, hasta]),
  },
  por_vencer: {
    titulo: 'Suscripciones por vencer',
    descripcion: 'Clientes con suscripción activa que vence en los próximos días (para gestionar renovaciones).',
    filtros: ['dias'],
    columns: [{ key: 'cliente', label: 'Cliente' }, { key: 'telefono', label: 'Teléfono' }, { key: 'membresia', label: 'Membresía' }, { key: 'fecha_fin', label: 'Vence', type: 'date' }, { key: 'dias_restantes', label: 'Días restantes' }],
    run: ({ dias }) => q(
      `SELECT ${NOMBRE('p')} AS cliente, p.telefono, m.nombre AS membresia, s.fecha_fin, (s.fecha_fin - CURRENT_DATE) AS dias_restantes
         FROM suscripcion s JOIN persona p ON p.id_persona = s.id_cliente JOIN membresia m ON m.id_membresia = s.id_membresia
        WHERE s.estado = 'Activa' AND s.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + ?::int
        ORDER BY s.fecha_fin`, [dias]),
  },
  cartera_pendiente: {
    titulo: 'Cartera pendiente',
    descripcion: 'Clientes con facturas sin pagar y el saldo total que deben.',
    filtros: [],
    columns: [{ key: 'cliente', label: 'Cliente' }, { key: 'telefono', label: 'Teléfono' }, { key: 'facturas', label: 'Facturas' }, { key: 'saldo', label: 'Saldo', type: 'money' }, { key: 'desde', label: 'Deuda desde', type: 'date' }],
    run: () => q(
      `SELECT ${NOMBRE('p')} AS cliente, p.telefono, COUNT(f.id_factura) AS facturas, SUM(${SALDO}) AS saldo, MIN(f.fecha_emision)::date AS desde
         FROM factura f JOIN suscripcion s ON s.id_suscripcion = f.id_suscripcion JOIN persona p ON p.id_persona = s.id_cliente
        WHERE f.estado = 'Pendiente' GROUP BY p.id_persona, p.nombres, p.apellidos, p.telefono ORDER BY saldo DESC`),
  },
  ocupacion_clases: {
    titulo: 'Ocupación de clases',
    descripcion: 'Sesiones, reservas, asistencia y porcentaje de ocupación por tipo de clase.',
    filtros: ['rango'],
    columns: [{ key: 'clase', label: 'Clase' }, { key: 'sesiones', label: 'Sesiones' }, { key: 'reservas', label: 'Reservas' }, { key: 'asistencias', label: 'Asistencias' }, { key: 'ocupacion_pct', label: 'Ocupación', type: 'pct' }],
    run: ({ desde, hasta }) => q(
      `SELECT c.nombre_clase AS clase, COUNT(DISTINCT pc.id_programacion) AS sesiones, COUNT(r.id_reserva) AS reservas,
              COUNT(CASE WHEN r.estado_reserva = 'Asistio' THEN 1 END) AS asistencias,
              ROUND(COUNT(r.id_reserva)::numeric / (COUNT(DISTINCT pc.id_programacion) * c.capacidad_maxima) * 100, 1) AS ocupacion_pct
         FROM clase c
         JOIN programacion_clase pc ON pc.id_clase = c.id_clase AND pc.fecha_hora_inicio::date BETWEEN ?::date AND ?::date
         LEFT JOIN reserva_clase r ON r.id_programacion = pc.id_programacion AND r.estado_reserva <> 'Cancelada'
        GROUP BY c.id_clase, c.nombre_clase, c.capacidad_maxima ORDER BY ocupacion_pct DESC`, [desde, hasta]),
  },
  actividad_entrenadores: {
    titulo: 'Actividad por entrenador',
    descripcion: 'Clases dictadas, asistentes atendidos y rutinas asignadas por entrenador.',
    filtros: ['rango'],
    columns: [{ key: 'entrenador', label: 'Entrenador' }, { key: 'especialidad', label: 'Especialidad' }, { key: 'clases_dictadas', label: 'Clases dictadas' }, { key: 'asistentes', label: 'Asistentes' }, { key: 'rutinas_asignadas', label: 'Rutinas asignadas' }],
    run: ({ desde, hasta }) => q(
      `SELECT ${NOMBRE('pe')} AS entrenador, e.especialidad, COUNT(DISTINCT pc.id_programacion) AS clases_dictadas,
              COUNT(CASE WHEN r.estado_reserva = 'Asistio' THEN 1 END) AS asistentes,
              (SELECT COUNT(*) FROM rutina ru WHERE ru.id_entrenador = e.id_entrenador) AS rutinas_asignadas
         FROM entrenador e JOIN persona pe ON pe.id_persona = e.id_persona
         LEFT JOIN programacion_clase pc ON pc.id_entrenador = e.id_entrenador AND pc.fecha_hora_inicio::date BETWEEN ?::date AND ?::date
         LEFT JOIN reserva_clase r ON r.id_programacion = pc.id_programacion
        GROUP BY e.id_entrenador, pe.id_persona, e.especialidad ORDER BY clases_dictadas DESC`, [desde, hasta]),
  },
  accesos_por_hora: {
    titulo: 'Horas pico por sede',
    descripcion: 'Ingresos por sede y hora del día, con permanencia promedio en minutos.',
    filtros: ['rango'],
    columns: [{ key: 'sede', label: 'Sede' }, { key: 'hora', label: 'Hora', type: 'hour' }, { key: 'ingresos', label: 'Ingresos' }, { key: 'permanencia_min', label: 'Permanencia prom. (min)' }],
    run: ({ desde, hasta }) => q(
      `SELECT s.nombre AS sede, EXTRACT(HOUR FROM a.fecha_hora_ingreso)::int AS hora, COUNT(*) AS ingresos,
              ROUND(AVG(EXTRACT(EPOCH FROM (a.fecha_hora_salida - a.fecha_hora_ingreso)) / 60)) AS permanencia_min
         FROM control_acceso a JOIN sede s ON s.id_sede = a.id_sede
        WHERE a.fecha_hora_ingreso::date BETWEEN ?::date AND ?::date
        GROUP BY s.id_sede, s.nombre, EXTRACT(HOUR FROM a.fecha_hora_ingreso) ORDER BY ingresos DESC LIMIT 15`, [desde, hasta]),
  },
  clientes_frecuentes: {
    titulo: 'Clientes más frecuentes',
    descripcion: 'Top 10 de clientes con más visitas al gimnasio en el período.',
    filtros: ['rango'],
    columns: [{ key: 'cliente', label: 'Cliente' }, { key: 'visitas', label: 'Visitas' }, { key: 'permanencia_min', label: 'Permanencia prom. (min)' }, { key: 'ultima_visita', label: 'Última visita', type: 'datetime' }],
    run: ({ desde, hasta }) => q(
      `SELECT ${NOMBRE('p')} AS cliente, COUNT(a.id_acceso) AS visitas,
              ROUND(AVG(EXTRACT(EPOCH FROM (a.fecha_hora_salida - a.fecha_hora_ingreso)) / 60)) AS permanencia_min, MAX(a.fecha_hora_ingreso) AS ultima_visita
         FROM control_acceso a JOIN persona p ON p.id_persona = a.id_cliente
        WHERE a.fecha_hora_ingreso::date BETWEEN ?::date AND ?::date
        GROUP BY p.id_persona ORDER BY visitas DESC LIMIT 10`, [desde, hasta]),
  },
};

const informeRepo = {
  catalogo: () => Object.entries(informes).map(([key, i]) => ({ key, titulo: i.titulo, descripcion: i.descripcion, filtros: i.filtros, columns: i.columns })),
  existe: (key) => Boolean(informes[key]),
  ejecutar: (key, params) => informes[key].run(params),

  async resumen() {
    const [[c]] = await pool.query(`SELECT COUNT(*) n FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE r.nombre = 'Cliente'`);
    const [[s]] = await pool.query(`SELECT COUNT(*) n FROM suscripcion WHERE estado = 'Activa' AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin`);
    const [[i]] = await pool.query(`SELECT COALESCE(SUM(monto),0) total FROM pago WHERE estado_pago = 'Aprobado' AND to_char(fecha_pago,'YYYY-MM') = to_char(CURRENT_DATE,'YYYY-MM')`);
    const [[f]] = await pool.query(`SELECT COUNT(*) n, COALESCE(SUM(${SALDO}),0) saldo FROM factura f WHERE f.estado = 'Pendiente'`);
    const [[h]] = await pool.query(`SELECT COUNT(*) n FROM programacion_clase WHERE fecha_hora_inicio::date = CURRENT_DATE`);
    return { clientes: c.n, suscripcionesActivas: s.n, ingresosMes: i.total, facturasPendientes: f.n, saldoPendiente: f.saldo, clasesHoy: h.n };
  },
};

module.exports = { informeRepo };
