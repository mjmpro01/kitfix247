import type { Prisma } from '@prisma/client';
import { POSTS_MAX_LIMIT, POSTS_PER_PAGE, type PostSummary } from '@kitfix/types';

export interface PostListParams {
  category?: string;
  brand?: string;
  q?: string;
  page: number;
  limit: number;
}

const toInt = (v: unknown, fallback: number) => {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};
const clean = (v: unknown, max: number) => {
  const s = typeof v === 'string' ? v.trim().slice(0, max) : '';
  return s || undefined;
};

/** Chuẩn hoá query string: page ≥ 1, 1 ≤ limit ≤ POSTS_MAX_LIMIT, bỏ khoảng trắng thừa, chuỗi rỗng = không lọc. */
export function parsePostListQuery(raw: Record<string, unknown>): PostListParams {
  return {
    category: clean(raw.category, 80),
    brand: clean(raw.brand, 80),
    q: clean(raw.q, 100),
    page: Math.max(1, toInt(raw.page, 1)),
    limit: Math.min(POSTS_MAX_LIMIT, Math.max(1, toInt(raw.limit, POSTS_PER_PAGE))),
  };
}

/** Chỉ bài đã đăng. Tìm theo tiêu đề, đoạn trích, từ khoá chính (collation MySQL không phân biệt hoa thường/dấu). */
export function buildPostWhere(p: Pick<PostListParams, 'category' | 'brand' | 'q'>): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = { status: 'published' };
  if (p.category) where.category = { slug: p.category };
  if (p.brand) where.brands = { some: { brand: { slug: p.brand } } };
  if (p.q) where.OR = [{ title: { contains: p.q } }, { excerpt: { contains: p.q } }, { focusKeyword: { contains: p.q } }];
  return where;
}

export const postSummaryInclude = {
  category: true,
  brands: { include: { brand: true }, orderBy: { brand: { sort: 'asc' } } },
} satisfies Prisma.PostInclude;

export type PostWithRefs = Prisma.PostGetPayload<{ include: typeof postSummaryInclude }>;

export const postOrder: Prisma.PostOrderByWithRelationInput[] = [{ publishedAt: 'desc' }, { id: 'desc' }];

export function toPostSummary(p: PostWithRefs): PostSummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category.name,
    categorySlug: p.category.slug,
    device: p.device,
    brands: p.brands.map((b) => ({ slug: b.brand.slug, name: b.brand.name })),
    coverUrl: p.coverUrl,
    coverAlt: p.coverAlt,
    readMinutes: p.readMinutes,
    publishedAt: (p.publishedAt ?? p.updatedAt).toISOString(),
  };
}
