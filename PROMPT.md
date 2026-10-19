# Prompt khởi động (dán vào Claude Code)

Giải nén gói này vào thư mục dự án trống, mở Claude Code tại thư mục đó rồi dán:

---

Đọc CLAUDE.md và SPEC.md, sau đó xem các file trong design/screens (bắt đầu từ Main.dc.html, SiteHeader.dc.html, SiteFooter.dc.html, BookingForm.dc.html, ChatBubbles.dc.html) và design/tokens.json.

Lên kế hoạch triển khai theo "Thứ tự triển khai gợi ý" ở SPEC mục 10 và cho tôi xem kế hoạch trước khi code. Sau khi tôi duyệt, làm bước 1–3:
1. Scaffold monorepo pnpm: apps/web (Next.js 15 App Router + TS), apps/api (NestJS + Prisma + MySQL), packages/ui, packages/types; docker-compose cho MySQL.
2. Tokens + font + layout; component SiteHeader (menu desktop + panel mobile), SiteFooter, ChatBubbles, BookingForm đúng như artboard.
3. Schema Prisma theo SPEC mục 5, seed dữ liệu mẫu lấy từ renderVals() của các artboard; API công khai /settings, /services, /bookings.
4. Trang chủ "/" đầy đủ các section, gồm hero banner với 2 nút phủ đúng toạ độ trong SPEC.

Chạy được bằng `pnpm dev`, có test cho validate form đặt lịch và luật chấm SEO (12 tiêu chí).
