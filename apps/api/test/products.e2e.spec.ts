import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { ProductsAdminController } from '../src/admin/products.admin.controller';
import { NotifyService } from '../src/notify/notify.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/shop/orders.service';
import { ShopController } from '../src/shop/shop.controller';

const row = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  sku: 'BEP-ELICA-804',
  slug: 'bep-tu-elica-ratio-804-plus',
  name: 'Bếp Từ Elica Ratio 804 Plus',
  category: 'Bếp điện từ',
  brandId: 2,
  brand: { slug: 'elica', name: 'Elica' },
  description: null,
  contentMd: '## Thông số kỹ thuật\n\n- Tổng công suất: 7,4 kW',
  price: 44_850_000,
  compareAtPrice: 59_800_000,
  stock: 3,
  imageUrl: null,
  icon: 'burner',
  status: 'active',
  _count: { orderItems: 0 },
  ...extra,
});

describe('Sản phẩm: lọc theo hãng, trang chi tiết, giá gốc', () => {
  let app: INestApplication;
  let auth: string;
  const prisma = {
    product: {
      findMany: jest.fn(async () => [row()]),
      findFirst: jest.fn(async ({ where }: { where: { slug: string } }) => (where.slug === row().slug ? row() : null)),
      findUnique: jest.fn(async () => row()),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data })),
      update: jest.fn(async (_args: { data: Record<string, unknown> }) => row()),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions }), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
      controllers: [ShopController, ProductsAdminController],
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotifyService, useValue: { orderCreated: jest.fn() } },
        { provide: APP_GUARD, useClass: AdminAuthGuard },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    auth = `Bearer ${await mod.get(JwtService).signAsync({ sub: 1, email: 'a@b.c', role: 'admin' })}`;
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const http = () => request(app.getHttpServer());

  it('GET /products?brand= lọc theo slug hãng, trả slug, hãng, giá gốc', async () => {
    const res = await http().get('/products?brand=elica').expect(200);
    expect((prisma.product.findMany.mock.calls[0] as unknown as [{ where: object }])[0].where).toEqual({ status: 'active', brand: { slug: 'elica' } });
    expect(res.body[0]).toMatchObject({ slug: 'bep-tu-elica-ratio-804-plus', brand: { slug: 'elica', name: 'Elica' }, price: 44_850_000, compareAtPrice: 59_800_000 });
    expect(res.body[0].contentMd).toBeUndefined();
  });

  it('giá gốc không lớn hơn giá bán thì không trả về (không hiện nhãn giảm giá)', async () => {
    prisma.product.findMany.mockResolvedValueOnce([row({ compareAtPrice: 40_000_000 })]);
    const res = await http().get('/products').expect(200);
    expect(res.body[0].compareAtPrice).toBeNull();
  });

  it('GET /products/:slug trả nội dung chi tiết; slug lạ hoặc sản phẩm ẩn → 404', async () => {
    const res = await http().get('/products/bep-tu-elica-ratio-804-plus').expect(200);
    expect(res.body.contentMd).toContain('Thông số kỹ thuật');
    expect(prisma.product.findFirst.mock.calls[0][0]).toMatchObject({ where: { slug: 'bep-tu-elica-ratio-804-plus', status: 'active' } });
    await http().get('/products/khong-co').expect(404);
  });

  it('admin: tạo sản phẩm tự sinh slug từ tên, lưu hãng và giá gốc', async () => {
    await http()
      .post('/admin/products')
      .set('Authorization', auth)
      .send({ sku: 'bep-elica-804', name: 'Bếp Từ Elica Ratio 804 Plus', category: 'Bếp điện từ', brandId: 2, price: 44_850_000, compareAtPrice: 59_800_000 })
      .expect(201);
    expect(prisma.product.create.mock.calls[0][0].data).toMatchObject({ sku: 'BEP-ELICA-804', slug: 'bep-tu-elica-ratio-804-plus', brandId: 2, compareAtPrice: 59_800_000 });
  });

  it('admin: giá gốc ≤ giá bán → 400; bỏ giảm giá bằng null', async () => {
    const res = await http().patch('/admin/products/1').set('Authorization', auth).send({ price: 100_000, compareAtPrice: 90_000 }).expect(400);
    expect(res.body.errors.compareAtPrice).toBeDefined();
    await http().patch('/admin/products/1').set('Authorization', auth).send({ compareAtPrice: null, brandId: null }).expect(200);
    expect(prisma.product.update.mock.calls[0][0].data).toEqual({ compareAtPrice: null, brandId: null });
  });
});
