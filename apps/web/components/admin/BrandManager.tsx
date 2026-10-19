'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, useTransition } from 'react';
import { BOOKING_DEVICES, type AdminBrand, type AdminBrandInput } from '@kitfix/types';
import { slugifyVi } from '@kitfix/ui';
import { saveBrands, type BrandChange } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';
import { uploadImage } from './upload';
import { AdminIcon } from './AdminIcon';
import { move, useSortable } from './useSortable';

/** Thiết bị hãng (AdminThuongHieu): 6 thiết bị đầu của form đặt lịch. */
const DEVICES = BOOKING_DEVICES.slice(0, 6).map((d) => d.value);

interface Row {
  key: string;
  id: number | null;
  name: string;
  slug: string;
  logoUrl: string | null;
  logoStyle: 'gray' | 'color';
  description: string;
  devices: string[];
  showHome: boolean;
  seoTitle: string;
  seoDesc: string;
  postCount: number;
}

const toRow = (b: AdminBrand): Row => ({
  key: String(b.id),
  id: b.id,
  name: b.name,
  slug: b.slug,
  logoUrl: b.logoUrl,
  logoStyle: b.logoStyle,
  description: b.description ?? '',
  devices: b.devices,
  showHome: b.showHome,
  seoTitle: b.seoTitle ?? '',
  seoDesc: b.seoDesc ?? '',
  postCount: b.postCount,
});

const payload = (r: Row): AdminBrandInput => ({
  name: r.name.trim(),
  slug: r.slug,
  logoUrl: r.logoUrl,
  logoStyle: r.logoStyle,
  description: r.description.trim() || null,
  devices: r.devices,
  showHome: r.showHome,
  seoTitle: r.seoTitle.trim() || null,
  seoDesc: r.seoDesc.trim() || null,
});

const sig = (r: Row) => JSON.stringify(payload(r));

