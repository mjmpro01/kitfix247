import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'kitfix:public';

/** Bỏ qua kiểm tra JWT cho một route /admin (chỉ dùng cho đăng nhập). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
