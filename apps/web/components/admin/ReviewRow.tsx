'use client';

import { useState, useTransition } from 'react';
import type { AdminReview, ReviewStatus } from '@kitfix/types';
import { updateReview } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

const LABELS: Record<ReviewStatus, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', hidden: 'Đã ẩn' };
const PILL: Record<ReviewStatus, string> = { pending: s.st_new, approved: s.st_done, hidden: s.st_cancelled };

export function ReviewRow({ review }: { review: AdminReview }) {
  const [r, setR] = useState(review);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  const update = (data: { status?: ReviewStatus; showHome?: boolean }) =>
    start(async () => {
      setError('');
      const res = await updateReview(r.id, data);
      if (res.ok) setR(res.data);
      else setError(res.error);
    });

  return (
    <tr>
      <td>
        <div className={s.strong}>{r.customerName}</div>
        <div className={`${s.small} ${s.muted}`}>
          {r.area} · {r.device} · {r.rating}/5
        </div>
      </td>
      <td className={s.small} style={{ maxWidth: 420 }}>
        {r.content}
      </td>
      <td>
        <span className={`${s.pill} ${PILL[r.status]}`}>{LABELS[r.status]}</span>
      </td>
      <td>
        <label className={s.check}>
          <input type="checkbox" checked={r.showHome} disabled={pending || r.status !== 'approved'} onChange={(e) => update({ showHome: e.target.checked })} />
          <span className="visually-hidden">Hiện đánh giá của {r.customerName} ở trang chủ</span>
        </label>
      </td>
      <td className={s.right}>
        <div className={s.rowActions} aria-busy={pending}>
          {r.status !== 'approved' ? (
            <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={pending} onClick={() => update({ status: 'approved' })}>
              Duyệt
            </button>
          ) : null}
          {r.status !== 'hidden' ? (
            <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} disabled={pending} onClick={() => update({ status: 'hidden', showHome: false })}>
              Ẩn
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
