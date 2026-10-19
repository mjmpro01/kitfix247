import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { ORDER_MESSAGES } from '@kitfix/types';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { OrdersAdminController } from '../src/admin/orders.admin.controller';
import { NotifyService } from '../src/notify/notify.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { orderCode, ORDER_PHONE_LIMIT, OrdersService } from '../src/shop/orders.service';
import { sortProducts } from '../src/shop/products';
import { ShopController } from '../src/shop/shop.controller';

type ProductRow = { id: number; name: string; price: number | null; status: string };

describe('Shop: POST /orders và /admin/orders', () => {
  let app: INestApplication;
  let auth: string;
  let products: ProductRow[];
  let shippingFee: number | null;
  let recent = 0;
  const created: { data: Record<string, unknown> }[] = [];
  const prisma = {
    product: { findMany: jest.fn(async ({ where }: { where: { id: { in: number[] } } }) => products.filter((p) => where.id.in.includes(p.id))) },
    setting: { findUnique: jest.fn(async () => ({ key: 'shop', value: { shippingFee } })) },
    order: {
      count: jest.fn(async () => recent),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => {
        created.push(args);
        return { id: created.length, ...args.data };
      }),
      update: jest.fn(async ({ where, data }: { where: { id: number }; data: { status: string } }) => ({
        id: where.id,
        code: 'KF261019-ABCD',
        customerName: 'Võ Thị F',
        phone: '0912345678',
        address: '12 Lê Lợi',
        payment: 'bank',
        status: data.status,
        subtotal: null,
        shippingFee: null,
        total: null,
        createdAt: new Date('2026-10-19T02:00:00Z'),
        items: [{ productId: 1, productName: 'Tua vít', qty: 1, unitPrice: null, product: { sku: 'DC-1' } }],
      })),
    },
  };
  const notify = { bookingCreated: jest.fn(), orderCreated: jest.fn(async () => undefined) };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions }), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
      controllers: [ShopController, OrdersAdminController],
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotifyService, useValue: notify },
        { provide: APP_GUARD, useClass: AdminAuthGuard },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    auth = `Bearer ${await mod.get(JwtService).signAsync({ sub: 1, email: 'admin@kitfix247.local', role: 'admin' })}`;
  });

  afterAll(() => app.close());
  beforeEach(() => {
    jest.clearAllMocks();
    created.length = 0;
    recent = 0;
    shippingFee = 30_000;
    products = [
      { id: 1, name: 'Tua vít', price: 120_000, status: 'active' },
      { id: 2, name: 'Keo tản nhiệt', price: 50_000, status: 'active' },
      { id: 3, name: 'Cầu chì', price: null, status: 'active' },
      { id: 4, name: 'Dây nguồn', price: 90_000, status: 'hidden' },
    ];
  });

  const valid = { customerName: 'Võ Thị F', phone: '0912.345.678', address: '12 Lê Lợi, Quận 1', payment: 'bank' };
  const post = (body: object) => request(app.getHttpServer()).post('/orders').send(body);

  it('201 {code}; giá lấy từ DB, bỏ qua giá client gửi; lưu tên sản phẩm lúc đặt', async () => {
    const res = await post({ ...valid, items: [{ productId: 1, qty: 2, price: 1 }, { productId: 2, qty: 1 }] }).expect(201);
    expect(res.body.code).toMatch(/^KF\d{6}-[2-9A-HJ-NP-Z]{4}$/);
    expect(created[0].data).toMatchObject({
      phone: '0912345678',
      payment: 'bank',
      status: 'new',
      subtotal: 290_000,
      shippingFee: 30_000,
      total: 320_000,
      items: { create: [{ productId: 1, productName: 'Tua vít', qty: 2, unitPrice: 120_000 }, { productId: 2, productName: 'Keo tản nhiệt', qty: 1, unitPrice: 50_000 }] },
    });
    expect(notify.orderCreated).toHaveBeenCalledTimes(1);
  });

  it('sản phẩm chưa có giá vẫn đặt được: dòng đó, tạm tính và tổng để trống', async () => {
    await post({ ...valid, items: [{ productId: 1, qty: 1 }, { productId: 3, qty: 2 }] }).expect(201);
    expect(created[0].data).toMatchObject({ subtotal: null, shippingFee: 30_000, total: null });
    expect((created[0].data.items as { create: { unitPrice: number | null }[] }).create[1].unitPrice).toBeNull();
  });

  it('phí giao chưa chốt → shippingFee và total để trống', async () => {
    shippingFee = null;
    await post({ ...valid, items: [{ productId: 2, qty: 3 }] }).expect(201);
    expect(created[0].data).toMatchObject({ subtotal: 150_000, shippingFee: null, total: null });
  });

  it('sản phẩm đã ẩn hoặc không tồn tại → 400, không lưu', async () => {
    const res = await post({ ...valid, items: [{ productId: 4, qty: 1 }, { productId: 99, qty: 1 }] }).expect(400);
    expect(res.body.unavailable).toEqual([4, 99]);
    expect(created).toHaveLength(0);
  });

  it('400 kèm lỗi từng trường', async () => {
    const res = await post({ customerName: '', phone: '1', address: '', payment: 'visa', items: [] }).expect(400);
    expect(res.body.errors).toEqual({
      customerName: ORDER_MESSAGES.customerName,
      phone: ORDER_MESSAGES.phone,
      address: ORDER_MESSAGES.address,
      payment: ORDER_MESSAGES.payment,
      items: ORDER_MESSAGES.items,
    });
  });

  it('honeypot: 201 nhưng không lưu, không báo', async () => {
    await post({ ...valid, website: 'http://spam', items: [{ productId: 1, qty: 1 }] }).expect(201);
    expect(created).toHaveLength(0);
    expect(notify.orderCreated).not.toHaveBeenCalled();
  });

  it('429 khi cùng SĐT đặt quá nhiều trong 10 phút', async () => {
    recent = ORDER_PHONE_LIMIT;
    await post({ ...valid, items: [{ productId: 1, qty: 1 }] }).expect(429);
    expect(created).toHaveLength(0);
  });

  it('PATCH /admin/orders/:id/status cần JWT, kiểm tra trạng thái', async () => {
    await request(app.getHttpServer()).patch('/admin/orders/1/status').send({ status: 'confirmed' }).expect(401);
    await request(app.getHttpServer()).patch('/admin/orders/1/status').set('Authorization', auth).send({ status: 'xong' }).expect(400);
    const res = await request(app.getHttpServer()).patch('/admin/orders/1/status').set('Authorization', auth).send({ status: 'shipping' }).expect(200);
    expect(res.body).toMatchObject({ status: 'shipping', items: [{ name: 'Tua vít', sku: 'DC-1', unitPrice: null }] });
  });
});

describe('orderCode / sortProducts', () => {
  it('mã đơn theo ngày giờ Việt Nam', () => {
    expect(orderCode(new Date('2026-10-18T18:30:00Z'))).toMatch(/^KF261019-/);
  });
  it('sắp theo giá, sản phẩm chưa có giá luôn ở cuối', () => {
    const rows = [
      { id: 1, price: 50 },
      { id: 2, price: null },
      { id: 3, price: 10 },
    ];
    expect(sortProducts(rows, 'price_asc').map((r) => r.id)).toEqual([3, 1, 2]);
    expect(sortProducts(rows, 'price_desc').map((r) => r.id)).toEqual([1, 3, 2]);
    expect(sortProducts(rows, 'new').map((r) => r.id)).toEqual([3, 2, 1]);
  });
});
