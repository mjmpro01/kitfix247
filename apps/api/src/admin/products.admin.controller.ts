import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AdminProduct } from '@kitfix/types';
import { ICONS, slugifyVi } from '@kitfix/ui';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, Check, defined, parseId } from './validate';

const include = { _count: { select: { orderItems: true } } } satisfies Prisma.ProductInclude;
type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

const toAdminProduct = (p: Row): AdminProduct => ({
  id: p.id,
  sku: p.sku,
  slug: p.slug,
  name: p.name,
  category: p.category,
  brandId: p.brandId,
  description: p.description,
  contentMd: p.contentMd,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  stock: p.stock,
  imageUrl: p.imageUrl,
  icon: p.icon,
  status: p.status === 'hidden' ? 'hidden' : 'active',
  orderCount: p._count.orderItems,
});

function productFields(body: unknown, creating: boolean) {
  const b = asBody(body);
  const c = new Check(b);
  const imageUrl = c.optStr('imageUrl', 'Ảnh', 512);
  if (imageUrl && !/^(https?:\/\/|\/)/.test(imageUrl)) c.errors.imageUrl = 'Ảnh phải là URL.';
  const sku = c.str('sku', 'Mã SKU', { max: 64, required: creating });
  if (sku && !/^[A-Za-z0-9._-]+$/.test(sku)) c.errors.sku = 'Mã SKU chỉ gồm chữ không dấu, số, dấu chấm, gạch.';
  const data = defined({
    sku: sku?.toUpperCase(),
    name: c.str('name', 'Tên sản phẩm', { max: 200, required: creating }),
    category: c.str('category', 'Nhóm', { max: 80, required: creating }),
    slug: c.has('slug') ? slugifyVi(c.str('slug', 'Đường dẫn', { max: 200 }) ?? '') : undefined,
    brandId: b.brandId === null ? null : c.int('brandId', 'Hãng', { min: 1 }),
    description: c.optStr('description', 'Mô tả', 2000),
    contentMd: c.optStr('contentMd', 'Thông tin chi tiết', 100_000),
    // Giá null = chưa có giá: không bán online (khách gọi hỏi giá).
    price: b.price === null ? null : c.int('price', 'Giá', { min: 1000, max: 1_000_000_000 }),
    compareAtPrice: b.compareAtPrice === null ? null : c.int('compareAtPrice', 'Giá gốc', { min: 1000, max: 1_000_000_000 }),
    stock: c.int('stock', 'Tồn kho', { min: 0, max: 1_000_000 }),
    imageUrl,
    icon: c.oneOf('icon', 'Icon', Object.keys(ICONS)),
    status: c.oneOf('status', 'Trạng thái', ['active', 'hidden'] as const),
  });
  if (c.has('name') && data.name === '') c.errors.name = 'Tên sản phẩm là bắt buộc.';
  if (c.has('category') && data.category === '') c.errors.category = 'Nhóm là bắt buộc.';
  if (c.has('slug') && !data.slug) c.errors.slug = 'Đường dẫn không hợp lệ.';
  if (typeof data.price === 'number' && typeof data.compareAtPrice === 'number' && data.compareAtPrice <= data.price) {
    c.errors.compareAtPrice = 'Giá gốc phải lớn hơn giá bán (để trống nếu không giảm giá).';
  }
  c.done();
  return data;
}

@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async one(id: number) {
    const p = await this.prisma.product.findUnique({ where: { id }, include });
    if (!p) throw new NotFoundException('Không tìm thấy sản phẩm');
    return toAdminProduct(p);
  }

  @Get()
  async list(): Promise<AdminProduct[]> {
    return (await this.prisma.product.findMany({ orderBy: { id: 'desc' }, include })).map(toAdminProduct);
  }

  @Post()
  async create(@Body() body: unknown): Promise<AdminProduct> {
    const f = productFields(body, true);
    const p = await this.prisma.product.create({
      data: {
        ...f,
        sku: f.sku!,
        slug: f.slug || slugifyVi(f.name!),
        name: f.name!,
        category: f.category!,
        price: f.price ?? null,
        stock: f.stock ?? 0,
        status: f.status ?? 'active',
      },
    });
    return this.one(p.id);
  }

  @Patch(':id')
  async update(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminProduct> {
    const id = parseId(rawId);
    await this.prisma.product.update({ where: { id }, data: productFields(body, false) });
    return this.one(id);
  }

  /** Sản phẩm đã có trong đơn hàng không xoá được (giữ lịch sử đơn) — ẩn đi thay vì xoá. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id: parseId(id) } });
  }
}
