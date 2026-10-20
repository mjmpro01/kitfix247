import type { Metadata } from 'next';
import { SiteChrome } from '@/components/SiteChrome';
import { getSettings } from '@/lib/api';

/** Thẻ meta xác minh Google Search Console (Admin › Cài đặt) cho mọi trang công khai. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const google = settings.analytics?.googleVerification;
  return google ? { verification: { google } } : {};
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
