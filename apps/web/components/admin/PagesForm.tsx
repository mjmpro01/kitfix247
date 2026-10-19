'use client';

import { useActionState } from 'react';
import { PAGE_MD_MAX, PAGE_TOKENS } from '@kitfix/types';
import { savePages, type SettingsState } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

export interface PageDraft {
  key: string;
  path: string;
  title: string;
  /** Nội dung đang lưu, chưa có thì là khung mặc định. */
  md: string;
}

export function PagesForm({ pages }: { pages: PageDraft[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(savePages, {});
  return (
    <form action={action} className={s.stack} style={{ gap: 24 }}>
      <p className={s.sub}>
        Soạn bằng Markdown: <code>## Tiêu đề mục</code>, <code>- gạch đầu dòng</code>, <code>**chữ đậm**</code>, <code>[chữ](/dat-lich)</code>. Biến tự lấy
        từ Cài đặt: {PAGE_TOKENS.map((t) => `{{${t}}}`).join(', ')}. Đoạn trong [ ... ] là chỗ chờ nội dung thật. Để trống = dùng khung mặc định.
      </p>
      {state.errors?.pages ? (
        <div className={s.alert} role="alert">
          {state.errors.pages}
        </div>
      ) : null}
      {pages.map((p) => (
        <section key={p.key} className={s.card} id={p.key} aria-labelledby={`page-${p.key}`}>
          <div className={s.rowBetween}>
            <h2 id={`page-${p.key}`} className={s.h2}>
              {p.title}
            </h2>
            <a href={p.path} target="_blank" rel="noopener" className={`${s.btn} ${s.btnSm}`}>
              Xem trang {p.path}
            </a>
          </div>
          <label className={s.label}>
            <span className={s.labelText}>Nội dung trang {p.title}</span>
            <textarea className={s.textarea} name={p.key} rows={16} maxLength={PAGE_MD_MAX} defaultValue={state.values?.[p.key] ?? p.md} />
          </label>
        </section>
      ))}
      <div className={s.headActions}>
        <button type="submit" className={`${s.btn} ${s.btnBrand}`} disabled={pending}>
          {pending ? 'Đang lưu…' : 'Lưu nội dung'}
        </button>
        <span role="status" aria-live="polite">
          {state.ok ? <span className={s.toast}>Đã lưu — website đã cập nhật</span> : null}
          {state.error ? <span className={`${s.toast} ${s.toastError}`}>{state.error}</span> : null}
        </span>
      </div>
    </form>
  );
}
