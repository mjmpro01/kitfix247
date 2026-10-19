import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_COOKIE = 'kf_admin';
const LOGIN_PATH = '/admin/dang-nhap';

/**
 * /admin: không cho máy tìm kiếm lập chỉ mục, và chưa có cookie phiên thì chuyển sang trang đăng nhập.
 * Đây chỉ là lớp chặn sớm — quyền thật do API kiểm tra JWT ở mọi route /admin.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isLogin = pathname === LOGIN_PATH;
  let res: NextResponse;
  if (!isLogin && !req.cookies.has(ADMIN_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = pathname === '/admin' ? '' : `?tiep=${encodeURIComponent(pathname + search)}`;
    res = NextResponse.redirect(url);
  } else {
    res = NextResponse.next();
  }
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
