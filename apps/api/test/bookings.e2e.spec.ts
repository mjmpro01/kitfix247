import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { BOOKING_MESSAGES } from '@kitfix/types';
import { BookingsController } from '../src/bookings/bookings.controller';
import { BookingsService, PHONE_LIMIT } from '../src/bookings/bookings.service';
import { NotifyService } from '../src/notify/notify.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('POST /bookings', () => {
  let app: INestApplication;
  const created: unknown[] = [];
  let recentCount = 0;
  const prisma = {
    booking: {
      count: jest.fn(async () => recentCount),
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.push(data);
        return { id: created.length };
      }),
    },
  };
  const notify = { bookingCreated: jest.fn(async () => undefined) };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 1000 }])],
      controllers: [BookingsController],
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotifyService, useValue: notify },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    created.length = 0;
    recentCount = 0;
    jest.clearAllMocks();
  });

  const valid = { name: 'Nguyễn Văn A', phone: '0989.041.641', device: 'Bếp từ', address: '2 Bạch Đằng', description: 'Báo lỗi E1' };

  it('201 {id}, lưu SĐT đã chuẩn hoá và báo admin', async () => {
    const res = await request(app.getHttpServer()).post('/bookings').send(valid).expect(201);
    expect(res.body).toEqual({ id: 1 });
    expect(created[0]).toMatchObject({ name: 'Nguyễn Văn A', phone: '0989041641', device: 'Bếp từ', source: 'form' });
    expect(notify.bookingCreated).toHaveBeenCalledTimes(1);
  });

  it('400 kèm lỗi từng trường khi dữ liệu sai', async () => {
    const res = await request(app.getHttpServer()).post('/bookings').send({ name: '', phone: '123', device: 'Tủ lạnh' }).expect(400);
    expect(res.body.errors).toEqual({ name: BOOKING_MESSAGES.name, phone: BOOKING_MESSAGES.phone, device: BOOKING_MESSAGES.device });
    expect(created).toHaveLength(0);
  });

  it('honeypot có giá trị: trả 201 nhưng không lưu, không báo', async () => {
    const res = await request(app.getHttpServer()).post('/bookings').send({ ...valid, website: 'http://spam' }).expect(201);
    expect(res.body).toEqual({ id: 0 });
    expect(created).toHaveLength(0);
    expect(notify.bookingCreated).not.toHaveBeenCalled();
  });

  it('429 khi cùng SĐT gửi quá nhiều trong 10 phút', async () => {
    recentCount = PHONE_LIMIT;
    await request(app.getHttpServer()).post('/bookings').send(valid).expect(429);
    expect(created).toHaveLength(0);
  });
});
