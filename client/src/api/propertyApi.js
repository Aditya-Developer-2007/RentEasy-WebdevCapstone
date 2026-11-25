import { apiFetch, buildQueryString } from './fetchClient';

export const propertyApi = {
  getProperties: (params) =>
    apiFetch(`/properties${buildQueryString(params)}`, { method: 'GET' }),

  getPropertyById: (id) => apiFetch(`/properties/${id}`, { method: 'GET' }),

  getMyProperties: (params) =>
    apiFetch(`/properties/mine${buildQueryString(params)}`, { method: 'GET' }),

  createProperty: (payload) =>
    apiFetch('/properties', { method: 'POST', body: payload }),

  updateProperty: (id, payload) =>
    apiFetch(`/properties/${id}`, { method: 'PATCH', body: payload }),

  deleteProperty: (id) =>
    apiFetch(`/properties/${id}`, { method: 'DELETE' }),
};
