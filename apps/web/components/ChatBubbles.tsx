'use client';

import { usePathname } from 'next/navigation';
import type { Settings } from '@kitfix/types';
import { Icon } from './Icon';
import s from './ChatBubbles.module.css';

/** Trang có sẵn form đặt lịch thì cuộn tới form, trang khác dẫn sang /dat-lich. */
function bookHref(path: string) {
  if (path === '/' || path.startsWith('/dich-vu/') || path === '/dat-lich') return '#dat-lich';
  return '/dat-lich#dat-lich';
}

export function ChatBubbles({ settings }: { settings: Pick<Settings, 'hotline' | 'hotlineTel' | 'zaloUrl'> }) {
  const path = usePathname() ?? '/';
  return (
    <nav aria-label="Liên hệ nhanh" className={s.wrap}>
      <a className={s.bub} href={bookHref(path)} aria-label="Đặt lịch sửa">
        <span className={s.tip}>Đặt lịch sửa</span>
        <span className={`${s.circle} ${s.book}`}>
          <Icon name="calendar" size={24} />
        </span>
      </a>
      <a className={s.bub} href={settings.zaloUrl} aria-label={`Nhắn Zalo ${settings.hotline}`}>
        <span className={s.tip}>Nhắn Zalo</span>
        <span className={`${s.circle} ${s.zalo}`}>
          <Icon name="chat" size={22} />
          <span className={s.zaloText}>Zalo</span>
        </span>
      </a>
      <a className={s.bub} href={`tel:${settings.hotlineTel}`} aria-label={`Gọi ${settings.hotline}`}>
        <span className={`${s.tip} ${s.tipBrand}`}>Gọi {settings.hotline}</span>
        <span className={s.callWrap}>
          <span className={s.pulse} aria-hidden="true" />
          <span className={`${s.circle} ${s.call}`}>
            <Icon name="phone" size={28} strokeWidth={2} />
          </span>
        </span>
      </a>
    </nav>
  );
}
