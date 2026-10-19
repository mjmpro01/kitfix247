import { redirect } from 'next/navigation';

/** Chưa có trang tổng hợp dịch vụ: đưa về lưới dịch vụ ở trang chủ. */
export default function ServicesIndex() {
  redirect('/#dich-vu');
}
