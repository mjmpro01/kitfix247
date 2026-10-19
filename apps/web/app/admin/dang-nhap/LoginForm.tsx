'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '../actions';
import s from '../admin.module.css';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className={s.stack} noValidate>
      <input type="hidden" name="next" value={next} />
      <label className={s.label}>
        <span className={s.labelText}>Email</span>
        <input
          className={s.input}
          type="email"
          name="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'login-error' : undefined}
        />
      </label>
      <label className={s.label}>
        <span className={s.labelText}>Mật khẩu</span>
        <input
          className={s.input}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'login-error' : undefined}
        />
      </label>
      {state.error ? (
        <p id="login-error" className={s.fieldError} role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={`${s.btn} ${s.btnBrand}`} disabled={pending}>
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}
