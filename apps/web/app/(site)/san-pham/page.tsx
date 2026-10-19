import type { Metadata } from 'next';
import Link from 'next/link';
import { PRODUCT_SORTS, type ProductSort } from '@kitfix/types';
import { formatPrice } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { MiniCart } from '@/components/cart/MiniCart';
import { SortSelect } from '@/components/cart/SortSelect';
import { getProducts, getSettings } from '@/lib/api';
import s from './san-pham.module.css';

type SP = Promise<{ nhom?: string; 'sap-xep'?: string }>;

export const metadata: Metadata = {
  title: 'Linh kiện & dụng cụ sửa bếp',
  description: 'Linh kiện và dụng cụ sửa bếp từ, lò vi sóng, máy hút mùi mà kỹ thuật viên KitFix247 dùng hằng ngày. Giao trong TP.HCM.',
  alternates: { canonical: '/san-pham' },
};

const qs = (nhom?: string, sort?: ProductSort) => {
  const p = new URLSearchParams();
  if (nhom) p.set('nhom', nhom);
  if (sort && sort !== 'new') p.set('sap-xep', sort);
  const q = p.toString();
  return q ? `/san-pham?${q}` : '/san-pham';
};

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sort = PRODUCT_SORTS.find((x) => x === sp['sap-xep']) ?? 'new';
  const [all, settings] = await Promise.all([getProducts({ sort }), getSettings()]);
  const categories = [...new Set(all.map((p) => p.category))];
  const nhom = categories.find((c) => c === sp.nhom);
  const items = nhom ? all.filter((p) => p.category === nhom) : all;
  // "Tiền mặt" → "tiền mặt"; tên riêng có chữ hoa ở giữa (MoMo, ZaloPay) giữ nguyên.
  const payments = settings.payments
    .map((p) => (/^\p{Lu}[^\p{Lu}]*$/u.test(p) ? p.toLocaleLowerCase('vi') : p))
    .join(', ')
    .replace(/, ([^,]*)$/, ' hoặc $1');

  return (
    <>
      <section className={s.head}>
        <div className="container">
          <div className={s.headIn}>
            <nav aria-label="Breadcrumb" className={s.crumb}>
              <ol>
                <li>
                  <Link href="/">Trang chủ</Link>
                </li>
                <li aria-current="page">Sản phẩm</li>
              </ol>
            </nav>
            <h1 className={s.h1}>Linh kiện &amp; dụng cụ sửa bếp</h1>
            <p className={s.lead}>
              Linh kiện và dụng cụ chúng tôi dùng hằng ngày khi sửa tại nhà. Giao trong TP.HCM, thanh toán {payments}.
            </p>
          </div>
        </div>
      </section>

      <section className={s.body}>
        <div className={`container ${s.layout}`}>
          <div className={s.main}>
            <div className={s.toolbar}>
              <nav aria-label="Lọc theo nhóm" className={s.chips}>
                {[undefined, ...categories].map((c) => {
                  const on = c === nhom;
                  return (
                    <Link key={c ?? 'all'} href={qs(c, sort)} className={s.chip} aria-current={on ? 'page' : undefined}>
                      {c ?? 'Tất cả'}
                    </Link>
                  );
                })}
              </nav>
              <SortSelect sort={sort} category={nhom} className={s.sort} selectClassName={s.select} />
            </div>

            {items.length === 0 ? (
              <p className="muted">Chưa có sản phẩm trong nhóm này.</p>
            ) : (
              <div className={s.grid}>
                {items.map((p) => (
                  <article key={p.id} className={`card ${s.card}`}>
                    <div className={s.img}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên (API khác origin)
                        <img src={p.imageUrl} alt={p.name} loading="lazy" />
                      ) : (
                        <>
                          <Icon name={p.icon} size={44} strokeWidth={1.5} />
                          [Ảnh sản phẩm]
                        </>
                      )}
                    </div>
                    <div className={s.cardBody}>
                      <div className="note">{p.category}</div>
                      <h2 className={s.name}>{p.name}</h2>
                      {p.description ? <p className={s.desc}>{p.description}</p> : <div className={s.grow} />}
                      <div className={s.price}>{p.price !== null ? formatPrice(p.price) : 'Giá: liên hệ'}</div>
                      <AddToCartButton productId={p.id} productName={p.name} className={`btn btn--brand ${s.add}`} />
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="note">
              Giá chưa gồm VAT. Sản phẩm chưa có giá vẫn đặt được — chúng tôi báo giá khi gọi xác nhận đơn.
            </p>
          </div>

          <MiniCart products={all} hotline={settings.hotline} hotlineTel={settings.hotlineTel} />
        </div>
      </section>
    </>
  );
}
