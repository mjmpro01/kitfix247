import type { Metadata } from 'next';
import { BookingForm } from '@/components/BookingForm';
import { Icon } from '@/components/Icon';
import { getSettings } from '@/lib/api';
import s from './dat-lich.module.css';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Đặt lịch sửa tại nhà — Liên hệ',
  description:
    'Đặt lịch sửa bếp từ, bếp hồng ngoại, máy hút mùi, lò nướng, lò vi sóng, máy rửa chén tận nhà tại TP.HCM. Chúng tôi gọi lại trong 15 phút.',
  alternates: { canonical: '/dat-lich' },
};

export default async function BookingPage() {
  const settings = await getSettings();
  const tel = `tel:${settings.hotlineTel}`;
  const mapQuery = encodeURIComponent(settings.address);

  return (
    <>
      <section className="page-hero">
        <div className={`container page-hero__in ${s.heroIn}`}>
          <h1>Đặt lịch sửa tại nhà</h1>
          <p className="lead">Điền thông tin bên dưới, chúng tôi gọi lại trong 15 phút để xác nhận giờ kỹ thuật viên đến.</p>
          <div className="btn-row">
            <a href={tel} className="btn btn--brand">
              <Icon name="phone" />
              Gọi {settings.hotline}
            </a>
            <a href={settings.zaloUrl} className="btn btn--dark">
              <Icon name="chat" />
              Nhắn Zalo
            </a>
          </div>
        </div>
      </section>

      <section className={s.body}>
        <div className={`container ${s.row}`}>
          <div id="dat-lich" className={s.formCol}>
            <BookingForm settings={settings} headingLevel={2} />
          </div>
          <div className={s.side}>
            <div className={s.box}>
              <h2 className={s.boxTitle}>Cam kết của chúng tôi</h2>
              <ul className={s.promises}>
                {settings.commitments.map((c) => (
                  <li key={c.title}>
                    <span className={s.tick}>
                      <Icon name="check" size={14} strokeWidth={2.5} />
                    </span>
                    <span>
                      <strong>{c.title}</strong> <span className="muted">{c.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={s.box}>
              <h2 className={s.boxTitle}>Liên hệ trực tiếp</h2>
              <div className={s.line}>
                <span className="muted">Hotline:</span>{' '}
                <a href={tel} className={s.strong}>
                  {settings.hotline}
                </a>
              </div>
              <div className={s.line}>
                <span className="muted">Địa chỉ:</span> {settings.address}
              </div>
              <div className={s.line}>
                <span className="muted">Giờ làm việc:</span> {settings.hours}, tất cả các ngày
              </div>
              <iframe
                className={s.map}
                title={`Bản đồ: ${settings.address}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
