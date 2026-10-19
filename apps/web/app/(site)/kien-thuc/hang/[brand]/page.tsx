import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS_PER_PAGE, type BrandDetail } from '@kitfix/types';
import { JsonLd } from '@/components/JsonLd';
import { getBrand, getBrands, getCategories, getPosts, getSettings } from '@/lib/api';
import { KNOWLEDGE_PATH, SITE_URL, brandHref, knowledgeHref } from '@/lib/site';
import { KnowledgeList } from '../../KnowledgeList';
import { readFilters, type SearchParams } from '../../params';
import s from '../../kien-thuc.module.css';

export const revalidate = 300;

type Params = Promise<{ brand: string }>;

/** Mô tả mặc định khi admin chưa nhập mô tả trang hãng. */
const brandDesc = (b: BrandDetail) =>
  b.description ||
  `Mã lỗi, mẹo dùng bền và hướng dẫn xử lý sự cố bếp từ, máy hút mùi, lò nướng, máy rửa chén ${b.name} — do kỹ thuật viên KitFix247 tổng hợp.`;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const [{ brand: slug }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrand(slug);
  if (!b) return {};
  const f = readFilters(sp);
  const title = b.seoTitle ?? `Kiến thức thiết bị ${b.name}: mã lỗi, mẹo dùng, sửa chữa`;
  const description = b.seoDesc ?? brandDesc(b);
  const canonical = knowledgeHref(brandHref(b.slug), { category: f.category, page: f.page });
  return {
    title: { absolute: `${title} | KitFix247` },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', ...(b.logoUrl ? { images: [b.logoUrl] } : {}) },
    robots: f.q ? { index: false, follow: true } : undefined,
  };
}

export default async function BrandKnowledgePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ brand: slug }, sp] = await Promise.all([params, searchParams]);
  const filters = { ...readFilters(sp), brand: slug };
  const [brand, settings, categories, brands, result] = await Promise.all([
    getBrand(slug),
    getSettings(),
    getCategories(),
    getBrands(),
    getPosts({ ...filters, limit: POSTS_PER_PAGE }),
  ]);
  if (!brand) notFound();
  if (filters.page && filters.page > result.totalPages) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Kiến thức', item: `${SITE_URL}${KNOWLEDGE_PATH}` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: `${SITE_URL}${brandHref(brand.slug)}` },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className={s.hero}>
        <div className={`container ${s.brandHeroIn}`}>
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol>
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href={KNOWLEDGE_PATH}>Kiến thức</Link>
              </li>
              <li aria-current="page">{brand.name}</li>
            </ol>
          </nav>
          <div className={s.brandRow}>
            <div className={s.logoBox}>
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo do admin tải lên, kích thước không cố định
                <img src={brand.logoUrl} alt={`Logo ${brand.name}`} />
              ) : (
                <span className={s.logoName}>{brand.name}</span>
              )}
            </div>
            <div className={s.brandText}>
              <h1 className={s.h1}>
                Kiến thức thiết bị <span>{brand.name}</span>
              </h1>
              <p className={s.brandDesc}>{brandDesc(brand)}</p>
            </div>
            <Link href="/dat-lich" className={`btn btn--brand btn--lg ${s.brandCta}`}>
              Đặt lịch sửa {brand.name}
            </Link>
          </div>
        </div>
      </section>

      <KnowledgeList settings={settings} categories={categories} brands={brands} result={result} filters={filters} fixedBrand={brand} />
    </>
  );
}
