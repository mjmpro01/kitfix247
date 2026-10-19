import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import type { Review } from '@prisma/client';
import type { AdminReview } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, Check, defined, parseId } from './validate';

const STATUSES = ['pending', 'approved', 'hidden'] as const;

/** Trường của đánh giá; `creating` = bắt buộc tên, nội dung, số sao. */
export function reviewFields(body: unknown, creating: boolean) {
  const c = new Check(asBody(body));
  const data = defined({
    customerName: c.str('customerName', 'Tên khách', { max: 120, required: creating }),
    area: c.str('area', 'Khu vực', { max: 120 }),
    device: c.str('device', 'Dịch vụ / thiết bị', { max: 120 }),
    rating: c.int('rating', 'Số sao', { min: 1, max: 5, required: creating }),
    content: c.str('content', 'Nội dung', { max: 2000, required: creating }),
    status: c.oneOf('status', 'Trạng thái', STATUSES),
    showHome: c.bool('showHome', 'Hiện ở trang chủ'),
  });
  if (c.has('customerName') && !data.customerName) c.errors.customerName = 'Tên khách là bắt buộc.';
  if (c.has('content') && !data.content) c.errors.content = 'Nội dung là bắt buộc.';
  // Chỉ đánh giá đã duyệt mới được hiện ở trang chủ.
  if (data.showHome && data.status && data.status !== 'approved') c.errors.showHome = 'Duyệt đánh giá trước khi cho hiện ở trang chủ.';
  c.done();
  if (data.status && data.status !== 'approved') data.showHome = false;
  return data;
}

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

  /** Sửa nội dung (tên, khu vực, dịch vụ, số sao, nội dung), duyệt / ẩn / chờ duyệt, bật/tắt hiện trang chủ. */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<AdminReview> {
    return toAdminReview(await this.prisma.review.update({ where: { id: parseId(id) }, data: reviewFields(body, false) }));
  }

  /** Thêm đánh giá thật do chủ nhập (từ Zalo, Google…): mặc định đã duyệt, chưa hiện trang chủ. */
  @Post()
  async create(@Body() body: unknown): Promise<AdminReview> {
    const f = reviewFields(body, true);
    const r = await this.prisma.review.create({
      data: {
        customerName: f.customerName!,
        area: f.area ?? '',
        device: f.device ?? '',
        rating: f.rating!,
        content: f.content!,
        status: f.status ?? 'approved',
        showHome: f.showHome ?? false,
      },
    });
    return toAdminReview(r);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id: parseId(id) } });
  }
}