export function BrandManager({ initial }: { initial: AdminBrand[] }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  const [base, setBase] = useState(() => ({ sigs: new Map(initial.map((b) => [String(b.id), sig(toRow(b))])), order: initial.map((b) => String(b.id)).join() }));
  const [sel, setSel] = useState(0);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dropOver, setDropOver] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cur = rows[sel] ?? null;

  const changed = useMemo(() => rows.filter((r) => r.id === null || base.sigs.get(r.key) !== sig(r)), [rows, base]);
  const orderChanged = rows.map((r) => r.key).join() !== base.order;
  const dirty = changed.length > 0 || orderChanged;
  const shown = rows.filter((r) => r.showHome);

  const patchAt = (i: number, v: Partial<Row>) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...v } : r)));
    setNotice(null);
  };
  const patch = (v: Partial<Row>) => patchAt(sel, v);

  const sortable = useSortable((from, to) => {
    setRows((rs) => move(rs, from, to));
    setSel((cs) => (cs === from ? to : from < cs && to >= cs ? cs - 1 : from > cs && to <= cs ? cs + 1 : cs));
    setNotice(null);
  });

  const addBrand = () => {
    const key = `moi-${Date.now()}`;
    setRows((rs) => [...rs, { key, id: null, name: 'Hãng mới', slug: 'hang-moi', logoUrl: null, logoStyle: 'gray', description: '', devices: [], showHome: false, seoTitle: '', seoDesc: '', postCount: 0 }]);
    setSel(rows.length);
    setNotice(null);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    const r = await uploadImage(file, 'brands');
    setUploading(false);
    if (!r.ok) return setNotice({ ok: false, text: r.error });
    patch({ logoUrl: r.data.url });
  };

  const save = () => {
    const bad = rows.find((r) => !r.name.trim() || !r.slug);
    if (bad) return setNotice({ ok: false, text: 'Mỗi hãng cần tên và đường dẫn.' });
    const dupe = rows.find((r, i) => rows.findIndex((x) => x.slug === r.slug) !== i);
    if (dupe) return setNotice({ ok: false, text: `Đường dẫn "${dupe.slug}" bị trùng.` });
    const changes: BrandChange[] = changed.map((r) => ({ key: r.key, id: r.id, data: payload(r) }));
    const order = orderChanged || changes.some((c) => c.id === null) ? rows.map((r) => r.key) : null;
    start(async () => {
      const res = await saveBrands(changes, order);
      if (!res.ok) return setNotice({ ok: false, text: res.errors ? Object.values(res.errors).join(' ') : res.error });
      const next = rows.map((r) => (r.id === null && res.data[r.key] ? { ...r, id: res.data[r.key], key: String(res.data[r.key]) } : r));
      setRows(next);
      setBase({ sigs: new Map(next.map((r) => [r.key, sig(r)])), order: next.map((r) => r.key).join() });
      setNotice({ ok: true, text: 'Đã lưu thay đổi' });
    });
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Thương hiệu</h1>
          <p className={s.sub}>Logo hiện ở dải hãng trang chủ. Bấm logo sẽ mở trang Kiến thức của hãng đó.</p>
        </div>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          <button type="button" className={s.btn} onClick={addBrand}>
            + Thêm hãng
          </button>
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={save} disabled={pending || !dirty}>
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.contentWide}`}>
        <section aria-label="Xem trước dải hãng" className={s.card} style={{ padding: '16px 20px', gap: 10 }}>
          <div className={s.kpiLabel} style={{ fontSize: 12 }}>
            Xem trước dải hãng trên trang chủ ({shown.length} hãng đang hiện)
          </div>
          <div className={s.stripPreview}>
            {shown.map((b) => (
              <div key={b.key} className={s.stripCell}>
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo do admin tải lên
                  <img src={b.logoUrl} alt={b.name} className={b.logoStyle === 'gray' ? s.logoGray : undefined} />
                ) : (
                  b.name
                )}
              </div>
            ))}
            {shown.length === 0 ? <span className={s.muted}>Chưa bật hãng nào ở trang chủ.</span> : null}
          </div>
        </section>

        <div className={s.cols}>
          <section aria-label="Danh sách hãng" style={{ flex: '1 1 380px', minWidth: 0 }}>
            <ul className={s.sortList}>
              <li className={s.sortHead}>
                <span>{rows.length} hãng · kéo để sắp xếp</span>
                <span>Trang chủ</span>
              </li>
              <li className="visually-hidden" id="brand-sort-help">
                Giữ Alt và bấm mũi tên lên/xuống để đổi thứ tự.
              </li>
              {rows.map((b, i) => {
                const on = i === sel;
                return (
                  <li
                    key={b.key}
                    className={`${s.sortItem} ${on ? s.sortItemOn : ''} ${sortable.dragging === i ? s.sortItemDrag : ''} ${sortable.over === i ? s.sortItemOver : ''}`}
                    {...sortable.itemProps(i)}
                  >
                    <span className={s.grip} aria-hidden="true">
                      <AdminIcon name="grip" size={16} strokeWidth={2} />
                    </span>
                    <button
                      type="button"
                      className={s.sortPick}
                      onClick={() => setSel(i)}
                      aria-current={on ? 'true' : undefined}
                      aria-describedby="brand-sort-help"
                      {...sortable.keyProps(i, rows.length)}
                    >
                      <span className={`${s.logoThumb} ${b.logoUrl ? s.logoThumbHas : ''}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {b.logoUrl ? <img src={b.logoUrl} alt="" /> : 'Chưa có'}
                      </span>
                      <span className={s.sortPickText}>
                        <span>{b.name || '(chưa đặt tên)'}</span>
                        <span className={s.sortMeta}>
                          {b.postCount} bài viết · /kien-thuc/hang/{b.slug}
                        </span>
                      </span>
                    </button>
                    <label className={s.check} style={{ paddingRight: 12 }}>
                      <span className="visually-hidden">Hiện {b.name} ở trang chủ</span>
                      <input type="checkbox" checked={b.showHome} onChange={(e) => patchAt(i, { showHome: e.target.checked })} />
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          {cur ? (
            <section aria-labelledby="brand-setup" className={s.card} style={{ flex: '2 1 480px', gap: 18 }}>
              <div className={s.rowBetween}>
                <h2 id="brand-setup" className={s.h2} style={{ fontSize: 20, lineHeight: '28px', fontWeight: 700 }}>
                  Thiết lập: {cur.name || '(chưa đặt tên)'}
                </h2>
                {cur.id !== null ? (
                  <a href={`/kien-thuc/hang/${cur.slug}`} target="_blank" rel="noopener" className={s.linkStrong}>
                    Xem trang Kiến thức {cur.name} →
                  </a>
                ) : null}
              </div>

              <div className={s.fieldRow} style={{ alignItems: 'stretch' }}>
                <div
                  className={`${s.drop} ${dropOver ? s.dropOver : ''}`}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('Files')) {
                      e.preventDefault();
                      setDropOver(true);
                    }
                  }}
                  onDragLeave={() => setDropOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) void uploadLogo(f);
                  }}
                >
                  {cur.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cur.logoUrl} alt={`Logo ${cur.name}`} className={s.dropLogo} />
                  ) : (
                    <span className={s.muted}>
                      <AdminIcon name="upload" size={32} strokeWidth={1.5} />
                    </span>
                  )}
                  <span className={s.strong}>{uploading ? 'Đang tải lên…' : cur.logoUrl ? `Đã có logo ${cur.name}` : 'Chưa có logo — đang hiện tên bằng chữ'}</span>
                  <span className={s.small} style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                    PNG hoặc SVG nền trong suốt, cao tối thiểu 80px. Dùng file logo chính thức của hãng.
                  </span>
                  <div className={s.chips} style={{ justifyContent: 'center' }}>
                    <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => fileInput.current?.click()} disabled={uploading}>
                      {cur.logoUrl ? 'Thay logo' : 'Tải logo lên'}
                    </button>
                    {cur.logoUrl ? (
                      <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => patch({ logoUrl: null })}>
                        Gỡ logo
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/svg+xml"
                    className="visually-hidden"
                    tabIndex={-1}
                    aria-label={`Chọn file logo ${cur.name}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) void uploadLogo(f);
                    }}
                  />
                </div>
                <fieldset className={s.fieldset}>
                  <legend className={s.kpiLabel} style={{ fontSize: 12, padding: 0, marginBottom: 8 }}>
                    Cách hiển thị trên trang chủ
                  </legend>
                  <label className={`${s.check} ${s.checkPlain}`}>
                    <input type="radio" name="logo-style" checked={cur.logoStyle === 'gray'} onChange={() => patch({ logoStyle: 'gray' })} />
                    Xám, hiện màu khi rê chuột
                  </label>
                  <label className={`${s.check} ${s.checkPlain}`}>
                    <input type="radio" name="logo-style" checked={cur.logoStyle === 'color'} onChange={() => patch({ logoStyle: 'color' })} />
                    Màu gốc của logo
                  </label>
                  <label className={`${s.check} ${s.checkPlain}`}>
                    <input type="checkbox" checked={cur.showHome} onChange={(e) => patch({ showHome: e.target.checked })} />
                    Hiện ở dải hãng trang chủ
                  </label>
                </fieldset>
              </div>

              <div className={s.fieldRow}>
                <label className={s.label}>
                  <span className={s.labelText}>Tên hãng</span>
                  <input
                    className={s.input}
                    value={cur.name}
                    maxLength={80}
                    onChange={(e) => patch({ name: e.target.value, ...(cur.id === null ? { slug: slugifyVi(e.target.value) } : {}) })}
                  />
                </label>
                <div className={s.label}>
                  <label className={s.labelText} htmlFor="brand-slug">
                    Đường dẫn trang hãng
                  </label>
                  <div className={s.affix}>
                    <span className={s.affixText}>/kien-thuc/hang/</span>
                    <input id="brand-slug" value={cur.slug} readOnly aria-describedby="brand-slug-note" />
                  </div>
                  <span id="brand-slug-note" className={s.sub}>
                    {cur.id === null ? 'Tự tạo từ tên hãng.' : 'Giữ cố định để không hỏng link đã chia sẻ.'}
                  </span>
                </div>
              </div>

              <label className={s.label}>
                <span className={s.labelText}>Mô tả đầu trang Kiến thức của hãng</span>
                <textarea className={s.textarea} rows={3} value={cur.description} onChange={(e) => patch({ description: e.target.value })} maxLength={2000} />
              </label>

              <fieldset className={s.fieldset}>
                <legend className={s.legend}>Thiết bị của hãng chúng tôi sửa</legend>
                <div className={s.chips}>
                  {DEVICES.map((d) => {
                    const on = cur.devices.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        className={s.chip}
                        aria-pressed={on}
                        onClick={() => patch({ devices: on ? cur.devices.filter((x) => x !== d) : [...cur.devices, d] })}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className={s.stack} style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div className={s.labelText}>SEO trang hãng</div>
                <label className={s.label} style={{ gap: 6 }}>
                  <span className={s.sub} style={{ fontSize: 13 }}>
                    Tiêu đề SEO
                  </span>
                  <input
                    className={`${s.input} ${s.inputSm}`}
                    value={cur.seoTitle}
                    onChange={(e) => patch({ seoTitle: e.target.value })}
                    placeholder={`Kiến thức thiết bị ${cur.name}: mã lỗi, mẹo dùng, sửa chữa`}
                    maxLength={160}
                  />
                </label>
                <label className={s.label} style={{ gap: 6 }}>
                  <span className={s.sub} style={{ fontSize: 13 }}>
                    Mô tả SEO
                  </span>
                  <textarea
                    className={s.textarea}
                    rows={2}
                    value={cur.seoDesc}
                    onChange={(e) => patch({ seoDesc: e.target.value })}
                    placeholder="Để trống sẽ dùng mô tả đầu trang"
                    maxLength={320}
                  />
                </label>
                <p className={s.sub}>
                  Điểm SEO chi tiết của từng bài vẫn chấm trong màn{' '}
                  <Link href="/admin/bai-viet" style={{ fontWeight: 700 }}>
                    Viết bài
                  </Link>
                  . Bài được gắn hãng {cur.name} sẽ tự xuất hiện ở trang hãng.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
