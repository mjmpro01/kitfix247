import type { Metadata } from 'next';
import type { AdminProduct } from '@kitfix/types';
import { ProductManager } from '@/components/admin/ProductManager';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Sản phẩm' };

export default async function ProductsAdminPage() {
  return <ProductManager initial={await adminGet<AdminProduct[]>('/admin/products')} />;
}
