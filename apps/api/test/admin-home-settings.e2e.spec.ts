import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DEFAULT_MENU } from '@kitfix/types';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { ProcessStepsAdminController } from '../src/admin/process-steps.admin.controller';
import { validateSettings } from '../src/admin/settings.admin.controller';
import { PrismaService } from '../src/prisma/prisma.service';

const hero = {
  imageUrl: '/images/hero-banner.png',
  imageAlt: 'Kỹ thuật viên sửa bếp từ',
  h1: 'Sửa chữa – Vệ sinh – Lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM',
  mobileLine1: 'Sửa chữa – Vệ sinh – Lắp đặt',
  mobileLine2: 'Thiết bị nhà bếp',
  mobileLead: 'Có mặt trong 60 phút.',
};

describe('validateSettings: nội dung trang chủ và menu', () => {
  it('hero hợp lệ: cắt khoảng trắng, mặc định kiểu overlay', () => {
    expect(validateSettings({ hero: { ...hero, h1: `  ${hero.h1} ` } }).hero).toEqual({ ...hero, layout: 'overlay' });
    expect(validateSettings({ hero: { ...hero, layout: 'clean', imageUrl: 'http://localhost:4000/uploads/hero/a.jpg' } }).hero?.layout).toBe('clean');
  });

  it('hero sai: thiếu chữ, ảnh javascript:, kiểu lạ → 400', () => {
    expect(() => validateSettings({ hero: { ...hero, mobileLead: '' } })).toThrow();
    expect(() => validateSettings({ hero: { ...hero, imageUrl: 'javascript:alert(1)' } })).toThrow();
    expect(() => validateSettings({ hero: { ...hero, imageUrl: '//evil.com/a.png' } })).toThrow();
    expect(() => validateSettings({ hero: { ...hero, layout: 'video' } })).toThrow();
  });

  it('5 cam kết: icon phải có trong bộ icon, chữ có giới hạn', () => {
    const ok = { title: 'Bảo hành 12 tháng', detail: 'Rõ ràng – minh bạch', icon: 'receipt' };
    expect(validateSettings({ features: [ok] }).features).toEqual([ok]);
    expect(() => validateSettings({ features: [{ ...ok, icon: 'rocket' }] })).toThrow();
    expect(() => validateSettings({ features: [] })).toThrow();
    expect(() => validateSettings({ features: Array(7).fill(ok) })).toThrow();
  });

  it('cam kết đặt lịch, lời hứa, đánh giá tổng', () => {
    expect(validateSettings({ commitments: [{ title: ' Báo giá trước. ', detail: 'Anh/chị đồng ý mới sửa.' }] }).commitments).toEqual([
      { title: 'Báo giá trước.', detail: 'Anh/chị đồng ý mới sửa.' },
    ]);
    expect(validateSettings({ promises: [' Chẩn đoán miễn phí '] }).promises).toEqual(['Chẩn đoán miễn phí']);
    expect(validateSettings({ rating: { score: 4.86, outOf: 5, label: 'Từ hơn 500 khách' } }).rating).toEqual({ score: 4.9, outOf: 5, label: 'Từ hơn 500 khách' });
    expect(() => validateSettings({ rating: { score: 6, outOf: 5, label: 'x' } })).toThrow();
    expect(() => validateSettings({ promises: [''] })).toThrow();
  });

  it('analytics: mã GA4 và xác minh Search Console', () => {
    expect(validateSettings({ analytics: { gaId: 'g-ab12cd34ef', googleVerification: '<meta name="google-site-verification" content="AbC_123-xyzXYZ0987654321" />' } }).analytics).toEqual({
      gaId: 'G-AB12CD34EF',
      googleVerification: 'AbC_123-xyzXYZ0987654321',
    });
    expect(() => validateSettings({ analytics: { gaId: 'UA-1-1' } })).toThrow();
  });

  it('menu: dùng validateMenu dùng chung', () => {
    expect(validateSettings({ menu: DEFAULT_MENU }).menu).toEqual(DEFAULT_MENU);
    expect(() => validateSettings({ menu: [{ label: 'X', href: 'javascript:1', visible: true, kind: 'link' }] })).toThrow();
  });
});

describe('PUT /admin/process-steps', () => {
  let app: INestApplication;
  let auth: string;
  const prisma = {
    processStep: { deleteMany: jest.fn(() => 'del'), createMany: jest.fn(() => 'create'), findMany: jest.fn(async () => [{ n: 1, title: 'Liên hệ', description: 'Gọi hotline' }]) },
    $transaction: jest.fn(async (ops: unknown[]) => ops),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
      controllers: [ProcessStepsAdminController],
      providers: [{ provide: PrismaService, useValue: prisma }, { provide: APP_GUARD, useClass: AdminAuthGuard }],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    auth = `Bearer ${await mod.get(JwtService).signAsync({ sub: 1, email: 'a@b.c', role: 'admin' })}`;
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('thay cả danh sách, đánh số lại theo thứ tự', async () => {
    await request(app.getHttpServer())
      .put('/admin/process-steps')
      .set('Authorization', auth)
      .send({ steps: [{ title: ' Liên hệ ', description: 'Gọi hotline' }, { title: 'Sửa', description: 'Sửa và bàn giao' }] })
      .expect(200);
    expect(prisma.processStep.createMany).toHaveBeenCalledWith({
      data: [
        { n: 1, title: 'Liên hệ', description: 'Gọi hotline' },
        { n: 2, title: 'Sửa', description: 'Sửa và bàn giao' },
      ],
    });
  });

  it('ít hơn 2 bước, thiếu mô tả, không token → bị chặn', async () => {
    await request(app.getHttpServer()).put('/admin/process-steps').set('Authorization', auth).send({ steps: [{ title: 'A', description: 'B' }] }).expect(400);
    await request(app.getHttpServer())
      .put('/admin/process-steps')
      .set('Authorization', auth)
      .send({ steps: [{ title: 'A', description: '' }, { title: 'B', description: 'C' }] })
      .expect(400);
    await request(app.getHttpServer()).put('/admin/process-steps').send({ steps: [] }).expect(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
