import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_MENU, type ServiceSummary, type Settings } from '@kitfix/types';
import { Icon } from './Icon';
import { serviceHref } from '@/lib/site';
import s from './SiteFooter.module.css';

interface Props {
  settings: Settings;
  services: ServiceSummary[];
}

export function SiteFooter({ settings, services }: Props) {
  // Footer gộp bếp từ + bếp hồng ngoại thành một dòng như artboard.
  const induction = services.find((x) => x.slug === 'sua-bep-tu');
  const rest = services.filter((x) => x.slug !== 'sua-bep-tu' && x.slug !== 'sua-bep-hong-ngoai');
  const year = new Date().getFullYear();
  // Bảng giá chỉ hiện ở footer khi admin bật mục /bang-gia trong Menu điều hướng.
  const showPricePage = (settings.menu?.length ? settings.menu : DEFAULT_MENU).some((m) => m.visible && m.href === '/bang-gia');

  return (
    <footer className={s.footer}>
      <div className={s.in}>
        <div className={s.cols}>
          <div className={s.brandCol}>
            <Link href="/" className={s.logoPlate} aria-label="KitFix247 — Trang chủ">
              <Image src="/images/kitfix247-logo-1000.png" alt="KitFix247 — Sửa chuyên nghiệp. Dùng bền lâu." width={133} height={44} className={s.logo} />
            </Link>
            <p className={s.muted}>{settings.about}</p>
            <a href={`tel:${settings.hotlineTel}`} className={s.hot}>
              {settings.hotline}
            </a>
          </div>

          <div className={s.col}>
            <h2 className={s.h}>Dịch vụ</h2>
            <ul className={s.list}>
              {induction && (
                <li>
                  <Link href={serviceHref(induction.slug)}>Sửa bếp từ, bếp hồng ngoại</Link>
                </li>
              )}
              {rest.map((sv) => (
                <li key={sv.slug}>
                  <Link href={serviceHref(sv.slug)}>{sv.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={s.col}>
            <h2 className={s.h}>Hỗ trợ</h2>
            <ul className={s.list}>
              <li>
                <Link href="/chinh-sach-bao-hanh">Chính sách bảo hành</Link>
              </li>
              {showPricePage && (
                <li>
                  <Link href="/bang-gia">Bảng giá</Link>
                </li>
              )}
              <li>
                <Link href="/kien-thuc">Kiến thức &amp; mẹo hay</Link>
              </li>
              <li>
                <Link href="/san-pham">Linh kiện &amp; dụng cụ</Link>
              </li>
              <li>
                <Link href="/gioi-thieu">Giới thiệu</Link>
              </li>
              <li>
                <Link href="/dat-lich">Liên hệ &amp; đặt lịch</Link>
              </li>
            </ul>
          </div>

          <div className={s.col}>
            <h2 className={s.h}>Liên hệ</h2>
            <div className={s.info}>
              <Icon name="pin" size={18} className={s.spark} />
              <span>{settings.address}</span>
            </div>
            <div className={s.info}>
              <Icon name="clock" size={18} className={s.spark} />
              <span>
                {settings.hours}, {settings.hoursNote}
              </span>
            </div>
            <h2 className={`${s.h} ${s.hGap}`}>Thanh toán</h2>
            <ul className={s.pay}>
              {settings.payments.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={s.bottom}>
          <span>© {year} KitFix247 · kitfix247.com</span>
          <span>
            <Link href="/chinh-sach-bao-hanh">Chính sách bảo hành</Link> · <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
