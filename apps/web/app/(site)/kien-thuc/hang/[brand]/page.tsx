import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS_MAX_LIMIT, type BrandDetail, type Category, type PostPage } from '@kitfix/types';
import { ArticleCard } from '@/components/ArticleCard';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { ProductCard } from '@/components/ProductCard';
import a from '@/app/(site)/kien-thuc/[slug]/article.module.css';
import { getBrand, getCategories, getPosts, getProducts, getSettings } from '@/lib/api';
import { renderArticle } from '@/lib/markdown';
import { KNOWLEDGE_PATH, SITE_URL, brandHref, knowledgeHref } from '@/lib/site';
import type { SearchParams } from '../../params';
import k from '../../kien-thuc.module.css';
import s from './brand.module.css';

export const revalidate = 300;

type Params = Promise<{ brand: string }>;
type Tab = 'sua-chua' | 'loi' | 'san-pham';

/**
 * Trang hãng có 3 mục, trùng 3 chuyên mục bài viết (Admin › Viết bài):
 * Sửa chữa (bài giới thiệu + bài "Sửa chữa"), Lỗi (bài "Lỗi"), Sản phẩm (thẻ sản phẩm + bài "Sản phẩm") — bài lọc theo hãng.
 */
const TABS: { key: Tab; label: string }[] = [
  { key: 'sua-chua', label: 'Sửa chữa' },
  { key: 'loi', label: 'Lỗi' },
  { key: 'san-pham', label: 'Sản phẩm' },
];
const readTab = (sp: Awaited<SearchParams>): Tab => (sp.muc === 'san-pham' || sp.muc === 'loi' ? sp.muc : 'sua-chua');
const tabHref = (slug: string, tab: Tab) => (tab === 'sua-chua' ? brandHref(slug) : `${brandHref(slug)}?muc=${tab}`);

/** Chuyên mục ứng với mục (slug = mã mục; dự phòng theo tên). */
const tabCategory = (cats: Category[], t: { key: Tab; label: string }) =>
  cats.find((c) => c.slug === t.key) ?? cats.find((c) => c.name.toLocaleLowerCase('vi') === t.label.toLocaleLowerCase('vi'));

const EMPTY: PostPage = { items: [], total: 0, page: 1, limit: POSTS_MAX_LIMIT, totalPages: 1 };

/** Bài viết của hãng trong một chuyên mục; quá 50 bài thì có nút sang trang Kiến thức đã lọc. */
function BrandPosts({ title, posts, brandSlug, category }: { title: string; posts: PostPage; brandSlug: string; category?: string }) {
  if (!posts.total) return null;
  return (
    <div className={s.posts}>
      <h2 className="h2">{title}</h2>
      <p className={k.count}>{posts.total} bài viết</p>
      <div className={k.grid}>
        {posts.items.map((p) => (
          <ArticleCard key={p.id} post={p} brandSlug={brandSlug} />
        ))}
      </div>
      {posts.total > posts.items.length ? (
        <Link href={knowledgeHref(KNOWLEDGE_PATH, { brand: brandSlug, category })} className={`btn btn--sec ${s.more}`}>
          Xem tất cả {posts.total} bài
        </Link>
      ) : null}
    </div>
  );
}

/** Mô tả mặc định khi admin chưa nhập mô tả trang hãng. */
const brandDesc = (b: BrandDetail) =>
  b.description || `Sửa chữa, vệ sinh, lắp đặt tận nhà tại TP.HCM và sản phẩm thiết bị bếp ${b.name}.`;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const [{ brand: slug }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrand(slug);
  if (!b) return {};
  const tab = readTab(sp);
  const base = b.seoTitle ?? `Sửa chữa thiết bị bếp ${b.name} tại nhà TP.HCM`;
  const title = tab === 'san-pham' ? `Sản phẩm ${b.name}` : tab === 'loi' ? `Mã lỗi thiết bị bếp ${b.name} và cách xử lý` : base;
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
  const [brand, settings, products, categories] = await Promise.all([
    getBrand(slug),
    getSettings(),
    getProducts({ brand: slug, limit: 48 }),
    getCategories(),
  ]);
  if (!brand) notFound();
  const cats = Object.fromEntries(TABS.map((t) => [t.key, tabCategory(categories, t)?.slug])) as Record<Tab, string | undefined>;
  const [repairPosts, errors, productPosts] = await Promise.all(
    TABS.map((t) => (cats[t.key] ? getPosts({ brand: slug, category: cats[t.key], limit: POSTS_MAX_LIMIT }) : EMPTY)),
  );
  const counts: Record<Tab, number | null> = { 'sua-chua': null, loi: errors.total, 'san-pham': products.length };
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
            {TABS.map((t) => (
              <Link key={t.key} href={tabHref(brand.slug, t.key)} className={k.chip} data-active={tab === t.key} aria-current={tab === t.key ? 'page' : undefined}>
                {t.label}
                {counts[t.key] ? ` (${counts[t.key]})` : ''}
              </Link>
            ))}
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
              <BrandPosts title={`Kinh nghiệm sửa chữa ${brand.name}`} posts={repairPosts} brandSlug={brand.slug} category={cats['sua-chua']} />
            </div>
          ) : tab === 'loi' ? (
            errors.total ? (
              <BrandPosts title={`Mã lỗi thiết bị bếp ${brand.name}`} posts={errors} brandSlug={brand.slug} category={cats.loi} />
            ) : (
              <div className={k.empty}>
                <p className={k.emptyTitle}>Chưa có bài mã lỗi {brand.name}</p>
                <p className="muted">
                  Thiết bị {brand.name} nhà anh/chị đang báo lỗi? Gọi{' '}
                  <a href={tel} className={k.strong}>
                    {settings.hotline}
                  </a>{' '}
                  để kỹ thuật viên tư vấn trực tiếp.
                </p>
                <Link href="/dat-lich" className="btn btn--sec">
                  Đặt lịch sửa {brand.name}
                </Link>
              </div>
            )
          ) : (
            <div className={s.repair}>
              {products.length ? (
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
              <BrandPosts title={`Bài viết về sản phẩm ${brand.name}`} posts={productPosts} brandSlug={brand.slug} category={cats['san-pham']} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
