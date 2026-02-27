const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3001/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const auth = {
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  register: (name, email, password) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(handleResponse),

  me: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(handleResponse),

  guest: () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers,
    }).then(handleResponse);
  },
};

// Bookmarks
export const bookmarks = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/bookmarks?${query}`, { headers: getHeaders() }).then(handleResponse);
  },

  listPublic: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/bookmarks/public?${query}`, { headers: getHeaders() }).then(handleResponse);
  },

  get: (id) =>
    fetch(`${API_BASE}/bookmarks/${id}`, { headers: getHeaders() }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE}/bookmarks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_BASE}/bookmarks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE}/bookmarks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  importJson: (data) =>
    fetch(`${API_BASE}/bookmarks/import/json`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookmarks: data }),
    }).then(handleResponse),
};

// Tags
export const tags = {
  list: () =>
    fetch(`${API_BASE}/tags`, { headers: getHeaders() }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_BASE}/tags/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE}/tags/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),
};

// Groups
export const groups = {
  list: () =>
    fetch(`${API_BASE}/groups`, { headers: getHeaders() }).then(handleResponse),

  listFlat: () =>
    fetch(`${API_BASE}/groups/flat`, { headers: getHeaders() }).then(handleResponse),

  create: (data) =>
    fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),
};

// Export helpers
export const exportBookmarks = {
  json: () => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}/bookmarks/export/json`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.blob());
  },
  html: () => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE}/bookmarks/export/html`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.blob());
  },
};
