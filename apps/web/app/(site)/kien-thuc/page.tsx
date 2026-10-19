import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS_PER_PAGE } from '@kitfix/types';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { getBrands, getCategories, getPosts, getSettings } from '@/lib/api';
import { KNOWLEDGE_PATH, SITE_URL, knowledgeHref } from '@/lib/site';
import { KnowledgeList } from './KnowledgeList';
import { readFilters, type SearchParams } from './params';
import s from './kien-thuc.module.css';

export const revalidate = 300;

const TITLE = 'Kiến thức & mẹo hay';
const DESCRIPTION =
  'Bảng mã lỗi, mẹo dùng bền và tư vấn sửa chữa bếp từ, máy hút mùi, lò nướng, lò vi sóng, máy rửa chén — do kỹ thuật viên KitFix247 viết.';

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const f = readFilters(await searchParams);
  const canonical = knowledgeHref(KNOWLEDGE_PATH, { category: f.category, page: f.page });
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: { title: `${TITLE} | KitFix247`, description: DESCRIPTION, url: canonical, type: 'website' },
    // Trang kết quả tìm kiếm / lọc hãng không nên vào chỉ mục (trang hãng riêng đã có URL sạch).
    robots: f.q || f.brand ? { index: false, follow: true } : undefined,
  };
}

export default async function KnowledgePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = readFilters(await searchParams);
  const [settings, categories, brands, result] = await Promise.all([
    getSettings(),
    getCategories(),
    getBrands(),
    getPosts({ ...filters, limit: POSTS_PER_PAGE }),
  ]);
  if (filters.page && filters.page > result.totalPages) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Kiến thức', item: `${SITE_URL}${KNOWLEDGE_PATH}` },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className={s.hero}>
        <div className={`container ${s.heroIn}`}>
          <div className={s.heroText}>
            <nav aria-label="Breadcrumb" className="breadcrumb">
              <ol>
                <li>
                  <Link href="/">Trang chủ</Link>
                </li>
                <li aria-current="page">Kiến thức</li>
              </ol>
            </nav>
            <h1 className={s.h1}>
              Kiến thức &amp; <span>mẹo hay</span>
            </h1>
            <p className={s.heroLead}>Bảng mã lỗi, mẹo dùng bền và tư vấn sửa chữa thiết bị nhà bếp — do kỹ thuật viên KitFix247 viết.</p>
          </div>
          <form role="search" action={KNOWLEDGE_PATH} method="get" className={s.search}>
            {filters.category && <input type="hidden" name="category" value={filters.category} />}
            {filters.brand && <input type="hidden" name="brand" value={filters.brand} />}
            <Icon name="search" />
            <label htmlFor="tim-bai" className="visually-hidden">
              Tìm bài viết
            </label>
            <input
              id="tim-bai"
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Tìm mã lỗi, tên thiết bị… (vd: E4)"
              maxLength={100}
            />
            <button type="submit" className={s.searchBtn}>
              Tìm
            </button>
          </form>
        </div>
      </section>

      <KnowledgeList settings={settings} categories={categories} brands={brands} result={result} filters={filters} />
    </>
  );
}
