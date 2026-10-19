import { Body, Controller, Get, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { compare, hashSync } from 'bcryptjs';
import type { AdminLoginInput, AdminLoginResult, AdminUserInfo } from '@kitfix/types';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminRequest } from './admin-auth.guard';
import { ADMIN_SESSION_SECONDS } from './jwt-config';
import { Public } from './public.decorator';

/** Hash giả để so sánh khi email không tồn tại — thời gian phản hồi như nhau, không lộ email nào có tài khoản. */
const DUMMY_HASH = hashSync('kitfix247-khong-co-tai-khoan', 10);

@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Giới hạn 5 lần / phút / IP để chống dò mật khẩu. */
  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: Partial<AdminLoginInput>): Promise<AdminLoginResult> {
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const user = email && password ? await this.prisma.adminUser.findUnique({ where: { email } }) : null;
    const ok = await compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return {
      token,
      expiresAt: new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000).toISOString(),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  @Get('me')
  me(@Req() req: AdminRequest): AdminUserInfo {
    const a = req.admin!;
    return { id: a.sub, email: a.email, role: a.role };
  }
}
