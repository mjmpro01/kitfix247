import type { Prisma } from '@prisma/client';
import { PRODUCT_SORTS, type Product, type ProductDetail, type ProductSort } from '@kitfix/types';

export const productInclude = { brand: { select: { slug: true, name: true } } } satisfies Prisma.ProductInclude;
export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export const toProduct = (p: ProductRow): Product => ({
  id: p.id,
  sku: p.sku,
  slug: p.slug,
  name: p.name,
  category: p.category,
  brand: p.brand ? { slug: p.brand.slug, name: p.brand.name } : null,
  description: p.description,
  icon: p.icon,
  price: p.price,
  // Giá gốc chỉ có nghĩa khi lớn hơn giá bán.
  compareAtPrice: p.price !== null && p.compareAtPrice !== null && p.compareAtPrice > p.price ? p.compareAtPrice : null,
  imageUrl: p.imageUrl,
});

export const toProductDetail = (p: ProductRow): ProductDetail => ({ ...toProduct(p), contentMd: p.contentMd });

export const parseSort = (v?: string): ProductSort => PRODUCT_SORTS.find((s) => s === v) ?? 'new';

/** Sắp xếp theo giá: sản phẩm chưa có giá luôn ở cuối. "new" = mới thêm trước. */
export function sortProducts<T extends { id: number; price: number | null }>(rows: T[], sort: ProductSort): T[] {
  if (sort === 'new') return [...rows].sort((a, b) => b.id - a.id);
  const dir = sort === 'price_asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (a.price === null || b.price === null) return a.price === b.price ? b.id - a.id : a.price === null ? 1 : -1;
    return (a.price - b.price) * dir || b.id - a.id;
  });
}
