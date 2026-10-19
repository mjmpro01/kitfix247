'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import type { AdminProduct, AdminProductInput } from '@kitfix/types';
import { ICONS } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { deleteProduct, saveProduct } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';
import { uploadImage } from './upload';
import { parsePrice, showPrice } from './price';

interface Draft {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  icon: string;
  status: 'active' | 'hidden';
  imageUrl: string | null;
}

const blank: Draft = { name: '', sku: '', category: '', description: '', price: '', stock: '0', icon: 'wrench', status: 'active', imageUrl: null };

const toDraft = (p: AdminProduct): Draft => ({
  name: p.name,
  sku: p.sku,
  category: p.category,
  description: p.description ?? '',
  price: showPrice(p.price),
  stock: String(p.stock),
  icon: p.icon,
  status: p.status,
  imageUrl: p.imageUrl,
});

export function ProductManager({ initial }: { initial: AdminProduct[] }) {
  const [list, setList] = useState(initial);
  /** id đang sửa; null = thêm mới. */
  const [selId, setSelId] = useState<number | null>(initial[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft>(initial[0] ? toDraft(initial[0]) : blank);
  const [baseline, setBaseline] = useState(JSON.stringify(draft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(draft) !== baseline;
  const current = list.find((p) => p.id === selId) ?? null;
  const categories = useMemo(() => [...new Set(list.map((p) => p.category))], [list]);

  const open = (p: AdminProduct | null) => {
    if (dirty && !confirm('Sản phẩm đang sửa có thay đổi chưa lưu. Bỏ thay đổi?')) return;
    const d = p ? toDraft(p) : blank;
    setSelId(p?.id ?? null);
    setDraft(d);
    setBaseline(JSON.stringify(d));
    setErrors({});
    setNotice(null);
  };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setNotice(null);
  };

  const save = () => {
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = 'Nhập tên sản phẩm.';
    if (!draft.sku.trim()) errs.sku = 'Nhập mã SKU.';
    if (!draft.category.trim()) errs.category = 'Nhập nhóm sản phẩm.';
    const price = draft.price.trim() ? parsePrice(draft.price) : null;
    if (draft.price.trim() && (price === null || price < 1000)) errs.price = 'Giá là số ₫ (tối thiểu 1.000), hoặc để trống.';
    const stock = Number(draft.stock || 0);
    if (!Number.isInteger(stock) || stock < 0) errs.stock = 'Tồn kho là số nguyên ≥ 0.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const data: AdminProductInput = {
      name: draft.name,
      sku: draft.sku,
      category: draft.category,
      description: draft.description.trim() || null,
      price,
      stock,
      icon: draft.icon,
      status: draft.status,
      imageUrl: draft.imageUrl,
    };
    start(async () => {
      const r = await saveProduct(selId, data);
      if (!r.ok) {
        setErrors(r.errors ?? {});
        return setNotice({ ok: false, text: r.error });
      }
      setList((l) => (selId ? l.map((p) => (p.id === r.data.id ? r.data : p)) : [r.data, ...l]));
      const d = toDraft(r.data);
      setSelId(r.data.id);
      setDraft(d);
      setBaseline(JSON.stringify(d));
      setNotice({ ok: true, text: r.message ?? 'Đã lưu' });
    });
  };

  const remove = () => {
    if (!current) return;
    if (current.orderCount > 0) {
      setNotice({ ok: false, text: 'Sản phẩm đã có trong đơn hàng — chuyển sang "Ẩn" thay vì xoá để giữ lịch sử đơn.' });
      return;
    }
    if (!confirm(`Xoá sản phẩm "${current.name}"? Không hoàn tác được.`)) return;
    start(async () => {
      const r = await deleteProduct(current.id);
      if (!r.ok) return setNotice({ ok: false, text: r.error });
      const rest = list.filter((p) => p.id !== current.id);
      setList(rest);
      const d = rest[0] ? toDraft(rest[0]) : blank;
      setSelId(rest[0]?.id ?? null);
      setDraft(d);
      setBaseline(JSON.stringify(d));
      setNotice({ ok: true, text: 'Đã xoá sản phẩm' });
    });
  };

  const upload = async (file: File) => {
    setUploading(true);
    const r = await uploadImage(file, 'products');
    setUploading(false);
    if (!r.ok) return setNotice({ ok: false, text: r.error });
    set('imageUrl', r.data.url);
  };

  const fieldErr = (k: string) =>
    errors[k] ? (
      <span id={`p-err-${k}`} className={s.fieldError}>
        {errors[k]}
      </span>
    ) : null;
  const errProps = (k: string) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `p-err-${k}` } : {});

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Sản phẩm (Shop)</h1>
          <p className={s.sub}>Sản phẩm chưa có giá vẫn bán được — khách thấy “Giá: liên hệ”, nhân viên báo giá khi gọi xác nhận đơn.</p>
        </div>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          <button type="button" className={s.btn} onClick={() => open(null)}>
            + Thêm sản phẩm
          </button>
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={save} disabled={pending || !dirty}>
            {pending ? 'Đang lưu…' : selId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.contentWide}`}>
        <div className={s.cols}>
          <nav aria-label="Danh sách sản phẩm" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <ul className={s.sortList}>
              <li className={s.sortHead}>
                <span>{list.length} sản phẩm</span>
                <span>Giá</span>
              </li>
              {list.map((p) => {
                const on = p.id === selId;
                return (
                  <li key={p.id} className={`${s.sortItem} ${on ? s.sortItemOn : ''}`}>
                    <button type="button" className={s.sortPick} onClick={() => open(p)} aria-current={on ? 'true' : undefined}>
                      <span className={`${s.logoThumb} ${p.imageUrl ? s.logoThumbHas : ''}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <Icon name={p.icon} size={20} strokeWidth={1.5} />}
                      </span>
                      <span className={s.sortPickText}>
                        <span>{p.name}</span>
                        <span className={s.sortMeta}>
                          {p.sku} · {p.category}
                          {p.status === 'hidden' ? ' · Đang ẩn' : ''}
                        </span>
                      </span>
                      <span className={`${s.vis} ${p.price !== null ? s.good : s.muted}`}>{p.price !== null ? showPrice(p.price) : 'Liên hệ'}</span>
                    </button>
                  </li>
                );
              })}
              {list.length === 0 ? <li className={s.empty}>Chưa có sản phẩm.</li> : null}
            </ul>
          </nav>

          <section className={s.card} style={{ flex: '2 1 480px' }} aria-labelledby="p-form">
            <h2 id="p-form" className={s.h2}>
              {selId ? `Sửa: ${current?.name ?? ''}` : 'Thêm sản phẩm mới'}
            </h2>
            <div className={s.fieldRow}>
              <label className={s.label} style={{ flex: '2 1 280px' }}>
                <span className={s.labelText}>Tên sản phẩm</span>
                <input className={s.input} value={draft.name} onChange={(e) => set('name', e.target.value)} maxLength={200} {...errProps('name')} />
                {fieldErr('name')}
              </label>
              <label className={s.label}>
                <span className={s.labelText}>Mã SKU</span>
                <input className={s.input} value={draft.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} maxLength={64} placeholder="vd DC-TUAVIT-01" {...errProps('sku')} />
                {fieldErr('sku')}
              </label>
            </div>
            <div className={s.fieldRow}>
              <label className={s.label}>
                <span className={s.labelText}>Nhóm</span>
                <input className={s.input} value={draft.category} onChange={(e) => set('category', e.target.value)} list="p-cats" maxLength={80} {...errProps('category')} />
                <datalist id="p-cats">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {fieldErr('category')}
              </label>
              <label className={s.label}>
                <span className={s.labelText}>
                  Giá (₫) <span className={s.labelHint}>trống = liên hệ</span>
                </span>
                <input className={`${s.input} ${s.priceIn}`} inputMode="numeric" value={draft.price} onChange={(e) => set('price', e.target.value)} placeholder="vd 120.000" {...errProps('price')} />
                {fieldErr('price')}
              </label>
              <label className={s.label}>
                <span className={s.labelText}>Tồn kho</span>
                <input className={s.input} inputMode="numeric" value={draft.stock} onChange={(e) => set('stock', e.target.value.replace(/[^\d]/g, ''))} {...errProps('stock')} />
                {fieldErr('stock')}
              </label>
            </div>
            <label className={s.label}>
              <span className={s.labelText}>Mô tả ngắn</span>
              <textarea className={s.textarea} rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} />
            </label>
            <div className={s.fieldRow} style={{ alignItems: 'flex-start' }}>
              <div className={s.stack}>
                <span className={s.labelText}>Ảnh sản phẩm</span>
                <div className={s.cover} style={{ background: 'var(--surface-sunken)', color: 'var(--line-strong)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {draft.imageUrl ? <img src={draft.imageUrl} alt="" /> : <Icon name={draft.icon} size={40} strokeWidth={1.5} />}
                </div>
                <div className={s.chips}>
                  <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => fileInput.current?.click()} disabled={uploading}>
                    {uploading ? 'Đang tải…' : draft.imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                  </button>
                  {draft.imageUrl ? (
                    <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => set('imageUrl', null)}>
                      Gỡ ảnh
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="visually-hidden"
                  tabIndex={-1}
                  aria-label="Chọn ảnh sản phẩm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void upload(f);
                  }}
                />
              </div>
              <div className={s.stack}>
                <label className={s.label}>
                  <span className={s.labelText}>Icon khi chưa có ảnh</span>
                  <select className={s.select} value={draft.icon} onChange={(e) => set('icon', e.target.value)}>
                    {Object.keys(ICONS).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className={s.fieldset}>
                  <legend className={s.legend}>Trạng thái</legend>
                  <label className={`${s.check} ${s.checkPlain}`}>
                    <input type="radio" name="p-status" checked={draft.status === 'active'} onChange={() => set('status', 'active')} />
                    Đang bán
                  </label>
                  <label className={`${s.check} ${s.checkPlain}`}>
                    <input type="radio" name="p-status" checked={draft.status === 'hidden'} onChange={() => set('status', 'hidden')} />
                    Ẩn khỏi website
                  </label>
                </fieldset>
              </div>
            </div>
            {current ? (
              <div className={s.rowBetween}>
                <span className={s.sub}>{current.orderCount ? `Có trong ${current.orderCount} đơn hàng.` : 'Chưa có trong đơn hàng nào.'}</span>
                <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={remove} disabled={pending}>
                  Xoá sản phẩm
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
