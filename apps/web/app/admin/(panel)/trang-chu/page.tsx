import type { Metadata } from 'next';
import type { ProcessStep, Settings } from '@kitfix/types';
import { HomeEditor } from '@/components/admin/HomeEditor';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Trang chủ & Hero' };

export default async function HomeAdminPage() {
  const [settings, steps] = await Promise.all([adminGet<Settings>('/admin/settings'), adminGet<ProcessStep[]>('/admin/process-steps')]);
  return <HomeEditor settings={settings} steps={steps} />;
}
