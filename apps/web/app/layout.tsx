import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Chakra_Petch } from 'next/font/google';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const chakra = Chakra_Petch({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-chakra',
  display: 'swap',
});
const bvp = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-bvp',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'KitFix247 — Sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp tận nhà TP.HCM', template: '%s | KitFix247' },
  description:
    'Sửa bếp từ, bếp hồng ngoại, máy hút mùi, lò nướng, lò vi sóng, máy rửa chén tận nhà tại TP.HCM. Có mặt trong 60 phút, chẩn đoán miễn phí, bảo hành 12 tháng.',
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'KitFix247' },
  icons: { icon: '/images/kitfix247-logo-1000.png' },
};

export const viewport: Viewport = { themeColor: '#0e2843', width: 'device-width', initialScale: 1 };

/** Gốc chung: font + token. Khung site công khai ở app/(site)/layout.tsx, khu quản trị ở app/admin. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${chakra.variable} ${bvp.variable}`}>
      <body>{children}</body>
    </html>
  );
}
