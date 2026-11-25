import { apiFetch, buildQueryString } from './fetchClient';

export const adminApi = {
  getAdminProperties: (params) =>
    apiFetch(`/admin/properties${buildQueryString(params)}`, { method: 'GET' }),

  reviewProperty: (id, payload) =>
    apiFetch(`/admin/properties/${id}/review`, { method: 'PATCH', body: payload }),

  getAreaRentAnalytics: (params) =>
    apiFetch(`/admin/analytics/area-rent${buildQueryString(params)}`, {
      method: 'GET',
    }),
};
