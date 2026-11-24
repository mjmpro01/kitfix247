'use client';

import { useId, useRef, useState } from 'react';
import s from '@/app/admin/admin.module.css';
import { uploadImage, type UploadFolder } from './upload';

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  folder: UploadFolder;
  /** Báo lỗi tải ảnh lên màn hình cha. */
  onError: (text: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}

/** Ô soạn Markdown gọn cho admin: tiêu đề, đậm, nghiêng, danh sách, chèn ảnh (tải lên API). */
export function MarkdownField({ label, hint, value, onChange, folder, onError, rows = 10, maxLength = 100_000, placeholder }: Props) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /** Chèn tại con trỏ (bọc vùng chọn nếu có). */
  const insert = (before: string, after = '', placeholderText = '') => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholderText;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };
  /** Chèn khối bắt đầu ở dòng mới. */
  const insertBlock = (prefix: string, placeholderText: string) => {
    const pos = ref.current?.selectionStart ?? value.length;
    const head = value.slice(0, pos);
    const lead = pos === 0 || head.endsWith('\n\n') ? '' : head.endsWith('\n') ? '\n' : '\n\n';
    insert(`${lead}${prefix}`, '\n\n', placeholderText);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const r = await uploadImage(file, folder);
    setUploading(false);
    if (!r.ok) return onError(r.error);
    insert('![', `](${r.data.url})`, 'Mô tả ảnh');
  };

  return (
    <div className={s.stack}>
      <label htmlFor={id} className={s.labelText}>
        {label} {hint ? <span className={s.labelHint}>{hint}</span> : null}
      </label>
      <div className={`${s.card} ${s.cardFlush}`} style={{ boxShadow: 'none', border: '1px solid var(--line)' }}>
        <div role="toolbar" aria-label={`Định dạng: ${label}`} className={s.toolbar}>
          <button type="button" className={`${s.tool} ${s.toolStrong}`} onClick={() => insertBlock('## ', 'Tiêu đề phụ')} aria-label="Chèn tiêu đề H2">
            H2
          </button>
          <button type="button" className={`${s.tool} ${s.toolStrong}`} onClick={() => insertBlock('### ', 'Tiêu đề nhỏ')} aria-label="Chèn tiêu đề H3">
            H3
          </button>
          <button type="button" className={`${s.tool} ${s.toolStrong}`} onClick={() => insert('**', '**', 'chữ đậm')} aria-label="In đậm">
            B
          </button>
          <button type="button" className={`${s.tool} ${s.toolItalic}`} onClick={() => insert('_', '_', 'chữ nghiêng')} aria-label="In nghiêng">
            I
          </button>
          <button type="button" className={s.tool} onClick={() => insertBlock('- ', 'Ý thứ nhất')}>
            Danh sách
          </button>
          <button type="button" className={s.tool} onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? 'Đang tải ảnh…' : 'Chèn ảnh'}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="visually-hidden"
          tabIndex={-1}
          aria-label={`Chọn ảnh để chèn vào: ${label}`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void upload(f);
          }}
        />
        <textarea id={id} ref={ref} className={s.editor} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} />
      </div>
    </div>
  );
}
