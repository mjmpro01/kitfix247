import type { Metadata } from 'next';
import { PostEditor } from '@/components/admin/PostEditor';
import { editorData } from '../editor-data';

export const metadata: Metadata = { title: 'Viết bài mới' };

export default async function NewPostPage() {
  return <PostEditor post={null} {...await editorData()} />;
}
