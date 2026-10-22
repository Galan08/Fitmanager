// CAPA DE PRESENTACIÓN (cliente): vistas genéricas y especializadas.
import { api } from './api.js';
import { h, money, fmtDate, fmtDT, today, ahora, badge, toast, openModal, confirmDialog, openForm, dataTable, btn, downloadCSV } from './ui.js';

const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia', 'PSE'];
const head = (title, sub, ...tools) => h('div', { class: 'page-head' }, h('div', {}, h('h2', {}, title), sub ? h('p', {}, sub) : null), tools.length ? h('div', { class: 'toolbar' }, tools) : null);

// ======================================================================
// Vista CRUD genérica (SELECT / INSERT / UPDATE / DELETE contra la API)
// ======================================================================
export function crudView(cfg, user) {
  const canWrite = user.rol === 'Administrador' || (cfg.write || []).includes(user.rol);
  const visible = (f) => !f.show || f.show(user);
  let rows = [], query = '';
  const wrap = h('div', { class: 'card' });
  const search = h('input', { type: 'search', placeholder: 'Buscar…', 'aria-label': 'Buscar', oninput: (e) => { query = e.target.value.toLowerCase(); render(); } });
  const root = h('div', {}, head(cfg.title, cfg.subtitle, search,
    canWrite && cfg.canCreate !== false ? h('button', { class: 'btn primary', type: 'button', onclick: () => openCreate() }, cfg.newLabel || 'Nuevo') : null), wrap);

  async function load() {
    try { rows = await api.get(cfg.endpoint); render(); } catch (e) { wrap.replaceChildren(h('div', { class: 'empty' }, e.message)); }
  }
  function render() {
    const shown = query ? rows.filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(query)) : rows;
    wrap.replaceChildren(
      dataTable({ columns: cfg.columns, rows: shown, empty: cfg.empty || 'Aún no hay registros. Crea el primero con el botón de arriba.', actions: (row) => [
        ...(cfg.actions || []).filter((a) => (!a.when || a.when(row)) && (!a.write || canWrite)).map((a) => btn(a.label, () => a.run(row, { reload: load, user, canWrite }), a.cls || '')),
        canWrite && cfg.canEdit !== false ? btn('Editar', () => openEdit(row)) : null,
        canWrite && cfg.canDelete !== false ? btn('Eliminar', () => remove(row), 'danger') : null,
      ] }),
      h('div', { class: 'count' }, `${shown.length} de ${rows.length} registro(s)`));
  }
  const formFields = (mode) => cfg.fields.filter((f) => visible(f) && (mode === 'create' ? !f.editOnly : !f.createOnly));
  function openCreate() {
    openForm({ title: cfg.newLabel || `Nuevo: ${cfg.singular}`, fields: formFields('create'), wide: cfg.wide, submitLabel: 'Crear',
      onSubmit: async (d) => { await api.post(cfg.endpoint, d); toast(`${cfg.singular} creado`); load(); } });
  }
  function openEdit(row) {
    openForm({ title: `Editar ${cfg.singular.toLowerCase()}`, fields: formFields('edit'), values: row, wide: cfg.wide,
      onSubmit: async (d) => { await api.put(`${cfg.endpoint}/${row[cfg.idKey]}`, d); toast(`${cfg.singular} actualizado`); load(); } });
  }
  async function remove(row) {
    if (!(await confirmDialog(`¿Eliminar ${cfg.singular.toLowerCase()} "${cfg.label(row)}"? Esta acción no se puede deshacer.`))) return;
    try { await api.del(`${cfg.endpoint}/${row[cfg.idKey]}`); toast(`${cfg.singular} eliminado`); load(); } catch (e) { toast(e.message, true); }
  }
  load();
  return root;
}

