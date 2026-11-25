import { apiFetch } from './fetchClient';

export const savedApi = {
  getSavedProperties: () => apiFetch('/saved', { method: 'GET' }),

  saveProperty: (propertyId) =>
    apiFetch(`/saved/${propertyId}`, { method: 'POST' }),

  removeSavedProperty: (propertyId) =>
    apiFetch(`/saved/${propertyId}`, { method: 'DELETE' }),
};
