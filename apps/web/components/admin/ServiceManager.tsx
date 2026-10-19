'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { BOOKING_DEVICES, type AdminPriceGroup, type AdminService } from '@kitfix/types';
import { PRICE_NOTE } from '@kitfix/ui';
import { createPriceGroup, createService, deleteService, reorder, saveService } from '@/app/admin/actions';
import { Icon } from '@/components/Icon';
import s from '@/app/admin/admin.module.css';
import { uploadImage } from './upload';
import { AdminIcon } from './AdminIcon';
import { parsePrice, showPrice } from './price';
import { move, useSortable } from './useSortable';

interface PriceRow {
  id?: number;
  from: string;
  to: string;
}
interface FaultDraft extends PriceRow {
  title: string;
  code: string;
  cause: string;
}
interface ItemDraft extends PriceRow {
  name: string;
  duration: string;
}
interface FaqDraft {
  id?: number;
  question: string;
  answer: string;
}
interface Draft {
  name: string;
  lead: string;
  cardText: string;
  shortHint: string;
  showHome: boolean;
  seoTitle: string;
  seoDesc: string;
  imageUrl: string | null;
  imageAlt: string;
  faults: FaultDraft[];
  faqs: FaqDraft[];
  items: ItemDraft[];
  /** id nhóm giá, hoặc "new" = tạo nhóm mới theo tên dịch vụ khi lưu. */
  group: string;
}

function toDraft(sv: AdminService): Draft {
  return {
    name: sv.name,
    lead: sv.lead,
    cardText: sv.cardText,
    shortHint: sv.shortHint,
    showHome: sv.showHome,
    seoTitle: sv.seoTitle ?? '',
    seoDesc: sv.seoDesc ?? '',
    imageUrl: sv.imageUrl,
    imageAlt: sv.imageAlt ?? '',
    faults: sv.faults.map((f) => ({ id: f.id, title: f.title, code: f.code, cause: f.cause, from: showPrice(f.priceFrom), to: showPrice(f.priceTo) })),
    faqs: sv.faqs.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
    items: sv.priceItems.map((p) => ({ id: p.id, name: p.name, duration: p.duration, from: showPrice(p.priceFrom), to: showPrice(p.priceTo) })),
    group: sv.priceItems[0] ? String(sv.priceItems[0].groupId) : '',
  };
}

/** Kiểm tra khoảng giá từng dòng trước khi gửi; trả danh sách lỗi dễ đọc. */
function priceErrors(rows: PriceRow[], label: (i: number) => string): string[] {
  const out: string[] = [];
  rows.forEach((r, i) => {
    const from = parsePrice(r.from);
    const to = parsePrice(r.to);
    if (from === null || to === null) out.push(`${label(i)}: nhập đủ giá từ và giá đến.`);
    else if (from > to) out.push(`${label(i)}: giá đến phải lớn hơn hoặc bằng giá từ.`);
  });
  return out;
}

