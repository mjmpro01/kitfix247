/** Kết quả trả về từ server action admin cho client component. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; errors?: Record<string, string> };
