import { Controller, Get } from '@nestjs/common';
import { CALLBACK_SLA_MINUTES, type AdminStats } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';

/** Nửa đêm hôm nay theo giờ Việt Nam (UTC+7, không đổi giờ theo mùa). */
export function startOfDayVn(now = new Date()): Date {
  const VN = 7 * 60 * 60 * 1000;
  const d = new Date(now.getTime() + VN);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - VN);
}

@Controller('admin/stats')
export class StatsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(): Promise<AdminStats> {
    const today = startOfDayVn();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const slaCutoff = new Date(Date.now() - CALLBACK_SLA_MINUTES * 60_000);
    const [bookingsToday, bookingsYesterday, waiting, overdue, newOrders, ordersAwaitingTransfer, publishedPosts, postsNeedSeo] =
      await Promise.all([
        this.prisma.booking.count({ where: { createdAt: { gte: today } } }),
        this.prisma.booking.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        this.prisma.booking.count({ where: { status: 'new' } }),
        this.prisma.booking.count({ where: { status: 'new', createdAt: { lt: slaCutoff } } }),
        this.prisma.order.count({ where: { status: 'new' } }),
        this.prisma.order.count({ where: { status: 'new', payment: 'bank' } }),
        this.prisma.post.count({ where: { status: 'published' } }),
        this.prisma.post.count({ where: { status: 'published', seoScore: { lt: 80 } } }),
      ]);
    return { bookingsToday, bookingsYesterday, waiting, overdue, newOrders, ordersAwaitingTransfer, publishedPosts, postsNeedSeo };
  }
}
