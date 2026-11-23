import axios from 'axios';
import { API_URL, TOKEN_KEY, USER_KEY } from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('connecthub:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the ConnectHub server. Is the backend running?';
  }
  return fallback;
}

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((response) => response.data),
  login: (payload) => api.post('/auth/login', payload).then((response) => response.data),
  me: () => api.get('/auth/me').then((response) => response.data),
};

export const userApi = {
  list: (params = {}) => api.get('/users', { params }).then((response) => response.data),
  get: (id) => api.get(`/users/${id}`).then((response) => response.data),
};

export const globalApi = {
  messages: () => api.get('/global/messages').then((response) => response.data),
  send: (content) => api.post('/global/messages', { content }).then((response) => response.data),
};

export const requestApi = {
  send: (userId) => api.post(`/requests/send/${userId}`).then((response) => response.data),
  incoming: () => api.get('/requests/incoming').then((response) => response.data),
  outgoing: () => api.get('/requests/outgoing').then((response) => response.data),
  accept: (id) => api.put(`/requests/${id}/accept`).then((response) => response.data),
  reject: (id) => api.put(`/requests/${id}/reject`).then((response) => response.data),
};

export const conversationApi = {
  list: () => api.get('/conversations').then((response) => response.data),
  get: (id) => api.get(`/conversations/${id}`).then((response) => response.data),
  messages: (id) => api.get(`/conversations/${id}/messages`).then((response) => response.data),
  send: (id, content) =>
    api.post(`/conversations/${id}/messages`, { content }).then((response) => response.data),
};

export const settingsApi = {
  profile: () => api.get('/settings/profile').then((response) => response.data),
};

export default api;
