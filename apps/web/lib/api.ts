import 'server-only';
import { connection } from 'next/server';
import type {
  Brand,
  BrandDetail,
  Category,
  PostDetail,
  PostListQuery,
  PostPage,
  ProcessStep,
  Product,
  Review,
  ServiceDetail,
  ServiceSummary,
  Settings,
} from '@kitfix/types';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
/** ISR: trang được dựng lại tối đa sau 5 phút; admin lưu sẽ gọi revalidateTag ở đợt Admin. */
const REVALIDATE = 300;

/**
 * Image Docker build không có API (SKIP_PRERENDER=1): không dựng sẵn trang lúc build, mọi trang render khi có request.
 * Dữ liệu vẫn được cache 5 phút theo tag nên API không bị gọi mỗi lần tải trang.
 */
export const SKIP_PRERENDER = process.env.SKIP_PRERENDER === '1';

async function get<T>(path: string, tag: string): Promise<T | null> {
  if (SKIP_PRERENDER) await connection();
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE, tags: [tag] } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} trả về ${res.status}`);
  return (await res.json()) as T;
}

async function must<T>(path: string, tag: string): Promise<T> {
  const v = await get<T>(path, tag);
  if (v === null) throw new Error(`API ${path} không có dữ liệu`);
  return v;
}

export const getSettings = () => must<Settings>('/settings', 'settings');
export const getServices = () => must<ServiceSummary[]>('/services', 'services');
export const getService = (slug: string) => get<ServiceDetail>(`/services/${encodeURIComponent(slug)}`, 'services');
export const getProcessSteps = () => must<ProcessStep[]>('/process-steps', 'process');
export const getHomeBrands = () => must<Brand[]>('/brands?home=1', 'brands');
export const getHomeReviews = () => must<Review[]>('/reviews?home=1', 'reviews');
export const getProducts = (limit: number) => must<Product[]>(`/products?limit=${limit}`, 'products');
export const getBrands = () => must<Brand[]>('/brands', 'brands');
export const getBrand = (slug: string) => get<BrandDetail>(`/brands/${encodeURIComponent(slug)}`, 'brands');
export const getCategories = () => must<Category[]>('/categories', 'posts');
export const getPost = (slug: string) => get<PostDetail>(`/posts/${encodeURIComponent(slug)}`, 'posts');

export function getPosts(query: PostListQuery = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') qs.set(k, String(v));
  return must<PostPage>(`/posts?${qs}`, 'posts');
}

export const getLatestPosts = async (limit: number) => (await getPosts({ limit })).items;
