'use client';

import { useState, useTransition } from 'react';
import { DEFAULT_MENU, isMenuHref, MENU_LABEL_MAX, MENU_MAX_ITEMS, type MenuItem } from '@kitfix/types';
import { saveMenu } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';
import { AdminIcon } from './AdminIcon';
import { move, useSortable } from './useSortable';

/** Trang chưa làm: bật lên menu sẽ dẫn tới trang "đang hoàn thiện". */
const NOT_BUILT = ['/bang-gia'];

type Row = MenuItem & { key: number };

let seq = 0;
const withKeys = (m: MenuItem[]): Row[] => m.map((x) => ({ ...x, key: ++seq }));
const strip = (rows: Row[]): MenuItem[] => rows.map(({ key: _k, ...x }) => x);

export function MenuEditor({ initial }: { initial: MenuItem[] }) {
  const [rows, setRows] = useState<Row[]>(() => withKeys(initial));
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');
  const dirty = JSON.stringify(strip(rows)) !== baseline;

  const patchAt = (i: number, v: Partial<MenuItem>) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...v } : r)));
    setNotice(null);
  };
  const sortable = useSortable((from, to) => {
    setRows((rs) => move(rs, from, to));
    setNotice(null);
  });

  const problems = rows.flatMap((r, i) => {
    const out: string[] = [];
    if (!r.label.trim() || r.label.trim().length > MENU_LABEL_MAX) out.push(`Mục ${i + 1}: tên 1–${MENU_LABEL_MAX} ký tự.`);
    if (!isMenuHref(r.href.trim())) out.push(`Mục "${r.label || i + 1}": đường dẫn bắt đầu bằng "/" hoặc "https://".`);
    return out;
  });
  if (!rows.some((r) => r.visible)) problems.push('Cần ít nhất một mục đang hiện.');

  const save = () => {
    if (problems.length) return setNotice({ ok: false, text: 'Còn mục chưa hợp lệ.' });
    const menu = strip(rows).map((r) => ({ ...r, label: r.label.trim(), href: r.href.trim() }));
    start(async () => {
      const r = await saveMenu(menu);
      if (!r.ok) return setNotice({ ok: false, text: r.errors?.menu ?? r.error });
      setBaseline(JSON.stringify(menu));
      setRows(withKeys(menu));
      setNotice({ ok: true, text: r.message ?? 'Đã lưu' });
    });
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !isMenuHref(newHref.trim()) || rows.length >= MENU_MAX_ITEMS) return;
    setRows((rs) => [...rs, ...withKeys([{ label: newLabel.trim(), href: newHref.trim(), visible: true, kind: 'link' }])]);
    setNewLabel('');
    setNewHref('');
    setNotice(null);
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Menu điều hướng</h1>
          <p className={s.sub}>Menu trên header và trong menu mobile. Kéo để sắp xếp; tắt “Hiện” để ẩn mục mà không xoá.</p>
        </div>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          <button
            type="button"
            className={s.btn}
            onClick={() => {
              setRows(withKeys(DEFAULT_MENU));
              setNotice(null);
            }}
          >
            Khôi phục mặc định
          </button>
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={save} disabled={pending || !dirty}>
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className={s.content}>
        {problems.length ? (
          <div className={s.alert} role="alert">
            <ul style={{ margin: 0 }}>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section aria-label="Các mục menu">
          <ul className={s.sortList}>
            <li className={s.sortHead}>
              <span>
                {rows.length}/{MENU_MAX_ITEMS} mục · kéo để sắp xếp
              </span>
              <span>Hiện</span>
            </li>
            <li className="visually-hidden" id="menu-sort-help">
              Giữ Alt và bấm mũi tên lên/xuống để đổi thứ tự.
            </li>
            {rows.map((r, i) => (
              <li
                key={r.key}
                className={`${s.sortItem} ${sortable.dragging === i ? s.sortItemDrag : ''} ${sortable.over === i ? s.sortItemOver : ''}`}
                style={{ flexWrap: 'wrap', padding: '6px 8px', opacity: r.visible ? 1 : 0.7 }}
                {...sortable.itemProps(i)}
              >
                <span className={s.grip} aria-hidden="true">
                  <AdminIcon name="grip" size={16} strokeWidth={2} />
                </span>
                <input
                  className={`${s.input} ${s.inputSm}`}
                  style={{ flex: '1 1 160px', width: 'auto' }}
                  aria-label={`Tên mục ${i + 1}`}
                  aria-describedby="menu-sort-help"
                  value={r.label}
                  maxLength={MENU_LABEL_MAX}
                  onChange={(e) => patchAt(i, { label: e.target.value })}
                  {...sortable.keyProps(i, rows.length)}
                />
                <input
                  className={`${s.input} ${s.inputSm}`}
                  style={{ flex: '1 1 180px', width: 'auto' }}
                  aria-label={`Đường dẫn mục ${i + 1}`}
                  value={r.href}
                  onChange={(e) => patchAt(i, { href: e.target.value })}
                />
                {r.kind === 'services' ? <span className={`${s.vis} ${s.muted}`}>Xổ danh sách dịch vụ</span> : null}
                {r.visible && NOT_BUILT.includes(r.href.trim()) ? <span className={`${s.vis} ${s.warn}`}>Trang này chưa có</span> : null}
                <label className={s.check} style={{ paddingRight: 4 }}>
                  <span className="visually-hidden">Hiện mục {r.label}</span>
                  <input type="checkbox" checked={r.visible} onChange={(e) => patchAt(i, { visible: e.target.checked })} />
                </label>
                <button
                  type="button"
                  className={`${s.btn} ${s.btnIcon}`}
                  aria-label={`Xoá mục ${r.label}`}
                  disabled={r.kind === 'services'}
                  title={r.kind === 'services' ? 'Mục Dịch vụ chỉ ẩn được, không xoá' : undefined}
                  onClick={() => {
                    setRows((rs) => rs.filter((_, j) => j !== i));
                    setNotice(null);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>

        {rows.length < MENU_MAX_ITEMS ? (
          <section className={s.card} aria-labelledby="menu-add">
            <h2 id="menu-add" className={`${s.h2} ${s.h2Sm}`}>
              Thêm mục
            </h2>
            <form className={s.fieldRow} style={{ alignItems: 'flex-end' }} onSubmit={add}>
              <label className={s.label}>
                <span className={s.labelText}>Tên mục</span>
                <input className={`${s.input} ${s.inputSm}`} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={MENU_LABEL_MAX} placeholder="vd Sản phẩm" />
              </label>
              <label className={s.label}>
                <span className={s.labelText}>Đường dẫn</span>
                <input className={`${s.input} ${s.inputSm}`} value={newHref} onChange={(e) => setNewHref(e.target.value)} placeholder="vd /san-pham" />
              </label>
              <button type="submit" className={`${s.btn} ${s.btnDashed}`} style={{ flex: 'none' }} disabled={!newLabel.trim() || !isMenuHref(newHref.trim())}>
                + Thêm vào menu
              </button>
            </form>
            <p className={s.sub}>Gợi ý: /san-pham (Linh kiện), /chinh-sach-bao-hanh, /dich-vu/sua-bep-tu, /kien-thuc/hang/bosch.</p>
          </section>
        ) : null}
      </div>
    </>
  );
}
