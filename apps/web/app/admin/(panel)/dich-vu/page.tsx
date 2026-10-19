import type { Metadata } from 'next';
import type { AdminPriceGroup, AdminService } from '@kitfix/types';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Dịch vụ & bảng giá' };

export default async function ServicesAdminPage() {
  const [services, groups] = await Promise.all([adminGet<AdminService[]>('/admin/services'), adminGet<AdminPriceGroup[]>('/admin/price-groups')]);
  return <ServiceManager initial={services} groups={groups} />;
}
