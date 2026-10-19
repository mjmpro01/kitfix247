import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/** Cookie httpOnly giữ JWT admin — chỉ gửi cho đường dẫn /admin, JS phía trình duyệt không đọc được. */
export const ADMIN_COOKIE = 'kf_admin';
export const LOGIN_PATH = '/admin/dang-nhap';

export async function getAdminToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
}

export async function setAdminToken(token: string, expiresAt: string) {
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    expires: new Date(expiresAt),
  });
}

export async function clearAdminToken() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: '/admin' });
}

/** Chỉ cho quay lại trang trong /admin — chặn open redirect qua ?tiep=. */
export function safeNext(next: unknown): string {
  return typeof next === 'string' && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith('//') ? next : '/admin';
}

export function redirectToLogin(reason?: 'het-han'): never {
  redirect(reason ? `${LOGIN_PATH}?ly-do=${reason}` : LOGIN_PATH);
}
