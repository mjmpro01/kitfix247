import type { Metadata } from 'next';
import { DEFAULT_MENU, type Settings } from '@kitfix/types';
import { MenuEditor } from '@/components/admin/MenuEditor';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Menu điều hướng' };

export default async function MenuAdminPage() {
  const settings = await adminGet<Settings>('/admin/settings');
  return <MenuEditor initial={settings.menu?.length ? settings.menu : DEFAULT_MENU} />;
}
