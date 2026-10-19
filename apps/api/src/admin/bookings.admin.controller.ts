import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Query } from '@nestjs/common';
import type { Booking, Prisma } from '@prisma/client';
import { BOOKING_STATUSES, isBookingStatus, type AdminBooking, type AdminBookingPage, type BookingStatus } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, parseId } from './validate';

export function toAdminBooking(b: Booking): AdminBooking {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone,
    device: b.device,
    address: b.address,
    description: b.description,
    status: b.status,
    technician: b.technician,
    source: b.source,
    createdAt: b.createdAt.toISOString(),
    calledAt: b.calledAt?.toISOString() ?? null,
  };
}

/**
 * Dữ liệu cập nhật khi đổi trạng thái lịch hẹn.
 * - called: ghi called_at (lần gọi đầu tiên, không ghi đè).
 * - assigned: bắt buộc có tên KTV (gửi kèm hoặc đã có sẵn); chưa ghi called_at thì ghi luôn — giao KTV nghĩa là đã gọi khách.
 * - các trạng thái khác: chỉ đổi status (cho phép admin sửa nhầm).
 */
export function statusUpdate(current: Pick<Booking, 'calledAt' | 'technician'>, body: unknown, now = new Date()): Prisma.BookingUpdateInput {
  const b = asBody(body);
  if (!isBookingStatus(b.status)) {
    throw new BadRequestException({ message: 'Trạng thái không hợp lệ', errors: { status: `Chỉ nhận: ${BOOKING_STATUSES.join(', ')}` } });
  }
  if (b.technician !== undefined && typeof b.technician !== 'string') {
    throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: { technician: 'Tên kỹ thuật viên phải là chữ.' } });
  }
  const status: BookingStatus = b.status;
  const technician = typeof b.technician === 'string' ? b.technician.trim().slice(0, 120) : undefined;
  const data: Prisma.BookingUpdateInput = { status };

  if (technician) data.technician = technician;
  if ((status === 'called' || status === 'assigned') && !current.calledAt) data.calledAt = now;
  if (status === 'assigned' && !technician && !current.technician) {
    throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: { technician: 'Nhập tên kỹ thuật viên được giao.' } });
  }
  return data;
}

@Controller('admin/bookings')
export class BookingsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('status') status?: string, @Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string): Promise<AdminBookingPage> {
    const p = Math.max(1, Number.parseInt(page ?? '', 10) || 1);
    const l = Math.min(100, Math.max(1, Number.parseInt(limit ?? '', 10) || 50));
    const search: Prisma.BookingWhereInput = q?.trim()
      ? { OR: [{ name: { contains: q.trim() } }, { phone: { contains: q.replace(/[\s.]/g, '') } }, { address: { contains: q.trim() } }] }
      : {};
    const where: Prisma.BookingWhereInput = isBookingStatus(status) ? { ...search, status } : search;

    const [items, total, grouped] = await Promise.all([
      this.prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p - 1) * l, take: l }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.groupBy({ by: ['status'], where: search, _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries([['all', 0], ...BOOKING_STATUSES.map((s) => [s, 0])]) as AdminBookingPage['counts'];
    for (const g of grouped) {
      counts[g.status] = g._count._all;
      counts.all += g._count._all;
    }
    return { items: items.map(toAdminBooking), total, page: p, limit: l, counts };
  }

  @Patch(':id/status')
  async setStatus(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminBooking> {
    const id = parseId(rawId);
    const current = await this.prisma.booking.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Không tìm thấy lịch hẹn');
    const updated = await this.prisma.booking.update({ where: { id }, data: statusUpdate(current, body) });
    return toAdminBooking(updated);
  }
}
