'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from '@/app/admin/admin.module.css';
import { AdminIcon, type AdminIconName } from './AdminIcon';

interface Item {
  name: string;
  icon: AdminIconName;
  /** Chưa có màn hình (SPEC bước 6 trở đi) → hiện "Sắp có", không bấm được. */
  href?: string;
  /** Đường dẫn được tính là đang mở (mặc định = href). */
  match?: (path: string) => boolean;
  badge?: number;
}

export function AdminSidebar({ waiting, newOrders }: { waiting: number; newOrders: number }) {
  const path = usePathname();
  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Vận hành',
      items: [
        { name: 'Tổng quan', icon: 'grid', href: '/admin', match: (p) => p === '/admin' },
        { name: 'Lịch hẹn', icon: 'cal', href: '/admin/lich-hen', badge: waiting },
        { name: 'Đơn hàng', icon: 'bag', href: '/admin/don-hang', badge: newOrders },
      ],
    },
    {
      title: 'Nội dung',
      items: [
        { name: 'Dịch vụ', icon: 'wrench', href: '/admin/dich-vu' },
        { name: 'Bảng giá', icon: 'tag', href: '/admin/dich-vu#bang-gia', match: () => false },
        { name: 'Sản phẩm (Shop)', icon: 'box', href: '/admin/san-pham' },
        { name: 'Bài viết & SEO', icon: 'doc', href: '/admin/bai-viet' },
        { name: 'Thương hiệu', icon: 'tag', href: '/admin/thuong-hieu' },
        { name: 'Đánh giá khách hàng', icon: 'star', href: '/admin/danh-gia' },
        { name: 'Trang chủ & Hero', icon: 'home' },
      ],
    },
    {
      title: 'Cài đặt',
      items: [
        { name: 'Menu điều hướng', icon: 'menu' },
        { name: 'Hotline, Zalo, CTA', icon: 'phone', href: '/admin/cai-dat' },
        { name: 'Footer & thanh toán', icon: 'card', href: '/admin/cai-dat#thanh-toan', match: () => false },
        { name: 'Giới thiệu & chính sách', icon: 'shield', href: '/admin/trang-noi-dung' },
      ],
    },
  ];

  return (
    <nav className={s.side} aria-label="Menu quản trị">
      <div className={s.sideHead}>
        <span className={s.sideLogo}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo nhỏ, không cần tối ưu ảnh */}
          <img src="/images/kitfix247-logo-1000.png" alt="KitFix247" width={109} height={36} />
        </span>
        <span className={s.sideTag}>Quản trị</span>
      </div>
      <div className={s.groups}>
        {groups.map((g) => (
          <div key={g.title} className={s.group} role="group" aria-label={g.title}>
            <div className={s.groupTitle} aria-hidden="true">
              {g.title}
            </div>
            {g.items.map((it) => {
              if (!it.href) {
                return (
                  <span key={it.name} className={`${s.item} ${s.itemSoon}`} aria-disabled="true">
                    <AdminIcon name={it.icon} />
                    <span className={s.itemText}>{it.name}</span>
                    <span className={s.soon}>Sắp có</span>
                  </span>
                );
              }
              const on = it.match ? it.match(path) : path === it.href || path.startsWith(`${it.href}/`);
              return (
                <Link key={it.name} href={it.href} className={`${s.item} ${on ? s.itemOn : ''}`} aria-current={on ? 'page' : undefined}>
                  <AdminIcon name={it.icon} />
                  <span className={s.itemText}>{it.name}</span>
                  {it.badge ? (
                    <span className={s.badge} aria-label={`${it.badge} đang chờ`}>
                      {it.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <a className={s.siteLink} href="/" target="_blank" rel="noopener">
        <AdminIcon name="eye" />
        Xem website
      </a>
    </nav>
  );
}
