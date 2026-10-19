import 'server-only';
import type { AdminBrand, Category, ServiceSummary, Settings } from '@kitfix/types';
import { adminGet } from '@/lib/admin/api';

/** Dữ liệu phụ cho trình soạn: chuyên mục, hãng, dịch vụ (chèn link), hotline (khối gọi). */
export async function editorData() {
  const [categories, brands, services, settings] = await Promise.all([
    adminGet<Category[]>('/categories'),
    adminGet<AdminBrand[]>('/admin/brands'),
    adminGet<ServiceSummary[]>('/services'),
    adminGet<Settings>('/admin/settings'),
  ]);
  return { categories, brands, services, hotline: { display: settings.hotline, tel: settings.hotlineTel } };
}
