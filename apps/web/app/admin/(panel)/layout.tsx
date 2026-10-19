import Link from 'next/link';
import type { AdminStats, AdminUserInfo } from '@kitfix/types';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { adminGet } from '@/lib/admin/api';
import { logoutAction } from '../actions';
import s from '../admin.module.css';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [me, stats] = await Promise.all([adminGet<AdminUserInfo>('/admin/auth/me'), adminGet<AdminStats>('/admin/stats')]);
  return (
    <div className={s.shell}>
      <AdminSidebar waiting={stats.waiting} />
      <div className={s.main}>
        <div className={s.topbar}>
          <form action="/admin/lich-hen" method="get" role="search" className={s.search}>
            <AdminIcon name="search" />
            <label htmlFor="admin-search" className="visually-hidden">
              Tìm lịch hẹn theo tên, số điện thoại, địa chỉ
            </label>
            <input id="admin-search" type="search" name="q" placeholder="Tìm lịch hẹn: tên, số điện thoại, địa chỉ…" />
          </form>
          <Link href="/admin/bai-viet/moi" className={`${s.btn} ${s.btnBrand}`}>
            <AdminIcon name="plus" strokeWidth={2} />
            Viết bài mới
          </Link>
          <div className={s.account}>
            <span className={s.avatar} aria-hidden="true">
              QT
            </span>
            <span className={s.accountEmail} title={me.email}>
              {me.email}
            </span>
            <form action={logoutAction}>
              <button type="submit" className={`${s.btn} ${s.btnSm}`}>
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
        <main id="noi-dung">{children}</main>
      </div>
    </div>
  );
}
