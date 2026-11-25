import { apiFetch } from './fetchClient';

export const authApi = {
  register: (payload) =>
    apiFetch('/auth/register', { method: 'POST', body: payload }),

  login: (payload) =>
    apiFetch('/auth/login', { method: 'POST', body: payload }),

  refresh: () => apiFetch('/auth/refresh', { method: 'POST' }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch('/auth/me', { method: 'GET' }),
};
