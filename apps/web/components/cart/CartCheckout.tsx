'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import { orderTotals, PAYMENT_METHODS, paymentLabel, validateOrder, type OrderErrors, type PaymentMethod, type Product } from '@kitfix/types';
import { formatPrice } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { useCart } from './CartProvider';
import { track } from '@/lib/analytics';
import s from './cart.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Props {
  products: Product[];
  shippingFee: number | null;
  hotline: string;
  hotlineTel: string;
}

type Fields = { customerName: string; phone: string; address: string; payment: PaymentMethod; website: string };
const FIELD_ORDER: (keyof OrderErrors)[] = ['customerName', 'phone', 'address', 'payment'];

/** Giỏ hàng + thông tin giao hàng + thanh toán (GioHang). Giá hiển thị lấy từ API; khi đặt, API tính lại. */
export function CartCheckout({ products, shippingFee, hotline, hotlineTel }: Props) {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const { lines, count, ready, setQty, remove, clear } = useCart();
  const [f, setF] = useState<Fields>({ customerName: '', phone: '', address: '', payment: 'cod', website: '' });
  const [tried, setTried] = useState(false);
  const [serverErrors, setServerErrors] = useState<OrderErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ code: string; payment: string; phone: string; needsQuote: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const byId = new Map(products.map((p) => [p.id, p]));
  const entries = Object.entries(lines).map(([pid, qty]) => ({ id: Number(pid), qty, p: byId.get(Number(pid)) }));
  const rows = entries.filter((r): r is typeof r & { p: Product } => !!r.p);
  const gone = entries.filter((r) => !r.p);
  const totals = orderTotals(rows.map((r) => ({ qty: r.qty, unitPrice: r.p.price })), shippingFee);
  const items = rows.map((r) => ({ productId: r.id, qty: r.qty }));

  const v = validateOrder({ ...f, items });
  const errors: OrderErrors = tried ? { ...(v.ok ? {} : v.errors), ...serverErrors } : serverErrors;

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    if (serverErrors[k as keyof OrderErrors]) setServerErrors((p) => ({ ...p, [k]: undefined }));
  };

  const focusFirstError = (errs: OrderErrors) => {
    const k = FIELD_ORDER.find((key) => errs[key]);
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
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, items }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 201 && body?.code) {
        setDone({ code: body.code, payment: paymentLabel(f.payment), phone: f.phone.trim(), needsQuote: totals.total === null });
        track('place_order', { payment: f.payment, items: count, ...(totals.total !== null ? { value: totals.total, currency: 'VND' } : {}) });
        clear();
        requestAnimationFrame(() => doneRef.current?.focus());
      } else if (res.status === 400 && Array.isArray(body?.unavailable)) {
        for (const pid of body.unavailable as number[]) remove(pid);
        setFormError(body.message);
      } else if (res.status === 400 && body?.errors) {
        setServerErrors(body.errors);
        setTried(true);
        focusFirstError(body.errors);
      } else {
        setFormError(body?.message ?? `Chưa đặt được hàng. Anh/chị vui lòng gọi ${hotline}.`);
      }
    } catch {
      setFormError(`Chưa đặt được hàng do lỗi kết nối. Anh/chị vui lòng thử lại hoặc gọi ${hotline}.`);
    }
    setSending(false);
  }

  if (done) {
    return (
      <div role="status" className={s.done}>
        <h2 ref={doneRef} tabIndex={-1} className={s.doneTitle}>
          Đặt hàng thành công
        </h2>
        <p>
          Mã đơn: <span className={s.code}>{done.code}</span>
        </p>
        <p>
          Chúng tôi sẽ gọi số {done.phone} để xác nhận đơn{done.needsQuote ? ', báo giá' : ''} và thời gian giao trong 15 phút. Phương thức thanh toán:{' '}
          {done.payment}.
        </p>
        <Link href="/san-pham">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  const fieldProps = (k: keyof OrderErrors) => ({
    id: id(k),
    className: s.input,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? id(`${k}-err`) : undefined,
  });
  const err = (k: keyof OrderErrors) =>
    errors[k] ? (
      <span id={id(`${k}-err`)} className={s.err}>
        {errors[k]}
      </span>
    ) : null;
  const money = (n: number | null, pending: string) => (n !== null ? formatPrice(n) : pending);

  return (
    <form ref={formRef} onSubmit={submit} noValidate className={s.layout} aria-busy={sending}>
      <div className={s.main}>
        <section className={s.box} aria-label="Sản phẩm trong giỏ">
          {rows.map(({ id: pid, qty, p }) => (
            <div key={pid} className={s.line}>
              <div className={s.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <Icon name={p.icon} size={28} strokeWidth={1.5} />}
              </div>
              <div className={s.lineInfo}>
                <div className={s.lineName}>{p.name}</div>
                <div className={s.lineCat}>
                  {p.category} · {p.price !== null ? `${formatPrice(p.price)} / cái` : 'Giá: báo khi gọi xác nhận'}
                </div>
              </div>
              <div className={s.stepper} role="group" aria-label={`Số lượng ${p.name}`}>
                <button type="button" className={s.stepBtn} onClick={() => setQty(pid, qty - 1)} aria-label={`Giảm số lượng ${p.name}`}>
                  −
                </button>
                <span className={s.qty} aria-live="polite">
                  {qty}
                </span>
                <button type="button" className={s.stepBtn} onClick={() => setQty(pid, qty + 1)} disabled={qty >= 99} aria-label={`Tăng số lượng ${p.name}`}>
                  +
                </button>
              </div>
              <div className={`${s.price} ${s.lineTotal}`}>{p.price !== null ? formatPrice(p.price * qty) : 'Báo giá'}</div>
              <button type="button" className={s.remove} onClick={() => remove(pid)} aria-label={`Xoá ${p.name} khỏi giỏ`}>
                Xóa
              </button>
            </div>
          ))}
          {gone.map((g) => (
            <div key={g.id} className={s.line}>
              <div className={s.lineInfo}>
                <div className={s.gone}>Một sản phẩm trong giỏ không còn bán.</div>
              </div>
              <button type="button" className={s.remove} onClick={() => remove(g.id)}>
                Xóa
              </button>
            </div>
          ))}
          {ready && rows.length === 0 ? (
            <p className={s.empty}>
              Giỏ hàng trống. <Link href="/san-pham">Xem linh kiện &amp; dụng cụ</Link>.
            </p>
          ) : null}
          {!ready ? <p className={s.empty}>Đang tải giỏ hàng…</p> : null}
          {err('items')}
        </section>

        <section className={`${s.box} ${s.boxPad}`} aria-labelledby={id('ship')}>
          <h2 id={id('ship')} className={s.h2}>
            Thông tin giao hàng
          </h2>
          <div className={s.grid2}>
            <div className={s.field}>
              <label htmlFor={id('customerName')} className={s.label}>
                Họ tên
              </label>
              <input {...fieldProps('customerName')} autoComplete="name" value={f.customerName} onChange={set('customerName')} required />
              {err('customerName')}
            </div>
            <div className={s.field}>
              <label htmlFor={id('phone')} className={s.label}>
                Số điện thoại
              </label>
              <input {...fieldProps('phone')} type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} required />
              {err('phone')}
            </div>
          </div>
          <div className={s.field}>
            <label htmlFor={id('address')} className={s.label}>
              Địa chỉ giao hàng
            </label>
            <input {...fieldProps('address')} autoComplete="street-address" placeholder="Số nhà, đường, phường" value={f.address} onChange={set('address')} required />
            {err('address')}
          </div>
          <div className={s.hp} aria-hidden="true">
            <label htmlFor={id('website')}>Website</label>
            <input id={id('website')} tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
          </div>
        </section>
      </div>

      <aside className={s.summary} aria-labelledby={id('sum')}>
        <h2 id={id('sum')} className={s.h2}>
          Tóm tắt đơn hàng
        </h2>
        <dl className={s.dl}>
          <dt>Tạm tính ({count} sản phẩm)</dt>
          <dd>{money(totals.subtotal, 'Báo sau')}</dd>
          <dt>Phí giao hàng</dt>
          <dd>{money(shippingFee, 'Báo sau')}</dd>
          <dt className={s.totalT}>Tổng cộng</dt>
          <dd className={s.totalD}>{money(totals.total, 'Báo sau')}</dd>
        </dl>
        <fieldset className={s.pays}>
          <legend className={s.legend}>Thanh toán</legend>
          {PAYMENT_METHODS.map((p) => (
            <label key={p.value} className={s.pay}>
              <input type="radio" name="payment" value={p.value} checked={f.payment === p.value} onChange={() => setF((x) => ({ ...x, payment: p.value }))} />
              {p.label}
              {p.note ? <span className={s.payNote}>{p.note}</span> : null}
            </label>
          ))}
          {err('payment')}
        </fieldset>
        {formError ? (
          <p className={s.formErr} role="alert">
            {formError}
          </p>
        ) : null}
        <button type="submit" className={`btn btn--brand ${s.submit}`} disabled={sending || !ready || rows.length === 0}>
          {sending ? 'Đang đặt hàng…' : 'Đặt hàng'}
        </button>
        <p className={s.note}>
          Giá chưa gồm VAT. Chúng tôi gọi xác nhận trước khi giao{totals.total === null ? ' và báo giá phần còn thiếu' : ''}. Cần hỏi thêm, gọi{' '}
          <a href={`tel:${hotlineTel}`} className={s.strong}>
            {hotline}
          </a>
          .
        </p>
      </aside>
    </form>
  );
}
