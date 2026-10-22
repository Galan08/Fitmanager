// CAPA DE PRESENTACIÓN (cliente): catálogo de módulos, columnas y formularios de cada pantalla.
import { api } from './api.js';
import { h, money, fmtDate, fmtDT, today, badge, toast, confirmDialog } from './ui.js';
import { crudView, cobrar, gestionarDetalle, dashboardView, accesosView, informesView, miResumenView, misRutinasView, misClasesView } from './views.js';

const A = 'Administrador', R = 'Recepcionista', E = 'Entrenador', C = 'Cliente';
const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia', 'PSE'];
const ESTADO = ['Activa', 'Inactiva'];

const personaFields = [
  { key: 'documento_identidad', label: 'Documento', required: true },
  { key: 'nombres', label: 'Nombres', required: true },
  { key: 'apellidos', label: 'Apellidos', required: true },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
  { key: 'email', label: 'Correo electrónico', type: 'email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'username', label: 'Usuario de acceso', hint: 'Si lo dejas vacío se usa el documento' },
  { key: 'password', label: 'Contraseña', type: 'password', hint: 'Mínimo 6 caracteres. Al editar, vacío = sin cambios' },
];
const nombreCompleto = { key: 'nombre_completo', label: 'Nombre' };

const cfg = {
  clientes: { title: 'Clientes', subtitle: 'Personas con rol Cliente: afiliados del gimnasio.', singular: 'Cliente', endpoint: '/clientes', idKey: 'id_persona', write: [R], wide: true,
    label: (r) => r.nombre_completo, fields: personaFields,
    columns: [{ key: 'documento_identidad', label: 'Documento' }, nombreCompleto, { key: 'email', label: 'Correo' }, { key: 'telefono', label: 'Teléfono' }, { key: 'fecha_registro', label: 'Registro', render: (r) => fmtDate(r.fecha_registro) }, { key: 'username', label: 'Usuario' }] },

  entrenadores: { title: 'Entrenadores', subtitle: 'Personal técnico que dicta clases y diseña rutinas.', singular: 'Entrenador', endpoint: '/entrenadores', idKey: 'id_persona', write: [], wide: true,
    label: (r) => r.nombre_completo,
    fields: [...personaFields, { key: 'id_sede', label: 'Sede', type: 'select', lookup: 'sedes', required: true }, { key: 'especialidad', label: 'Especialidad' }],
    columns: [nombreCompleto, { key: 'especialidad', label: 'Especialidad' }, { key: 'sede', label: 'Sede' }, { key: 'email', label: 'Correo' }, { key: 'telefono', label: 'Teléfono' }] },

  personal: { title: 'Personal administrativo', subtitle: 'Administradores y recepcionistas con acceso al sistema.', singular: 'Usuario', endpoint: '/personal', idKey: 'id_persona', write: [], wide: true,
    label: (r) => r.nombre_completo,
    fields: [...personaFields, { key: 'rol', label: 'Rol', type: 'select', lookup: 'roles_personal', required: true }],
    columns: [nombreCompleto, { key: 'rol', label: 'Rol', render: (r) => badge(r.rol) }, { key: 'username', label: 'Usuario' }, { key: 'email', label: 'Correo' }] },

  suscripciones: { title: 'Suscripciones', subtitle: 'Al crear una suscripción se genera su factura. Puedes cobrarla en el mismo paso.', singular: 'Suscripción', newLabel: 'Nueva suscripción', endpoint: '/suscripciones', idKey: 'id_suscripcion', write: [R],
    label: (r) => `${r.cliente} · ${r.membresia}`,
    fields: [
      { key: 'id_cliente', label: 'Cliente', type: 'select', lookup: 'clientes', required: true, createOnly: true, full: true },
      { key: 'id_membresia', label: 'Membresía', type: 'select', lookup: 'membresias', required: true, createOnly: true, full: true },
      { key: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true, default: today },
      { key: 'fecha_fin', label: 'Fecha de fin', type: 'date', required: true, editOnly: true },
      { key: 'descuento', label: 'Descuento ($)', type: 'number', step: 'any', createOnly: true, hint: 'Opcional' },
      { key: 'metodo_pago', label: 'Cobrar ahora con', type: 'select', options: METODOS, blank: 'No cobrar todavía', createOnly: true, hint: 'Cobra el total de la factura' },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Pendiente', 'Activa', 'Vencida', 'Cancelada'], required: true, editOnly: true },
    ],
    columns: [{ key: 'cliente', label: 'Cliente' }, { key: 'membresia', label: 'Plan' }, { key: 'fecha_inicio', label: 'Inicio', render: (r) => fmtDate(r.fecha_inicio) }, { key: 'fecha_fin', label: 'Fin', render: (r) => fmtDate(r.fecha_fin) }, { key: 'precio', label: 'Precio', num: true, render: (r) => money(r.precio) }, { key: 'estado', label: 'Estado', render: (r) => badge(r.estado) }],
    actions: [{ label: 'Cobrar', write: true, when: (r) => r.estado === 'Pendiente' && r.id_factura, run: (r, { reload }) => cobrar(r.id_factura, reload) }] },

  facturas: { title: 'Facturas', subtitle: 'Se generan automáticamente con cada suscripción.', singular: 'Factura', endpoint: '/facturas', idKey: 'id_factura', write: [R], canCreate: false, canEdit: false, canDelete: false, fields: [],
    label: (r) => r.numero_factura,
    columns: [{ key: 'numero_factura', label: 'Número' }, { key: 'cliente', label: 'Cliente' }, { key: 'membresia', label: 'Plan' }, { key: 'fecha_emision', label: 'Emisión', render: (r) => fmtDT(r.fecha_emision) }, { key: 'total', label: 'Total', num: true, render: (r) => money(r.total) }, { key: 'pagado', label: 'Pagado', num: true, render: (r) => money(r.pagado) }, { key: 'saldo', label: 'Saldo', num: true, render: (r) => money(r.saldo) }, { key: 'estado', label: 'Estado', render: (r) => badge(r.estado) }],
    actions: [
      { label: 'Registrar pago', write: true, when: (r) => r.estado === 'Pendiente', run: (r, { reload }) => cobrar(r.id_factura, reload) },
      { label: 'Anular', write: true, cls: 'danger', when: (r) => r.estado === 'Pendiente' && !r.pagado,
        run: async (r, { reload }) => { if (!(await confirmDialog(`¿Anular la factura ${r.numero_factura}?`, 'Anular'))) return; try { await api.put(`/facturas/${r.id_factura}/anular`); toast('Factura anulada'); reload(); } catch (e) { toast(e.message, true); } } },
    ] },

  pagos: { title: 'Pagos', subtitle: 'Cada pago aprobado actualiza la factura y la suscripción.', singular: 'Pago', newLabel: 'Registrar pago', endpoint: '/pagos', idKey: 'id_pago', write: [R],
    label: (r) => r.referencia_pago,
    fields: [
      { key: 'id_factura', label: 'Factura pendiente', type: 'select', lookup: 'facturas_pendientes', required: true, createOnly: true, full: true },
      { key: 'monto', label: 'Monto', type: 'number', step: 'any', required: true, createOnly: true },
      { key: 'metodo_pago', label: 'Método de pago', type: 'select', options: METODOS, required: true },
      { key: 'estado_pago', label: 'Estado del pago', type: 'select', options: ['Pendiente', 'Aprobado', 'Rechazado', 'Anulado'], required: true, editOnly: true },
      { key: 'concepto', label: 'Concepto', full: true },
    ],
    columns: [{ key: 'fecha_pago', label: 'Fecha', render: (r) => fmtDT(r.fecha_pago) }, { key: 'numero_factura', label: 'Factura' }, { key: 'cliente', label: 'Cliente' }, { key: 'monto', label: 'Monto', num: true, render: (r) => money(r.monto) }, { key: 'metodo_pago', label: 'Método' }, { key: 'estado_pago', label: 'Estado', render: (r) => badge(r.estado_pago) }, { key: 'referencia_pago', label: 'Referencia' }] },

  clases: { title: 'Clases', subtitle: 'Catálogo de actividades dirigidas y su cupo máximo.', singular: 'Clase', endpoint: '/clases', idKey: 'id_clase', write: [E], label: (r) => r.nombre_clase,
    fields: [{ key: 'nombre_clase', label: 'Nombre', required: true }, { key: 'capacidad_maxima', label: 'Capacidad máxima', type: 'number', min: 1, required: true }, { key: 'descripcion', label: 'Descripción', type: 'textarea' }],
    columns: [{ key: 'nombre_clase', label: 'Clase' }, { key: 'capacidad_maxima', label: 'Cupo máximo', num: true }, { key: 'descripcion', label: 'Descripción' }] },

  programacion: { title: 'Programación de clases', subtitle: 'Horarios de cada clase con su entrenador y sede. Un entrenador no puede tener dos clases a la vez.', singular: 'Clase programada', newLabel: 'Programar clase', endpoint: '/programacion', idKey: 'id_programacion', write: [E],
    label: (r) => `${r.nombre_clase} ${fmtDT(r.fecha_hora_inicio)}`,
    fields: [
      { key: 'id_clase', label: 'Clase', type: 'select', lookup: 'clases', required: true },
      { key: 'id_entrenador', label: 'Entrenador', type: 'select', lookup: 'entrenadores', required: true },
      { key: 'id_sede', label: 'Sede', type: 'select', lookup: 'sedes', required: true },
      { key: 'fecha_hora_inicio', label: 'Fecha y hora', type: 'datetime', required: true },
      { key: 'duracion_minutos', label: 'Duración (min)', type: 'number', min: 1, required: true, default: 60 },
    ],
    columns: [{ key: 'nombre_clase', label: 'Clase' }, { key: 'fecha_hora_inicio', label: 'Cuándo', render: (r) => fmtDT(r.fecha_hora_inicio) }, { key: 'duracion_minutos', label: 'Duración', num: true, render: (r) => `${r.duracion_minutos} min` }, { key: 'entrenador', label: 'Entrenador' }, { key: 'sede', label: 'Sede' }, { key: 'reservas', label: 'Cupos', num: true, render: (r) => `${r.reservas}/${r.capacidad_maxima}` }] },

  reservas: { title: 'Reservas de clases', subtitle: 'Requiere suscripción activa y cupo disponible.', singular: 'Reserva', newLabel: 'Nueva reserva', endpoint: '/reservas', idKey: 'id_reserva', write: [R],
    label: (r) => `${r.cliente} · ${r.nombre_clase}`,
    fields: [
      { key: 'id_cliente', label: 'Cliente', type: 'select', lookup: 'clientes', required: true, createOnly: true, full: true },
      { key: 'id_programacion', label: 'Clase programada', type: 'select', lookup: 'programaciones', required: true, createOnly: true, full: true },
      { key: 'estado_reserva', label: 'Estado', type: 'select', options: ['Confirmada', 'Asistio', 'Cancelada'], required: true, editOnly: true },
    ],
    columns: [{ key: 'cliente', label: 'Cliente' }, { key: 'nombre_clase', label: 'Clase' }, { key: 'fecha_hora_inicio', label: 'Cuándo', render: (r) => fmtDT(r.fecha_hora_inicio) }, { key: 'sede', label: 'Sede' }, { key: 'estado_reserva', label: 'Estado', render: (r) => badge(r.estado_reserva) }] },

  rutinas: { title: 'Rutinas', subtitle: 'Planes personalizados. Usa "Ejercicios" para armar el detalle de cada rutina.', singular: 'Rutina', newLabel: 'Nueva rutina', endpoint: '/rutinas', idKey: 'id_rutina', write: [E], label: (r) => r.nombre_rutina,
    fields: [
      { key: 'id_cliente', label: 'Cliente', type: 'select', lookup: 'clientes', required: true, full: true },
      { key: 'id_entrenador', label: 'Entrenador', type: 'select', lookup: 'entrenadores', required: true, full: true, show: (u) => u.rol !== E },
      { key: 'nombre_rutina', label: 'Nombre de la rutina', required: true },
      { key: 'fecha_asignacion', label: 'Fecha de asignación', type: 'date', default: today },
      { key: 'objetivo', label: 'Objetivo', full: true },
    ],
    columns: [{ key: 'nombre_rutina', label: 'Rutina' }, { key: 'cliente', label: 'Cliente' }, { key: 'entrenador', label: 'Entrenador' }, { key: 'objetivo', label: 'Objetivo' }, { key: 'ejercicios', label: 'Ejercicios', num: true }, { key: 'fecha_asignacion', label: 'Asignada', render: (r) => fmtDate(r.fecha_asignacion) }],
    actions: [{ label: 'Ejercicios', run: (r, { canWrite }) => gestionarDetalle(r, { canWrite }) }] },

  ejercicios: { title: 'Ejercicios', subtitle: 'Catálogo de ejercicios disponibles para las rutinas.', singular: 'Ejercicio', endpoint: '/ejercicios', idKey: 'id_ejercicio', write: [E], label: (r) => r.nombre_ejercicio,
    fields: [{ key: 'nombre_ejercicio', label: 'Nombre', required: true }, { key: 'grupo_muscular', label: 'Grupo muscular', required: true }, { key: 'descripcion', label: 'Descripción', type: 'textarea' }],
    columns: [{ key: 'nombre_ejercicio', label: 'Ejercicio' }, { key: 'grupo_muscular', label: 'Grupo muscular' }, { key: 'descripcion', label: 'Descripción' }] },

  membresias: { title: 'Membresías', subtitle: 'Planes que se pueden contratar.', singular: 'Membresía', endpoint: '/membresias', idKey: 'id_membresia', write: [], label: (r) => r.nombre,
    fields: [{ key: 'nombre', label: 'Nombre', required: true }, { key: 'precio', label: 'Precio ($)', type: 'number', step: 'any', required: true }, { key: 'duracion_dias', label: 'Duración (días)', type: 'number', min: 1, required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ESTADO, required: true, default: 'Activa' }, { key: 'descripcion', label: 'Descripción', type: 'textarea' }],
    columns: [{ key: 'nombre', label: 'Plan' }, { key: 'precio', label: 'Precio', num: true, render: (r) => money(r.precio) }, { key: 'duracion_dias', label: 'Duración', num: true, render: (r) => `${r.duracion_dias} días` }, { key: 'estado', label: 'Estado', render: (r) => badge(r.estado) }, { key: 'descripcion', label: 'Descripción' }] },

  sedes: { title: 'Sedes', subtitle: 'Sucursales del gimnasio.', singular: 'Sede', endpoint: '/sedes', idKey: 'id_sede', write: [], label: (r) => r.nombre,
    fields: [{ key: 'nombre', label: 'Nombre', required: true }, { key: 'telefono', label: 'Teléfono' }, { key: 'direccion', label: 'Dirección', required: true, full: true }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADO, required: true, default: 'Activa' }],
    columns: [{ key: 'nombre', label: 'Sede' }, { key: 'direccion', label: 'Dirección' }, { key: 'telefono', label: 'Teléfono' }, { key: 'estado', label: 'Estado', render: (r) => badge(r.estado) }] },
};

