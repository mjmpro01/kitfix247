import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BrandDetail } from '@kitfix/types';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { ProductCard } from '@/components/ProductCard';
import a from '@/app/(site)/kien-thuc/[slug]/article.module.css';
import { getBrand, getProducts, getSettings } from '@/lib/api';
import { renderArticle } from '@/lib/markdown';
import { SITE_URL, brandHref } from '@/lib/site';
import type { SearchParams } from '../../params';
import k from '../../kien-thuc.module.css';
import s from './brand.module.css';

export const revalidate = 300;

type Params = Promise<{ brand: string }>;
type Tab = 'sua-chua' | 'san-pham';

/** Trang hãng chỉ có 2 mục: Sửa chữa (bài giới thiệu) và Sản phẩm (thẻ sản phẩm của hãng). */
const readTab = (sp: Awaited<SearchParams>): Tab => (sp.muc === 'san-pham' ? 'san-pham' : 'sua-chua');
const tabHref = (slug: string, tab: Tab) => (tab === 'san-pham' ? `${brandHref(slug)}?muc=san-pham` : brandHref(slug));

/** Mô tả mặc định khi admin chưa nhập mô tả trang hãng. */
const brandDesc = (b: BrandDetail) =>
  b.description || `Sửa chữa, vệ sinh, lắp đặt tận nhà tại TP.HCM và sản phẩm thiết bị bếp ${b.name}.`;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const [{ brand: slug }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrand(slug);
  if (!b) return {};
  const tab = readTab(sp);
  const base = b.seoTitle ?? `Sửa chữa thiết bị bếp ${b.name} tại nhà TP.HCM`;
  const title = tab === 'san-pham' ? `Sản phẩm ${b.name}` : base;
  const description = b.seoDesc ?? brandDesc(b);
  const canonical = tabHref(b.slug, tab);
  return {
    title: { absolute: `${title} | KitFix247` },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', ...(b.logoUrl ? { images: [b.logoUrl] } : {}) },
  };
}

export default async function BrandPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ brand: slug }, sp] = await Promise.all([params, searchParams]);
  const tab = readTab(sp);
  const [brand, settings, products] = await Promise.all([getBrand(slug), getSettings(), getProducts({ brand: slug, limit: 48 })]);
  if (!brand) notFound();
  const tel = `tel:${settings.hotlineTel}`;
  const repair = brand.repairMd?.trim() ? renderArticle(brand.repairMd).html : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: brand.name, item: `${SITE_URL}${brandHref(brand.slug)}` },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className={k.hero}>
        <div className={`container ${k.brandHeroIn}`}>
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol>
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li aria-current="page">{brand.name}</li>
            </ol>
          </nav>
          <div className={k.brandRow}>
            <div className={k.logoBox}>
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo do admin tải lên, kích thước không cố định
                <img src={brand.logoUrl} alt={`Logo ${brand.name}`} />
              ) : (
                <span className={k.logoName}>{brand.name}</span>
              )}
            </div>
            <div className={k.brandText}>
              <h1 className={k.h1}>
                Thiết bị bếp <span>{brand.name}</span>
              </h1>
              <p className={k.brandDesc}>{brandDesc(brand)}</p>
            </div>
            <Link href="/dat-lich" className={`btn btn--brand btn--lg ${k.brandCta}`}>
              Đặt lịch sửa {brand.name}
            </Link>
          </div>
        </div>
      </section>

      <section className={k.listSection}>
        <div className={`container ${k.listIn}`}>
          <nav aria-label={`Mục của hãng ${brand.name}`} className={k.chips}>
            <Link href={tabHref(brand.slug, 'sua-chua')} className={k.chip} data-active={tab === 'sua-chua'} aria-current={tab === 'sua-chua' ? 'page' : undefined}>
              Sửa chữa
            </Link>
            <Link href={tabHref(brand.slug, 'san-pham')} className={k.chip} data-active={tab === 'san-pham'} aria-current={tab === 'san-pham' ? 'page' : undefined}>
              Sản phẩm{products.length ? ` (${products.length})` : ''}
            </Link>
          </nav>

          {tab === 'sua-chua' ? (
            <div className={s.repair}>
              <h2 className="h2">Sửa chữa thiết bị bếp {brand.name}</h2>
              {repair ? (
                <div className={`${a.body} ${s.content}`} dangerouslySetInnerHTML={{ __html: repair }} />
              ) : (
                // Admin chưa viết bài giới thiệu (Admin › Thương hiệu): khung mặc định chỉ dùng thông tin đã có.
                <div className={`${a.body} ${s.content}`}>
                  <p>
                    KitFix247 nhận sửa chữa, vệ sinh và lắp đặt thiết bị bếp {brand.name}
                    {brand.devices.length ? ` (${brand.devices.join(', ').toLocaleLowerCase('vi')})` : ''} tận nhà tại TP.HCM.
                  </p>
                  {settings.promises.length ? (
                    <ul>
                      {settings.promises.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
              <div className="btn-row">
                <a href={tel} className="btn btn--brand btn--lg">
                  <Icon name="phone" />
                  Gọi {settings.hotline}
                </a>
                <Link href="/dat-lich" className="btn btn--sec btn--lg">
                  Đặt lịch sửa {brand.name}
                </Link>
              </div>
            </div>
          ) : products.length ? (
            <>
              <p className={k.count}>
                {products.length} sản phẩm {brand.name}
              </p>
              <div className={s.grid}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 280px" />
                ))}
              </div>
              <p className="note">Giá chưa gồm VAT. Sản phẩm chưa có giá vẫn đặt được — chúng tôi báo giá khi gọi xác nhận đơn.</p>
            </>
          ) : (
            <div className={k.empty}>
              <p className={k.emptyTitle}>Chưa có sản phẩm {brand.name} trên website</p>
              <p className="muted">
                Anh/chị cần mua thiết bị hoặc linh kiện {brand.name}, gọi{' '}
                <a href={tel} className={k.strong}>
                  {settings.hotline}
                </a>{' '}
                để được tư vấn.
              </p>
              <Link href="/san-pham" className="btn btn--sec">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
