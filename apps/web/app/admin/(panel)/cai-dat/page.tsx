import type { Metadata } from 'next';
import type { Settings } from '@kitfix/types';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { adminGet } from '@/lib/admin/api';
import s from '../../admin.module.css';

export const metadata: Metadata = { title: 'Cài đặt liên hệ' };

export default async function SettingsAdminPage() {
  const settings = await adminGet<Settings>('/admin/settings');
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Cài đặt liên hệ & thanh toán</h1>
          <p className={s.sub}>Thông tin cố định của website — đọc từ bảng Cài đặt, không viết cứng trong code.</p>
        </div>
      </div>
      <div className={s.content}>
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
