'use client';

import { useActionState } from 'react';
import type { Settings } from '@kitfix/types';
import { saveSettings, type SettingsState } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

const FIELDS: { k: keyof Settings & string; label: string; hint?: string; type?: string }[] = [
  { k: 'hotline', label: 'Hotline (hiển thị)', hint: 'vd 0989.041.641' },
  { k: 'hotlineTel', label: 'Số gọi (link tel:)', hint: '10 chữ số, bắt đầu bằng 0', type: 'tel' },
  { k: 'zaloUrl', label: 'Link Zalo', hint: 'https://zalo.me/…', type: 'url' },
  { k: 'address', label: 'Địa chỉ' },
  { k: 'hours', label: 'Giờ làm', hint: 'vd 7:00 – 21:00' },
  { k: 'hoursNote', label: 'Ghi chú giờ làm', hint: 'vd tất cả các ngày' },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  const err = (k: string) => state.errors?.[k];
  return (
    <form action={action} className={s.stack} style={{ gap: 24 }}>
      <section className={s.card} aria-labelledby="set-contact">
        <h2 id="set-contact" className={s.h2}>
          Hotline, Zalo, CTA
        </h2>
        <p className={s.sub}>Hiện ở header, hero, form đặt lịch, bong bóng liên hệ và footer.</p>
        <div className={s.fieldRow}>
          {FIELDS.map((f) => (
            <label key={f.k} className={s.label}>
              <span className={s.labelText}>
                {f.label} {f.hint ? <span className={s.labelHint}>{f.hint}</span> : null}
              </span>
              <input
                className={`${s.input} ${err(f.k) ? s.inputError : ''}`}
                name={f.k}
                type={f.type ?? 'text'}
                defaultValue={state.values?.[f.k] ?? String(settings[f.k] ?? '')}
                required
                maxLength={500}
                aria-invalid={err(f.k) ? true : undefined}
                aria-describedby={err(f.k) ? `err-${f.k}` : undefined}
              />
              {err(f.k) ? (
                <span id={`err-${f.k}`} className={s.fieldError}>
                  {err(f.k)}
                </span>
              ) : null}
            </label>
          ))}
        </div>
      </section>

      <section className={s.card} id="thanh-toan" aria-labelledby="set-pay">
        <h2 id="set-pay" className={s.h2}>
          Footer & thanh toán
        </h2>
        <label className={s.label}>
          <span className={s.labelText}>
            Phương thức thanh toán <span className={s.labelHint}>mỗi dòng một phương thức</span>
          </span>
          <textarea className={s.textarea} name="payments" rows={4} defaultValue={state.values?.payments ?? settings.payments.join('\n')} />
        </label>
        <label className={s.label}>
          <span className={s.labelText}>
            Phí giao hàng Shop (₫) <span className={s.labelHint}>để trống = báo khi gọi xác nhận đơn</span>
          </span>
          <input
            className={`${s.input} ${err('shop') ? s.inputError : ''}`}
            name="shippingFee"
            inputMode="numeric"
            placeholder="vd 30.000"
            defaultValue={state.values?.shippingFee ?? (settings.shop?.shippingFee != null ? new Intl.NumberFormat('vi-VN').format(settings.shop.shippingFee) : '')}
            aria-invalid={err('shop') ? true : undefined}
            aria-describedby={err('shop') ? 'err-shop' : undefined}
            style={{ maxWidth: 240 }}
          />
          {err('shop') ? (
            <span id="err-shop" className={s.fieldError}>
              {err('shop')}
            </span>
          ) : null}
        </label>
      </section>

      <section className={s.card} id="google" aria-labelledby="set-google">
        <h2 id="set-google" className={s.h2}>
          Google Analytics & Search Console
        </h2>
        <p className={s.sub}>Để trống ô nào thì không gắn ô đó. Chỉ chạy trên website công khai, không chạy trong trang quản trị.</p>
        <div className={s.fieldRow}>
          <label className={s.label}>
            <span className={s.labelText}>
              Mã đo lường GA4 <span className={s.labelHint}>dạng G-XXXXXXXXXX</span>
            </span>
            <input
              className={`${s.input} ${err('analytics') ? s.inputError : ''}`}
              name="gaId"
              placeholder="G-XXXXXXXXXX"
              defaultValue={state.values?.gaId ?? settings.analytics?.gaId ?? ''}
              aria-describedby="ga-help"
              autoComplete="off"
            />
            <span id="ga-help" className={s.sub}>
              Google Analytics › Quản trị › Luồng dữ liệu › chọn luồng web › Mã đo lường.
            </span>
          </label>
          <label className={s.label}>
            <span className={s.labelText}>
              Mã xác minh Search Console <span className={s.labelHint}>dán cả thẻ meta cũng được</span>
            </span>
            <input
              className={`${s.input} ${err('analytics') ? s.inputError : ''}`}
              name="googleVerification"
              placeholder='<meta name="google-site-verification" content="…" />'
              defaultValue={state.values?.googleVerification ?? settings.analytics?.googleVerification ?? ''}
              aria-describedby="gsc-help"
              autoComplete="off"
            />
            <span id="gsc-help" className={s.sub}>
              Search Console › Thêm thuộc tính › Tiền tố URL › Thẻ HTML. Lưu ở đây trước, rồi bấm “Xác minh” bên Google.
            </span>
          </label>
        </div>
        {err('analytics') ? (
          <span className={s.fieldError} role="alert">
            {err('analytics')}
          </span>
        ) : null}
      </section>

      <div className={s.headActions}>
        <button type="submit" className={`${s.btn} ${s.btnBrand}`} disabled={pending}>
          {pending ? 'Đang lưu…' : 'Lưu cài đặt'}
        </button>
        <span role="status" aria-live="polite">
          {state.ok ? <span className={s.toast}>Đã lưu — website đã cập nhật</span> : null}
          {state.error ? <span className={`${s.toast} ${s.toastError}`}>{state.error}</span> : null}
        </span>
      </div>
    </form>
  );
}
