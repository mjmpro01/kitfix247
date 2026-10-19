'use client';

import Link from 'next/link';
import { orderTotals, type Product } from '@kitfix/types';
import { formatPrice } from '@kitfix/ui';
import { useCart } from './CartProvider';
import s from './cart.module.css';

/** Giỏ hàng thu gọn cạnh danh sách sản phẩm (SanPham). */
export function MiniCart({ products, hotline, hotlineTel }: { products: Product[]; hotline: string; hotlineTel: string }) {
  const { lines, count, ready } = useCart();
  const byId = new Map(products.map((p) => [p.id, p]));
  const rows = Object.entries(lines)
    .map(([id, qty]) => ({ p: byId.get(Number(id)), qty }))
    .filter((r): r is { p: Product; qty: number } => !!r.p);
  const { subtotal } = orderTotals(rows.map((r) => ({ qty: r.qty, unitPrice: r.p.price })), 0);

  return (
    <aside aria-labelledby="mini-cart-title" className={s.mini}>
      <h2 id="mini-cart-title" className={s.miniTitle}>
        Giỏ hàng <span className={s.miniCount}>{ready ? `${count} sản phẩm` : ''}</span>
      </h2>
      {ready && rows.length === 0 ? <p className={s.muted}>Chưa có sản phẩm. Bấm “Thêm vào giỏ” để chọn.</p> : null}
      {rows.length > 0 ? (
        <>
          <ul className={s.miniList}>
            {rows.map(({ p, qty }) => (
              <li key={p.id} className={s.miniLine}>
                <span>
                  {p.name} <span className={s.muted}>× {qty}</span>
                </span>
                <span className={s.price}>{p.price !== null ? formatPrice(p.price * qty) : 'Báo giá'}</span>
              </li>
            ))}
          </ul>
          <div className={s.miniTotal}>
            <span>Tạm tính</span>
            <span className={s.price}>{subtotal !== null ? formatPrice(subtotal) : 'Báo sau'}</span>
          </div>
          <Link href="/gio-hang" className="btn btn--brand">
            Xem giỏ hàng & thanh toán
          </Link>
        </>
      ) : null}
      <p className={s.note}>
        Cần kỹ thuật viên lắp giúp? Gọi{' '}
        <a href={`tel:${hotlineTel}`} className={s.strong}>
          {hotline}
        </a>
        .
      </p>
    </aside>
  );
}
