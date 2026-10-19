import type { KnowledgeFilters } from '@/lib/site';

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function readFilters(sp: Awaited<SearchParams>): KnowledgeFilters {
  const page = Number.parseInt(one(sp.page) ?? '', 10);
  return {
    category: one(sp.category)?.slice(0, 80),
    brand: one(sp.brand)?.slice(0, 80),
    q: one(sp.q)?.slice(0, 100),
    page: Number.isFinite(page) && page > 1 ? page : undefined,
  };
}
