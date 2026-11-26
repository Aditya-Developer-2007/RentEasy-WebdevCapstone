const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://renteasy-webdevcapstone.onrender.com/api'
    : 'http://localhost:5000/api')
).replace(/\/+$/, '');

let accessToken = null;
let refreshPromise = null;
let onAuthFailureCallback = null;

export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const setOnAuthFailure = (callback) => {
  onAuthFailureCallback = typeof callback === 'function' ? callback : null;
};

export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value).trim());
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

const REFRESH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

async function executeRefresh() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError('Session expired', response.status);
  }

  const data = await response.json();
  if (!data?.accessToken) {
    throw new ApiError('Invalid refresh response', 401);
  }

  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function performSingleFlightRefresh() {
  if (!refreshPromise) {
    refreshPromise = executeRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Native fetch wrapper with credentials, Bearer auth, and single-flight 401 refresh retry.
 */
export async function apiFetch(endpoint, options = {}, hasRetried = false) {
  const { headers: customHeaders, body, ...restOptions } = options;

  const headers = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
    body:
      body !== undefined && typeof body !== 'string' ? JSON.stringify(body) : body,
    credentials: 'include',
  });

  const isRefreshExcluded = REFRESH_EXCLUDED_PATHS.some((path) =>
    endpoint.startsWith(path)
  );

  if (response.status === 401 && !hasRetried && !isRefreshExcluded) {
    try {
      await performSingleFlightRefresh();
      return apiFetch(endpoint, options, true);
    } catch (refreshError) {
      clearAccessToken();
      if (onAuthFailureCallback) {
        onAuthFailureCallback();
      }
      throw refreshError;
    }
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.errors || null
    );
  }

  return payload;
}
