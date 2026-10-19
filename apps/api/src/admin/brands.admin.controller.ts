import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AdminBrand } from '@kitfix/types';
import { slugifyVi } from '@kitfix/ui';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, Check, defined, parseId } from './validate';

const brandInclude = { _count: { select: { posts: true } } } satisfies Prisma.BrandInclude;
type BrandRow = Prisma.BrandGetPayload<{ include: typeof brandInclude }>;

function toAdminBrand(b: BrandRow): AdminBrand {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    logoUrl: b.logoUrl,
    logoStyle: b.logoStyle,
    description: b.description,
    devices: Array.isArray(b.devices) ? b.devices.filter((d): d is string => typeof d === 'string') : [],
    sort: b.sort,
    showHome: b.showHome,
    seoTitle: b.seoTitle,
    seoDesc: b.seoDesc,
    postCount: b._count.posts,
  };
}

function brandFields(body: unknown, creating: boolean) {
  const c = new Check(asBody(body));
  const name = c.str('name', 'Tên hãng', { max: 80, required: creating });
  const rawSlug = c.str('slug', 'Đường dẫn', { max: 80 });
  const logoUrl = c.optStr('logoUrl', 'Logo', 512);
  if (logoUrl && !/^https?:\/\//.test(logoUrl)) c.errors.logoUrl = 'Logo phải là URL http(s) do API tải lên trả về.';
  const data = defined({
    name,
    slug: rawSlug !== undefined ? slugifyVi(rawSlug) : creating && name ? slugifyVi(name) : undefined,
    logoUrl,
    logoStyle: c.oneOf('logoStyle', 'Kiểu logo', ['gray', 'color'] as const),
    description: c.optStr('description', 'Mô tả', 2000),
    devices: c.strList('devices', 'Thiết bị', 20, 80),
    showHome: c.bool('showHome', 'Hiện ở trang chủ'),
    seoTitle: c.optStr('seoTitle', 'Tiêu đề SEO', 160),
    seoDesc: c.optStr('seoDesc', 'Mô tả SEO', 320),
  });
  if (data.slug === '') c.errors.slug = 'Đường dẫn không hợp lệ.';
  if (c.has('name') && name === '') c.errors.name = 'Tên hãng là bắt buộc.';
  c.done();
  return data;
}

@Controller('admin/brands')
export class BrandsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async one(id: number) {
    const b = await this.prisma.brand.findUnique({ where: { id }, include: brandInclude });
    if (!b) throw new NotFoundException('Không tìm thấy thương hiệu');
    return toAdminBrand(b);
  }

  @Get()
  async list(): Promise<AdminBrand[]> {
    const rows = await this.prisma.brand.findMany({ orderBy: { sort: 'asc' }, include: brandInclude });
    return rows.map(toAdminBrand);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.one(parseId(id));
  }

  @Post()
  async create(@Body() body: unknown): Promise<AdminBrand> {
    const data = brandFields(body, true);
    const last = await this.prisma.brand.aggregate({ _max: { sort: true } });
    const b = await this.prisma.brand.create({
      data: { ...data, name: data.name!, slug: data.slug!, showHome: data.showHome ?? false, sort: (last._max.sort ?? 0) + 1 },
    });
    return this.one(b.id);
  }

  @Put('order')
  async order(@Body() body: unknown): Promise<{ ok: true }> {
    const c = new Check(asBody(body));
    const ids = c.intList('ids', 'Thứ tự', 200);
    if (!ids) c.errors.ids = 'Thiếu danh sách id.';
    c.done();
    await this.prisma.$transaction(ids!.map((id, i) => this.prisma.brand.update({ where: { id }, data: { sort: i + 1 } })));
    return { ok: true };
  }

  @Patch(':id')
  async update(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminBrand> {
    const id = parseId(rawId);
    await this.prisma.brand.update({ where: { id }, data: brandFields(body, false) });
    return this.one(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.prisma.brand.delete({ where: { id: parseId(id) } });
  }
}
