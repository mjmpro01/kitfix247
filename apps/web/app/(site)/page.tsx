import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { SectionTitle } from '@/components/SectionTitle';
import { BookingSection } from '@/components/BookingSection';
import {
  getHomeBrands,
  getHomeReviews,
  getLatestPosts,
  getProcessSteps,
  getProducts,
  getServices,
  getSettings,
} from '@/lib/api';
import { SITE_URL, formatDateVi, serviceHref } from '@/lib/site';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { PostCover } from '@/components/ArticleCard';
import s from './home.module.css';

export const revalidate = 300;

export default async function HomePage() {
  const [settings, services, steps, brands, reviews, products, posts] = await Promise.all([
    getSettings(),
    getServices(),
    getProcessSteps(),
    getHomeBrands(),
    getHomeReviews(),
    getProducts({ limit: 4 }),
    getLatestPosts(3),
  ]);
  const tel = `tel:${settings.hotlineTel}`;
  const heroLayout = settings.hero.layout ?? 'overlay';
  const homeServices = services.filter((x) => x.showHome);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: 'KitFix247',
    slogan: settings.tagline,
    url: settings.siteUrl,
    logo: `${SITE_URL}/images/kitfix247-logo-1000.png`,
    image: /^https?:\/\//.test(settings.hero.imageUrl) ? settings.hero.imageUrl : `${SITE_URL}${settings.hero.imageUrl}`,
    telephone: `+84${settings.hotlineTel.replace(/^0/, '')}`,
    address: { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: 'TP. Hồ Chí Minh', addressCountry: 'VN' },
    areaServed: 'TP. Hồ Chí Minh',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '21:00',
    },
    paymentAccepted: settings.payments.join(', '),
    makesOffer: services.map((sv) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: sv.name, url: `${SITE_URL}${serviceHref(sv.slug)}` } })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {heroLayout === 'clean' ? (
        /* HERO ảnh sạch (không chữ): tiêu đề, đoạn dẫn, nút là chữ thật đặt trên ảnh */
        <section aria-labelledby="hero-title" className={`${s.hero} ${s.clean}`}>
          <Image
            className={s.cleanImg}
            src={settings.hero.imageUrl}
            alt={settings.hero.imageAlt}
            fill
            sizes="100vw"
            priority
            unoptimized={/^https?:\/\//.test(settings.hero.imageUrl)}
          />
          <div className={`container ${s.cleanIn}`}>
            <h1 id="hero-title" className={s.cleanH1}>
              {settings.hero.h1}
            </h1>
            <p className={s.cleanLead}>{settings.hero.mobileLead}</p>
            <div className={s.cleanBtns}>
              <a href={tel} className={`btn btn--brand ${s.heroBtnCall}`}>
                <Icon name="phone" strokeWidth={2} />
                Gọi ngay {settings.hotline}
              </a>
              <a href="#dat-lich" className={`btn btn--dark ${s.heroBtnBook}`}>
                <Icon name="calendar" />
                Đặt lịch sửa chữa
              </a>
            </div>
          </div>
        </section>
      ) : (
        // HERO banner có chữ sẵn: 2 nút HTML phủ đúng vị trí nút trong ảnh (ảnh ghi sai số).
        <section aria-label="Giới thiệu dịch vụ" className={s.hero}>
          <h1 className="visually-hidden">{settings.hero.h1}</h1>
          <div className={s.bannerWrap}>
            <Image
              className={s.banner}
              src={settings.hero.imageUrl}
              alt={settings.hero.imageAlt}
              width={1024}
              height={310}
              sizes="100vw"
              priority
              unoptimized={/^https?:\/\//.test(settings.hero.imageUrl)}
            />
            <a href={tel} className={`${s.ov} ${s.ovCall}`}>
              <Icon name="phone" strokeWidth={2} className={s.ovIcon} />
              Gọi ngay {settings.hotline}
            </a>
            <a href="#dat-lich" className={`${s.ov} ${s.ovBook}`}>
              <Icon name="calendar" className={s.ovIcon} />
              Đặt lịch sửa chữa
            </a>
          </div>
          <div className={s.heroMobile}>
            <div className={s.heroTitle} aria-hidden="true">
              <span className={s.heroL1}>{settings.hero.mobileLine1}</span>
              <span className={s.heroL2}>{settings.hero.mobileLine2}</span>
            </div>
            <p className={s.heroLead}>{settings.hero.mobileLead}</p>
            <a href={tel} className={`btn btn--brand ${s.heroBtnCall}`}>
              <Icon name="phone" strokeWidth={2} />
              Gọi ngay {settings.hotline}
            </a>
            <a href="#dat-lich" className={`btn btn--dark ${s.heroBtnBook}`}>
              <Icon name="calendar" />
              Đặt lịch sửa chữa
            </a>
          </div>
        </section>
      )}

      {/* DẢI HÃNG — chỉ dùng logo chủ tải lên; chưa có thì hiện tên bằng chữ */}
      <section aria-label="Các hãng chúng tôi sửa" className={s.brands}>
        <ul className={s.brandList}>
          {brands.map((b) => (
            <li key={b.slug}>
              <Link href={`/kien-thuc/hang/${b.slug}`} className={s.brandBtn} title={`Kiến thức & sửa chữa thiết bị ${b.name}`}>
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo do admin tải lên, kích thước không cố định
                  <img src={b.logoUrl} alt={b.name} className={b.logoStyle === 'gray' ? s.brandLogoGray : s.brandLogo} />
                ) : (
                  <span className={s.brandName}>{b.name}</span>
                )}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/kien-thuc" className={s.brandMore}>
              và nhiều hãng khác →
            </Link>
          </li>
        </ul>
      </section>

      {/* CAM KẾT */}
      <section aria-label="Cam kết" className={s.features}>
        <div className={`container ${s.featGrid}`}>
          {settings.features.map((f) => (
            <div key={f.title} className={s.feat}>
              <span className={s.featIcon}>
                <Icon name={f.icon} size={26} />
              </span>
              <span className={s.featText}>
                <span className={s.featT}>{f.title}</span>
                <span className={s.featD}>{f.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* DỊCH VỤ */}
      <section id="dich-vu" aria-labelledby="dich-vu-title" className="section">
        <div className="container">
          <div className={s.svcHead}>
            <span aria-hidden="true" />
            <SectionTitle id="dich-vu-title" center>
              Dịch vụ của chúng tôi
            </SectionTitle>
            <Link href={serviceHref(homeServices[0]?.slug ?? 'sua-bep-tu')} className={`btn btn--outline-ink hide-mobile ${s.svcAll}`}>
              Xem tất cả dịch vụ
              <Icon name="arrow" size={16} strokeWidth={2} />
            </Link>
          </div>
          <div className={`grid ${s.svcGrid}`}>
            {homeServices.map((sv) => (
              <article key={sv.slug} className={`card ${s.svcCard}`}>
                {sv.imageUrl ? (
                  <div className={`${s.svcImg} ${s.svcImgHas}`}>
                    <Image
                      src={sv.imageUrl}
                      alt={sv.imageAlt ?? sv.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                      unoptimized={/^https?:\/\//.test(sv.imageUrl)}
                    />
                  </div>
                ) : (
                  <div className={`placeholder-img ${s.svcImg}`}>
                    <Icon name={sv.icon} size={44} strokeWidth={1.25} />[Ảnh {sv.shortName.toLocaleLowerCase('vi')}]
                  </div>
                )}
                <div className={s.svcBody}>
                  <h3 className={s.h3}>
                    <Link href={serviceHref(sv.slug)} className={s.cardLink}>
                      {sv.name}
                    </Link>
                  </h3>
                  <p className={s.cardText}>{sv.cardText}</p>
                  <span className={s.more} aria-hidden="true">
                    Xem chi tiết
                    <Icon name="arrow" size={16} strokeWidth={2} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* QUY TRÌNH */}
      <section aria-labelledby="quy-trinh-title" className="section section--sunken">
        <div className="container">
          <SectionTitle id="quy-trinh-title" center>
            Quy trình {steps.length} bước
          </SectionTitle>
          <ol className={`grid ${s.steps}`}>
            {steps.map((st) => (
              <li key={st.n} className={s.step}>
                <div className={s.stepN}>{st.n}</div>
                <h3 className={s.h3}>{st.title}</h3>
                <p className={s.cardText}>{st.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ĐÁNH GIÁ */}
      <section aria-labelledby="danh-gia-title" className="section">
        <div className="container">
          <div className="sec-row">
            <SectionTitle id="danh-gia-title">Khách hàng nói gì</SectionTitle>
            <div className={s.rating}>
              <div className={s.ratingNum}>
                {settings.rating.score}
                <span>/{settings.rating.outOf}</span>
              </div>
              <div className={s.ratingSide}>
                <div className={s.stars} role="img" aria-label={`${settings.rating.score} trên ${settings.rating.outOf} sao`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star" size={18} strokeWidth={1.5} filled />
                  ))}
                </div>
                <div className="note">{settings.rating.label}</div>
              </div>
            </div>
          </div>
          <div className={`grid ${s.reviews}`}>
            {reviews.map((r) => {
              const initial = r.customerName.replace(/[[\]]/g, '').trim().split(/\s+/).pop()?.charAt(0) ?? '';
              return (
                <figure key={r.id} className={s.review}>
                  <div className={s.revTop}>
                    <Icon name="star" size={16} strokeWidth={1.5} filled />
                    <span>
                      {r.rating}/5<span className="visually-hidden"> sao</span>
                    </span>
                    <span className={s.revDevice}>· {r.device}</span>
                  </div>
                  <blockquote className={s.quote}>“{r.content}”</blockquote>
                  <figcaption className={s.revBy}>
                    <div className={s.avatar} aria-hidden="true">
                      {initial}
                    </div>
                    <div className={s.revWho}>
                      <span className={s.revName}>{r.customerName}</span>
                      <span className={s.revArea}>
                        <Icon name="pin" size={14} />
                        {r.area}
                      </span>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* LINH KIỆN */}
      {products.length > 0 && (
        <section aria-labelledby="linh-kien-title" className="section section--sunken">
          <div className="container">
            <div className="sec-row">
              <SectionTitle id="linh-kien-title">Linh kiện &amp; dụng cụ</SectionTitle>
              <Link href="/san-pham" className="link-arrow">
                Xem tất cả sản phẩm
                <Icon name="arrow" size={16} strokeWidth={2} />
              </Link>
            </div>
            <div className={`grid ${s.products}`}>
              {products.map((p) => (
                <article key={p.id} className={`card ${s.product}`}>
                  {p.imageUrl ? (
                    <div className={`${s.productImg} ${s.productImgHas}`}>
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                        unoptimized={/^https?:\/\//.test(p.imageUrl)}
                      />
                    </div>
                  ) : (
                    <div className={s.productImg}>
                      <Icon name={p.icon} size={40} strokeWidth={1.5} />
                      [Ảnh sản phẩm]
                    </div>
                  )}
                  <div className={s.productBody}>
                    <div className="note">{p.category}</div>
                    <h3 className={s.productName}>{p.name}</h3>
                    <div className={s.price}>{p.price != null ? formatPrice(p.price) : 'Giá: liên hệ'}</div>
                    <AddToCartButton productId={p.id} productName={p.name} className={`btn btn--sec ${s.cartBtn}`} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* KIẾN THỨC */}
      {posts.length > 0 && (
        <section aria-labelledby="kien-thuc-title" className="section">
          <div className="container">
            <div className="sec-row">
              <SectionTitle id="kien-thuc-title">Kiến thức &amp; mẹo hay</SectionTitle>
              <Link href="/kien-thuc" className="link-arrow link-arrow--ink">
                Xem tất cả bài viết
                <Icon name="arrow" size={16} strokeWidth={2} />
              </Link>
            </div>
            <div className={`grid ${s.posts}`}>
              {posts.map((p) => (
                <article key={p.id} className={`card ${s.post}`}>
                  <PostCover post={p} className={s.postImg} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px" label="[Ảnh đại diện bài viết]" iconSize={40} />
                  <div className={s.postBody}>
                    <div className={s.postMeta}>
                      <span className="chip-dark">{p.category}</span>
                      <time dateTime={p.publishedAt} className="muted">
                        {formatDateVi(p.publishedAt)}
                      </time>
                    </div>
                    <h3 className={s.h3}>
                      <Link href={`/kien-thuc/${p.slug}`} className={s.cardLink}>
                        {p.title}
                      </Link>
                    </h3>
                    <p className={s.cardText}>{p.excerpt}</p>
                    <span className={s.more} aria-hidden="true">
                      Đọc tiếp
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <BookingSection settings={settings} title="Đặt lịch sửa tại nhà" />
    </>
  );
}
