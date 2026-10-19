import type { Metadata } from 'next';
import Link from 'next/link';
import { seoRating } from '@kitfix/ui';
import type { AdminPostSummary } from '@kitfix/types';
import { adminGet } from '@/lib/admin/api';
import { formatDateVi } from '@/lib/site';
import s from '../../admin.module.css';

export const metadata: Metadata = { title: 'Bài viết & SEO' };

const ratingClass = (score: number) => ({ good: s.good, ok: s.warn, poor: s.bad })[seoRating(score).rating];

export default async function PostsAdminPage() {
  const posts = await adminGet<AdminPostSummary[]>('/admin/posts');
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Bài viết & SEO</h1>
          <p className={s.sub}>
            {posts.length} bài · {posts.filter((p) => p.status === 'published').length} đã đăng
          </p>
        </div>
        <Link href="/admin/bai-viet/moi" className={`${s.btn} ${s.btnBrand}`}>
          + Viết bài mới
        </Link>
      </div>
      <div className={s.content}>
        <section className={`${s.card} ${s.cardFlush}`} aria-label="Danh sách bài viết">
          <div className={s.tableWrap}>
            <table className={s.table} style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th scope="col">SEO</th>
                  <th scope="col">Bài viết</th>
                  <th scope="col">Chuyên mục</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`${s.ring} ${ratingClass(p.seoScore)}`} title={seoRating(p.seoScore).label}>
                        <span className="visually-hidden">Điểm SEO </span>
                        {p.seoScore}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/bai-viet/${p.id}`} className={s.strong}>
                        {p.title}
                      </Link>
                      <div className={`${s.small} ${s.muted}`}>{p.focusKeyword ? `Từ khoá “${p.focusKeyword}”` : 'Chưa có từ khoá chính'}</div>
                    </td>
                    <td className={s.muted}>{p.category}</td>
                    <td>
                      <span className={`${s.pill} ${p.status === 'published' ? s.st_done : s.st_new}`}>{p.status === 'published' ? 'Đã đăng' : 'Nháp'}</span>
                    </td>
                    <td className={`${s.muted} ${s.nowrap}`}>{formatDateVi(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posts.length === 0 ? <p className={s.empty}>Chưa có bài viết nào.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}
