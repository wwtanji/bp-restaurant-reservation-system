import { STORAGE_KEY_TOKEN, STORAGE_KEY_REFRESH_TOKEN } from '../constants/storage';

export const API_URL = 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/authentication/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, data.refresh_token);
      return data.access_token as string;
    } catch {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function resolveImageUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('/static/')) return `${API_URL}${url}`;
  return url;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const buildHeaders = (token: string | null) => {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  };

  let token = localStorage.getItem(STORAGE_KEY_TOKEN);
  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(token),
  });

  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: buildHeaders(newToken),
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(res.status, body.detail ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
