import { getApiBaseUrl } from './env';
import { getAccessToken } from './auth-storage';

export type UserRole = 'PUBLIC' | 'JUDGE' | 'ADMIN';

export type MeResponse = {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  role: UserRole;
  disabled: boolean;
  createdAt: string;
};

/**
 * Caminho sob o prefixo global `/api/v1`.
 * Com `VITE_API_BASE_URL` definido (ex.: `http://localhost:3000/api/v1`), o sufixo é `/users/me`.
 * Sem base (recomendado com proxy Vite), devolve `/api/v1/users/me`.
 */
export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  if (!base) {
    return `/api/v1${suffix}`;
  }
  return `${base}${suffix}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOptions = RequestInit & {
  /** Ignora token em sessionStorage */
  skipAuth?: boolean;
};

export async function apiFetch(
  path: string,
  init: FetchOptions = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!init.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  const res = await fetch(apiUrl(path), { ...init, headers });
  return res;
}

export async function fetchCurrentUser(): Promise<MeResponse> {
  const res = await apiFetch('/users/me');
  if (res.status === 401) {
    throw new ApiError('Não autenticado', 401);
  }
  if (!res.ok) {
    throw new ApiError(await safeErrorBody(res), res.status);
  }
  return (await res.json()) as MeResponse;
}

export async function postOAuthMock(body: {
  email: string;
  displayName?: string;
  photoUrl?: string | null;
}): Promise<{ accessToken: string }> {
  const res = await apiFetch('/auth/oauth/mock', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
  if (!res.ok) {
    throw new ApiError(await safeErrorBody(res), res.status);
  }
  return (await res.json()) as { accessToken: string };
}

async function safeErrorBody(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 200) || res.statusText;
  } catch {
    return res.statusText;
  }
}
