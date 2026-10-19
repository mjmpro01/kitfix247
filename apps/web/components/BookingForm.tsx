'use client';

import { useId, useRef, useState } from 'react';
import { BOOKING_DEVICES, validateBooking, type BookingErrors, type Settings } from '@kitfix/types';
import { Icon } from './Icon';
import s from './BookingForm.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Fields = { name: string; phone: string; device: string; address: string; description: string; website: string };
type Status = 'idle' | 'sending' | 'sent';

interface Props {
  settings: Pick<Settings, 'hotline' | 'hotlineTel' | 'zaloUrl' | 'hours'>;
  defaultDevice?: string;
}

const ORDER: (keyof BookingErrors)[] = ['name', 'phone', 'device', 'address', 'description'];

export function BookingForm({ settings, defaultDevice = 'Bếp từ' }: Props) {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const empty: Fields = { name: '', phone: '', device: defaultDevice, address: '', description: '', website: '' };
  const [f, setF] = useState<Fields>(empty);
  const [tried, setTried] = useState(false);
  const [serverErrors, setServerErrors] = useState<BookingErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [sent, setSent] = useState<{ name: string; phone: string; device: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const v = validateBooking(f);
  const errors: BookingErrors = tried ? { ...(v.ok ? {} : v.errors), ...serverErrors } : serverErrors;
  const tel = `tel:${settings.hotlineTel}`;

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    if (serverErrors[k as keyof BookingErrors]) setServerErrors((p) => ({ ...p, [k]: undefined }));
  };

  const focusFirstError = (errs: BookingErrors) => {
    const k = ORDER.find((key) => errs[key]);
    if (k) formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(k))}`)?.focus();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!v.ok) {
      setTried(true);
      focusFirstError(v.errors);
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      if (res.status === 201) {
        setSent({ name: v.data.name, phone: f.phone.trim(), device: v.data.device });
        setStatus('sent');
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 400 && body?.errors) {
        setServerErrors(body.errors);
        setTried(true);
        focusFirstError(body.errors);
      } else {
        setFormError(body?.message ?? `Chưa gửi được yêu cầu. Anh/chị vui lòng gọi ${settings.hotline}.`);
      }
    } catch {
      setFormError(`Chưa gửi được yêu cầu do lỗi kết nối. Anh/chị vui lòng thử lại hoặc gọi ${settings.hotline}.`);
    }
    setStatus('idle');
  }

  function reset() {
    setF(empty);
    setTried(false);
    setServerErrors({});
    setSent(null);
    setStatus('idle');
  }

  if (status === 'sent' && sent) {
    const deviceLabel = BOOKING_DEVICES.find((d) => d.value === sent.device)?.label ?? sent.device;
    return (
      <div className={s.form}>
        <div role="status" className={s.done}>
          <div className={s.doneIcon}>
            <Icon name="check" size={30} strokeWidth={2} />
          </div>
          <h3 ref={doneRef} tabIndex={-1} className={s.title}>
            Đã nhận yêu cầu của anh/chị {sent.name}
          </h3>
          <div className={s.doneBox}>Chúng tôi sẽ gọi lại số {sent.phone} trong vòng 15 phút để xác nhận giờ kỹ thuật viên đến.</div>
          <dl className={s.dl}>
            <dt>Thiết bị</dt>
            <dd>{deviceLabel}</dd>
            <dt>Giờ làm việc</dt>
            <dd>{settings.hours} mỗi ngày</dd>
          </dl>
          <p className="note">
            Ngoài giờ làm việc, chúng tôi gọi lại ngay đầu giờ sáng hôm sau. Cần gấp, anh/chị gọi{' '}
            <a href={tel} className={s.strongLink}>
              {settings.hotline}
            </a>
            .
          </p>
          <button type="button" className="btn btn--sec" onClick={reset} style={{ minHeight: 44 }}>
            Gửi yêu cầu khác
          </button>
        </div>
      </div>
    );
  }

  const fieldProps = (k: keyof BookingErrors) => ({
    id: id(k),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? id(`${k}-err`) : undefined,
    className: s.input,
  });
  const err = (k: keyof BookingErrors) =>
    errors[k] ? (
      <span id={id(`${k}-err`)} className={s.err}>
        {errors[k]}
      </span>
    ) : null;

  return (
    <div className={s.form}>
      <form ref={formRef} onSubmit={submit} noValidate className={s.fields} aria-labelledby={id('title')}>
        <div className={s.head}>
          <h3 id={id('title')} className={s.title}>
            Đặt lịch sửa tại nhà
          </h3>
          <p className="note">Chẩn đoán miễn phí. Chúng tôi gọi lại trong 15 phút.</p>
        </div>

        <div className={s.field}>
          <label htmlFor={id('name')} className={s.label}>
            Họ tên
          </label>
          <input {...fieldProps('name')} type="text" autoComplete="name" placeholder="Nguyễn Văn A" value={f.name} onChange={set('name')} required />
          {err('name')}
        </div>

        <div className={s.field}>
          <label htmlFor={id('phone')} className={s.label}>
            Số điện thoại
          </label>
          <input
            {...fieldProps('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09xx xxx xxx"
            value={f.phone}
            onChange={set('phone')}
            required
          />
          {err('phone')}
        </div>

        <div className={s.field}>
          <label htmlFor={id('device')} className={s.label}>
            Thiết bị cần sửa
          </label>
          <select {...fieldProps('device')} value={f.device} onChange={set('device')}>
            {BOOKING_DEVICES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {err('device')}
        </div>

        <div className={s.field}>
          <label htmlFor={id('address')} className={s.label}>
            Địa chỉ
          </label>
          <input
            {...fieldProps('address')}
            type="text"
            autoComplete="street-address"
            placeholder="Số nhà, đường, phường"
            value={f.address}
            onChange={set('address')}
          />
          {err('address')}
        </div>

        <div className={s.field}>
          <label htmlFor={id('description')} className={s.label}>
            Mô tả lỗi
          </label>
          <textarea
            {...fieldProps('description')}
            className={`${s.input} ${s.textarea}`}
            rows={3}
            placeholder="Ví dụ: bếp báo lỗi E1, không nhận nồi"
            value={f.description}
            onChange={set('description')}
          />
          {err('description')}
        </div>

        {/* Honeypot chống spam: ẩn với người dùng và trình đọc màn hình */}
        <div className={s.hp} aria-hidden="true">
          <label htmlFor={id('website')}>Website</label>
          <input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
        </div>

        {formError && (
          <p role="alert" className={s.formErr}>
            {formError}
          </p>
        )}

        <button type="submit" className={`btn btn--brand ${s.submit}`} disabled={status === 'sending'} aria-busy={status === 'sending'}>
          <Icon name="calendar" size={20} />
          {status === 'sending' ? 'Đang gửi…' : 'Gửi yêu cầu đặt lịch'}
        </button>

        <div className={s.urgent}>
          <span>Cần gấp?</span>
          <a href={tel}>Gọi {settings.hotline}</a>
          <a href={settings.zaloUrl}>Nhắn Zalo</a>
        </div>
      </form>
    </div>
  );
}
