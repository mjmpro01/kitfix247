import type { JwtModuleOptions } from '@nestjs/jwt';

/** Phiên admin: 12 giờ (một ca làm). */
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

export function jwtOptions(): JwtModuleOptions {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Thiếu JWT_SECRET (tối thiểu 32 ký tự) trong apps/api/.env — xem apps/api/.env.example');
  }
  return { secret, signOptions: { expiresIn: ADMIN_SESSION_SECONDS, issuer: 'kitfix247-admin' }, verifyOptions: { issuer: 'kitfix247-admin' } };
}
