/** Gửi sự kiện GA4 nếu trang đã gắn GA (Admin › Cài đặt). Không gắn thì bỏ qua, không lỗi. */
type Gtag = (cmd: 'event', name: string, params?: Record<string, string | number>) => void;

export function track(name: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === 'function') gtag('event', name, params);
}
