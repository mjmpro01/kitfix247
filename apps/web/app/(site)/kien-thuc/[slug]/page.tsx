import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard, PostCover } from '@/components/ArticleCard';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { getPost, getPosts, getServices, getSettings } from '@/lib/api';
import { renderArticle } from '@/lib/markdown';
import { KNOWLEDGE_PATH, SITE_URL, brandHref, formatDateVi, knowledgeHref, lowerFirst, postHref, serviceHref, telLd } from '@/lib/site';
import s from './article.module.css';

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

/** Dịch vụ gợi ý luôn kèm khi bài không khớp thiết bị nào. */
const MAINTENANCE_DEVICE = 'Vệ sinh / bảo dưỡng';

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = post.metaTitle || post.title;
  const description = post.metaDesc || post.excerpt;
  const url = postHref(post.slug);
  return {
    title: { absolute: `${title} | KitFix247` },
    description,
    keywords: post.focusKeyword ? [post.focusKeyword] : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: post.category,
      ...(post.coverUrl ? { images: [{ url: post.coverUrl, alt: post.coverAlt ?? post.title }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [post, settings, services] = await Promise.all([getPost(slug), getSettings(), getServices()]);
  if (!post) notFound();

  const { html, toc } = renderArticle(post.contentMd);
  const tel = `tel:${settings.hotlineTel}`;
  const url = `${SITE_URL}${postHref(post.slug)}`;
  const catHref = knowledgeHref(KNOWLEDGE_PATH, { category: post.categorySlug });
  const relatedServices = [
    ...services.filter((sv) => post.device && sv.device === post.device),
    ...services.filter((sv) => sv.device === MAINTENANCE_DEVICE && sv.device !== post.device),
  ].slice(0, 2);
  const deviceLabel = post.device ? lowerFirst(post.device) : 'thiết bị';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDesc || post.excerpt,
      image: [post.coverUrl ? new URL(post.coverUrl, SITE_URL).toString() : `${SITE_URL}/images/kitfix247-logo-1000.png`],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      articleSection: post.category,
      ...(post.focusKeyword ? { keywords: post.focusKeyword } : {}),
      ...(post.brands.length ? { about: post.brands.map((b) => ({ '@type': 'Brand', name: b.name })) } : {}),
      inLanguage: 'vi-VN',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Organization', name: post.author, url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'KitFix247',
        telephone: telLd(settings.hotlineTel),
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/kitfix247-logo-1000.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Kiến thức', item: `${SITE_URL}${KNOWLEDGE_PATH}` },
        { '@type': 'ListItem', position: 3, name: post.category, item: `${SITE_URL}${catHref}` },
        { '@type': 'ListItem', position: 4, name: post.title, item: url },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className={`container ${s.head}`}>
          <nav aria-label="Breadcrumb" className={s.crumb}>
            <ol>
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href={KNOWLEDGE_PATH}>Kiến thức</Link>
              </li>
              <li>
                <Link href={catHref}>{post.category}</Link>
              </li>
              <li aria-current="page" className="visually-hidden">
                {post.title}
              </li>
            </ol>
          </nav>
          <ul className={s.labels} aria-label="Nhãn bài viết">
            <li>
              <Link href={catHref} className={s.labelCat}>
                {post.category}
              </Link>
            </li>
            {post.device && (
              <li>
                <Link href={knowledgeHref(KNOWLEDGE_PATH, { q: post.device })} className={s.label}>
                  {post.device}
                </Link>
              </li>
            )}
            {post.brands.map((b) => (
              <li key={b.slug}>
                <Link href={brandHref(b.slug)} className={s.label}>
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
          <h1 className={s.h1}>{post.title}</h1>
          <div className={s.meta}>
            <span className={s.author}>
              <span className={s.avatar} aria-hidden="true">
                <Icon name="wrench" size={16} />
              </span>
              {post.author}
            </span>
            <span>
              Cập nhật <time dateTime={post.updatedAt}>{formatDateVi(post.updatedAt)}</time>
            </span>
            <span>{post.readMinutes} phút đọc</span>
          </div>
        </header>

        <div className="container">
          <figure className={s.figure}>
            <PostCover
              post={post}
              className={s.cover}
              sizes="(max-width: 1160px) 100vw, 1128px"
              label={`[Ảnh đại diện: ${post.coverAlt ?? post.title}]`}
              iconSize={56}
              priority
            />
          </figure>
        </div>

        <div className={`container ${s.layout}`}>
          <div className={s.main}>
            <div className={s.body} dangerouslySetInnerHTML={{ __html: html }} />

            <aside aria-labelledby="cta-title" className={s.cta}>
              <h2 id="cta-title" className={s.ctaTitle}>
                Đã thử mà {deviceLabel} vẫn chưa ổn?
              </h2>
              <p className={s.ctaText}>{settings.promises.join(' · ')}.</p>
              <div className="btn-row">
                <a href={tel} className={`btn btn--brand btn--lg ${s.pill}`}>
                  <Icon name="phone" strokeWidth={2} />
                  Gọi {settings.hotline}
                </a>
                <Link href="/dat-lich" className={`btn btn--dark btn--lg ${s.ctaBook}`}>
                  Đặt lịch sửa
                </Link>
              </div>
            </aside>
          </div>

          <aside className={s.side} aria-label="Mục lục và dịch vụ liên quan">
            {toc.length > 0 && (
              <nav aria-labelledby="toc-title" className={s.box}>
                <h2 id="toc-title" className={s.boxTitle}>
                  Mục lục
                </h2>
                <ol className={s.toc}>
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`}>{t.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {relatedServices.length > 0 && (
              <div className={s.box}>
                <h2 className={s.boxTitle}>Dịch vụ liên quan</h2>
                <ul className={s.svcList}>
                  {relatedServices.map((sv) => (
                    <li key={sv.slug}>
                      <Link href={serviceHref(sv.slug)} className={s.svcLink}>
                        {sv.name} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className={s.trust}>{settings.promises.join(' · ')}</p>
          </aside>
        </div>
      </article>

      {post.related.length > 0 && (
        <section aria-labelledby="lien-quan-title" className={s.related}>
          <div className={`container ${s.relatedIn}`}>
            <div className="sec-row">
              <div className="sec-head">
                <h2 id="lien-quan-title" className="h2-upper">
                  Bài viết liên quan
                </h2>
                <span className="sec-bar" aria-hidden="true" />
              </div>
              <Link href={KNOWLEDGE_PATH} className="link-arrow link-arrow--ink">
                Xem tất cả bài viết →
              </Link>
            </div>
            <div className={s.relatedGrid}>
              {post.related.map((p) => (
                <ArticleCard key={p.id} post={p} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
