'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ORDER_STATUS_LABELS, paymentLabel, type AdminOrder, type AdminOrderPage, type OrderStatus } from '@kitfix/types';
import { formatPrice } from '@kitfix/ui';
import { setOrderStatus } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

type Filter = OrderStatus | 'all';

const FILTERS: { k: Filter; name: string }[] = [
  { k: 'all', name: 'Tất cả' },
  { k: 'new', name: 'Chờ xác nhận' },
  { k: 'confirmed', name: 'Đã xác nhận' },
  { k: 'shipping', name: 'Đang giao' },
  { k: 'delivered', name: 'Đã giao' },
  { k: 'cancelled', name: 'Đã huỷ' },
];

const PILL: Record<OrderStatus, string> = { new: s.st_new, confirmed: s.st_called, shipping: s.st_assigned, delivered: s.st_done, cancelled: s.st_cancelled };

/** Bước kế tiếp của đơn (một nút chính mỗi trạng thái). */
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: 'confirmed', label: 'Xác nhận đơn' },
  confirmed: { to: 'shipping', label: 'Đang giao' },
  shipping: { to: 'delivered', label: 'Đã giao' },
};

const fmtPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 4)}.${p.slice(4, 7)}.${p.slice(7)}` : p);
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso));

export function OrdersTable({ page }: { page: AdminOrderPage }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(t);
  }, [router]);
  const rows = page.items.filter((o) => filter === 'all' || o.status === filter);

  return (
    <section className={`${s.card} ${s.cardFlush}`} aria-labelledby="orders-title">
      <div className={s.cardHead}>
        <div>
          <h2 id="orders-title" className={s.h2}>
            Đơn hàng Shop
          </h2>
          <p className={s.sub}>Gọi xác nhận đơn, báo giá dòng chưa có giá và phí giao trước khi giao.</p>
        </div>
        <div role="group" aria-label="Lọc trạng thái" className={s.chips}>
          {FILTERS.map((f) => (
            <button key={f.k} type="button" className={`${s.chip} ${s.chipSm}`} aria-pressed={filter === f.k} onClick={() => setFilter(f.k)}>
              {f.name} ({page.counts[f.k]})
            </button>
          ))}
        </div>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table} style={{ minWidth: 960 }}>
          <thead>
            <tr>
              <th scope="col">Đơn · khách</th>
              <th scope="col">Sản phẩm</th>
              <th scope="col">Thanh toán</th>
              <th scope="col">Đặt lúc</th>
              <th scope="col">Trạng thái</th>
              <th scope="col" className={s.right}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className={s.empty}>{page.items.length === 0 ? 'Chưa có đơn hàng nào.' : 'Không có đơn ở trạng thái này.'}</p> : null}
      </div>
    </section>
  );
}

function OrderRow({ o }: { o: AdminOrder }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const next = NEXT[o.status];
  const go = (status: OrderStatus) =>
    start(async () => {
      setError('');
      const r = await setOrderStatus(o.id, status);
      if (!r.ok) setError(r.error);
    });
  const missing = o.total === null;

  return (
    <tr>
      <td>
        <div className={s.strong}>{o.code}</div>
        <div>{o.customerName}</div>
        <a href={`tel:${o.phone}`} className={s.tel}>
          {fmtPhone(o.phone)}
        </a>
        <div className={`${s.small} ${s.muted}`}>{o.address}</div>
      </td>
      <td className={s.small}>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {o.items.map((i) => (
            <li key={i.productId}>
              {i.name} × {i.qty} <span className={s.muted}>· {i.unitPrice !== null ? formatPrice(i.unitPrice * i.qty) : 'chưa có giá'}</span>
            </li>
          ))}
        </ul>
      </td>
      <td>
        <div className={s.strong}>{paymentLabel(o.payment)}</div>
        <div className={`${s.small} ${missing ? s.warn : s.muted}`}>
          {missing ? 'Cần báo giá' : `Tổng ${formatPrice(o.total!)}`}
          {o.shippingFee === null ? ' · phí giao chưa chốt' : ''}
        </div>
        {o.payment === 'bank' && o.status === 'new' ? <div className={`${s.small} ${s.warn}`}>Chờ xác nhận chuyển khoản</div> : null}
      </td>
      <td className={`${s.muted} ${s.nowrap}`}>
        <time dateTime={o.createdAt}>{fmtTime(o.createdAt)}</time>
      </td>
      <td>
        <span className={`${s.pill} ${PILL[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
      </td>
      <td className={s.right}>
        <div className={s.rowActions} aria-busy={pending}>
          {next ? (
            <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={pending} onClick={() => go(next.to)}>
              {next.label}
            </button>
          ) : null}
          {o.status === 'new' || o.status === 'confirmed' ? (
            <button
              type="button"
              className={`${s.btn} ${s.btnSm} ${s.btnDanger}`}
              disabled={pending}
              onClick={() => {
                if (confirm(`Huỷ đơn ${o.code}?`)) go('cancelled');
              }}
            >
              Huỷ
            </button>
          ) : null}
        </div>
        {error ? (
          <div className={s.fieldError} role="alert">
            {error}
          </div>
        ) : null}
      </td>
    </tr>
  );
}
