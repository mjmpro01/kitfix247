import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { AdminPost } from '@kitfix/types';
import { PostEditor } from '@/components/admin/PostEditor';
import { AdminApiError, adminGet } from '@/lib/admin/api';
import { editorData } from '../editor-data';

export const metadata: Metadata = { title: 'Sửa bài viết' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ moi?: string }> };

export default async function EditPostPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^\d+$/.test(id)) notFound();
  let post: AdminPost;
  try {
    post = await adminGet<AdminPost>(`/admin/posts/${id}`);
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 404) notFound();
    throw e;
  }
  return <PostEditor key={post.id} post={post} justCreated={sp.moi === '1'} {...await editorData()} />;
}
