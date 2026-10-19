# KitFix247

Website + API cho KitFix247 — sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM.
Đặc tả: [SPEC.md](SPEC.md) · Hướng dẫn cho Claude Code: [CLAUDE.md](CLAUDE.md) · Thiết kế: [design/](design/).

## Chạy lần đầu

Cần Node ≥ 20, pnpm 8, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env  # JWT_SECRET, tài khoản admin seed, thư mục upload
docker compose up -d mysql            # MySQL 8 ở cổng 3307
pnpm db:migrate
pnpm db:seed                          # nạp dữ liệu mẫu + tạo/cập nhật tài khoản admin
pnpm dev                              # web http://localhost:3000 · api http://localhost:4000
```

| Lệnh | Việc |
|---|---|
| `pnpm dev` | build `packages/*` rồi chạy web + api song song |
| `pnpm test` | vitest (validate đặt lịch, luật chấm SEO) + jest e2e `POST /bookings`, Kiến thức, guard `/admin`, `PATCH /admin/bookings/:id/status` |
| `pnpm lint` | ESLint (web) + kiểm tra kiểu TypeScript mọi package |
| `pnpm db:migrate` / `pnpm db:seed` | Prisma migrate / nạp dữ liệu mẫu từ artboard |

## Cấu trúc

```
apps/web        Next.js 15 App Router — site công khai (app/(site)) + quản trị (app/admin)
apps/api        NestJS + Prisma + MySQL
packages/types  DTO dùng chung + validateBooking
packages/ui     tokens.css, icon, định dạng giá, slugifyVi, checkSeo (12 tiêu chí)
design/         bàn giao thiết kế (không sửa)
```

## Đã làm (SPEC mục 10, bước 1–3)

- Trang `/`, `/dich-vu/[slug]` (8 dịch vụ, trọng tâm bếp từ + bếp hồng ngoại), `/dat-lich`, 404, sitemap, robots, JSON-LD.
- API công khai: `/settings`, `/services`, `/services/:slug`, `POST /bookings` (honeypot, giới hạn theo IP và SĐT),
  cùng `/process-steps`, `/brands?home=1`, `/reviews?home=1`, `/products`, `/posts` bản tối thiểu cho trang chủ.
- Thông báo lịch hẹn mới hiện chỉ ghi log (`apps/api/src/notify`) — chờ chọn Zalo OA / Telegram / email.

## Quản trị `/admin` (SPEC mục 10, bước 5)

- Đăng nhập: http://localhost:3000/admin — tài khoản lấy từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `apps/api/.env`
  (mẫu ở `apps/api/.env.example`), `pnpm db:seed` tạo hoặc đặt lại mật khẩu (bcrypt).
- API: mọi route `/admin/*` cần `Authorization: Bearer <JWT>` (guard toàn cục `apps/api/src/admin/auth/admin-auth.guard.ts`,
  chỉ `POST /admin/auth/login` là công khai, giới hạn 5 lần/phút). JWT ký bằng `JWT_SECRET`, hạn 12 giờ.
- Web giữ JWT trong cookie httpOnly `kf_admin` (path `/admin`), gọi API từ server action và `revalidateTag`
  (`services`, `brands`, `posts`, `reviews`, `settings`) để trang công khai cập nhật ngay khi lưu.
- `/admin` có `noindex` (metadata + header `X-Robots-Tag` trong `middleware.ts`) và bị chặn trong robots.txt.
- Màn hình: Tổng quan, Lịch hẹn (tìm kiếm), Dịch vụ & bảng giá, Bài viết & SEO (chấm điểm trực tiếp + xem trước Google),
  Thương hiệu (upload logo), Đánh giá, Cài đặt liên hệ & thanh toán. Đơn hàng, Sản phẩm, Trang chủ & Hero, Menu,
  Chính sách bảo hành hiện "Sắp có".
- Upload: `POST /admin/uploads?folder=brands|posts` lưu vào `UPLOAD_DIR` (mặc định `apps/api/uploads`) qua interface
  `FileStorage` (`apps/api/src/admin/uploads/storage.ts`) — thay bằng S3/Azure chỉ cần viết lớp mới và đổi provider.

## Còn là placeholder

Xem SPEC mục 9. Trong dữ liệu mẫu: giá lỗi đều là `150.000 – 450.000 ₫`, đánh giá và tên khách là `[...]`,
lỗi bếp hồng ngoại do chúng tôi soạn theo mô tả thẻ dịch vụ (cần kỹ thuật viên duyệt), chưa có logo hãng.
`/bang-gia` đang ẩn khỏi menu (`SHOW_PRICE_PAGE` trong `apps/web/lib/site.ts`).

## Deploy

Build image → Oracle Container Registry → VPS: xem [DEPLOY.md](DEPLOY.md).
