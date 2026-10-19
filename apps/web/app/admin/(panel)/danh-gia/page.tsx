import type { Metadata } from 'next';
import type { AdminReview } from '@kitfix/types';
import { ReviewManager } from '@/components/admin/ReviewManager';
import { adminGet } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Đánh giá khách hàng' };

export default async function ReviewsAdminPage() {
  return <ReviewManager initial={await adminGet<AdminReview[]>('/admin/reviews')} />;
}
