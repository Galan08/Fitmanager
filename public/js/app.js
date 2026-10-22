// CAPA DE PRESENTACIÓN (cliente): arranque, sesión, navegación por hash.
import { api, session } from './api.js';
import { $, h, toast } from './ui.js';
import { MODULES, puedeVer } from './modules.js';

const loginEl = $('#login'), appEl = $('#app'), view = $('#view'), nav = $('#nav'), sidebar = $('#sidebar');
let renderToken = 0;

function showApp() {
  const user = session.user;
  if (!session.token || !user) { loginEl.hidden = false; appEl.hidden = true; return; }
  loginEl.hidden = true; appEl.hidden = false;
  $('#meName').textContent = user.nombre;
  $('#meRole').textContent = user.rol;
  const mods = MODULES.filter((m) => puedeVer(m, user));
  nav.replaceChildren();
  let group;
  for (const m of mods) {
    if (m.group && m.group !== group) nav.append(h('div', { class: 'group' }, m.group));
    group = m.group;
    nav.append(h('a', { href: `#/${m.id}`, 'data-id': m.id }, m.title));
  }
  route();
}

async function route() {
  const user = session.user;
  if (!user) return;
  const mods = MODULES.filter((m) => puedeVer(m, user));
  const id = location.hash.replace(/^#\//, '');
  const mod = mods.find((m) => m.id === id) || mods[0];
  nav.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.id === mod.id));
  sidebar.classList.remove('open');
  const token = ++renderToken;
  view.replaceChildren(h('p', { class: 'empty' }, 'Cargando…'));
  try {
    const node = await mod.build(user);
    if (token === renderToken) { view.replaceChildren(node); view.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  } catch (e) {
    if (token === renderToken) view.replaceChildren(h('div', { class: 'card empty' }, `No se pudo cargar esta pantalla: ${e.message}`));
  }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, err = $('#loginError');
  err.textContent = '';
  try {
    const { token, user } = await api.post('/auth/login', { username: f.username.value, password: f.password.value });
    session.save(token, user);
    f.reset();
    location.hash = '';
    showApp();
  } catch (ex) { err.textContent = ex.message; }
});
$('#logoutBtn').addEventListener('click', () => { session.clear(); location.hash = ''; showApp(); });
$('#menuBtn').addEventListener('click', () => sidebar.classList.toggle('open'));
window.addEventListener('hashchange', route);
window.addEventListener('fm:unauthorized', () => { session.clear(); showApp(); toast('Tu sesión expiró. Inicia sesión de nuevo.', true); });

showApp();
