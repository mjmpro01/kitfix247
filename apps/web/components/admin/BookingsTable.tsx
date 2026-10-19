'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  BOOKING_STATUS_LABELS,
  CALLBACK_SLA_MINUTES,
  isBookingOverdue,
  type AdminBooking,
  type AdminBookingPage,
  type BookingStatus,
} from '@kitfix/types';
import { setBookingStatus } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

type Filter = BookingStatus | 'all';

const FILTERS: { k: Filter; name: string }[] = [
  { k: 'all', name: 'Tất cả' },
  { k: 'new', name: 'Chờ gọi' },
  { k: 'called', name: 'Đã gọi' },
  { k: 'assigned', name: 'Đang sửa' },
  { k: 'done', name: 'Hoàn tất' },
  { k: 'cancelled', name: 'Đã huỷ' },
];

const fmtPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 4)}.${p.slice(4, 7)}.${p.slice(7)}` : p);

function age(createdAt: string, now: number) {
  const min = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} giờ trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(createdAt),
  );
}

/** Bảng lịch hẹn (AdminTongQuan): lọc trạng thái, quá 15 phút tô đỏ, "Đánh dấu đã gọi" / "Giao KTV". Tự làm mới mỗi phút. */
export function BookingsTable({ page, now: serverNow, title, subtitle }: { page: AdminBookingPage; now: number; title: string; subtitle?: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const reload = setInterval(() => router.refresh(), 60_000);
    return () => {
      clearInterval(tick);
      clearInterval(reload);
    };
  }, [router]);

  const rows = page.items.filter((b) => filter === 'all' || b.status === filter);

  return (
    <section className={`${s.card} ${s.cardFlush}`} aria-labelledby="bookings-title">
      <div className={s.cardHead}>
        <div>
          <h2 id="bookings-title" className={s.h2}>
            {title}
          </h2>
          <p className={s.sub}>{subtitle ?? `Cam kết gọi lại trong ${CALLBACK_SLA_MINUTES} phút — yêu cầu quá hạn được tô đỏ.`}</p>
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
        <table className={s.table} style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th scope="col">Khách hàng</th>
              <th scope="col">Thiết bị · lỗi</th>
              <th scope="col">Địa chỉ</th>
              <th scope="col">Đã gửi</th>
              <th scope="col">Trạng thái</th>
              <th scope="col" className={s.right}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <BookingRow key={b.id} b={b} now={now} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className={s.empty}>{page.items.length === 0 ? 'Chưa có lịch hẹn nào.' : 'Không có lịch hẹn ở trạng thái này.'}</p>
        ) : null}
      </div>
      {page.total > page.items.length ? (
        <p className={`${s.sub} ${s.empty}`}>
          Đang hiện {page.items.length} lịch mới nhất trên tổng {page.total}.
        </p>
      ) : null}
    </section>
  );
}

function BookingRow({ b, now }: { b: AdminBooking; now: number }) {
  const [pending, start] = useTransition();
  const [assigning, setAssigning] = useState(false);
  const [tech, setTech] = useState(b.technician ?? '');
  const [error, setError] = useState('');
  const late = isBookingOverdue(b, now);

  const go = (status: BookingStatus, technician?: string) =>
    start(async () => {
      setError('');
      const r = await setBookingStatus(b.id, status, technician);
      if (!r.ok) setError(r.errors?.technician ?? r.error);
      else setAssigning(false);
    });

  return (
    <tr>
      <td>
        <div className={s.strong}>{b.name}</div>
        <a href={`tel:${b.phone}`} className={s.tel}>
          {fmtPhone(b.phone)}
        </a>
      </td>
      <td>
        <div className={s.strong}>{b.device}</div>
        {b.description ? <div className={`${s.small} ${s.muted}`}>{b.description}</div> : null}
      </td>
      <td className={s.muted}>{b.address || '—'}</td>
      <td className={`${s.nowrap} ${late ? `${s.bad} ${s.strong}` : s.muted}`}>
        <time dateTime={b.createdAt}>{age(b.createdAt, now)}</time>
        {late ? ' · quá hạn' : ''}
      </td>
      <td>
        <span className={`${s.pill} ${s[`st_${b.status}`]}`}>{BOOKING_STATUS_LABELS[b.status]}</span>
        {b.technician && (b.status === 'assigned' || b.status === 'done') ? <div className={`${s.small} ${s.muted}`}>KTV: {b.technician}</div> : null}
      </td>
      <td className={s.right}>
        <div className={s.rowActions} aria-busy={pending}>
          {b.status === 'new' ? (
            <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={pending} onClick={() => go('called')}>
              Đánh dấu đã gọi
            </button>
          ) : null}
          {b.status === 'called' && !assigning ? (
            <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={pending} onClick={() => setAssigning(true)}>
              Giao KTV
            </button>
          ) : null}
          {b.status === 'called' && assigning ? (
            <form
              className={s.assignForm}
              onSubmit={(e) => {
                e.preventDefault();
                go('assigned', tech);
              }}
            >
              <label className="visually-hidden" htmlFor={`tech-${b.id}`}>
                Tên kỹ thuật viên cho lịch của {b.name}
              </label>
              <input
                id={`tech-${b.id}`}
                className={`${s.input} ${s.inputSm}`}
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                placeholder="Tên KTV"
                autoFocus
                required
                maxLength={120}
              />
              <button type="submit" className={`${s.btn} ${s.btnSm} ${s.btnBrand}`} disabled={pending || !tech.trim()}>
                Giao
              </button>
              <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => setAssigning(false)}>
                Thôi
              </button>
            </form>
          ) : null}
          {b.status === 'assigned' ? (
            <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={pending} onClick={() => go('done')}>
              Hoàn tất
            </button>
          ) : null}
          {b.status === 'new' || b.status === 'called' ? (
            <button
              type="button"
              className={`${s.btn} ${s.btnSm} ${s.btnDanger}`}
              disabled={pending}
              onClick={() => {
                if (confirm(`Huỷ lịch hẹn của ${b.name}?`)) go('cancelled');
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
