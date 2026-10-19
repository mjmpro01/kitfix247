'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import type { HeroSettings, ProcessStep, Settings } from '@kitfix/types';
import { ICONS } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { saveHome, uploadFile } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

type HomeSettings = Pick<Settings, 'hero' | 'features' | 'commitments' | 'promises' | 'rating' | 'tagline' | 'about'>;

interface Draft {
  hero: Required<HeroSettings>;
  tagline: string;
  about: string;
  features: { title: string; detail: string; icon: string }[];
  steps: { title: string; description: string }[];
  ratingScore: string;
  ratingLabel: string;
  commitments: { title: string; detail: string }[];
  promises: string[];
}

const ICON_NAMES = Object.keys(ICONS);

const toDraft = (h: HomeSettings, steps: ProcessStep[]): Draft => ({
  hero: { ...h.hero, layout: h.hero.layout ?? 'overlay' },
  tagline: h.tagline,
  about: h.about,
  features: h.features.map((f) => ({ ...f })),
  steps: steps.map((st) => ({ title: st.title, description: st.description })),
  ratingScore: String(h.rating.score).replace('.', ','),
  ratingLabel: h.rating.label,
  commitments: h.commitments.map((c) => ({ ...c })),
  promises: [...h.promises],
});

/** Ô chữ có đếm ký tự. */
function Field({ label, hint, value, max, onChange, rows }: { label: string; hint?: string; value: string; max: number; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className={s.label}>
      <span className={s.labelText}>
        {label}
        <span className={`${s.labelHint} ${value.length > max ? s.bad : ''}`}>
          {hint ? `${hint} · ` : ''}
          {value.length}/{max}
        </span>
      </span>
      {rows ? (
        <textarea className={s.textarea} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={s.input} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/** Nút thêm / xoá dòng trong một danh sách có giới hạn số mục. */
function RowRemove({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={`${s.btn} ${s.btnIcon}`} onClick={onClick} aria-label={label} disabled={disabled}>
      ×
    </button>
  );
}

export function HomeEditor({ settings, steps }: { settings: HomeSettings; steps: ProcessStep[] }) {
  const initial = useMemo(() => toDraft(settings, steps), [settings, steps]);
  const [d, setD] = useState<Draft>(initial);
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== baseline;

  const patch = (fn: (x: Draft) => Draft) => {
    setD(fn);
    setNotice(null);
  };
  const setHero = <K extends keyof Draft['hero']>(k: K, v: Draft['hero'][K]) => patch((x) => ({ ...x, hero: { ...x.hero, [k]: v } }));
  const setRow = <K extends 'features' | 'steps' | 'commitments'>(k: K, i: number, v: Partial<Draft[K][number]>) =>
    patch((x) => ({ ...x, [k]: x[k].map((r, j) => (j === i ? { ...r, ...v } : r)) }));
  const removeRow = (k: 'features' | 'steps' | 'commitments' | 'promises', i: number) => patch((x) => ({ ...x, [k]: (x[k] as unknown[]).filter((_, j) => j !== i) }));

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.set('file', file);
    fd.set('folder', 'hero');
    setUploading(true);
    const r = await uploadFile(fd);
    setUploading(false);
    if (!r.ok) return setNotice({ ok: false, text: r.error });
    setHero('imageUrl', r.data.url);
    setNotice({ ok: true, text: 'Đã tải ảnh — bấm "Lưu thay đổi" để áp dụng' });
  };

  const save = () => {
    const score = Number(d.ratingScore.replace(',', '.'));
    const errs: string[] = [];
    if (!(score >= 1 && score <= 5)) errs.push('Điểm đánh giá từ 1 đến 5 (vd 4,9).');
    if (d.steps.length < 2) errs.push('Quy trình cần ít nhất 2 bước.');
    setErrors(errs);
    if (errs.length) return;
    start(async () => {
      const r = await saveHome({
        settings: {
          hero: d.hero,
          tagline: d.tagline,
          about: d.about,
          features: d.features,
          commitments: d.commitments,
          promises: d.promises,
          rating: { score, outOf: 5, label: d.ratingLabel },
        },
        steps: d.steps,
      });
      if (!r.ok) {
        setErrors(r.errors ? Object.values(r.errors) : []);
        return setNotice({ ok: false, text: r.error });
      }
      setBaseline(JSON.stringify(d));
      setNotice({ ok: true, text: r.message ?? 'Đã lưu' });
    });
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Trang chủ & Hero</h1>
          <p className={s.sub}>Ảnh và tiêu đề Hero, cam kết, quy trình, điểm đánh giá — lưu là trang chủ cập nhật ngay.</p>
        </div>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          <a className={s.btn} href="/" target="_blank" rel="noopener">
            Xem trang chủ
          </a>
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={save} disabled={pending || !dirty}>
            {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className={s.content}>
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

        {/* HERO */}
        <section className={s.card} aria-labelledby="h-hero">
          <h2 id="h-hero" className={s.h2}>
            Hero (đầu trang chủ)
          </h2>
          <div className={s.fieldRow} style={{ alignItems: 'flex-start' }}>
            <div className={s.stack} style={{ flex: '1 1 320px' }}>
              <span className={s.labelText}>Ảnh Hero</span>
              <div style={{ background: 'var(--glass)', borderRadius: 12, overflow: 'hidden', aspectRatio: '1024 / 310' }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- xem trước ảnh admin chọn */}
                <img src={d.hero.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div className={s.chips}>
                <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => fileInput.current?.click()} disabled={uploading}>
                  {uploading ? 'Đang tải…' : 'Đổi ảnh'}
                </button>
                {d.hero.imageUrl !== '/images/hero-banner.png' ? (
                  <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => patch((x) => ({ ...x, hero: { ...x.hero, imageUrl: '/images/hero-banner.png', layout: 'overlay' } }))}>
                    Dùng lại banner gốc
                  </button>
                ) : null}
              </div>
              <span className={s.sub}>Ảnh ngang, rộng tối thiểu 1920px, JPG/PNG/WebP, dưới 2 MB. Phần bên phải ảnh nên là kỹ thuật viên (mobile cắt lấy phần này).</span>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="visually-hidden"
                tabIndex={-1}
                aria-label="Chọn ảnh Hero"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) void upload(f);
                }}
              />
            </div>
            <fieldset className={s.fieldset} style={{ flex: '1 1 280px' }}>
              <legend className={s.legend}>Kiểu Hero</legend>
              <label className={`${s.check} ${s.checkPlain}`} style={{ alignItems: 'flex-start' }}>
                <input type="radio" name="hero-layout" checked={d.hero.layout === 'overlay'} onChange={() => setHero('layout', 'overlay')} style={{ marginTop: 2 }} />
                <span>
                  <strong>Banner có chữ sẵn</strong>
                  <br />
                  <span className={s.sub}>Nút Gọi / Đặt lịch phủ đúng vị trí nút trong ảnh. Chỉ dùng cho banner gốc 1024×310 (vị trí nút đo trên ảnh đó).</span>
                </span>
              </label>
              <label className={`${s.check} ${s.checkPlain}`} style={{ alignItems: 'flex-start' }}>
                <input type="radio" name="hero-layout" checked={d.hero.layout === 'clean'} onChange={() => setHero('layout', 'clean')} style={{ marginTop: 2 }} />
                <span>
                  <strong>Ảnh sạch, chữ thật</strong>
                  <br />
                  <span className={s.sub}>Ảnh không có chữ; tiêu đề, đoạn dẫn và 2 nút hiện bằng chữ thật trên ảnh (tốt hơn cho SEO và màn hình nhỏ).</span>
                </span>
              </label>
            </fieldset>
          </div>
          <Field label="Mô tả ảnh (alt)" value={d.hero.imageAlt} max={200} onChange={(v) => setHero('imageAlt', v)} />
          <Field
            label="Tiêu đề H1"
            hint={d.hero.layout === 'clean' ? 'hiện trên ảnh' : 'ẩn, dành cho Google'}
            value={d.hero.h1}
            max={160}
            onChange={(v) => setHero('h1', v)}
          />
          {d.hero.layout === 'overlay' ? (
            <div className={s.fieldRow}>
              <Field label="Mobile — dòng 1" value={d.hero.mobileLine1} max={60} onChange={(v) => setHero('mobileLine1', v)} />
              <Field label="Mobile — dòng 2 (chữ cam)" value={d.hero.mobileLine2} max={60} onChange={(v) => setHero('mobileLine2', v)} />
            </div>
          ) : null}
          <Field label="Đoạn dẫn" hint={d.hero.layout === 'clean' ? 'dưới tiêu đề' : 'trên mobile'} value={d.hero.mobileLead} max={240} rows={2} onChange={(v) => setHero('mobileLead', v)} />
        </section>

        {/* KHẨU HIỆU */}
        <section className={s.card} aria-labelledby="h-brand">
          <h2 id="h-brand" className={s.h2}>
            Khẩu hiệu & giới thiệu ngắn
          </h2>
          <Field label="Khẩu hiệu" value={d.tagline} max={120} onChange={(v) => patch((x) => ({ ...x, tagline: v }))} />
          <Field label="Giới thiệu ngắn ở footer" value={d.about} max={300} rows={2} onChange={(v) => patch((x) => ({ ...x, about: v }))} />
        </section>

        {/* 5 CAM KẾT */}
        <section className={s.card} aria-labelledby="h-feat">
          <div className={s.rowBetween}>
            <h2 id="h-feat" className={s.h2}>
              Dải cam kết dưới Hero
            </h2>
            <span className={s.sub}>{d.features.length}/6 mục</span>
          </div>
          <div className={s.repeat}>
            {d.features.map((f, i) => (
              <div key={i} className={s.repeatRow}>
                <span className={s.repeatN} aria-hidden="true">
                  <Icon name={f.icon} size={22} />
                </span>
                <div className={s.repeatBody}>
                  <input className={`${s.input} ${s.inputSm}`} aria-label={`Cam kết ${i + 1}: tiêu đề`} value={f.title} onChange={(e) => setRow('features', i, { title: e.target.value })} maxLength={60} />
                  <select className={`${s.select} ${s.inputSm}`} aria-label={`Cam kết ${i + 1}: icon`} value={f.icon} onChange={(e) => setRow('features', i, { icon: e.target.value })}>
                    {ICON_NAMES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input className={`${s.input} ${s.inputSm} ${s.span2}`} aria-label={`Cam kết ${i + 1}: mô tả`} value={f.detail} onChange={(e) => setRow('features', i, { detail: e.target.value })} maxLength={80} />
                </div>
                <RowRemove label={`Xoá cam kết ${i + 1}`} onClick={() => removeRow('features', i)} disabled={d.features.length <= 1} />
              </div>
            ))}
          </div>
          {d.features.length < 6 ? (
            <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((x) => ({ ...x, features: [...x.features, { title: '', detail: '', icon: 'check' }] }))}>
              + Thêm cam kết
            </button>
          ) : null}
        </section>

        {/* QUY TRÌNH */}
        <section className={s.card} aria-labelledby="h-steps">
          <div className={s.rowBetween}>
            <h2 id="h-steps" className={s.h2}>
              Quy trình {d.steps.length} bước
            </h2>
            <span className={s.sub}>2–6 bước, số bước đánh tự động</span>
          </div>
          <div className={s.repeat}>
            {d.steps.map((st, i) => (
              <div key={i} className={s.repeatRow}>
                <span className={s.repeatN}>{i + 1}</span>
                <div className={s.stack} style={{ gap: 8 }}>
                  <input className={`${s.input} ${s.inputSm}`} aria-label={`Bước ${i + 1}: tiêu đề`} value={st.title} onChange={(e) => setRow('steps', i, { title: e.target.value })} maxLength={60} />
                  <textarea className={s.textarea} rows={2} aria-label={`Bước ${i + 1}: mô tả`} value={st.description} onChange={(e) => setRow('steps', i, { description: e.target.value })} maxLength={240} />
                </div>
                <RowRemove label={`Xoá bước ${i + 1}`} onClick={() => removeRow('steps', i)} disabled={d.steps.length <= 2} />
              </div>
            ))}
          </div>
          {d.steps.length < 6 ? (
            <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((x) => ({ ...x, steps: [...x.steps, { title: '', description: '' }] }))}>
              + Thêm bước
            </button>
          ) : null}
        </section>

        {/* ĐÁNH GIÁ TỔNG */}
        <section className={s.card} aria-labelledby="h-rating">
          <h2 id="h-rating" className={s.h2}>
            Điểm đánh giá (khối Khách hàng nói gì)
          </h2>
          <p className={s.sub}>Chỉ ghi số liệu thật, ví dụ lấy từ Google Maps.</p>
          <div className={s.fieldRow}>
            <label className={s.label} style={{ flex: '0 1 160px' }}>
              <span className={s.labelText}>Điểm /5</span>
              <input className={s.input} inputMode="decimal" value={d.ratingScore} onChange={(e) => patch((x) => ({ ...x, ratingScore: e.target.value }))} />
            </label>
            <Field label="Dòng mô tả" value={d.ratingLabel} max={80} onChange={(v) => patch((x) => ({ ...x, ratingLabel: v }))} />
          </div>
        </section>

        {/* CAM KẾT ĐẶT LỊCH */}
        <section className={s.card} aria-labelledby="h-commit">
          <div className={s.rowBetween}>
            <h2 id="h-commit" className={s.h2}>
              Cam kết ở trang Đặt lịch & trang nội dung
            </h2>
            <span className={s.sub}>{d.commitments.length}/8 mục</span>
          </div>
          <div className={s.repeat}>
            {d.commitments.map((c, i) => (
              <div key={i} className={s.repeatRow}>
                <span className={s.repeatN}>{i + 1}</span>
                <div className={s.repeatBody}>
                  <input className={`${s.input} ${s.inputSm}`} aria-label={`Cam kết đặt lịch ${i + 1}: tiêu đề`} value={c.title} onChange={(e) => setRow('commitments', i, { title: e.target.value })} maxLength={60} />
                  <input className={`${s.input} ${s.inputSm}`} aria-label={`Cam kết đặt lịch ${i + 1}: mô tả`} value={c.detail} onChange={(e) => setRow('commitments', i, { detail: e.target.value })} maxLength={120} />
                </div>
                <RowRemove label={`Xoá cam kết đặt lịch ${i + 1}`} onClick={() => removeRow('commitments', i)} disabled={d.commitments.length <= 1} />
              </div>
            ))}
          </div>
          {d.commitments.length < 8 ? (
            <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((x) => ({ ...x, commitments: [...x.commitments, { title: '', detail: '' }] }))}>
              + Thêm cam kết
            </button>
          ) : null}
        </section>

        {/* LỜI HỨA */}
        <section className={s.card} aria-labelledby="h-promise">
          <div className={s.rowBetween}>
            <h2 id="h-promise" className={s.h2}>
              Lời hứa ngắn (trang dịch vụ, cuối bài viết)
            </h2>
            <span className={s.sub}>{d.promises.length}/8 mục</span>
          </div>
          <div className={s.repeat}>
            {d.promises.map((p, i) => (
              <div key={i} className={s.repeatRow}>
                <span className={s.repeatN}>{i + 1}</span>
                <input
                  className={`${s.input} ${s.inputSm}`}
                  aria-label={`Lời hứa ${i + 1}`}
                  value={p}
                  onChange={(e) => patch((x) => ({ ...x, promises: x.promises.map((q, j) => (j === i ? e.target.value : q)) }))}
                  maxLength={60}
                />
                <RowRemove label={`Xoá lời hứa ${i + 1}`} onClick={() => removeRow('promises', i)} disabled={d.promises.length <= 1} />
              </div>
            ))}
          </div>
          {d.promises.length < 8 ? (
            <button type="button" className={`${s.btn} ${s.btnDashed}`} onClick={() => patch((x) => ({ ...x, promises: [...x.promises, ''] }))}>
              + Thêm lời hứa
            </button>
          ) : null}
        </section>
      </div>
    </>
  );
}
