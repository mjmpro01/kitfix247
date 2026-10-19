import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ChatBubbles } from '@/components/ChatBubbles';
import { getServices, getSettings } from '@/lib/api';

/** Khung site công khai: header, footer, bong bóng liên hệ. /admin không dùng khung này. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);
  return (
    <>
      <a href="#noi-dung" className="skip-link">
        Bỏ qua menu
      </a>
      <SiteHeader settings={settings} services={services} />
      <main id="noi-dung">{children}</main>
      <SiteFooter settings={settings} services={services} />
      <ChatBubbles settings={settings} />
    </>
  );
}
