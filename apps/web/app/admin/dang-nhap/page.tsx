import type { Metadata } from 'next';
import s from '../admin.module.css';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Đăng nhập' };

type SP = Promise<{ tiep?: string; 'ly-do'?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <main className={s.loginPage}>
      <div className={s.loginCard}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/kitfix247-logo-1000.png" alt="KitFix247" className={s.loginLogo} width={145} height={48} />
        <div>
          <h1 className={s.h1}>Đăng nhập quản trị</h1>
          <p className={s.sub}>Dành cho nhân viên KitFix247.</p>
        </div>
        {sp['ly-do'] === 'het-han' ? (
          <p className={s.alert} role="status">
            Phiên đăng nhập đã hết hạn. Anh/chị đăng nhập lại để tiếp tục.
          </p>
        ) : null}
        <LoginForm next={sp.tiep ?? ''} />
      </div>
    </main>
  );
}
