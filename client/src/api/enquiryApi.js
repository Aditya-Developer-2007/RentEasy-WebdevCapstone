import { apiFetch, buildQueryString } from './fetchClient';

export const enquiryApi = {
  createEnquiry: (payload) =>
    apiFetch('/enquiries', { method: 'POST', body: payload }),

  getSentEnquiries: (params) =>
    apiFetch(`/enquiries/sent${buildQueryString(params)}`, { method: 'GET' }),

  getReceivedEnquiries: (params) =>
    apiFetch(`/enquiries/received${buildQueryString(params)}`, { method: 'GET' }),

  updateEnquiryStatus: (id, payload) =>
    apiFetch(`/enquiries/${id}/status`, { method: 'PATCH', body: payload }),
};
