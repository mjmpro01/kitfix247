import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { discountPercent } from '@kitfix/types';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { SideWidgets } from '@/components/SideWidgets';
import w from '@/components/SideWidgets.module.css';
import { ProductCard, ProductPrice } from '@/components/ProductCard';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { BuyNowButton } from '@/components/cart/BuyNowButton';
import a from '@/app/(site)/kien-thuc/[slug]/article.module.css';
import { getProduct, getProducts, getSettings } from '@/lib/api';
import { renderArticle } from '@/lib/markdown';
import { SITE_URL, brandHref, productHref } from '@/lib/site';
import s from './product.module.css';

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url}`);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const description = p.description ?? `${p.name}${p.brand ? ` (${p.brand.name})` : ''} — KitFix247 giao hàng tại TP.HCM, gọi điện xác nhận trước khi giao.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: productHref(p.slug) },
    openGraph: { title: p.name, description, url: productHref(p.slug), type: 'website', ...(p.imageUrl ? { images: [absolute(p.imageUrl)] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [p, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!p) notFound();
  // Cùng hãng trước, không có hãng thì cùng nhóm.
  const related = (await getProducts(p.brand ? { brand: p.brand.slug, limit: 8 } : { category: p.category, limit: 8 })).filter((x) => x.id !== p.id).slice(0, 4);
  const content = p.contentMd?.trim() ? renderArticle(p.contentMd).html : null;
  const pct = discountPercent(p.price, p.compareAtPrice);
  const tel = `tel:${settings.hotlineTel}`;

  // Chỉ BreadcrumbList: dữ liệu Product/Offer đòi đủ ảnh, chính sách đổi trả, phí giao… (Search Console báo lỗi
  // "Trang thông tin của người bán" nếu thiếu) — thêm khi đã có đủ thông tin thật.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: `${SITE_URL}/san-pham` },
      { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE_URL}${productHref(p.slug)}` },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className={s.top}>
        <div className="container">
          <nav aria-label="Breadcrumb" className={s.crumb}>
            <ol>
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href="/san-pham">Sản phẩm</Link>
              </li>
              {p.brand ? (
                <li>
                  <Link href={brandHref(p.brand.slug)}>{p.brand.name}</Link>
                </li>
              ) : null}
              <li aria-current="page">{p.name}</li>
            </ol>
          </nav>

          <div className={s.layout}>
            <div className={s.media}>
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.name} fill priority sizes="(max-width: 900px) 100vw, 560px" unoptimized={/^https?:\/\//.test(p.imageUrl)} className={s.mediaImg} />
              ) : (
                <span className={s.placeholder} aria-hidden="true">
                  <Icon name={p.icon} size={64} strokeWidth={1.25} />
                  [Ảnh sản phẩm]
                </span>
              )}
              {pct ? (
                <span className={s.badge}>
                  <span className="visually-hidden">Giảm </span>-{pct}%
                </span>
              ) : null}
            </div>

            <div className={s.info}>
              <div className={s.meta}>
                {p.category}
                {p.brand ? (
                  <>
                    {' · '}
                    <Link href={brandHref(p.brand.slug)} className={s.brandLink}>
                      {p.brand.name}
                    </Link>
                  </>
                ) : null}
              </div>
              <h1 className={s.h1}>{p.name}</h1>
              <ProductPrice product={p} size="lg" />
              <p className={s.note}>
                {p.price === null ? 'Chúng tôi báo giá khi gọi xác nhận đơn. ' : ''}Giá chưa gồm VAT.
              </p>
              {p.description ? <p className={s.desc}>{p.description}</p> : null}
              <div className={s.actions}>
                <BuyNowButton productId={p.id} className={`btn btn--brand ${s.buy}`} note="Gọi điện xác nhận, giao hàng tận nơi" />
                <AddToCartButton productId={p.id} productName={p.name} className={`btn btn--sec ${s.cart}`} />
              </div>
              <a href={tel} className={s.call}>
                <Icon name="phone" size={18} />
                Cần tư vấn? Gọi {settings.hotline}
              </a>
              <ul className={s.promises}>
                {settings.payments.length ? <li>Thanh toán: {settings.payments.join(', ')}</li> : null}
                <li>Giao hàng trong TP.HCM</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className={`container ${w.row}`}>
          <section aria-labelledby="thong-tin" className={`${w.main} ${s.detail}`}>
            <h2 id="thong-tin" className="h2">
              Thông tin sản phẩm
            </h2>
            {content ? (
              <div className={`${a.body} ${s.content}`} dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <p className="muted">
                Thông tin chi tiết đang được cập nhật. Anh/chị gọi{' '}
                <a href={tel} className={s.strong}>
                  {settings.hotline}
                </a>{' '}
                để được tư vấn thông số và lắp đặt.
              </p>
            )}
          </section>
          <aside className={w.side} aria-label="Bài viết mới và dịch vụ">
            <SideWidgets />
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="lien-quan" className="section section--sunken">
          <div className="container">
            <h2 id="lien-quan" className="h2">
              {p.brand ? `Sản phẩm ${p.brand.name} khác` : 'Sản phẩm cùng nhóm'}
            </h2>
            <div className={s.related}>
              {related.map((x) => (
                <ProductCard key={x.id} product={x} sizes="(max-width: 640px) 100vw, 280px" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