// ---------- Cobro de una factura (compartido por Suscripciones y Facturas) ----------
export async function cobrar(idFactura, reload) {
  const f = await api.get(`/facturas/${idFactura}`);
  openForm({
    title: `Registrar pago · ${f.numero_factura}`, submitLabel: 'Registrar pago',
    fields: [
      { key: 'monto', label: 'Monto', type: 'number', step: 'any', required: true, default: f.saldo, hint: `Saldo pendiente: ${money(f.saldo)}` },
      { key: 'metodo_pago', label: 'Método de pago', type: 'select', options: METODOS, required: true },
      { key: 'concepto', label: 'Concepto', full: true, default: `Pago ${f.membresia} · ${f.cliente}` },
    ],
    onSubmit: async (d) => { await api.post('/pagos', { ...d, id_factura: idFactura }); toast('Pago registrado'); reload(); },
  });
}

// ---------- Detalle de rutina (relación N:M rutina ↔ ejercicio) ----------
export async function gestionarDetalle(rutina, { canWrite }) {
  const body = h('div');
  const dlg = openModal({ title: `Ejercicios · ${rutina.nombre_rutina}`, body, wide: true });
  const fields = [
    { key: 'id_ejercicio', label: 'Ejercicio', type: 'select', lookup: 'ejercicios', required: true, full: true },
    { key: 'series', label: 'Series', type: 'number', required: true, default: 3, min: 1 },
    { key: 'repeticiones', label: 'Repeticiones', type: 'number', required: true, default: 10, min: 1 },
    { key: 'descanso_segundos', label: 'Descanso (segundos)', type: 'number', default: 60 },
    { key: 'orden', label: 'Orden', type: 'number', min: 1, hint: 'Vacío = al final' },
  ];
  async function load() {
    const rows = await api.get(`/rutinas/${rutina.id_rutina}/detalle`);
    body.replaceChildren(
      h('p', {}, `Cliente: ${rutina.cliente} · Objetivo: ${rutina.objetivo || '—'}`),
      canWrite ? h('p', {}, btn('Agregar ejercicio', () => openForm({ title: 'Agregar ejercicio', fields, submitLabel: 'Agregar',
        onSubmit: async (d) => { await api.post(`/rutinas/${rutina.id_rutina}/detalle`, d); toast('Ejercicio agregado'); load(); } }), '')) : null,
      dataTable({ empty: 'Esta rutina aún no tiene ejercicios.', rows, columns: [
        { key: 'orden', label: '#' }, { key: 'nombre_ejercicio', label: 'Ejercicio' }, { key: 'grupo_muscular', label: 'Grupo' },
        { key: 'series', label: 'Series', num: true }, { key: 'repeticiones', label: 'Reps', num: true }, { key: 'descanso_segundos', label: 'Descanso (s)', num: true }],
        actions: canWrite ? (r) => [
          btn('Editar', () => openForm({ title: 'Editar ejercicio de la rutina', fields, values: r,
            onSubmit: async (d) => { await api.put(`/detalle-rutina/${r.id_detalle}`, d); toast('Detalle actualizado'); load(); } })),
          btn('Quitar', async () => { if (await confirmDialog(`¿Quitar "${r.nombre_ejercicio}" de la rutina?`, 'Quitar')) { await api.del(`/detalle-rutina/${r.id_detalle}`); toast('Ejercicio quitado'); load(); } }, 'danger'),
        ] : null }));
  }
  load().catch((e) => { body.textContent = e.message; });
  return dlg;
}

