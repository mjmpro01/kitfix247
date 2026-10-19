import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { Brand, BrandDetail, ProcessStep, Review } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';

const isOn = (v?: string) => v === '1' || v === 'true';

/** Các danh sách công khai mà trang chủ cần. Bài viết + chuyên mục ở PostsController. */
@Controller()
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('process-steps')
  async steps(): Promise<ProcessStep[]> {
    const rows = await this.prisma.processStep.findMany({ orderBy: { n: 'asc' } });
    return rows.map((r) => ({ n: r.n, title: r.title, description: r.description }));
  }

  @Get('brands')
  async brands(@Query('home') home?: string): Promise<Brand[]> {
    const rows = await this.prisma.brand.findMany({
      where: isOn(home) ? { showHome: true } : undefined,
      orderBy: { sort: 'asc' },
    });
    return rows.map((b) => ({ id: b.id, slug: b.slug, name: b.name, logoUrl: b.logoUrl, logoStyle: b.logoStyle }));
  }

  @Get('brands/:slug')
  async brand(@Param('slug') slug: string): Promise<BrandDetail> {
    const b = await this.prisma.brand.findUnique({ where: { slug } });
    if (!b) throw new NotFoundException('Không tìm thấy thương hiệu');
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      logoUrl: b.logoUrl,
      logoStyle: b.logoStyle,
      description: b.description,
      devices: Array.isArray(b.devices) ? b.devices.filter((d): d is string => typeof d === 'string') : [],
      seoTitle: b.seoTitle,
      seoDesc: b.seoDesc,
    };
  }

  @Get('reviews')
  async reviews(@Query('home') home?: string): Promise<Review[]> {
    const rows = await this.prisma.review.findMany({
      where: { status: 'approved', ...(isOn(home) ? { showHome: true } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    return rows.map((r) => ({ id: r.id, customerName: r.customerName, area: r.area, device: r.device, rating: r.rating, content: r.content }));
  }
}
