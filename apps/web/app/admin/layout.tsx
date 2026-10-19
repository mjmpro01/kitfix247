import type { Metadata } from 'next';

/** /admin không được lập chỉ mục (kèm header X-Robots-Tag ở middleware.ts và Disallow trong robots.txt). */
export const metadata: Metadata = {
  title: { default: 'Quản trị', template: '%s · Quản trị KitFix247' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
