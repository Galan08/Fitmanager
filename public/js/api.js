// CAPA DE PRESENTACIÓN (cliente): comunicación con el servidor y manejo de sesión.
const TOKEN = 'fm_token', USER = 'fm_user';

export const session = {
  get token() { return localStorage.getItem(TOKEN); },
  get user() { try { return JSON.parse(localStorage.getItem(USER)); } catch { return null; } },
  save(token, user) { localStorage.setItem(TOKEN, token); localStorage.setItem(USER, JSON.stringify(user)); },
  clear() { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); },
};

async function request(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session.token ? { Authorization: 'Bearer ' + session.token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('fm:unauthorized'));
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};
/** Listas {value,label} para selectores (sin caché para que siempre estén actualizadas). */
export const lookup = (name) => api.get(`/lookups/${name}`);
