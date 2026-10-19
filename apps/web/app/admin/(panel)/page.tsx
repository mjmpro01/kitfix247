import type { Metadata } from 'next';
import Link from 'next/link';
import { seoRating } from '@kitfix/ui';
import type { AdminBookingPage, AdminBrand, AdminPostSummary, AdminPriceGroup, AdminService, AdminStats } from '@kitfix/types';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { adminGet } from '@/lib/admin/api';
import { formatDateVi } from '@/lib/site';
import s from '../admin.module.css';

export const metadata: Metadata = { title: 'Tổng quan' };

const ratingClass = (score: number) => ({ good: s.good, ok: s.warn, poor: s.bad })[seoRating(score).rating];

export default async function AdminOverview() {
  const [stats, bookings, posts, services, groups, brands] = await Promise.all([
    adminGet<AdminStats>('/admin/stats'),
    adminGet<AdminBookingPage>('/admin/bookings?limit=50'),
    adminGet<AdminPostSummary[]>('/admin/posts'),
    adminGet<AdminService[]>('/admin/services'),
    adminGet<AdminPriceGroup[]>('/admin/price-groups'),
    adminGet<AdminBrand[]>('/admin/brands'),
  ]);
  const now = Date.now();
  const diff = stats.bookingsToday - stats.bookingsYesterday;

  const kpis = [
    {
      l: 'Lịch hẹn hôm nay',
      v: stats.bookingsToday,
      s: diff === 0 ? 'Bằng hôm qua' : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} so với hôm qua`,
      c: diff > 0 ? s.good : s.muted,
    },
    {
      l: 'Đang chờ gọi lại',
      v: stats.waiting,
      s: stats.overdue ? `${stats.overdue} yêu cầu quá 15 phút` : 'Không có yêu cầu quá hạn',
      c: stats.overdue ? s.bad : s.good,
    },
    {
      l: 'Đơn hàng Shop mới',
      v: stats.newOrders,
      s: stats.ordersAwaitingTransfer ? `${stats.ordersAwaitingTransfer} chờ xác nhận chuyển khoản` : 'Không có đơn chờ chuyển khoản',
      c: s.muted,
    },
    {
      l: 'Bài viết đã đăng',
      v: stats.publishedPosts,
      s: stats.postsNeedSeo ? `${stats.postsNeedSeo} bài cần cải thiện SEO` : 'SEO các bài đều đạt mức Tốt',
      c: stats.postsNeedSeo ? s.warn : s.good,
    },
  ];

  const modules = [
    { t: 'Lịch hẹn', d: 'Danh sách đầy đủ, tìm theo tên, số điện thoại', href: '/admin/lich-hen' },
    { t: `Dịch vụ (${services.length})`, d: 'Trang dịch vụ, lỗi thường gặp, FAQ', href: '/admin/dich-vu' },
    { t: `Bảng giá (${groups.length} nhóm)`, d: 'Hạng mục và khoảng giá, ghi chú VAT', href: '/admin/dich-vu#bang-gia' },
    { t: 'Bài viết & SEO', d: 'Soạn bài, chuyên mục, chấm điểm SEO', href: '/admin/bai-viet' },
    { t: `Thương hiệu (${brands.length})`, d: 'Logo dải hãng, trang Kiến thức theo hãng', href: '/admin/thuong-hieu' },
    { t: 'Đánh giá khách hàng', d: 'Duyệt, ẩn/hiện, chọn đánh giá trang chủ', href: '/admin/danh-gia' },
    { t: 'Hotline, Zalo, thanh CTA', d: 'Số gọi, link Zalo, địa chỉ, giờ làm', href: '/admin/cai-dat' },
    { t: 'Footer & thanh toán', d: 'Phương thức thanh toán hiện ở footer', href: '/admin/cai-dat#thanh-toan' },
  ];

  return (
    <div className={s.content}>
      <div>
        <h1 className={`${s.h1} ${s.h1Lg}`}>Tổng quan</h1>
        <p className={s.muted}>
          Cập nhật lúc {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(now)} ngày{' '}
          {formatDateVi(new Date(now).toISOString())} · lịch hẹn tự làm mới mỗi phút.
        </p>
      </div>

      <div className={s.kpis}>
        {kpis.map((k) => (
          <div key={k.l} className={s.kpi}>
            <div className={s.kpiLabel}>{k.l}</div>
            <div className={s.kpiValue}>{k.v}</div>
            <div className={`${s.kpiNote} ${k.c}`}>{k.s}</div>
          </div>
        ))}
      </div>

      <BookingsTable page={bookings} now={now} title="Lịch hẹn từ form đặt lịch" />

      <div className={s.cols}>
        <section className={`${s.card} ${s.half}`} aria-labelledby="orders-title">
          <div className={s.rowBetween}>
            <h2 id="orders-title" className={s.h2}>
              Đơn hàng Shop mới
            </h2>
          </div>
          <p className={s.muted}>
            {stats.newOrders
              ? `${stats.newOrders} đơn mới đang chờ xử lý. Màn quản lý đơn hàng sẽ có ở bước Shop.`
              : 'Chưa có đơn hàng mới. Màn quản lý đơn hàng sẽ có ở bước Shop.'}
          </p>
        </section>

        <section className={`${s.card} ${s.half}`} aria-labelledby="seo-title">
          <div className={s.rowBetween}>
            <h2 id="seo-title" className={s.h2}>
              Bài viết & SEO
            </h2>
            <Link href="/admin/bai-viet" className={s.linkStrong}>
              Mở trình soạn
            </Link>
          </div>
          <div className={s.list}>
            {posts.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/admin/bai-viet/${p.id}`} className={s.listRow} style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className={`${s.ring} ${ratingClass(p.seoScore)}`} aria-label={`Điểm SEO ${p.seoScore}`}>
                  {p.seoScore}
                </span>
                <span style={{ flex: 1 }}>
                  <span className={s.strong} style={{ display: 'block' }}>
                    {p.title}
                  </span>
                  <span className={`${s.small} ${s.muted}`}>
                    {p.status === 'published' && p.publishedAt ? `Đã đăng ${formatDateVi(p.publishedAt)}` : 'Đang soạn'}
                    {p.focusKeyword ? ` · từ khoá “${p.focusKeyword}”` : ' · chưa có từ khoá'}
                  </span>
                </span>
              </Link>
            ))}
            {posts.length === 0 ? <p className={s.muted}>Chưa có bài viết.</p> : null}
          </div>
        </section>
      </div>

      <section className={s.stack} aria-labelledby="modules-title">
        <h2 id="modules-title" className={s.h2}>
          Quản lý nội dung website
        </h2>
        <div className={s.modules}>
          {modules.map((m) => (
            <Link key={m.t} href={m.href} className={s.module}>
              <span className={s.moduleTitle}>{m.t}</span>
              <span className={s.moduleDesc}>{m.d}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
