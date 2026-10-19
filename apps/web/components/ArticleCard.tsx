import Image from 'next/image';
import Link from 'next/link';
import type { PostSummary } from '@kitfix/types';
import { formatDateVi, postHref } from '@/lib/site';
import { Icon } from './Icon';
import s from './ArticleCard.module.css';

/** Icon tạm cho ảnh bài viết khi chưa có ảnh thật, chọn theo thiết bị. */
const DEVICE_ICON: Record<string, string> = {
  'Bếp từ': 'burner',
  'Bếp hồng ngoại': 'infrared',
  'Máy hút mùi': 'hood',
  'Lò nướng': 'oven',
  'Lò vi sóng': 'microwave',
  'Máy rửa chén': 'dishwasher',
};
export const deviceIcon = (device: string | null) => (device && DEVICE_ICON[device]) || 'wrench';

interface CoverProps {
  post: Pick<PostSummary, 'coverUrl' | 'coverAlt' | 'device' | 'title'>;
  className: string;
  sizes: string;
  label: string;
  iconSize: number;
  priority?: boolean;
}

/** Ảnh đại diện; chưa có ảnh thì hiện khung placeholder kèm icon thiết bị. */
export function PostCover({ post, className, sizes, label, iconSize, priority }: CoverProps) {
  if (post.coverUrl) {
    return (
      <div className={`${className} ${s.coverWrap}`}>
        <Image
          src={post.coverUrl}
          alt={post.coverAlt ?? post.title}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={/^https?:/i.test(post.coverUrl)}
          className={s.coverImg}
        />
      </div>
    );
  }
  return (
    <div className={`placeholder-img ${className}`} aria-hidden="true">
      <Icon name={deviceIcon(post.device)} size={iconSize} strokeWidth={1.25} />
      {label}
    </div>
  );
}

interface Props {
  post: PostSummary;
  /** Lưới Kiến thức: thêm nhãn hãng và "Đọc tiếp · N phút". Bài liên quan: bản gọn. */
  variant?: 'grid' | 'compact';
  /** Đang lọc theo hãng: nhãn hãng trên thẻ ưu tiên đúng hãng đó. */
  brandSlug?: string;
}

export function ArticleCard({ post, variant = 'grid', brandSlug }: Props) {
  const grid = variant === 'grid';
  const brand = post.brands.find((b) => b.slug === brandSlug) ?? post.brands[0];
  return (
    <article className={`card ${s.card}`}>
      <PostCover
        post={post}
        className={grid ? s.img : s.imgCompact}
        sizes="(max-width: 640px) 100vw, 380px"
        label="[Ảnh bài viết]"
        iconSize={40}
      />
      <div className={grid ? s.body : s.bodyCompact}>
        <div className={s.meta}>
          <span className={s.cat}>{post.category}</span>
          {grid && brand && <span className={s.brand}>{brand.name}</span>}
          <time dateTime={post.publishedAt} className="muted">
            {formatDateVi(post.publishedAt)}
          </time>
        </div>
        <h3 className={s.title}>
          <Link href={postHref(post.slug)} className={s.link}>
            {post.title}
          </Link>
        </h3>
        {grid && (
          <span className={s.more} aria-hidden="true">
            Đọc tiếp · {post.readMinutes} phút
          </span>
        )}
      </div>
    </article>
  );
}