// ======================================================================
// Panel principal
// ======================================================================
export async function dashboardView() {
  const [aforo, r, venc, prog] = await Promise.all([api.get('/accesos/aforo'), api.get('/informes/resumen'), api.get('/informes/por_vencer?dias=7'), api.get('/programacion')]);
  const proximas = prog.filter((p) => p.fecha_hora_inicio >= ahora()).sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio)).slice(0, 6);
  const kpi = (v, t) => h('div', { class: 'card kpi' }, h('div', { class: 'v' }, v), h('div', { class: 't' }, t));
  return h('div', {},
    head('Panel', 'Estado del gimnasio ahora mismo.'),
    h('div', { class: 'aforo' }, aforo.map((s) => h('div', { class: 'aforo-card' }, h('div', { class: 'n' }, s.dentro), h('div', { class: 's' }, s.nombre), h('div', { class: 'l' }, s.dentro === 1 ? 'persona dentro ahora' : 'personas dentro ahora')))),
    h('div', { class: 'kpis' },
      kpi(r.clientes, 'Clientes registrados'), kpi(r.suscripcionesActivas, 'Suscripciones activas'), kpi(money(r.ingresosMes), 'Ingresos del mes'),
      kpi(`${r.facturasPendientes} · ${money(r.saldoPendiente)}`, 'Facturas pendientes y saldo'), kpi(r.clasesHoy, 'Clases hoy')),
    h('div', { class: 'cols' },
      h('section', { class: 'card' }, h('h3', {}, 'Vencen en los próximos 7 días'), h('p', { class: 'sub' }, 'Buen momento para ofrecer la renovación.'),
        dataTable({ rows: venc, empty: 'Ninguna suscripción vence esta semana.', columns: [{ key: 'cliente', label: 'Cliente' }, { key: 'membresia', label: 'Plan' }, { key: 'fecha_fin', label: 'Vence', render: (x) => fmtDate(x.fecha_fin) }] })),
      h('section', { class: 'card' }, h('h3', {}, 'Próximas clases'), h('p', { class: 'sub' }, 'Cupos ocupados sobre capacidad.'),
        dataTable({ rows: proximas, empty: 'No hay clases programadas.', columns: [{ key: 'nombre_clase', label: 'Clase' }, { key: 'fecha_hora_inicio', label: 'Cuándo', render: (x) => fmtDT(x.fecha_hora_inicio) }, { key: 'sede', label: 'Sede' }, { key: 'reservas', label: 'Cupos', num: true, render: (x) => `${x.reservas}/${x.capacidad_maxima}` }] }))));
}

// ======================================================================
// Control de acceso
// ======================================================================
export async function accesosView(user) {
  const root = h('div');
  const aforoBox = h('div', { class: 'aforo' });
  const tableBox = h('div', { class: 'card' });
  const [clientes, sedes] = await Promise.all([api.get('/lookups/clientes'), api.get('/lookups/sedes')]);
  const selCliente = h('select', { required: true }, h('option', { value: '' }, '— Seleccionar cliente —'), clientes.map((c) => h('option', { value: c.value }, c.label)));
  const selSede = h('select', { required: true }, sedes.map((s) => h('option', { value: s.value }, s.label)));
  const form = h('form', { class: 'card quick', onsubmit: async (e) => {
    e.preventDefault();
    try { await api.post('/accesos', { id_cliente: selCliente.value, id_sede: selSede.value }); toast('Ingreso registrado'); selCliente.value = ''; load(); }
    catch (err) { toast(err.message, true); }
  } }, h('label', {}, 'Cliente', selCliente), h('label', {}, 'Sede', selSede), h('button', { class: 'btn primary', type: 'submit' }, 'Registrar ingreso'));

  async function load() {
    const [aforo, rows] = await Promise.all([api.get('/accesos/aforo'), api.get('/accesos')]);
    aforoBox.replaceChildren(...aforo.map((s) => h('div', { class: 'aforo-card' }, h('div', { class: 'n' }, s.dentro), h('div', { class: 's' }, s.nombre), h('div', { class: 'l' }, 'dentro ahora'))));
    tableBox.replaceChildren(dataTable({ rows, empty: 'Todavía no hay ingresos registrados.',
      columns: [
        { key: 'cliente', label: 'Cliente' }, { key: 'sede', label: 'Sede' },
        { key: 'fecha_hora_ingreso', label: 'Ingreso', render: (r) => fmtDT(r.fecha_hora_ingreso) },
        { key: 'fecha_hora_salida', label: 'Salida', render: (r) => (r.fecha_hora_salida ? fmtDT(r.fecha_hora_salida) : badge('Pendiente')) },
        { key: 'minutos', label: 'Permanencia', num: true, render: (r) => (r.minutos == null ? '—' : `${r.minutos} min`) }],
      actions: (r) => [
        !r.fecha_hora_salida ? btn('Registrar salida', async () => { try { await api.put(`/accesos/${r.id_acceso}/salida`); toast('Salida registrada'); load(); } catch (e) { toast(e.message, true); } }) : null,
        btn('Eliminar', async () => { if (await confirmDialog('¿Eliminar este registro de acceso?')) { try { await api.del(`/accesos/${r.id_acceso}`); toast('Registro eliminado'); load(); } catch (e) { toast(e.message, true); } } }, 'danger')] }),
      h('div', { class: 'count' }, 'Se muestran los 200 accesos más recientes.'));
  }
  root.append(head('Control de acceso', 'El ingreso solo se permite con una suscripción activa.'), aforoBox, form, tableBox);
  await load();
  return root;
}

