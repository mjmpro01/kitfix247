import type { Metadata } from 'next';
import type { AdminBookingPage } from '@kitfix/types';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { adminGet } from '@/lib/admin/api';
import s from '../../admin.module.css';

export const metadata: Metadata = { title: 'Lịch hẹn' };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const query = q.trim().slice(0, 100);
  const page = await adminGet<AdminBookingPage>(`/admin/bookings?limit=100${query ? `&q=${encodeURIComponent(query)}` : ''}`);
  return (
    <div className={s.content}>
      <div>
        <h1 className={`${s.h1} ${s.h1Lg}`}>Lịch hẹn</h1>
        <p className={s.muted}>{query ? `Kết quả tìm “${query}”: ${page.total} lịch hẹn.` : `${page.counts.all} lịch hẹn, mới nhất ở trên.`}</p>
      </div>
      <BookingsTable page={page} now={Date.now()} title={query ? 'Kết quả tìm kiếm' : 'Tất cả lịch hẹn'} />
    </div>
  );
}
