import type { Metadata } from 'next';
import Link from 'next/link';
import { CartCheckout } from '@/components/cart/CartCheckout';
import s from '@/components/cart/cart.module.css';
import { getProducts, getSettings } from '@/lib/api';

/** Giỏ hàng là trang riêng của từng khách — không lập chỉ mục. */
export const metadata: Metadata = { title: 'Giỏ hàng', robots: { index: false, follow: true } };

export default async function CartPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  return (
    <section className={s.page}>
      <div className={`container ${s.pageIn}`}>
        <nav aria-label="Breadcrumb" className="breadcrumb" style={{ color: 'var(--ink-muted)' }}>
          <ol>
            <li>
              <Link href="/" style={{ color: 'var(--ink-muted)' }}>
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/san-pham" style={{ color: 'var(--ink-muted)' }}>
                Sản phẩm
              </Link>
            </li>
            <li aria-current="page" style={{ color: 'var(--ink)' }}>
              Giỏ hàng
            </li>
          </ol>
        </nav>
        <h1 className={s.h1}>Giỏ hàng</h1>
        <CartCheckout products={products} shippingFee={settings.shop?.shippingFee ?? null} hotline={settings.hotline} hotlineTel={settings.hotlineTel} />
      </div>
    </section>
  );
}
