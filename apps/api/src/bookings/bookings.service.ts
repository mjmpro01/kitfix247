import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { validateBooking, type BookingCreated, type BookingInput } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { NotifyService } from '../notify/notify.service';

/** Một SĐT gửi tối đa ngần này yêu cầu trong cửa sổ thời gian dưới đây. */
export const PHONE_LIMIT = 2;
export const PHONE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  async create(input: Partial<BookingInput>, ip?: string): Promise<BookingCreated> {
    // Honeypot: bot điền ô ẩn. Trả về như thành công để bot không dò ra, nhưng không lưu.
    if (typeof input?.website === 'string' && input.website.trim() !== '') return { id: 0 };

    const v = validateBooking(input ?? {});
    if (!v.ok) throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: v.errors });

    const recent = await this.prisma.booking.count({
      where: { phone: v.data.phone, createdAt: { gte: new Date(Date.now() - PHONE_WINDOW_MS) } },
    });
    if (recent >= PHONE_LIMIT) {
      throw new HttpException(
        { message: 'Chúng tôi đã nhận yêu cầu từ số này và sẽ gọi lại sớm. Cần gấp, anh/chị vui lòng gọi hotline.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const b = await this.prisma.booking.create({ data: { ...v.data, source: 'form', ip: ip?.slice(0, 64) } });
    await this.notify.bookingCreated({ id: b.id, ...v.data });
    return { id: b.id };
  }
}
