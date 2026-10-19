'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ServiceSummary, Settings } from '@kitfix/types';
import { Icon } from './Icon';
import { SHOW_PRICE_PAGE, serviceHref } from '@/lib/site';
import s from './SiteHeader.module.css';

type Key = 'home' | 'about' | 'dv' | 'gia' | 'kt' | 'lh';

const NAV: { key: Key; label: string; href: string }[] = [
  { key: 'home', label: 'Trang chủ', href: '/' },
  { key: 'about', label: 'Giới thiệu', href: '/gioi-thieu' },
  { key: 'dv', label: 'Dịch vụ', href: '/#dich-vu' },
  { key: 'gia', label: 'Bảng giá', href: '/bang-gia' },
  { key: 'kt', label: 'Kiến thức', href: '/kien-thuc' },
  { key: 'lh', label: 'Liên hệ', href: '/dat-lich' },
];
const VISIBLE_NAV = NAV.filter((n) => n.key !== 'gia' || SHOW_PRICE_PAGE);

function activeKey(path: string): Key | null {
  if (path === '/') return 'home';
  if (path.startsWith('/gioi-thieu')) return 'about';
  if (path.startsWith('/dich-vu')) return 'dv';
  if (path.startsWith('/bang-gia')) return 'gia';
  if (path.startsWith('/kien-thuc')) return 'kt';
  if (path.startsWith('/dat-lich')) return 'lh';
  return null;
}

interface Props {
  settings: Pick<Settings, 'hotline' | 'hotlineTel' | 'zaloUrl' | 'hours' | 'address'>;
  services: ServiceSummary[];
}

export function SiteHeader({ settings, services }: Props) {
  const pathname = usePathname() ?? '/';
  const active = activeKey(pathname);
  const [open, setOpen] = useState(false);
  const tel = `tel:${settings.hotlineTel}`;

  // Đóng panel mobile khi chuyển trang hoặc bấm Esc.
  useEffect(() => setOpen(false), [pathname]);
  // Bong bóng liên hệ ẩn khi panel đang mở để không đè lên menu.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-menu-open', open);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={s.header}>
      <div className={s.bar}>
        <Link href="/" className={s.logoLink} aria-label="KitFix247 — Trang chủ">
          <Image
            className={s.logo}
            src="/images/kitfix247-logo-1000.png"
            alt="KitFix247 — Sửa chuyên nghiệp. Dùng bền lâu."
            width={1000}
            height={331}
            priority
          />
        </Link>

        <nav className={s.navDesktop} aria-label="Menu chính">
          <ul className={s.navList}>
            {VISIBLE_NAV.map((n) =>
              n.key === 'dv' ? (
                <li key={n.key} className={s.dd}>
                  <Link href={n.href} className={s.navLink} data-active={active === n.key} aria-haspopup="true">
                    {n.label}
                    <Icon name="chevron" size={16} strokeWidth={2} />
                  </Link>
                  <div className={s.ddMenu}>
                    {services.map((sv) => (
                      <Link key={sv.slug} href={serviceHref(sv.slug)} className={s.ddItem} aria-current={pathname === serviceHref(sv.slug) ? 'page' : undefined}>
                        <span className={s.ddIcon}>
                          <Icon name={sv.icon} size={20} />
                        </span>
                        <span className={s.ddText}>
                          <span className={s.ddName}>{sv.name}</span>
                          <span className={s.ddHint}>{sv.shortHint}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </li>
              ) : (
                <li key={n.key}>
                  <Link href={n.href} className={s.navLink} data-active={active === n.key} aria-current={active === n.key ? 'page' : undefined}>
                    {n.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className={s.actions}>
          <a className={s.hotline} href={tel}>
            <Icon name="phoneRing" size={30} style={{ color: 'var(--heat)' }} />
            <span className={s.hotText}>
              <span className={s.hotLabel}>Hotline</span>
              <span className={s.hotNum}>{settings.hotline}</span>
            </span>
          </a>
          <Link href="/dat-lich" className={`btn btn--brand ${s.bookBtn}`}>
            Đặt lịch ngay
          </Link>
          <a href={tel} className={`btn btn--brand ${s.callBtn}`} aria-label={`Gọi ${settings.hotline}`}>
            <Icon name="phone" size={18} />
            <span className={s.callFull}>Gọi ngay</span>
            <span className={s.callShort}>Gọi</span>
          </a>
          <button
            type="button"
            className={s.burger}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="kf-mobile-menu"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="kf-mobile-menu" className={s.mpanel} aria-label="Menu">
          {VISIBLE_NAV.map((n) =>
            n.key === 'dv' ? (
              <details key={n.key} className={s.mDetails} open={active === 'dv'}>
                <summary className={s.mLink} data-active={active === n.key}>
                  {n.label}
                  <Icon name="chevron" size={20} className={s.chev} />
                </summary>
                <div className={s.mSub}>
                  {services.map((sv) => (
                    <Link key={sv.slug} href={serviceHref(sv.slug)} className={s.mSubLink} aria-current={pathname === serviceHref(sv.slug) ? 'page' : undefined}>
                      <Icon name={sv.icon} size={20} style={{ color: 'var(--heat-strong)' }} />
                      {sv.name}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={n.key} href={n.href} className={s.mLink} data-active={active === n.key} aria-current={active === n.key ? 'page' : undefined}>
                {n.label}
              </Link>
            ),
          )}
          <div className={s.mBtns}>
            <Link href="/dat-lich" className="btn btn--brand">
              Đặt lịch ngay
            </Link>
            <a href={settings.zaloUrl} className="btn btn--sec">
              Nhắn Zalo
            </a>
          </div>
          <a href={tel} className={s.mHot}>
            Hotline {settings.hotline}
          </a>
          <div className={s.mInfo}>
            {settings.hours} mỗi ngày · {settings.address.replace(/, TP\.HCM$/, '')}
          </div>
        </nav>
      )}
    </header>
  );
}
