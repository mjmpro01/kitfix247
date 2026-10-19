import Link from 'next/link';
import type { Brand, Category, PostPage, Settings } from '@kitfix/types';
import { ArticleCard, PostCover } from '@/components/ArticleCard';
import { Icon } from '@/components/Icon';
import { KNOWLEDGE_PATH, brandHref, formatDateVi, knowledgeHref, postHref, type KnowledgeFilters } from '@/lib/site';
import { BrandSelect } from './BrandSelect';
import s from './kien-thuc.module.css';

interface Props {
  settings: Settings;
  categories: Category[];
  brands: Brand[];
  result: PostPage;
  filters: KnowledgeFilters;
  /** Trang hãng: URL gốc là /kien-thuc/hang/[slug], hãng đã lọc sẵn. */
  fixedBrand?: Brand;
}

/** Trang 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push(null);
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push(null);
  out.push(total);
  return out;
}

export function KnowledgeList({ settings, categories, brands, result, filters, fixedBrand }: Props) {
  const base = fixedBrand ? brandHref(fixedBrand.slug) : KNOWLEDGE_PATH;
  // Trên trang hãng, hãng nằm trong path nên không đưa vào query.
  const own = (f: KnowledgeFilters) => knowledgeHref(base, fixedBrand ? { ...f, brand: undefined } : f);
  const brandSlug = fixedBrand?.slug ?? filters.brand ?? '';
  const cat = categories.find((c) => c.slug === filters.category);
  const brand = brands.find((b) => b.slug === brandSlug) ?? fixedBrand;
  const filtered = !!(filters.category || brandSlug || filters.q);

  const feat = !filtered && result.page === 1 ? result.items[0] : undefined;
  const rest = feat ? result.items.slice(1) : result.items;

  const parts = [cat?.name ?? filters.category, brand ? `hãng ${brand.name}` : undefined, filters.q ? `“${filters.q}”` : undefined].filter(
    Boolean,
  );
  const countText = `${result.total} bài viết${parts.length ? ` · ${parts.join(' · ')}` : ''}`;

  const brandHrefs: Record<string, string> = {
    '': knowledgeHref(KNOWLEDGE_PATH, { category: filters.category, q: filters.q }),
  };
  for (const b of brands) {
    brandHrefs[b.slug] = fixedBrand
      ? knowledgeHref(brandHref(b.slug), { category: filters.category, q: filters.q })
      : knowledgeHref(KNOWLEDGE_PATH, { category: filters.category, brand: b.slug, q: filters.q });
  }

  const chips = [{ slug: '', name: 'Tất cả' }, ...categories];
  const tel = `tel:${settings.hotlineTel}`;

  return (
    <>
      <section className={s.listSection} aria-label="Danh sách bài viết">
        <div className={`container ${s.listIn}`}>
          <div className={s.filters}>
            <nav aria-label="Lọc theo chuyên mục" className={s.chips}>
              {chips.map((c) => {
                const on = (filters.category ?? '') === c.slug;
                return (
                  <Link
                    key={c.slug || 'all'}
                    href={own({ ...filters, category: c.slug || undefined, page: undefined })}
                    className={s.chip}
                    data-active={on}
                    aria-current={on ? 'page' : undefined}
                    scroll={false}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </nav>
            <BrandSelect
              key={brandSlug}
              brands={brands}
              value={brandSlug}
              hrefs={brandHrefs}
              keep={{ category: filters.category, q: filters.q }}
            />
          </div>

          <p className={s.count} role="status">
            {countText}
          </p>

          {feat && (
            <article className={`card ${s.feat}`}>
              <PostCover post={feat} className={s.featImg} sizes="(max-width: 640px) 100vw, 580px" label="[Ảnh đại diện bài viết]" iconSize={56} priority />
              <div className={s.featBody}>
                <div className={s.featMeta}>
                  <span className={s.badgeBrand}>Nổi bật</span>
                  <span className="chip-dark">{feat.category}</span>
                  <span className="muted">
                    <time dateTime={feat.publishedAt}>{formatDateVi(feat.publishedAt)}</time> · {feat.readMinutes} phút đọc
                  </span>
                </div>
                <h2 className={s.featTitle}>
                  <Link href={postHref(feat.slug)} className={s.featLink}>
                    {feat.title}
                  </Link>
                </h2>
                <p className={s.featEx}>{feat.excerpt}</p>
                <span className={s.featMore} aria-hidden="true">
                  Đọc bài
                  <Icon name="arrow" size={16} strokeWidth={2} />
                </span>
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <div className={s.grid}>
              {rest.map((p) => (
                <ArticleCard key={p.id} post={p} brandSlug={brandSlug || undefined} />
              ))}
            </div>
          )}

          {result.total === 0 && (
            <div className={s.empty}>
              <h2 className={s.emptyTitle}>Chưa có bài phù hợp</h2>
              <p className="muted" style={{ margin: 0 }}>
                Anh/chị gọi{' '}
                <a href={tel} className={s.strong}>
                  {settings.hotline}
                </a>{' '}
                để kỹ thuật viên tư vấn trực tiếp.
              </p>
              <Link href={base} className="btn btn--sec">
                Xóa bộ lọc
              </Link>
            </div>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Phân trang" className={s.pager}>
              {result.page > 1 && (
                <Link href={own({ ...filters, page: result.page - 1 })} className={s.pageBtn} aria-label="Trang trước">
                  <Icon name="chevron" size={18} strokeWidth={2} style={{ transform: 'rotate(90deg)' }} />
                </Link>
              )}
              {pageWindow(result.page, result.totalPages).map((n, i) =>
                n === null ? (
                  <span key={`gap-${i}`} className={s.pageGap} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={own({ ...filters, page: n })}
                    className={s.pageBtn}
                    data-active={n === result.page}
                    aria-current={n === result.page ? 'page' : undefined}
                    aria-label={`Trang ${n}`}
                  >
                    {n}
                  </Link>
                ),
              )}
              {result.page < result.totalPages && (
                <Link href={own({ ...filters, page: result.page + 1 })} className={s.pageBtn} aria-label="Trang sau">
                  <Icon name="chevron" size={18} strokeWidth={2} style={{ transform: 'rotate(-90deg)' }} />
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>

      <section className={s.cta} aria-labelledby="kt-cta-title">
        <div className={`container ${s.ctaIn}`}>
          <div className={s.ctaText}>
            <h2 id="kt-cta-title" className="h2">
              Đọc rồi mà thiết bị vẫn chưa chạy?
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {settings.promises.join(' · ')}.
            </p>
          </div>
          <div className="btn-row">
            <a href={tel} className={`btn btn--brand btn--lg ${s.pill}`}>
              <Icon name="phone" strokeWidth={2} />
              Gọi {settings.hotline}
            </a>
            <Link href="/dat-lich" className={`btn btn--outline-ink btn--lg ${s.ctaBook}`}>
              Đặt lịch sửa
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
