import type { Metadata } from 'next';
import Link from 'next/link';
import { fillPageTokens, type ContentPageKey } from '@kitfix/types';
import s from '@/app/(site)/kien-thuc/[slug]/article.module.css';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { getSettings } from '@/lib/api';
import { CONTENT_PAGE_INFO } from '@/lib/content-pages';
import { renderArticle } from '@/lib/markdown';
import { SITE_URL } from '@/lib/site';
import c from './ContentPage.module.css';

export function contentPageMetadata(key: ContentPageKey): Metadata {
  const p = CONTENT_PAGE_INFO[key];
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: { type: 'website', title: `${p.title} | KitFix247`, description: p.description, url: p.path },
  };
}

/**
 * Trang nội dung theo layout bài viết (SPEC mục 4): breadcrumb, H1, thân bài ≤720px, khối gọi cuối trang.
 * Thân bài là Markdown admin soạn (settings.pages); chưa soạn thì dùng khung placeholder mặc định.
 */
export async function ContentPage({ pageKey }: { pageKey: ContentPageKey }) {
  const p = CONTENT_PAGE_INFO[pageKey];
  const settings = await getSettings();
  const { html } = renderArticle(fillPageTokens(settings.pages?.[pageKey] ?? p.defaultMd, settings));
  const url = `${SITE_URL}${p.path}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: p.title, item: url },
    ],
  };

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
              <li aria-current="page">{p.title}</li>
            </ol>
          </nav>
          <h1 className={s.h1}>{p.title}</h1>
        </header>

        <div className={`container ${s.layout} ${c.layout}`}>
          <div className={s.main}>
            <div className={s.body} dangerouslySetInnerHTML={{ __html: html }} />

            <aside aria-labelledby="cta-title" className={s.cta}>
              <h2 id="cta-title" className={s.ctaTitle}>
                {p.ctaTitle}
              </h2>
              <p className={s.ctaText}>
                {settings.hours}, {settings.hoursNote}.
              </p>
              <div className="btn-row">
                <a href={`tel:${settings.hotlineTel}`} className={`btn btn--brand btn--lg ${s.pill}`}>
                  <Icon name="phone" strokeWidth={2} />
                  Gọi {settings.hotline}
                </a>
                <Link href="/dat-lich" className={`btn btn--dark btn--lg ${s.ctaBook}`}>
                  Đặt lịch
                </Link>
              </div>
            </aside>
          </div>

          <aside className={s.side} aria-label="Cam kết và thông tin liên hệ">
            {settings.commitments.length > 0 && (
              <div className={s.box}>
                <h2 className={s.boxTitle}>Cam kết của chúng tôi</h2>
                <ul className={c.list}>
                  {settings.commitments.map((m) => (
                    <li key={m.title}>
                      <strong>{m.title}</strong> {m.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={s.box}>
              <h2 className={s.boxTitle}>Liên hệ</h2>
              <dl className={c.contact}>
                <dt>Địa chỉ</dt>
                <dd>{settings.address}</dd>
                <dt>Giờ làm</dt>
                <dd>
                  {settings.hours}, {settings.hoursNote}
                </dd>
                <dt>Hotline</dt>
                <dd>
                  <a href={`tel:${settings.hotlineTel}`} className={c.tel}>
                    {settings.hotline}
                  </a>
                </dd>
              </dl>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
