import Link from 'next/link';
import { PostCover } from '@/components/ArticleCard';
import { getLatestPosts, getServices } from '@/lib/api';
import { KNOWLEDGE_PATH, formatDateVi, postHref, serviceHref } from '@/lib/site';
import s from './SideWidgets.module.css';

const LATEST = 5;

/**
 * Cột phải dùng chung (trang dịch vụ, bài viết, trang nội dung, chi tiết sản phẩm):
 * "Bài viết mới" (ảnh nhỏ + tiêu đề + ngày) và "Dịch vụ" (toàn bộ dịch vụ, đánh dấu dịch vụ đang xem).
 */
export async function SideWidgets({ currentPost, currentService }: { currentPost?: string; currentService?: string }) {
  const [latest, services] = await Promise.all([getLatestPosts(LATEST + 1), getServices()]);
  const posts = latest.filter((p) => p.slug !== currentPost).slice(0, LATEST);

  return (
    <>
      {posts.length > 0 && (
        <nav aria-labelledby="side-posts" className={s.box}>
          <h2 id="side-posts" className={s.title}>
            Bài viết mới
          </h2>
          <ul className={s.posts}>
            {posts.map((p) => (
              <li key={p.id} className={s.post}>
                <PostCover post={p} className={s.thumb} sizes="64px" label="" iconSize={22} />
                <div className={s.postText}>
                  <Link href={postHref(p.slug)} className={s.postLink}>
                    {p.title}
                  </Link>
                  <time dateTime={p.publishedAt} className={s.date}>
                    {formatDateVi(p.publishedAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
          <Link href={KNOWLEDGE_PATH} className={s.more}>
            Xem thêm bài viết →
          </Link>
        </nav>
      )}

      {services.length > 0 && (
        <nav aria-labelledby="side-services" className={s.box}>
          <h2 id="side-services" className={s.title}>
            Dịch vụ
          </h2>
          <ul className={s.services}>
            {services.map((sv) => {
              const on = sv.slug === currentService;
              return (
                <li key={sv.slug}>
                  <Link href={serviceHref(sv.slug)} className={s.svc} aria-current={on ? 'page' : undefined}>
                    {sv.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