// ======================================================================
// Informes
// ======================================================================
export async function informesView() {
  const catalogo = await api.get('/informes');
  const root = h('div'), list = h('div', { class: 'card report-list' }), panel = h('div', { class: 'card' });
  let actual = null;
  const fmt = (col, row) => {
    const v = row[col.key];
    if (v === null || v === undefined) return '—';
    if (col.type === 'money') return money(v);
    if (col.type === 'date') return fmtDate(v);
    if (col.type === 'datetime') return fmtDT(v);
    if (col.type === 'hour') return `${String(v).padStart(2, '0')}:00`;
    if (col.type === 'pct') return h('span', {}, h('span', { class: 'bar', style: `width:${Math.min(100, v)}px` }), `${v}%`);
    return v;
  };
  async function abrir(inf) {
    actual = inf;
    [...list.children].forEach((b) => b.setAttribute('aria-current', String(b.dataset.key === inf.key)));
    const hoy = today();
    const f = {
      desde: h('input', { type: 'date', value: new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10) }),
      hasta: h('input', { type: 'date', value: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) }),
      dias: h('input', { type: 'number', min: 1, max: 365, value: 15 }),
    };
    const result = h('div');
    const run = async () => {
      const qs = new URLSearchParams();
      if (inf.filtros.includes('rango')) { qs.set('desde', f.desde.value); qs.set('hasta', f.hasta.value); }
      if (inf.filtros.includes('dias')) qs.set('dias', f.dias.value);
      try {
        const rows = await api.get(`/informes/${inf.key}?${qs}`);
        result.replaceChildren(
          dataTable({ rows, columns: inf.columns.map((c) => ({ ...c, num: ['money', 'pct'].includes(c.type) || typeof rows[0]?.[c.key] === 'number', render: (r) => fmt(c, r) })), empty: 'No hay datos para estos filtros.' }),
          h('div', { class: 'count' }, `${rows.length} fila(s) · `, btn('Descargar CSV', () => downloadCSV(`${inf.key}_${hoy}.csv`, inf.columns, rows))));
      } catch (e) { result.replaceChildren(h('div', { class: 'empty' }, e.message)); }
    };
    panel.replaceChildren(h('h3', {}, inf.titulo), h('p', { class: 'sub' }, inf.descripcion),
      h('div', { class: 'filters' },
        inf.filtros.includes('rango') ? [h('label', {}, 'Desde', f.desde), h('label', {}, 'Hasta', f.hasta)] : null,
        inf.filtros.includes('dias') ? h('label', {}, 'Días hacia adelante', f.dias) : null,
        h('button', { class: 'btn primary', type: 'button', onclick: run }, 'Generar informe')), result);
    run();
  }
  catalogo.forEach((inf) => list.append(h('button', { type: 'button', 'data-key': inf.key, onclick: () => abrir(inf) }, inf.titulo)));
  root.append(head('Informes', 'Consultas que cruzan varias tablas para tomar decisiones.'), h('div', { class: 'reports' }, list, panel));
  abrir(catalogo[0]);
  return root;
}

