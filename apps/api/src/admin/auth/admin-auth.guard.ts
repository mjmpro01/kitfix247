import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC } from './public.decorator';

export interface AdminJwtPayload {
  sub: number;
  email: string;
  role: string;
}

export type AdminRequest = Request & { admin?: AdminJwtPayload };

export const ADMIN_PREFIX = '/admin';

const isAdminPath = (path: string) => path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);

/**
 * Guard toàn cục: mọi route dưới /admin bắt buộc có `Authorization: Bearer <JWT>` hợp lệ,
 * trừ route gắn @Public(). Route công khai (ngoài /admin) không bị ảnh hưởng.
 * Đặt theo đường dẫn thay vì từng controller để route admin mới không thể "quên" gắn guard.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    if (!isAdminPath(req.path)) return true;
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;

    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Cần đăng nhập');
    try {
      const payload = await this.jwt.verifyAsync<AdminJwtPayload>(token);
      if (typeof payload?.sub !== 'number') throw new Error('payload');
      req.admin = { sub: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập hết hạn hoặc không hợp lệ');
    }
  }
}
