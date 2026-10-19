import type { Metadata } from 'next';
import type { AdminBrand } from '@kitfix/types';
import { BrandManager } from '@/components/admin/BrandManager';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Thương hiệu' };

export default async function BrandsAdminPage() {
  return <BrandManager initial={await adminGet<AdminBrand[]>('/admin/brands')} />;
}