export function ServiceManager({ initial, groups: initialGroups }: { initial: AdminService[]; groups: AdminPriceGroup[] }) {
  const [list, setList] = useState(initial);
  const [groups, setGroups] = useState(initialGroups);
  const [selId, setSelId] = useState<number | null>(initial[0]?.id ?? null);
  const current = list.find((x) => x.id === selId) ?? null;
  const [draft, setDraft] = useState<Draft | null>(current ? toDraft(current) : null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDevice, setNewDevice] = useState<string>(BOOKING_DEVICES[0].value);
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== baseline, [draft, baseline]);

  const select = (sv: AdminService) => {
    if (sv.id === selId) return;
    if (dirty && !confirm('Dịch vụ đang sửa có thay đổi chưa lưu. Bỏ thay đổi?')) return;
    const d = toDraft(sv);
    setSelId(sv.id);
    setDraft(d);
    setBaseline(JSON.stringify(d));
    setErrors([]);
    setNotice(null);
  };

  const sortable = useSortable((from, to) => {
    const next = move(list, from, to);
    setList(next);
    start(async () => {
      const r = await reorder('services', next.map((x) => x.id));
      setNotice(r.ok ? { ok: true, text: 'Đã lưu thứ tự' } : { ok: false, text: r.error });
    });
  });

  const patch = (fn: (d: Draft) => Draft) => {
    setDraft((d) => (d ? fn(d) : d));
    setNotice(null);
  };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => patch((d) => ({ ...d, [k]: v }));
  const setRow = <K extends 'faults' | 'faqs' | 'items'>(k: K, i: number, v: Partial<Draft[K][number]>) =>
    patch((d) => ({ ...d, [k]: d[k].map((r, j) => (j === i ? { ...r, ...v } : r)) }));
  const removeRow = (k: 'faults' | 'faqs' | 'items', i: number) => patch((d) => ({ ...d, [k]: d[k].filter((_, j) => j !== i) }));

  const pickImage = async (file: File) => {
    setUploading(true);
    const r = await uploadImage(file, 'services');
    setUploading(false);
    if (!r.ok) return setNotice({ ok: false, text: r.error });
    patch((d) => ({ ...d, imageUrl: r.data.url, imageAlt: d.imageAlt || d.name }));
  };

  const save = () => {
    if (!draft || !current) return;
    const errs = [
      ...(draft.name.trim() ? [] : ['Tên dịch vụ là bắt buộc.']),
      ...draft.faults.flatMap((f, i) => (f.title.trim() ? [] : [`Lỗi số ${i + 1}: nhập tên lỗi.`])),
      ...priceErrors(draft.faults, (i) => `Lỗi số ${i + 1}`),
      ...draft.faqs.flatMap((q, i) => (q.question.trim() && q.answer.trim() ? [] : [`Câu hỏi số ${i + 1}: nhập đủ câu hỏi và trả lời.`])),
      ...draft.items.flatMap((p, i) => (p.name.trim() ? [] : [`Hạng mục giá số ${i + 1}: nhập tên hạng mục.`])),
      ...priceErrors(draft.items, (i) => `Hạng mục giá số ${i + 1}`),
      ...(draft.items.length && !draft.group ? ['Chọn nhóm bảng giá cho các hạng mục.'] : []),
    ];
    setErrors(errs);
    if (errs.length) return;

    start(async () => {
      let groupId = Number(draft.group) || 0;
      if (draft.items.length && draft.group === 'new') {
        const g = await createPriceGroup(draft.name.trim());
        if (!g.ok) return setNotice({ ok: false, text: g.error });
        setGroups((gs) => [...gs, g.data]);
        groupId = g.data.id;
      }
      const r = await saveService(current.id, {
        fields: {
          name: draft.name,
          lead: draft.lead,
          cardText: draft.cardText,
          shortHint: draft.shortHint,
          showHome: draft.showHome,
          seoTitle: draft.seoTitle.trim() || null,
          seoDesc: draft.seoDesc.trim() || null,
          imageUrl: draft.imageUrl,
          imageAlt: draft.imageUrl ? draft.imageAlt.trim() || draft.name.trim() : null,
        },
        faults: draft.faults.map((f) => ({ id: f.id, title: f.title, code: f.code, cause: f.cause, priceFrom: parsePrice(f.from)!, priceTo: parsePrice(f.to)! })),
        faqs: draft.faqs.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
        items: draft.items.map((p) => ({ id: p.id, groupId, name: p.name, duration: p.duration, priceFrom: parsePrice(p.from)!, priceTo: parsePrice(p.to)! })),
      });
      if (!r.ok) {
        setErrors(r.errors ? Object.values(r.errors) : []);
        return setNotice({ ok: false, text: r.error });
      }
      setList((l) => l.map((x) => (x.id === r.data.id ? r.data : x)));
      const d = toDraft(r.data);
      setDraft(d);
      setBaseline(JSON.stringify(d));
      setNotice({ ok: true, text: 'Đã lưu thay đổi — trang dịch vụ đã cập nhật' });
    });
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    start(async () => {
      const r = await createService(newName.trim(), newDevice);
      if (!r.ok) return setNotice({ ok: false, text: r.errors ? Object.values(r.errors).join(' ') : r.error });
      setList((l) => [...l, r.data]);
      const d = toDraft(r.data);
      setSelId(r.data.id);
      setDraft(d);
      setBaseline(JSON.stringify(d));
      setAdding(false);
      setNewName('');
      setNotice({ ok: true, text: r.message ?? 'Đã thêm dịch vụ' });
    });
  };

  const remove = () => {
    if (!current || !confirm(`Xoá dịch vụ "${current.name}" cùng lỗi thường gặp và FAQ của nó? Không hoàn tác được.`)) return;
    start(async () => {
      const r = await deleteService(current.id);
      if (!r.ok) return setNotice({ ok: false, text: r.error });
      const rest = list.filter((x) => x.id !== current.id);
      setList(rest);
      const first = rest[0] ?? null;
      const d = first ? toDraft(first) : null;
      setSelId(first?.id ?? null);
      setDraft(d);
      setBaseline(JSON.stringify(d));
      setNotice({ ok: true, text: 'Đã xoá dịch vụ' });
    });
  };

  return (
    <>
      <div className={s.pageHead}>
        <h1>Dịch vụ & bảng giá</h1>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          {current ? (
            <a className={s.btn} href={`/dich-vu/${current.slug}`} target="_blank" rel="noopener">
              Xem trang
            </a>
          ) : null}
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={save} disabled={!draft || pending || !dirty}>
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.contentWide}`}>
        <div className={s.cols}>
          <nav aria-label="Danh sách dịch vụ" className={s.colSide}>
            <ul className={s.sortList}>
              <li className={s.sortHead}>
                <span>{list.length} dịch vụ · kéo để sắp xếp</span>
              </li>
              <li className="visually-hidden" id="sort-help">
                Giữ Alt và bấm mũi tên lên/xuống để đổi thứ tự.
              </li>
              {list.map((sv, i) => {
                const on = sv.id === selId;
                return (
                  <li
                    key={sv.id}
                    className={`${s.sortItem} ${on ? s.sortItemOn : ''} ${sortable.dragging === i ? s.sortItemDrag : ''} ${sortable.over === i ? s.sortItemOver : ''}`}
                    {...sortable.itemProps(i)}
                  >
                    <span className={s.grip} aria-hidden="true">
                      <AdminIcon name="grip" size={16} strokeWidth={2} />
                    </span>
                    <button
                      type="button"
                      className={s.sortPick}
                      onClick={() => select(sv)}
                      aria-current={on ? 'true' : undefined}
                      aria-describedby="sort-help"
                      {...sortable.keyProps(i, list.length)}
                    >
                      <span className={s.sortPickText}>{sv.name}</span>
                      <span className={`${s.vis} ${sv.showHome ? s.good : s.muted}`}>{sv.showHome ? 'Đang hiện' : 'Ẩn'}</span>
                    </button>
                  </li>
                );
              })}
              <li style={{ padding: '8px 4px 4px' }}>
                {adding ? (
                  <form onSubmit={add} className={s.stack}>
                    <label className={s.label}>
                      <span className={s.labelText}>Tên dịch vụ mới</span>
                      <input className={`${s.input} ${s.inputSm}`} value={newName} onChange={(e) => setNewName(e.target.value)} required maxLength={160} autoFocus />
                    </label>
                    <label className={s.label}>
                      <span className={s.labelText}>Thiết bị</span>
                      <select className={`${s.select} ${s.inputSm}`} value={newDevice} onChange={(e) => setNewDevice(e.target.value)}>
                        {BOOKING_DEVICES.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className={s.chips}>
                      <button type="submit" className={`${s.btn} ${s.btnBrand}`} disabled={pending || !newName.trim()}>
                        Thêm
                      </button>
                      <button type="button" className={s.btn} onClick={() => setAdding(false)}>
                        Thôi
                      </button>
                    </div>
                  </form>
                ) : (
                  <button type="button" className={`${s.btn} ${s.btnDashed}`} style={{ width: '100%' }} onClick={() => setAdding(true)}>
                    + Thêm dịch vụ
                  </button>
                )}
              </li>
            </ul>
          </nav>

          {draft && current ? (
            <div className={s.colMain}>
              {errors.length ? (
                <div className={s.alert} role="alert">
                  Chưa lưu được:
                  <ul>
                    {errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <section className={s.card} aria-labelledby="sv-info">
                <div className={s.rowBetween}>
                  <h2 id="sv-info" className={s.h2}>
                    Thông tin trang dịch vụ
                  </h2>
                  <label className={s.check}>
                    <input type="checkbox" checked={draft.showHome} onChange={(e) => set('showHome', e.target.checked)} />
                    Hiện card ở trang chủ & menu
                  </label>
                </div>
                <div className={s.fieldRow}>
                  <label className={s.label}>
                    <span className={s.labelText}>Tên dịch vụ</span>
                    <input className={s.input} value={draft.name} onChange={(e) => set('name', e.target.value)} maxLength={160} required />
                  </label>
                  <label className={s.label}>
                    <span className={s.labelText}>Đường dẫn</span>
                    <input className={s.input} value={`/dich-vu/${current.slug}`} readOnly />
                  </label>
                </div>
                <label className={s.label}>
                  <span className={s.labelText}>Đoạn dẫn (Hero trang dịch vụ)</span>
                  <textarea className={s.textarea} rows={3} value={draft.lead} onChange={(e) => set('lead', e.target.value)} maxLength={2000} />
                </label>
                <div className={s.fieldRow} style={{ alignItems: 'flex-start' }}>
                  <div className={s.stack} style={{ flex: '0 1 240px' }}>
                    <span className={s.labelText}>Ảnh thẻ dịch vụ</span>
                    <div className={s.cover} style={{ width: '100%', aspectRatio: '4 / 3', height: 'auto', background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- xem trước ảnh admin tải lên */}
                      {draft.imageUrl ? <img src={draft.imageUrl} alt="" /> : <Icon name={current.icon} size={44} strokeWidth={1.25} />}
                    </div>
                    <div className={s.chips}>
                      <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => imageInput.current?.click()} disabled={uploading}>
                        {uploading ? 'Đang tải…' : draft.imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                      </button>
                      {draft.imageUrl ? (
                        <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => set('imageUrl', null)}>
                          Gỡ ảnh
                        </button>
                      ) : null}
                    </div>
                    <input
                      ref={imageInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="visually-hidden"
                      tabIndex={-1}
                      aria-label={`Chọn ảnh cho ${draft.name}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) void pickImage(f);
                      }}
                    />
                  </div>
                  <div className={s.stack} style={{ flex: '1 1 260px' }}>
                    <label className={s.label}>
                      <span className={s.labelText}>Mô tả ảnh (alt)</span>
                      <input
                        className={s.input}
                        value={draft.imageAlt}
                        onChange={(e) => set('imageAlt', e.target.value)}
                        placeholder={`vd Kỹ thuật viên ${draft.name.toLocaleLowerCase('vi')} tại nhà khách`}
                        maxLength={255}
                        disabled={!draft.imageUrl}
                      />
                    </label>
                    <p className={s.sub}>
                      Ảnh thật của kỹ thuật viên đang làm dịch vụ này, khổ ngang 4:3, rộng tối thiểu 800px, JPG/PNG/WebP dưới 2 MB. Hiện trên thẻ dịch vụ ở trang chủ và làm ảnh chia sẻ
                      khi gửi link trang dịch vụ. Chưa có ảnh thì thẻ hiện icon.
                    </p>
                  </div>
                </div>
                <div className={s.fieldRow}>
                  <label className={s.label}>
                    <span className={s.labelText}>Mô tả trên card trang chủ</span>
                    <input className={s.input} value={draft.cardText} onChange={(e) => set('cardText', e.target.value)} maxLength={255} />
                  </label>
                  <label className={s.label}>
                    <span className={s.labelText}>Gợi ý ngắn (menu)</span>
                    <input className={s.input} value={draft.shortHint} onChange={(e) => set('shortHint', e.target.value)} maxLength={160} />
                  </label>
                </div>
                <div className={s.fieldRow}>
                  <label className={s.label}>
                    <span className={s.labelText}>
                      Tiêu đề SEO <span className={s.labelHint}>{draft.seoTitle.length}/60</span>
                    </span>
                    <input
                      className={s.input}
                      value={draft.seoTitle}
                      onChange={(e) => set('seoTitle', e.target.value)}
                      placeholder={`${draft.name} tận nhà tại TP.HCM`}
                      maxLength={160}
                    />
                  </label>
                  <label className={s.label}>
                    <span className={s.labelText}>
                      Mô tả SEO <span className={s.labelHint}>{draft.seoDesc.length}/160</span>
                    </span>
                    <input className={s.input} value={draft.seoDesc} onChange={(e) => set('seoDesc', e.target.value)} placeholder="Để trống sẽ dùng đoạn dẫn" maxLength={320} />
                  </label>
                </div>
              </section>

              <section className={s.card} aria-labelledby="sv-faults">
                <div className={s.rowBetween}>
                  <h2 id="sv-faults" className={s.h2}>
                    Lỗi thường gặp (hiện trên card)
                  </h2>
                  <span className={s.sub}>Trang chủ hiện 3 lỗi đầu</span>
                </div>
                <div className={s.repeat}>
                  {draft.faults.map((f, i) => (
                    <div key={f.id ?? `n${i}`} className={s.repeatRow}>
                      <span className={s.repeatN}>{i + 1}</span>
                      <div className={s.repeatBody}>
                        <input className={`${s.input} ${s.inputSm}`} aria-label={`Lỗi số ${i + 1}`} value={f.title} onChange={(e) => setRow('faults', i, { title: e.target.value })} placeholder="Tên lỗi, vd: Không nhận nồi" maxLength={160} />
                        <input className={`${s.input} ${s.inputSm}`} aria-label={`Mã lỗi số ${i + 1}`} value={f.code} onChange={(e) => setRow('faults', i, { code: e.target.value })} placeholder="Mã, vd: E1" maxLength={40} />
                        <input className={`${s.input} ${s.inputSm} ${s.span2}`} aria-label={`Nguyên nhân lỗi số ${i + 1}`} value={f.cause} onChange={(e) => setRow('faults', i, { cause: e.target.value })} placeholder="Nguyên nhân thường gặp" maxLength={2000} />
                        <input className={`${s.input} ${s.inputSm} ${s.priceIn}`} inputMode="numeric" aria-label={`Giá từ (₫), lỗi số ${i + 1}`} value={f.from} onChange={(e) => setRow('faults', i, { from: e.target.value })} placeholder="Giá từ, vd 150.000" />
                        <input className={`${s.input} ${s.inputSm} ${s.priceIn}`} inputMode="numeric" aria-label={`Giá đến (₫), lỗi số ${i + 1}`} value={f.to} onChange={(e) => setRow('faults', i, { to: e.target.value })} placeholder="Giá đến" />
                      </div>
                      <button type="button" className={`${s.btn} ${s.btnIcon}`} onClick={() => removeRow('faults', i)} aria-label={`Xoá lỗi số ${i + 1}`}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((d) => ({ ...d, faults: [...d.faults, { title: '', code: '', cause: '', from: '', to: '' }] }))}>
                  + Thêm lỗi
                </button>
              </section>

              <section className={s.card} aria-labelledby="sv-faq">
                <h2 id="sv-faq" className={s.h2}>
                  Câu hỏi thường gặp (FAQ)
                </h2>
                <div className={s.repeat}>
                  {draft.faqs.map((q, i) => (
                    <div key={q.id ?? `n${i}`} className={s.repeatRow}>
                      <span className={s.repeatN}>{i + 1}</span>
                      <div className={s.stack} style={{ gap: 8 }}>
                        <input className={`${s.input} ${s.inputSm}`} aria-label={`Câu hỏi số ${i + 1}`} value={q.question} onChange={(e) => setRow('faqs', i, { question: e.target.value })} placeholder="Câu hỏi" maxLength={255} />
                        <textarea className={s.textarea} rows={2} aria-label={`Trả lời câu hỏi số ${i + 1}`} value={q.answer} onChange={(e) => setRow('faqs', i, { answer: e.target.value })} placeholder="Trả lời" maxLength={4000} />
                      </div>
                      <button type="button" className={`${s.btn} ${s.btnIcon}`} onClick={() => removeRow('faqs', i)} aria-label={`Xoá câu hỏi số ${i + 1}`}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((d) => ({ ...d, faqs: [...d.faqs, { question: '', answer: '' }] }))}>
                  + Thêm câu hỏi
                </button>
              </section>

              <section className={s.card} id="bang-gia" aria-labelledby="sv-price">
                <div className={s.rowBetween}>
                  <h2 id="sv-price" className={s.h2}>
                    Bảng giá tham khảo
                  </h2>
                  <label className={`${s.small} ${s.muted}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Nhóm bảng giá
                    <select className={`${s.select} ${s.inputSm}`} style={{ width: 'auto' }} value={draft.group} onChange={(e) => set('group', e.target.value)}>
                      <option value="">— Chọn nhóm —</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                      <option value="new">+ Nhóm mới: {draft.name}</option>
                    </select>
                  </label>
                </div>
                <div className={s.tableWrap}>
                  <table className={`${s.table} ${s.tableCompact}`} style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th scope="col">Hạng mục</th>
                        <th scope="col" style={{ width: 130 }}>
                          Thời gian
                        </th>
                        <th scope="col" style={{ width: 140 }}>
                          Giá từ (₫)
                        </th>
                        <th scope="col" style={{ width: 140 }}>
                          Giá đến (₫)
                        </th>
                        <th scope="col" style={{ width: 52 }}>
                          <span className="visually-hidden">Xoá</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.items.map((p, i) => (
                        <tr key={p.id ?? `n${i}`}>
                          <td>
                            <input className={`${s.input} ${s.inputSm}`} aria-label={`Hạng mục số ${i + 1}`} value={p.name} onChange={(e) => setRow('items', i, { name: e.target.value })} maxLength={160} />
                          </td>
                          <td>
                            <input className={`${s.input} ${s.inputSm}`} aria-label={`Thời gian hạng mục số ${i + 1}`} value={p.duration} onChange={(e) => setRow('items', i, { duration: e.target.value })} placeholder="vd 30–60 phút" maxLength={60} />
                          </td>
                          <td>
                            <input className={`${s.input} ${s.inputSm} ${s.priceIn}`} inputMode="numeric" aria-label={`Giá từ, hạng mục số ${i + 1}`} value={p.from} onChange={(e) => setRow('items', i, { from: e.target.value })} placeholder="vd 650.000" />
                          </td>
                          <td>
                            <input className={`${s.input} ${s.inputSm} ${s.priceIn}`} inputMode="numeric" aria-label={`Giá đến, hạng mục số ${i + 1}`} value={p.to} onChange={(e) => setRow('items', i, { to: e.target.value })} placeholder="vd 1.200.000" />
                          </td>
                          <td>
                            <button type="button" className={`${s.btn} ${s.btnIcon}`} onClick={() => removeRow('items', i)} aria-label={`Xoá hạng mục số ${i + 1}`}>
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={s.rowBetween}>
                  <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((d) => ({ ...d, items: [...d.items, { name: '', duration: '', from: '', to: '' }] }))}>
                    + Thêm hạng mục giá
                  </button>
                  <span className={s.sub}>Ghi chú tự động: “{PRICE_NOTE}”</span>
                </div>
              </section>

              <div>
                <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={remove} disabled={pending}>
                  Xoá dịch vụ này
                </button>
              </div>
            </div>
          ) : (
            <div className={s.colMain}>
              <p className={s.muted}>Chưa có dịch vụ. Bấm “+ Thêm dịch vụ” để tạo.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
