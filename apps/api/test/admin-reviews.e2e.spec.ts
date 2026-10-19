import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { ReviewsAdminController } from '../src/admin/reviews.admin.controller';
import { PrismaService } from '../src/prisma/prisma.service';

const row = (data: Record<string, unknown> = {}) => ({
  id: 1,
  customerName: '[Tên khách hàng A]',
  area: 'Tân Bình, TP.HCM',
  device: 'Sửa bếp từ',
  rating: 5,
  content: '[Trích đánh giá]',
  status: 'approved',
  showHome: true,
  createdAt: new Date('2026-10-19T02:00:00Z'),
  ...data,
});

describe('/admin/reviews: sửa, thêm, xoá', () => {
  let app: INestApplication;
  let auth: string;
  const prisma = {
    review: {
      findMany: jest.fn(),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => row(data)),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => row({ id: 9, ...data })),
      delete: jest.fn(async () => row()),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
      controllers: [ReviewsAdminController],
      providers: [{ provide: PrismaService, useValue: prisma }, { provide: APP_GUARD, useClass: AdminAuthGuard }],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    auth = `Bearer ${await mod.get(JwtService).signAsync({ sub: 1, email: 'a@b.c', role: 'admin' })}`;
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const http = () => request(app.getHttpServer());

  it('sửa tên, khu vực, số sao, nội dung (cắt khoảng trắng)', async () => {
    const res = await http()
      .patch('/admin/reviews/1')
      .set('Authorization', auth)
      .send({ customerName: '  Chị Lan ', area: 'Quận 3', rating: 4, content: 'Thợ đến đúng giờ, sửa nhanh.' })
      .expect(200);
    expect(prisma.review.update.mock.calls[0][0]).toEqual({
      where: { id: 1 },
      data: { customerName: 'Chị Lan', area: 'Quận 3', rating: 4, content: 'Thợ đến đúng giờ, sửa nhanh.' },
    });
    expect(res.body).toMatchObject({ customerName: 'Chị Lan', rating: 4 });
  });

  it('số sao ngoài 1–5, nội dung rỗng → 400, không lưu', async () => {
    const res = await http().patch('/admin/reviews/1').set('Authorization', auth).send({ rating: 6, content: '  ' }).expect(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(['content', 'rating']);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it('ẩn đánh giá thì tự tắt hiện trang chủ; không cho hiện trang chủ khi chưa duyệt', async () => {
    await http().patch('/admin/reviews/1').set('Authorization', auth).send({ status: 'hidden' }).expect(200);
    expect(prisma.review.update.mock.calls[0][0].data).toEqual({ status: 'hidden', showHome: false });
    await http().patch('/admin/reviews/1').set('Authorization', auth).send({ status: 'pending', showHome: true }).expect(400);
  });

  it('thêm đánh giá: bắt buộc tên, số sao, nội dung; mặc định đã duyệt, chưa hiện trang chủ', async () => {
    await http().post('/admin/reviews').set('Authorization', auth).send({ customerName: 'Anh Minh' }).expect(400);
    const res = await http().post('/admin/reviews').set('Authorization', auth).send({ customerName: 'Anh Minh', rating: 5, content: 'Rất hài lòng.' }).expect(201);
    expect(prisma.review.create.mock.calls[0][0].data).toEqual({ customerName: 'Anh Minh', area: '', device: '', rating: 5, content: 'Rất hài lòng.', status: 'approved', showHome: false });
    expect(res.body.id).toBe(9);
  });

  it('xoá → 204; không có token → 401', async () => {
    await http().delete('/admin/reviews/1').set('Authorization', auth).expect(204);
    await http().delete('/admin/reviews/1').expect(401);
  });
});
