import Link from 'next/link';
import { SiteChrome } from '@/components/SiteChrome';
import { getSettings } from '@/lib/api';

export default async function NotFound() {
  const settings = await getSettings();
  return (
    <SiteChrome>
    <section className="page-hero">
      <div className="container page-hero__in" style={{ paddingBottom: 96 }}>
        <h1>Trang này đang được hoàn thiện</h1>
        <p className="lead">
          Nội dung anh/chị tìm chưa có hoặc đã chuyển chỗ. Cần sửa thiết bị bếp, anh/chị gọi ngay hoặc đặt lịch — chúng tôi gọi lại trong 15 phút.
        </p>
        <div className="btn-row">
          <a href={`tel:${settings.hotlineTel}`} className="btn btn--brand btn--lg">
            Gọi ngay {settings.hotline}
          </a>
          <Link href="/dat-lich" className="btn btn--dark btn--lg">
            Đặt lịch sửa
          </Link>
          <Link href="/" className="btn btn--dark btn--lg">
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
    </SiteChrome>
  );
}
