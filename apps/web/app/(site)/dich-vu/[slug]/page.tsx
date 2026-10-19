import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRICE_NOTE, formatPriceRange } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { SectionTitle } from '@/components/SectionTitle';
import { BookingSection } from '@/components/BookingSection';
import { getService, getServices, getSettings } from '@/lib/api';
import { SITE_URL, lowerFirst, serviceHref } from '@/lib/site';
import s from './service.module.css';

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const sv = await getService(slug);
  if (!sv) return {};
  const title = sv.seoTitle ?? `${sv.name} tận nhà tại TP.HCM`;
  const description = sv.seoDesc ?? sv.lead;
  return {
    title: { absolute: `${title} | KitFix247` },
    description,
    alternates: { canonical: serviceHref(sv.slug) },
    openGraph: { title, description, url: serviceHref(sv.slug), type: 'website', ...(sv.imageUrl ? { images: [{ url: sv.imageUrl, alt: sv.imageAlt ?? sv.name }] } : {}) },
  };
}

export default async function ServicePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [sv, services, settings] = await Promise.all([getService(slug), getServices(), getSettings()]);
  if (!sv) notFound();

  const tel = `tel:${settings.hotlineTel}`;
  const url = `${SITE_URL}${serviceHref(sv.slug)}`;
  const h1 = `${sv.name} tận nhà tại TP.HCM`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: sv.name,
      serviceType: sv.name,
      description: sv.seoDesc ?? sv.lead,
      url,
      ...(sv.imageUrl ? { image: /^https?:\/\//.test(sv.imageUrl) ? sv.imageUrl : `${SITE_URL}${sv.imageUrl}` } : {}),
      areaServed: { '@type': 'City', name: 'TP. Hồ Chí Minh' },
      provider: {
        '@type': 'HomeAndConstructionBusiness',
        name: 'KitFix247',
        telephone: `+84${settings.hotlineTel.replace(/^0/, '')}`,
        address: { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: 'TP. Hồ Chí Minh', addressCountry: 'VN' },
      },
      ...(sv.faults.length
        ? {
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: sv.faultsTitle,
              itemListElement: sv.faults.map((f) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: f.title },
                priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'VND', minPrice: f.priceFrom, maxPrice: f.priceTo },
              })),
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: sv.faqs.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Dịch vụ', item: `${SITE_URL}/#dich-vu` },
        { '@type': 'ListItem', position: 3, name: sv.name, item: url },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Tab 8 dịch vụ */}
      <nav aria-label="Các dịch vụ" className={s.tabsBar}>
        <div className={`container ${s.tabs}`}>
          {services.map((t) => {
            const on = t.slug === sv.slug;
            return (
              <Link key={t.slug} href={serviceHref(t.slug)} className={s.tab} data-active={on} aria-current={on ? 'page' : undefined}>
                {t.shortName}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hero dịch vụ */}
      <section className="page-hero">
        <div className="container page-hero__in">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol>
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href="/#dich-vu">Dịch vụ</Link>
              </li>
              <li aria-current="page">{sv.name}</li>
            </ol>
          </nav>
          <h1>{h1}</h1>
          <p className="lead">{sv.lead}</p>
          <div className="btn-row">
            <a href={tel} className="btn btn--brand btn--lg">
              <Icon name="phone" />
              Gọi ngay {settings.hotline}
            </a>
            <a href={settings.zaloUrl} className="btn btn--dark btn--lg">
              <Icon name="chat" />
              Gửi ảnh lỗi qua Zalo
            </a>
          </div>
          <ul className={s.promises}>
            {settings.promises.map((p) => (
              <li key={p}>
                <Icon name="check" size={18} strokeWidth={2} style={{ color: 'var(--spark)' }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lỗi thường gặp */}
      {sv.faults.length > 0 && (
        <section aria-labelledby="loi-title" className="section">
          <div className="container">
            <SectionTitle id="loi-title" eyebrow="Lỗi thường gặp">
              {sv.faultsTitle}
            </SectionTitle>
            <div className={`grid ${s.faults}`}>
              {sv.faults.map((f) => (
                <article key={f.id} className={`card ${s.fault}`}>
                  <div className={s.faultHead}>
                    <h3 className={s.h3}>{f.title}</h3>
                    <span className="code-tag">{f.code}</span>
                  </div>
                  <p className={s.cause}>
                    <strong>Nguyên nhân thường gặp:</strong> {f.cause}
                  </p>
                  <div className={s.priceRow}>
                    <span className="muted">Giá tham khảo</span>
                    <span className={s.price}>{formatPriceRange(f.priceFrom, f.priceTo)}</span>
                  </div>
                </article>
              ))}
            </div>
            <p className="note">
              {PRICE_NOTE} Không thấy lỗi của nhà mình? Gọi{' '}
              <a href={tel} className={s.strong}>
                {settings.hotline}
              </a>{' '}
              hoặc mô tả trong form đặt lịch bên dưới.
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {sv.faqs.length > 0 && (
        <section aria-labelledby="faq-title" className="section section--sunken">
          <div className={`container ${s.faqWrap}`}>
            <h2 id="faq-title" className="h2">
              Câu hỏi thường gặp
            </h2>
            <div className={s.faqList}>
              {sv.faqs.map((q) => (
                <details key={q.id} className={s.faq}>
                  <summary className={s.faqQ}>
                    {q.question}
                    <Icon name="chevron" size={20} className={s.chev} />
                  </summary>
                  <p className={s.faqA}>{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <BookingSection settings={settings} title={`Đặt lịch ${lowerFirst(sv.name)}`} defaultDevice={sv.device} variant="page" />
    </>
  );
}
