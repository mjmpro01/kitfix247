import type { Metadata } from 'next';
import type { AdminOrderPage } from '@kitfix/types';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { adminGet } from '@/lib/admin/api';
import s from '../../admin.module.css';

export const metadata: Metadata = { title: 'Đơn hàng' };

export default async function OrdersAdminPage() {
  const page = await adminGet<AdminOrderPage>('/admin/orders?limit=100');
  return (
    <div className={s.content}>
      <div>
        <h1 className={`${s.h1} ${s.h1Lg}`}>Đơn hàng</h1>
        <p className={s.muted}>
          {page.counts.all} đơn · {page.counts.new} chờ xác nhận. Danh sách tự làm mới mỗi phút.
        </p>
      </div>
      <OrdersTable page={page} />
    </div>
  );
}
