import type { Settings } from '@kitfix/types';
import { BookingForm } from './BookingForm';
import { Icon } from './Icon';
import { SectionTitle } from './SectionTitle';
import s from './BookingSection.module.css';

interface Props {
  settings: Settings;
  title: string;
  defaultDevice?: string;
  /** Kiểu trang chủ: nền sunken, tiêu đề in hoa + danh sách liên hệ. Kiểu trang con: gọn hơn. */
  variant?: 'home' | 'page';
}

export function BookingSection({ settings, title, defaultDevice, variant = 'home' }: Props) {
  const tel = `tel:${settings.hotlineTel}`;
  return (
    <section id="dat-lich" aria-labelledby="dat-lich-title" className={variant === 'home' ? 'section section--sunken' : 'section'}>
      <div className={`container ${s.row}`}>
        <div className={s.text}>
          {variant === 'home' ? (
            <>
              <SectionTitle id="dat-lich-title">{title}</SectionTitle>
              <p className="lead">
                Để lại thông tin, chúng tôi gọi lại trong 15 phút. Anh/chị chỉ cần mô tả thiết bị đang bị gì — kỹ thuật viên sẽ gọi xác nhận giờ đến.
              </p>
              <ul className={s.contacts}>
                <li>
                  <span className={s.ic}>
                    <Icon name="phone" size={22} />
                  </span>
                  <div>
                    <div className={s.small}>Cần gấp? Gọi hotline</div>
                    <a href={tel} className={s.hot}>
                      {settings.hotline}
                    </a>
                  </div>
                </li>
                <li>
                  <span className={s.ic}>
                    <Icon name="chat" size={22} />
                  </span>
                  <div>
                    <div className={s.small}>Gửi ảnh lỗi qua Zalo</div>
                    <a href={settings.zaloUrl} className={s.zalo}>
                      Nhắn Zalo {settings.hotline}
                    </a>
                  </div>
                </li>
                <li>
                  <span className={s.ic}>
                    <Icon name="clock" size={22} />
                  </span>
                  <div>
                    <div className={s.small}>Giờ làm việc</div>
                    <div className={s.hours}>{settings.hours}, tất cả các ngày</div>
                  </div>
                </li>
              </ul>
            </>
          ) : (
            <>
              <h2 id="dat-lich-title" className="h2">
                {title}
              </h2>
              <p className="lead">
                Gửi thông tin, chúng tôi gọi lại trong 15 phút. Cần gấp, gọi ngay{' '}
                <a href={tel} className={s.inlineHot}>
                  {settings.hotline}
                </a>
                .
              </p>
            </>
          )}
        </div>
        <div className={s.formCol}>
          <BookingForm settings={settings} defaultDevice={defaultDevice} />
        </div>
      </div>
    </section>
  );
}
