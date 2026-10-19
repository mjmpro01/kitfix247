import type { Product as ProductRow } from '@prisma/client';
import { PRODUCT_SORTS, type Product, type ProductSort } from '@kitfix/types';

export const toProduct = (p: ProductRow): Product => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  description: p.description,
  icon: p.icon,
  price: p.price,
  imageUrl: p.imageUrl,
});

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
