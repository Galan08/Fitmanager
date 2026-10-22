// CAPA DE PRESENTACIÓN (cliente): utilidades de interfaz (elementos, formularios, tablas, mensajes).
export const $ = (sel, root = document) => root.querySelector(sel);

/** Crea elementos del DOM: h('div', {class:'x', onclick}, hijos...) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => {
    if (Array.isArray(c)) c.forEach(add);
    else if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  };
  children.forEach(add);
  return el;
}

// ---------- Formato ----------
export const money = (n) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n));
export const fmtDate = (s) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '—');
export const fmtDT = (s) => (s ? `${fmtDate(s)} ${String(s).slice(11, 16)}` : '—');
/** Fecha y hora local en formato de la API ('AAAA-MM-DD HH:mm'). */
export const ahora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace('T', ' ');
export const today = () => ahora().slice(0, 10);

const TONE = {
  Activa: 'ok', Pagada: 'ok', Aprobado: 'ok', Asistio: 'ok', Confirmada: 'info', Pendiente: 'warn',
  Vencida: 'bad', Cancelada: 'bad', Anulada: 'bad', Anulado: 'bad', Rechazado: 'bad', Inactiva: 'bad',
};
export const badge = (text) => h('span', { class: `badge ${TONE[text] || ''}` }, text);

// ---------- Mensajes ----------
export function toast(msg, isError = false) {
  const t = h('div', { class: `toast${isError ? ' err' : ''}`, role: isError ? 'alert' : 'status' }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), isError ? 6000 : 3200);
}

// ---------- Modal ----------
export function openModal({ title, body, footer, wide = false }) {
  const dlg = h('dialog', { class: wide ? 'wide' : '' },
    h('div', { class: 'modal-head' }, h('h3', {}, title), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Cerrar', onclick: () => dlg.close() }, '✕')),
    h('div', { class: 'modal-body' }, body),
    footer ? h('div', { class: 'modal-foot' }, footer) : null);
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

export function confirmDialog(message, okLabel = 'Eliminar') {
  return new Promise((resolve) => {
    let result = false;
    const dlg = openModal({
      title: 'Confirmar acción',
      body: h('p', {}, message),
      footer: [
        h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Cancelar'),
        h('button', { class: 'btn danger', type: 'button', onclick: () => { result = true; dlg.close(); } }, okLabel),
      ],
    });
    dlg.addEventListener('close', () => resolve(result));
  });
}

// ---------- Formularios ----------
const toInputDT = (v) => (v ? String(v).replace(' ', 'T').slice(0, 16) : '');

/**
 * Abre un formulario modal.
 * fields: [{key,label,type:'text|number|date|datetime|email|password|textarea|select', required, options|lookup, hint, full}]
 */
export async function openForm({ title, fields, values = {}, submitLabel = 'Guardar', wide = false, onSubmit }) {
  const { lookup } = await import('./api.js');
  const lookups = {};
  await Promise.all(fields.filter((f) => f.lookup).map(async (f) => { lookups[f.key] = await lookup(f.lookup); }));

  const control = (f) => {
    const val = values[f.key] ?? (typeof f.default === 'function' ? f.default() : f.default) ?? '';
    const common = { name: f.key, required: !!f.required };
    if (f.type === 'select') {
      const opts = (f.lookup ? lookups[f.key] : f.options).map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
      const sel = h('select', common, !f.required || val === '' ? h('option', { value: '' }, f.blank || '— Seleccionar —') : null,
        opts.map((o) => h('option', { value: o.value }, o.label)));
      sel.value = String(val);
      if (val !== '' && sel.value !== String(val)) sel.value = '';
      return sel;
    }
    if (f.type === 'textarea') return h('textarea', { ...common, value: val });
    if (f.type === 'datetime') return h('input', { ...common, type: 'datetime-local', value: toInputDT(val) });
    if (f.type === 'date') return h('input', { ...common, type: 'date', value: String(val).slice(0, 10) });
    if (f.type === 'number') return h('input', { ...common, type: 'number', step: f.step || '1', min: f.min ?? 0, value: val });
    return h('input', { ...common, type: f.type || 'text', value: val, autocomplete: f.type === 'password' ? 'new-password' : 'off' });
  };

  const error = h('p', { class: 'form-error', role: 'alert' });
  const form = h('form', { novalidate: false },
    h('div', { class: 'form-grid' }, fields.map((f) => h('label', { class: f.full || f.type === 'textarea' ? 'full' : '' },
      f.label + (f.required ? ' *' : ''), control(f), f.hint ? h('span', { class: 'hint' }, f.hint) : null))),
    error);
  const submit = h('button', { class: 'btn primary', type: 'submit' }, submitLabel);
  form.append(h('div', { class: 'modal-foot', style: 'margin:1rem -1.3rem -1.2rem' },
    h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Cancelar'), submit));
  const dlg = openModal({ title, body: form, wide });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {};
    for (const f of fields) {
      let v = form.elements[f.key].value;
      if (f.type === 'number' && v !== '') v = Number(v);
      data[f.key] = v;
    }
    submit.disabled = true; error.textContent = '';
    try { await onSubmit(data); dlg.close(); }
    catch (err) { error.textContent = err.message; submit.disabled = false; }
  });
  return dlg;
}

// ---------- Tablas ----------
/** columns: [{key,label,render?(row),num?}] ; actions: row => [nodos] */
export function dataTable({ columns, rows, actions, empty = 'No hay registros para mostrar.' }) {
  if (!rows.length) return h('div', { class: 'empty' }, empty);
  return h('div', { class: 'table-wrap' }, h('table', {},
    h('thead', {}, h('tr', {}, columns.map((c) => h('th', { class: c.num ? 'num' : '' }, c.label)), actions ? h('th', {}, '') : null)),
    h('tbody', {}, rows.map((row) => h('tr', {},
      columns.map((c) => h('td', { class: c.num ? 'num' : '' }, c.render ? c.render(row) : (row[c.key] ?? '—'))),
      actions ? h('td', { class: 'actions' }, actions(row)) : null)))));
}

export const btn = (label, onclick, cls = '') => h('button', { class: `btn sm ${cls}`, type: 'button', onclick }, label);

/** Descarga las filas como CSV (UTF-8 con BOM para Excel). */
export function downloadCSV(name, columns, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(','))].join('\n');
  const a = h('a', { href: URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })), download: name });
  a.click();
  URL.revokeObjectURL(a.href);
}
