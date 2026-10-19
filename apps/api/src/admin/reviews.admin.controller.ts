import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { Review } from '@prisma/client';
import type { AdminReview } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, Check, defined, parseId } from './validate';

const STATUSES = ['pending', 'approved', 'hidden'] as const;

const toAdminReview = (r: Review): AdminReview => ({
  id: r.id,
  customerName: r.customerName,
  area: r.area,
  device: r.device,
  rating: r.rating,
  content: r.content,
  status: r.status,
  showHome: r.showHome,
  createdAt: r.createdAt.toISOString(),
});

@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('status') status?: string): Promise<AdminReview[]> {
    const s = STATUSES.find((x) => x === status);
    const rows = await this.prisma.review.findMany({ where: s ? { status: s } : undefined, orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.map(toAdminReview);
  }

  /** Duyệt (approved) / ẩn (hidden) / chờ duyệt (pending), bật/tắt hiện trang chủ. */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<AdminReview> {
    const c = new Check(asBody(body));
    const data = defined({ status: c.oneOf('status', 'Trạng thái', STATUSES), showHome: c.bool('showHome', 'Hiện ở trang chủ') });
    c.done();
    return toAdminReview(await this.prisma.review.update({ where: { id: parseId(id) }, data }));
  }
}
