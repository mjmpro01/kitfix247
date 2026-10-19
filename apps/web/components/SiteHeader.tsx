'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DEFAULT_MENU, isMenuActive, type MenuItem, type ServiceSummary, type Settings } from '@kitfix/types';
import { Icon } from './Icon';
import { CartLink } from './cart/CartLink';
import { serviceHref } from '@/lib/site';
import s from './SiteHeader.module.css';

interface Props {
  settings: Pick<Settings, 'hotline' | 'hotlineTel' | 'zaloUrl' | 'hours' | 'address' | 'menu'>;
  services: ServiceSummary[];
}

/** Link nội bộ dùng next/link; link ngoài (https://) dùng thẻ a thường. */
function NavLink({ item, className, active }: { item: MenuItem; className: string; active: boolean }) {
  const props = { className, 'data-active': active, 'aria-current': active ? ('page' as const) : undefined };
  return item.href.startsWith('/') ? (
    <Link href={item.href} {...props}>
      {item.label}
    </Link>
  ) : (
    <a href={item.href} rel="noopener" {...props}>
      {item.label}
    </a>
  );
}

export function SiteHeader({ settings, services }: Props) {
  const pathname = usePathname() ?? '/';
  // Menu do admin sắp xếp (Admin › Menu điều hướng); chưa lưu thì dùng menu mặc định.
  const menu = (settings.menu?.length ? settings.menu : DEFAULT_MENU).filter((m) => m.visible);
  // Mục Dịch vụ xổ các dịch vụ bật "Hiện card ở trang chủ & menu".
  const menuServices = services.filter((sv) => sv.showHome);
  const isActive = (m: MenuItem) => (m.kind === 'services' ? pathname.startsWith('/dich-vu') : isMenuActive(m.href, pathname));
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
            width={145}
            height={48}
            priority
          />
        </Link>

        <nav className={s.navDesktop} aria-label="Menu chính">
          <ul className={s.navList}>
            {menu.map((n) =>
              n.kind === 'services' ? (
                <li key={`${n.label}-${n.href}`} className={s.dd}>
                  <Link href={n.href} className={s.navLink} data-active={isActive(n)} aria-haspopup="true">
                    {n.label}
                    <Icon name="chevron" size={16} strokeWidth={2} />
                  </Link>
                  <div className={s.ddMenu}>
                    {menuServices.map((sv) => (
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
                <li key={`${n.label}-${n.href}`}>
                  <NavLink item={n} className={s.navLink} active={isActive(n)} />
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className={s.actions}>
          <CartLink />
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
          {menu.map((n) =>
            n.kind === 'services' ? (
              <details key={`${n.label}-${n.href}`} className={s.mDetails} open={isActive(n)}>
                <summary className={s.mLink} data-active={isActive(n)}>
                  {n.label}
                  <Icon name="chevron" size={20} className={s.chev} />
                </summary>
                <div className={s.mSub}>
                  {menuServices.map((sv) => (
                    <Link key={sv.slug} href={serviceHref(sv.slug)} className={s.mSubLink} aria-current={pathname === serviceHref(sv.slug) ? 'page' : undefined}>
                      <Icon name={sv.icon} size={20} style={{ color: 'var(--heat-strong)' }} />
                      {sv.name}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <NavLink key={`${n.label}-${n.href}`} item={n} className={s.mLink} active={isActive(n)} />
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
