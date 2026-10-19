import type { Metadata } from 'next';
import type { AdminReview } from '@kitfix/types';
import { ReviewRow } from '@/components/admin/ReviewRow';
import { adminGet } from '@/lib/admin/api';
import s from '../../admin.module.css';

export const metadata: Metadata = { title: 'Đánh giá khách hàng' };

export default async function ReviewsAdminPage() {
  const reviews = await adminGet<AdminReview[]>('/admin/reviews');
  const pending = reviews.filter((r) => r.status === 'pending').length;
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Đánh giá khách hàng</h1>
          <p className={s.sub}>
            Chỉ đánh giá đã duyệt mới hiện trên website. {pending ? `${pending} đánh giá chờ duyệt.` : 'Không có đánh giá chờ duyệt.'}
          </p>
        </div>
      </div>
      <div className={s.content}>
        <section className={`${s.card} ${s.cardFlush}`} aria-label="Danh sách đánh giá">
          <div className={s.tableWrap}>
            <table className={s.table} style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th scope="col">Khách hàng</th>
                  <th scope="col">Nội dung</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Trang chủ</th>
                  <th scope="col" className={s.right}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </tbody>
            </table>
            {reviews.length === 0 ? <p className={s.empty}>Chưa có đánh giá nào.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}