// ======================================================================
// Portal del cliente
// ======================================================================
export async function miResumenView() {
  const { perfil, suscripciones, activa } = await api.get('/portal/resumen');
  const vigente = suscripciones.find((s) => s.estado === 'Activa' && s.fecha_inicio <= today() && s.fecha_fin >= today());
  return h('div', {}, head(`Hola, ${perfil.nombres}`, 'Tu estado en el gimnasio.'),
    h('div', { class: `card status-card${activa ? ' on' : ''}` },
      h('div', {}, h('div', { class: 'big' }, activa ? 'Suscripción activa' : 'Sin suscripción activa'),
        h('div', {}, activa ? `${vigente.membresia} · vence el ${fmtDate(vigente.fecha_fin)}` : 'Acércate a recepción para renovar tu plan.'))),
    h('section', { class: 'card' }, h('h3', {}, 'Mis suscripciones'),
      dataTable({ rows: suscripciones, empty: 'Aún no tienes suscripciones.', columns: [
        { key: 'membresia', label: 'Plan' }, { key: 'fecha_inicio', label: 'Inicio', render: (s) => fmtDate(s.fecha_inicio) },
        { key: 'fecha_fin', label: 'Fin', render: (s) => fmtDate(s.fecha_fin) }, { key: 'estado', label: 'Estado', render: (s) => badge(s.estado) }] })));
}

export async function misRutinasView() {
  const rutinas = await api.get('/portal/rutinas');
  const root = h('div', {}, head('Mis rutinas', 'Planes de entrenamiento asignados por tu entrenador.'));
  if (!rutinas.length) root.append(h('div', { class: 'card empty' }, 'Todavía no tienes rutinas asignadas.'));
  for (const r of rutinas) {
    const det = await api.get(`/portal/rutinas/${r.id_rutina}/detalle`);
    root.append(h('section', { class: 'card', style: 'margin-bottom:1rem' },
      h('h3', {}, r.nombre_rutina), h('p', { class: 'sub' }, `${r.objetivo || ''} · Entrenador: ${r.entrenador} · Asignada el ${fmtDate(r.fecha_asignacion)}`),
      dataTable({ rows: det, empty: 'Sin ejercicios aún.', columns: [{ key: 'orden', label: '#' }, { key: 'nombre_ejercicio', label: 'Ejercicio' }, { key: 'grupo_muscular', label: 'Grupo' },
        { key: 'series', label: 'Series', num: true }, { key: 'repeticiones', label: 'Reps', num: true }, { key: 'descanso_segundos', label: 'Descanso (s)', num: true }] })));
  }
  return root;
}

export async function misClasesView() {
  const root = h('div'), box = h('div', { class: 'card' });
  const quick = h('div', { class: 'card quick' });
  async function load() {
    const [progs, reservas] = await Promise.all([api.get('/lookups/programaciones'), api.get('/portal/reservas')]);
    const sel = h('select', { required: true }, h('option', { value: '' }, '— Elige una clase —'), progs.map((p) => h('option', { value: p.value }, p.label)));
    quick.replaceChildren(h('label', {}, 'Clase disponible', sel), h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      if (!sel.value) return toast('Elige una clase primero', true);
      try { await api.post('/portal/reservas', { id_programacion: sel.value }); toast('Cupo reservado'); load(); } catch (e) { toast(e.message, true); }
    } }, 'Reservar cupo'));
    box.replaceChildren(h('h3', {}, 'Mis reservas'), dataTable({ rows: reservas, empty: 'Aún no has reservado clases.', columns: [
      { key: 'nombre_clase', label: 'Clase' }, { key: 'fecha_hora_inicio', label: 'Cuándo', render: (r) => fmtDT(r.fecha_hora_inicio) }, { key: 'sede', label: 'Sede' },
      { key: 'estado_reserva', label: 'Estado', render: (r) => badge(r.estado_reserva) }],
      actions: (r) => (r.estado_reserva === 'Confirmada' && r.fecha_hora_inicio > ahora()
        ? [btn('Cancelar', async () => { if (await confirmDialog('¿Cancelar esta reserva?', 'Cancelar reserva')) { try { await api.put(`/portal/reservas/${r.id_reserva}/cancelar`); toast('Reserva cancelada'); load(); } catch (e) { toast(e.message, true); } } }, 'danger')] : []) }));
  }
  root.append(head('Clases', 'Reserva tu cupo en las clases grupales. Los cupos se muestran como ocupados/capacidad.'), quick, box);
  await load();
  return root;
}
