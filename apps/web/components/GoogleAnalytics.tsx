'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { GA_ID_PATTERN } from '@kitfix/types';
import { track } from '@/lib/analytics';

/**
 * GA4 cho site công khai (không gắn trong /admin). Mã đo lường nhập ở Admin › Cài đặt.
 * Đo thêm lượt bấm gọi / Zalo ở mọi nơi trên trang (header, hero, bong bóng, footer…).
 */
export function GoogleAnalytics({ gaId }: { gaId: string | null | undefined }) {
  const id = gaId && GA_ID_PATTERN.test(gaId) ? gaId : null;

  useEffect(() => {
    if (!id) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      const where = a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : location.pathname;
      if (href.startsWith('tel:')) track('click_call', { link_location: where });
      else if (/zalo\.me\//.test(href)) track('click_zalo', { link_location: where });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [id]);

  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
