import type { Metadata } from 'next';
import type { AdminBrand, AdminProduct } from '@kitfix/types';
import { ProductManager } from '@/components/admin/ProductManager';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Sản phẩm' };

export default async function ProductsAdminPage() {
  const [products, brands] = await Promise.all([adminGet<AdminProduct[]>('/admin/products'), adminGet<AdminBrand[]>('/admin/brands')]);
  return <ProductManager initial={products} brands={brands.map((b) => ({ id: b.id, name: b.name }))} />;
}