const crud = (k) => (user) => crudView(cfg[k], user);

/** Catálogo de módulos. roles = quiénes lo ven (el Administrador ve todo el personal). */
export const MODULES = [
  { id: 'panel', title: 'Panel', roles: [A, R, E], build: dashboardView },
  { id: 'accesos', title: 'Control de acceso', group: 'Operación diaria', roles: [R], build: accesosView },
  { id: 'suscripciones', title: 'Suscripciones', group: 'Operación diaria', roles: [R], build: crud('suscripciones') },
  { id: 'facturas', title: 'Facturas', group: 'Operación diaria', roles: [R], build: crud('facturas') },
  { id: 'pagos', title: 'Pagos', group: 'Operación diaria', roles: [R], build: crud('pagos') },
  { id: 'clientes', title: 'Clientes', group: 'Personas', roles: [R, E], build: crud('clientes') },
  { id: 'entrenadores', title: 'Entrenadores', group: 'Personas', roles: [R, E], build: crud('entrenadores') },
  { id: 'personal', title: 'Personal', group: 'Personas', roles: [], build: crud('personal') },
  { id: 'programacion', title: 'Programación', group: 'Clases', roles: [R, E], build: crud('programacion') },
  { id: 'reservas', title: 'Reservas', group: 'Clases', roles: [R, E], build: crud('reservas') },
  { id: 'clases', title: 'Catálogo de clases', group: 'Clases', roles: [R, E], build: crud('clases') },
  { id: 'rutinas', title: 'Rutinas', group: 'Entrenamiento', roles: [R, E], build: crud('rutinas') },
  { id: 'ejercicios', title: 'Ejercicios', group: 'Entrenamiento', roles: [R, E], build: crud('ejercicios') },
  { id: 'membresias', title: 'Membresías', group: 'Configuración', roles: [R, E], build: crud('membresias') },
  { id: 'sedes', title: 'Sedes', group: 'Configuración', roles: [R, E], build: crud('sedes') },
  { id: 'informes', title: 'Informes', group: 'Análisis', roles: [R, E], build: informesView },
  // Portal del cliente
  { id: 'mi-resumen', title: 'Mi resumen', roles: [C], build: miResumenView },
  { id: 'mis-rutinas', title: 'Mis rutinas', roles: [C], build: misRutinasView },
  { id: 'mis-clases', title: 'Reservar clases', roles: [C], build: misClasesView },
];

export const puedeVer = (m, user) => m.roles.includes(user.rol) || (user.rol === A && !m.roles.includes(C));
