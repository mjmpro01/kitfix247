'use client';

import { useState, useTransition } from 'react';
import type { AdminReview, AdminReviewInput, ReviewStatus } from '@kitfix/types';
import { createReview, deleteReview, updateReview } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

const LABELS: Record<ReviewStatus, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', hidden: 'Đã ẩn' };
const PILL: Record<ReviewStatus, string> = { pending: s.st_new, approved: s.st_done, hidden: s.st_cancelled };

/** Dữ liệu mẫu trong seed đánh dấu bằng [ ... ] — cần thay bằng đánh giá thật. */
const isPlaceholder = (r: Pick<AdminReview, 'customerName' | 'content'>) => /^\[.*\]$/.test(r.customerName.trim()) || /^\[.*\]$/.test(r.content.trim());

interface Draft {
  customerName: string;
  area: string;
  device: string;
  rating: number;
  content: string;
}

const emptyDraft: Draft = { customerName: '', area: '', device: '', rating: 5, content: '' };

/** Form sửa / thêm đánh giá. */
function ReviewForm({
  initial,
  submitLabel,
  pending,
  errors,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial: Draft;
  submitLabel: string;
  pending: boolean;
  errors: Record<string, string>;
  onSubmit: (d: Draft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState(initial);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const err = (k: string) =>
    errors[k] ? (
      <span id={`rv-err-${k}`} className={s.fieldError}>
        {errors[k]}
      </span>
    ) : null;
  const errProps = (k: string) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `rv-err-${k}` } : {});

  return (
    <form
      className={s.stack}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(d);
      }}
    >
      <div className={s.fieldRow}>
        <label className={s.label}>
          <span className={s.labelText}>Tên khách</span>
          <input className={`${s.input} ${s.inputSm}`} value={d.customerName} onChange={(e) => set('customerName', e.target.value)} maxLength={120} placeholder="vd Chị Lan" required autoFocus {...errProps('customerName')} />
          {err('customerName')}
        </label>
        <label className={s.label}>
          <span className={s.labelText}>Khu vực</span>
          <input className={`${s.input} ${s.inputSm}`} value={d.area} onChange={(e) => set('area', e.target.value)} maxLength={120} placeholder="vd Quận 3, TP.HCM" {...errProps('area')} />
          {err('area')}
        </label>
        <label className={s.label}>
          <span className={s.labelText}>Dịch vụ đã làm</span>
          <input className={`${s.input} ${s.inputSm}`} value={d.device} onChange={(e) => set('device', e.target.value)} maxLength={120} placeholder="vd Sửa bếp từ" {...errProps('device')} />
          {err('device')}
        </label>
        <label className={s.label} style={{ flex: '0 1 140px' }}>
          <span className={s.labelText}>Số sao</span>
          <select className={`${s.select} ${s.inputSm}`} value={d.rating} onChange={(e) => set('rating', Number(e.target.value))} {...errProps('rating')}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}/5
              </option>
            ))}
          </select>
          {err('rating')}
        </label>
      </div>
      <label className={s.label}>
        <span className={s.labelText}>
          Nội dung <span className={s.labelHint}>đúng lời khách, 2–3 câu</span>
        </span>
        <textarea className={s.textarea} rows={3} value={d.content} onChange={(e) => set('content', e.target.value)} maxLength={2000} required {...errProps('content')} />
        {err('content')}
      </label>
      <div className={s.rowBetween}>
        <div className={s.chips}>
          <button type="submit" className={`${s.btn} ${s.btnBrand}`} disabled={pending}>
            {pending ? 'Đang lưu…' : submitLabel}
          </button>
          <button type="button" className={s.btn} onClick={onCancel} disabled={pending}>
            Thôi
          </button>
        </div>
        {onDelete ? (
          <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={onDelete} disabled={pending}>
            Xoá đánh giá
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function ReviewManager({ initial }: { initial: AdminReview[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | 'new' | null>(null);
  const [pending, start] = useTransition();

  const pendingCount = list.filter((r) => r.status === 'pending').length;
  const placeholders = list.filter(isPlaceholder).length;

  const run = (id: number | 'new', fn: () => Promise<{ ok: true; data: AdminReview | undefined } | { ok: false; error: string; errors?: Record<string, string> }>, after: (r?: AdminReview) => void, okText?: string) => {
    setBusyId(id);
    setNotice(null);
    start(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res.ok) {
        setErrors(res.errors ?? {});
        setNotice({ ok: false, text: res.error });
        return;
      }
      setErrors({});
      after(res.data);
      if (okText) setNotice({ ok: true, text: okText });
    });
  };

  const replace = (r?: AdminReview) => r && setList((l) => l.map((x) => (x.id === r.id ? r : x)));
  const openEdit = (id: number | 'new') => {
    setEditing(id);
    setErrors({});
    setNotice(null);
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Đánh giá khách hàng</h1>
          <p className={s.sub}>
            Chỉ đánh giá đã duyệt mới hiện trên website. {pendingCount ? `${pendingCount} đánh giá chờ duyệt. ` : ''}
            {placeholders ? `${placeholders} đánh giá còn là nội dung mẫu — bấm "Sửa" để thay bằng đánh giá thật.` : ''}
          </p>
        </div>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={() => openEdit('new')} disabled={editing === 'new'}>
            + Thêm đánh giá
          </button>
        </div>
      </div>
      <div className={s.content}>
        {editing === 'new' ? (
          <section className={s.card} aria-labelledby="rv-new">
            <h2 id="rv-new" className={s.h2}>
              Thêm đánh giá thật
            </h2>
            <p className={s.sub}>Nhập đúng lời khách (từ Zalo, Google, tin nhắn…). Đánh giá mới được duyệt sẵn, chưa hiện ở trang chủ.</p>
            <ReviewForm
              initial={emptyDraft}
              submitLabel="Thêm đánh giá"
              pending={pending && busyId === 'new'}
              errors={errors}
              onCancel={() => setEditing(null)}
              onSubmit={(d) =>
                run(
                  'new',
                  () => createReview(d),
                  (r) => {
                    if (r) setList((l) => [r, ...l]);
                    setEditing(null);
                  },
                  'Đã thêm đánh giá',
                )
              }
            />
          </section>
        ) : null}

        <section className={`${s.card} ${s.cardFlush}`} aria-label="Danh sách đánh giá">
          <div className={s.tableWrap}>
            <table className={s.table} style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th scope="col">Khách hàng</th>
                  <th scope="col">Nội dung</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Trang chủ</th>
                  <th scope="col" className={s.right}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) =>
                  editing === r.id ? (
                    <tr key={r.id}>
                      <td colSpan={5}>
                        <ReviewForm
                          initial={{ customerName: r.customerName, area: r.area, device: r.device, rating: r.rating, content: r.content }}
                          submitLabel="Lưu đánh giá"
                          pending={pending && busyId === r.id}
                          errors={errors}
                          onCancel={() => setEditing(null)}
                          onSubmit={(d) =>
                            run(
                              r.id,
                              () => updateReview(r.id, d),
                              (x) => {
                                replace(x);
                                setEditing(null);
                              },
                              'Đã lưu đánh giá — website đã cập nhật',
                            )
                          }
                          onDelete={() => {
                            if (!confirm(`Xoá đánh giá của ${r.customerName}? Không hoàn tác được.`)) return;
                            run(
                              r.id,
                              async () => {
                                const res = await deleteReview(r.id);
                                return res.ok ? { ok: true as const, data: undefined } : res;
                              },
                              () => {
                                setList((l) => l.filter((x) => x.id !== r.id));
                                setEditing(null);
                              },
                              'Đã xoá đánh giá',
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    <ReviewRowView
                      key={r.id}
                      r={r}
                      busy={pending && busyId === r.id}
                      onEdit={() => openEdit(r.id)}
                      onUpdate={(data: AdminReviewInput) => run(r.id, () => updateReview(r.id, data), replace)}
                    />
                  ),
                )}
              </tbody>
            </table>
            {list.length === 0 ? <p className={s.empty}>Chưa có đánh giá nào. Bấm “+ Thêm đánh giá” để nhập đánh giá thật.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}

function ReviewRowView({ r, busy, onEdit, onUpdate }: { r: AdminReview; busy: boolean; onEdit: () => void; onUpdate: (d: AdminReviewInput) => void }) {
  const sample = isPlaceholder(r);
  return (
    <tr>
      <td>
        <div className={s.strong}>{r.customerName}</div>
        <div className={`${s.small} ${s.muted}`}>
          {[r.area, r.device].filter(Boolean).join(' · ')} · {r.rating}/5
        </div>
        {sample ? <div className={`${s.small} ${s.warn} ${s.strong}`}>Nội dung mẫu</div> : null}
      </td>
      <td className={s.small} style={{ maxWidth: 420 }}>
        {r.content}
      </td>
      <td>
        <span className={`${s.pill} ${PILL[r.status]}`}>{LABELS[r.status]}</span>
      </td>
      <td>
        <label className={s.check}>
          <input type="checkbox" checked={r.showHome} disabled={busy || r.status !== 'approved'} onChange={(e) => onUpdate({ showHome: e.target.checked })} />
          <span className="visually-hidden">Hiện đánh giá của {r.customerName} ở trang chủ</span>
        </label>
      </td>
      <td className={s.right}>
        <div className={s.rowActions} aria-busy={busy}>
          <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={busy} onClick={onEdit} aria-label={`Sửa đánh giá của ${r.customerName}`}>
            Sửa
          </button>
          {r.status !== 'approved' ? (
            <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={busy} onClick={() => onUpdate({ status: 'approved' })}>
              Duyệt
            </button>
          ) : null}
          {r.status !== 'hidden' ? (
            <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} disabled={busy} onClick={() => onUpdate({ status: 'hidden' })}>
              Ẩn
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
