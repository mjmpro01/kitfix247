import type { MetadataRoute } from 'next';
import { CONTENT_PAGES, POSTS_MAX_LIMIT, type PostSummary } from '@kitfix/types';
import { getBrands, getPosts, getServices } from '@/lib/api';
import { KNOWLEDGE_PATH, SITE_URL, brandHref, postHref, serviceHref } from '@/lib/site';

export const revalidate = 3600;

async function allPosts(): Promise<PostSummary[]> {
  const first = await getPosts({ limit: POSTS_MAX_LIMIT });
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => getPosts({ limit: POSTS_MAX_LIMIT, page: i + 2 })),
  );
  return [first, ...rest].flatMap((p) => p.items);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, brands, posts] = await Promise.all([getServices(), getBrands(), allPosts()]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/dat-lich`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/san-pham`, changeFrequency: 'weekly', priority: 0.5 },
    ...CONTENT_PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, changeFrequency: 'monthly' as const, priority: p.key === 'privacy' ? 0.3 : 0.5 })),
    ...services.map((sv) => ({ url: `${SITE_URL}${serviceHref(sv.slug)}`, changeFrequency: 'monthly' as const, priority: 0.9 })),
    { url: `${SITE_URL}${KNOWLEDGE_PATH}`, changeFrequency: 'daily', priority: 0.7 },
    ...brands.map((b) => ({ url: `${SITE_URL}${brandHref(b.slug)}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...posts.map((p) => ({
      url: `${SITE_URL}${postHref(p.slug)}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
