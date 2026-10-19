import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { isBookingOverdue } from '@kitfix/types';
import { AdminAuthGuard } from '../src/admin/auth/admin-auth.guard';
import { jwtOptions } from '../src/admin/auth/jwt-config';
import { BookingsAdminController, statusUpdate } from '../src/admin/bookings.admin.controller';
import { PrismaService } from '../src/prisma/prisma.service';

type Row = {
  id: number;
  name: string;
  phone: string;
  device: string;
  address: string;
  description: string;
  status: string;
  technician: string | null;
  source: string;
  ip: string | null;
  createdAt: Date;
  calledAt: Date | null;
};

const base = (id: number, extra: Partial<Row> = {}): Row => ({
  id,
  name: `Khách ${id}`,
  phone: '0901234567',
  device: 'Bếp từ',
  address: 'Tân Bình',
  description: 'Báo lỗi E1',
  status: 'new',
  technician: null,
  source: 'form',
  ip: null,
  createdAt: new Date('2026-10-18T01:00:00Z'),
  calledAt: null,
  ...extra,
});

describe('PATCH /admin/bookings/:id/status', () => {
  let app: INestApplication;
  let auth: string;
  let rows: Map<number, Row>;
  const prisma = {
    booking: {
      findUnique: jest.fn(async ({ where }: { where: { id: number } }) => rows.get(where.id) ?? null),
      update: jest.fn(async ({ where, data }: { where: { id: number }; data: Partial<Row> }) => {
        const next = { ...rows.get(where.id)!, ...data };
        rows.set(where.id, next);
        return next;
      }),
      findMany: jest.fn(async () => [...rows.values()]),
      count: jest.fn(async () => rows.size),
      groupBy: jest.fn(async () => [
        { status: 'new', _count: { _all: 2 } },
        { status: 'done', _count: { _all: 1 } },
      ]),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
    const mod = await Test.createTestingModule({
      imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
      controllers: [BookingsAdminController],
      providers: [{ provide: PrismaService, useValue: prisma }, { provide: APP_GUARD, useClass: AdminAuthGuard }],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
    auth = `Bearer ${await mod.get(JwtService).signAsync({ sub: 1, email: 'admin@kitfix247.local', role: 'admin' })}`;
  });

  afterAll(() => app.close());
  beforeEach(() => {
    jest.clearAllMocks();
    rows = new Map([
      [1, base(1)],
      [2, base(2, { status: 'called', calledAt: new Date('2026-10-18T01:05:00Z') })],
      [3, base(3, { status: 'called', calledAt: new Date('2026-10-18T01:05:00Z'), technician: 'KTV Sẵn' })],
    ]);
  });

  const patch = (id: number | string, body: object, withAuth = true) => {
    const r = request(app.getHttpServer()).patch(`/admin/bookings/${id}/status`).send(body);
    return withAuth ? r.set('Authorization', auth) : r;
  };

  it('không có token → 401 và không đụng DB', async () => {
    await patch(1, { status: 'called' }, false).expect(401);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('"Đánh dấu đã gọi": new → called, ghi called_at', async () => {
    const before = Date.now();
    const res = await patch(1, { status: 'called' }).expect(200);
    expect(res.body.status).toBe('called');
    expect(new Date(res.body.calledAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('gọi lại lần nữa không ghi đè called_at đầu tiên', async () => {
    const res = await patch(2, { status: 'called' }).expect(200);
    expect(res.body.calledAt).toBe('2026-10-18T01:05:00.000Z');
  });

  it('"Giao KTV": called → assigned lưu tên KTV (đã cắt khoảng trắng)', async () => {
    const res = await patch(2, { status: 'assigned', technician: '  KTV Minh  ' }).expect(200);
    expect(res.body).toMatchObject({ status: 'assigned', technician: 'KTV Minh', calledAt: '2026-10-18T01:05:00.000Z' });
  });

  it('giao KTV khi chưa có tên KTV → 400, không cập nhật', async () => {
    const res = await patch(2, { status: 'assigned' }).expect(400);
    expect(res.body.errors.technician).toBeDefined();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('giao KTV khi lịch đã có KTV thì không cần gửi lại tên', async () => {
    const res = await patch(3, { status: 'assigned' }).expect(200);
    expect(res.body.technician).toBe('KTV Sẵn');
  });

  it('giao thẳng từ new → assigned cũng ghi called_at', async () => {
    const res = await patch(1, { status: 'assigned', technician: 'KTV Minh' }).expect(200);
    expect(res.body.calledAt).not.toBeNull();
  });

  it('done / cancelled chỉ đổi trạng thái', async () => {
    const done = await patch(3, { status: 'done' }).expect(200);
    expect(done.body).toMatchObject({ status: 'done', technician: 'KTV Sẵn' });
    const cancelled = await patch(1, { status: 'cancelled' }).expect(200);
    expect(cancelled.body).toMatchObject({ status: 'cancelled', calledAt: null });
  });

  it('trạng thái lạ, thiếu, technician không phải chữ → 400', async () => {
    await patch(1, { status: 'dang-sua' }).expect(400);
    await patch(1, {}).expect(400);
    await patch(1, { status: 'assigned', technician: 42 }).expect(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('id không tồn tại → 404; id không phải số → 400', async () => {
    await patch(99, { status: 'called' }).expect(404);
    await patch('abc', { status: 'called' }).expect(400);
  });

  it('GET /admin/bookings trả counts theo trạng thái và lọc theo status hợp lệ', async () => {
    const res = await request(app.getHttpServer()).get('/admin/bookings?status=new').set('Authorization', auth).expect(200);
    expect(res.body.counts).toEqual({ all: 3, new: 2, called: 0, assigned: 0, done: 1, cancelled: 0 });
    const calls = prisma.booking.findMany.mock.calls as unknown as { where: object }[][];
    expect(calls[0][0]).toMatchObject({ where: { status: 'new' }, orderBy: { createdAt: 'desc' } });
    await request(app.getHttpServer()).get('/admin/bookings?status=khong-co').set('Authorization', auth).expect(200);
    expect(calls[1][0].where).toEqual({});
  });
});

describe('statusUpdate / isBookingOverdue', () => {
  const now = new Date('2026-10-18T02:00:00Z');
  it('ghi called_at = now khi lần đầu gọi', () => {
    expect(statusUpdate({ calledAt: null, technician: null }, { status: 'called' }, now)).toEqual({ status: 'called', calledAt: now });
  });
  it('quá 15 phút chỉ tính với lịch "new"', () => {
    const t = now.getTime();
    expect(isBookingOverdue({ status: 'new', createdAt: new Date(t - 16 * 60_000).toISOString() }, t)).toBe(true);
    expect(isBookingOverdue({ status: 'new', createdAt: new Date(t - 14 * 60_000).toISOString() }, t)).toBe(false);
    expect(isBookingOverdue({ status: 'called', createdAt: new Date(t - 60 * 60_000).toISOString() }, t)).toBe(false);
  });
});
