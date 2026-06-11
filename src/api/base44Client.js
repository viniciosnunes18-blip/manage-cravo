import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cravo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Retorna data diretamente para compatibilidade com o SDK original
api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err.response?.data || err)
);

function makeEntity(entityType) {
  return {
    list: (params) => api.get(`/entities/${entityType}`, { params }),
    filter: (query) => api.get(`/entities/${entityType}`, { params: { q: JSON.stringify(query) } }),
    get: (id) => api.get(`/entities/${entityType}/${id}`),
    create: (data) => api.post(`/entities/${entityType}`, data),
    update: (id, data) => api.put(`/entities/${entityType}/${id}`, data),
    delete: (id) => api.delete(`/entities/${entityType}/${id}`),
    bulkCreate: (items) => api.post(`/entities/${entityType}/bulk`, items),
  };
}

// Proxy dinâmico: base44.entities.QualquerEntidade.list() funciona sem precisar declarar cada uma
const entities = new Proxy({}, {
  get(_, entityType) {
    return makeEntity(String(entityType));
  },
});

export const base44 = {
  entities,

  functions: {
    invoke: (name, payload) => api.post(`/functions/${name}`, payload || {}),
  },

  auth: {
    me: () => api.get('/auth/me'),

    login: (email, password) => api.post('/auth/login', { email, password }).then(data => {
      localStorage.setItem('cravo_token', data.token);
      return data;
    }),

    logout: (_returnUrl) => {
      localStorage.removeItem('cravo_token');
      window.location.href = '/login';
    },

    redirectToLogin: (_returnUrl) => {
      window.location.href = '/login';
    },

    isAuthenticated: () => !!localStorage.getItem('cravo_token'),
  },
};
