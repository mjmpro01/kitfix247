import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { ServicesAdminController } from '../src/admin/services.admin.controller';
import { PrismaService } from '../src/prisma/prisma.service';

const svc = {
  id: 3,
  slug: 'sua-bep-tu',
  name: 'Sửa bếp từ',
  shortName: 'Sửa bếp từ',
  shortHint: '',
  cardText: '',
  lead: '',
  device: 'Bếp từ',
  faultsTitle: '',
  icon: 'burner',
  imageUrl: null as string | null,
  imageAlt: null as string | null,
  sort: 1,
  showHome: true,
  seoTitle: null,
  seoDesc: null,
  faults: [],
  faqs: [],
  priceItems: [],
};

describe('PATCH /admin/services/:id — ảnh dịch vụ', () => {
  let app: INestApplication;
  let auth: string;
  const prisma = {
    service: {
      update: jest.fn(async ({ data }: { data: Partial<typeof svc> }) => Object.assign(svc, data)),
      findUnique: jest.fn(async () => svc),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
      controllers: [ServicesAdminController],
      providers: [{ provide: PrismaService, useValue: prisma }, { provide: APP_GUARD, useClass: AdminAuthGuard }],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    auth = `Bearer ${await mod.get(JwtService).signAsync({ sub: 1, email: 'a@b.c', role: 'admin' })}`;
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const patch = (body: object) => request(app.getHttpServer()).patch('/admin/services/3').set('Authorization', auth).send(body);

  it('lưu ảnh đã tải lên và mô tả ảnh, trả về trong AdminService', async () => {
    const res = await patch({ imageUrl: 'http://localhost:4000/uploads/services/2026/10/a.jpg', imageAlt: ' Kỹ thuật viên sửa bếp từ ' }).expect(200);
    expect(prisma.service.update.mock.calls[0][0].data).toEqual({ imageUrl: 'http://localhost:4000/uploads/services/2026/10/a.jpg', imageAlt: 'Kỹ thuật viên sửa bếp từ' });
    expect(res.body).toMatchObject({ imageUrl: 'http://localhost:4000/uploads/services/2026/10/a.jpg', imageAlt: 'Kỹ thuật viên sửa bếp từ' });
  });

  it('gỡ ảnh: chuỗi rỗng / null → null', async () => {
    await patch({ imageUrl: '', imageAlt: null }).expect(200);
    expect(prisma.service.update.mock.calls[0][0].data).toEqual({ imageUrl: null, imageAlt: null });
  });

  it('URL lạ (javascript:, //host) → 400, không lưu', async () => {
    await patch({ imageUrl: 'javascript:alert(1)' }).expect(400);
    await patch({ imageUrl: '//evil.com/a.png' }).expect(400);
    expect(prisma.service.update).not.toHaveBeenCalled();
  });
});
