import type { Metadata } from 'next';
import { CONTENT_PAGES, type Settings } from '@kitfix/types';
import { PagesForm } from '@/components/admin/PagesForm';
import { adminGet } from '@/lib/admin/api';
import { CONTENT_PAGE_INFO } from '@/lib/content-pages';
import s from '../../admin.module.css';

export const metadata: Metadata = { title: 'Giới thiệu & chính sách' };

export default async function PagesAdminPage() {
  const settings = await adminGet<Settings>('/admin/settings');
  const pages = CONTENT_PAGES.map((p) => ({ key: p.key, path: p.path, title: p.title, md: settings.pages?.[p.key] ?? CONTENT_PAGE_INFO[p.key].defaultMd }));
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>Giới thiệu & chính sách</h1>
          <p className={s.sub}>Nội dung các trang Giới thiệu, Chính sách bảo hành, Chính sách bảo mật.</p>
        </div>
      </div>
      <div className={s.content}>
        <PagesForm pages={pages} />
      </div>
    </>
  );
}
