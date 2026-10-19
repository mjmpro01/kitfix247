import 'server-only';
import { getAdminToken, redirectToLogin } from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Gọi API admin kèm JWT từ cookie. Không cache. 401 → về trang đăng nhập. */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminToken();
  if (!token) redirectToLogin();
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) redirectToLogin('het-han');
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof body?.message === 'string' ? body.message : `API ${path} trả về ${res.status}`;
    throw new AdminApiError(res.status, msg, body?.errors);
  }
  return body as T;
}

export const adminGet = <T>(path: string) => adminFetch<T>(path);
export const adminSend = <T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown) =>
  adminFetch<T>(path, { method, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });

/** Đăng nhập không cần token có sẵn. */
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}
