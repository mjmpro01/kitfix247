import 'reflect-metadata';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { AuthController } from '../src/admin/auth/auth.controller';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { PrismaService } from '../src/prisma/prisma.service';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

@Controller('admin/ping')
class AdminPingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

@Controller('administrator-like')
class LookalikeController {
  @Get()
  get() {
    return { public: true };
  }
}

@Controller('services')
class PublicController {
  @Get()
  list() {
    return [];
  }
}

describe('Bảo vệ /admin bằng JWT', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let passwordHash: string;
  const prisma = { adminUser: { findUnique: jest.fn() } };

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    passwordHash = await hash('dung-mat-khau-123', 4);
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions }), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
      controllers: [AuthController, AdminPingController, LookalikeController, PublicController],
      providers: [{ provide: PrismaService, useValue: prisma }, { provide: APP_GUARD, useClass: AdminAuthGuard }],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    jwt = mod.get(JwtService);
  });

  afterAll(() => app.close());
  beforeEach(() => {
    prisma.adminUser.findUnique.mockReset();
    prisma.adminUser.findUnique.mockImplementation(async ({ where }: { where: { email: string } }) =>
      where.email === 'admin@kitfix247.local' ? { id: 1, email: 'admin@kitfix247.local', passwordHash, role: 'admin' } : null,
    );
  });

  const http = () => request(app.getHttpServer());

  it('route /admin không có token → 401', async () => {
    await http().get('/admin/ping').expect(401);
  });

  it('token sai chữ ký, sai issuer hoặc sai scheme → 401', async () => {
    const forged = await new JwtService({ secret: 'khoa-khac-0123456789abcdef0123456789' }).signAsync({ sub: 1 }, { issuer: 'kitfix247-admin' });
    const wrongIssuer = await jwt.signAsync({ sub: 1, email: 'a', role: 'admin' }, { issuer: 'khac' });
    const good = await jwt.signAsync({ sub: 1, email: 'a', role: 'admin' });
    await http().get('/admin/ping').set('Authorization', `Bearer ${forged}`).expect(401);
    await http().get('/admin/ping').set('Authorization', `Bearer ${wrongIssuer}`).expect(401);
    await http().get('/admin/ping').set('Authorization', `Token ${good}`).expect(401);
    await http().get('/admin/ping').set('Authorization', 'Bearer khong-phai-jwt').expect(401);
  });

  it('token hết hạn → 401', async () => {
    const expired = await new JwtService({ secret: SECRET }).signAsync(
      { sub: 1, email: 'a', role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 },
      { issuer: 'kitfix247-admin' },
    );
    await http().get('/admin/ping').set('Authorization', `Bearer ${expired}`).expect(401);
  });

  it('token hợp lệ → vào được và /admin/auth/me trả đúng người', async () => {
    const token = await jwt.signAsync({ sub: 7, email: 'admin@kitfix247.local', role: 'admin' });
    await http().get('/admin/ping').set('Authorization', `Bearer ${token}`).expect(200, { ok: true });
    await http().get('/admin/auth/me').set('Authorization', `Bearer ${token}`).expect(200, { id: 7, email: 'admin@kitfix247.local', role: 'admin' });
  });

  it('route công khai và đường dẫn chỉ "giống" /admin không bị chặn', async () => {
    await http().get('/services').expect(200);
    await http().get('/administrator-like').expect(200);
  });

  it('đăng nhập đúng → token dùng được cho /admin', async () => {
    const res = await http().post('/admin/auth/login').send({ email: ' Admin@KitFix247.local ', password: 'dung-mat-khau-123' }).expect(200);
    expect(res.body.user).toEqual({ id: 1, email: 'admin@kitfix247.local', role: 'admin' });
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    await http().get('/admin/ping').set('Authorization', `Bearer ${res.body.token}`).expect(200);
  });

  it('sai mật khẩu hoặc email không tồn tại → 401 cùng một thông báo', async () => {
    const a = await http().post('/admin/auth/login').send({ email: 'admin@kitfix247.local', password: 'sai' }).expect(401);
    const b = await http().post('/admin/auth/login').send({ email: 'khong-co@kitfix247.local', password: 'dung-mat-khau-123' }).expect(401);
    expect(a.body.message).toBe(b.body.message);
    expect(a.body.token).toBeUndefined();
  });

  it('thiếu JWT_SECRET hoặc quá ngắn → không khởi động', () => {
    const saved = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'ngan';
    expect(() => jwtOptions()).toThrow(/JWT_SECRET/);
    delete process.env.JWT_SECRET;
    expect(() => jwtOptions()).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = saved;
  });
});
