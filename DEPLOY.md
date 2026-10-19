# Deploy KitFix247: Oracle Container Registry (OCIR) → VPS

Máy dev **build** 2 image (`api`, `web`) và **đẩy** lên OCIR. VPS chỉ **kéo** image về và chạy 4 container:
MySQL 8.4, API (NestJS), web (Next.js) và Caddy (tự xin HTTPS Let's Encrypt). Image không gắn với tên miền
hay CSDL: mọi cấu hình nằm trong `.env.production` trên VPS.

| Đường dẫn | Đi vào |
|---|---|
| `https://DOMAIN/api/*` | API (bỏ tiền tố `/api`) — form đặt lịch trên trình duyệt gọi vào đây |
| `https://DOMAIN/uploads/*` | API — logo hãng, ảnh bài viết do admin tải lên |
| còn lại | web (site công khai + `/admin`) |
| `https://www.DOMAIN` | chuyển hướng 301 về `https://DOMAIN` |

MySQL và API không mở cổng ra ngoài; chỉ Caddy nghe cổng 80/443.

---

## Bước 0 — Chuẩn bị (làm một lần)

**Trên Oracle Cloud Console**
1. Lấy **tenancy namespace**: Profile (góc phải trên) → *Tenancy* → mục *Object storage namespace* (vd `axabcdef1234`).
2. Lấy **region key** của registry, vd Singapore `sin`, Tokyo `nrt`, Ashburn `iad` → registry là `sin.ocir.io`.
3. Tạo **Auth Token**: Profile → *My profile* → *Auth tokens* → *Generate token*. Chép ngay (chỉ hiện một lần) — đây là mật khẩu đăng nhập registry.
4. (Khuyên dùng) *Developer Services → Container Registry* → tạo 2 repository **private** `kitfix247/api` và `kitfix247/web`
   trong compartment của anh/chị. Không tạo trước thì OCIR tự tạo ở compartment gốc khi push.

**Trên VPS**
1. Xem kiến trúc CPU: `uname -m` → `aarch64` (Ampere A1) dùng `linux/arm64`; `x86_64` dùng `linux/amd64`.
2. Cài Docker: `curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER` (đăng xuất/đăng nhập lại).
3. **Mở cổng 80 và 443** ở cả hai nơi:
   - Oracle Console → VCN → Subnet → *Security List* (hoặc NSG) → *Ingress rules*: TCP 80 và 443 từ `0.0.0.0/0`.
   - Tường lửa trong máy (image Oracle Linux/Ubuntu của OCI chặn sẵn):
     - Ubuntu: `sudo iptables -I INPUT 6 -p tcp -m multiport --dports 80,443 -j ACCEPT && sudo netfilter-persistent save`
     - Oracle Linux: `sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload`
4. VPS **1 GB RAM**: thêm swap 2 GB (MySQL + Node cần bộ nhớ).

**Tên miền**: tạo bản ghi **A** cho `DOMAIN` và `www.DOMAIN` trỏ về IP public của VPS, **trước** lần chạy đầu
(Caddy cần để xin chứng chỉ).

---

## Bước 1 — Build và đẩy image (trên máy dev)

```bash
docker login sin.ocir.io -u '<namespace>/<email-đăng-nhập-oracle>'
# Mật khẩu = Auth Token. Tài khoản cũ dạng IDCS: '<namespace>/oracleidentitycloudservice/<email>'

REGISTRY=sin.ocir.io/<namespace>/kitfix247 PLATFORMS=linux/arm64 ./scripts/push-images.sh
```

Script build `api` và `web`, gắn 2 tag (`<ngày-giờ>` và `latest`) rồi push. Ghi lại tag nó in ra để quay lại bản cũ khi cần.
Máy dev là Mac chip M mà VPS là `x86_64` thì đặt `PLATFORMS=linux/amd64` (build qua giả lập, lâu hơn vài phút).

---

## Bước 2 — Lần đầu trên VPS

```bash
mkdir -p ~/kitfix247 && cd ~/kitfix247
# Từ máy dev chép 4 file lên (chỉ cần đúng 4 file này, không cần mã nguồn):
#   scp docker-compose.prod.yml Caddyfile deploy.sh .env.production.example user@VPS:~/kitfix247/

cp .env.production.example .env.production
openssl rand -hex 32          # dán vào JWT_SECRET
nano .env.production           # REGISTRY, DOMAIN, mật khẩu MySQL, ADMIN_EMAIL, ADMIN_PASSWORD
chmod 600 .env.production

docker login sin.ocir.io -u '<namespace>/<email>'   # mật khẩu = Auth Token (để kéo image private)
./deploy.sh
```

`deploy.sh` làm lần lượt:
1. `docker compose pull` — kéo image `REGISTRY/api:TAG` và `REGISTRY/web:TAG`.
2. Khởi động MySQL + API. API tự chạy `prisma migrate deploy` mỗi lần khởi động.
3. **Seed chỉ khi CSDL còn trống** (bảng `settings` chưa có dòng nào): nạp dữ liệu mẫu từ thiết kế và tạo tài khoản admin.
4. Khởi động web + Caddy, dọn image cũ.

Kiểm tra: mở `https://DOMAIN`, `https://DOMAIN/kien-thuc`, `https://DOMAIN/admin` (đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`),
gửi thử một lịch hẹn ở `https://DOMAIN/dat-lich` rồi xem nó trong *Lịch hẹn* của admin.

---

## Cập nhật phiên bản mới

```bash
# Máy dev
REGISTRY=sin.ocir.io/<namespace>/kitfix247 PLATFORMS=linux/arm64 ./scripts/push-images.sh
# VPS
cd ~/kitfix247 && ./deploy.sh
```

Dữ liệu (MySQL, file upload, chứng chỉ HTTPS) nằm trong volume Docker nên giữ nguyên; seed tự bỏ qua.
Có thay đổi `docker-compose.prod.yml`, `Caddyfile` hoặc `deploy.sh` thì chép lại các file đó trước khi chạy.

**Quay lại bản cũ**: đặt `TAG=<tag cũ>` trong `.env.production` rồi `./deploy.sh`.
Lưu ý migration CSDL chỉ chạy tiến, không tự lùi — bản cũ phải tương thích với schema hiện tại.

> **Không chạy `prisma db seed` tay trên production** — seed xoá toàn bộ dịch vụ, bài viết, hãng, đánh giá, cài đặt để nạp lại dữ liệu mẫu.

---

## Vận hành

```bash
cd ~/kitfix247
DC="docker compose --env-file .env.production -f docker-compose.prod.yml"
$DC ps                     # trạng thái
$DC logs -f api            # log API (lịch hẹn mới hiện ghi log ở đây cho tới khi nối Zalo/Telegram/email)
$DC logs -f caddy          # lỗi xin chứng chỉ HTTPS (thường do DNS chưa trỏ hoặc cổng 80/443 bị chặn)
$DC restart web

# Sao lưu CSDL
$DC exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction kitfix247' | gzip > kitfix247-$(date +%F).sql.gz
# Sao lưu file upload
docker run --rm -v kitfix247_uploads:/u -v "$PWD":/b alpine tar czf /b/uploads-$(date +%F).tgz -C /u .
```

Nên đặt cron sao lưu hằng ngày và chép bản sao ra ngoài VPS (vd Object Storage của Oracle).

## Lưu ý trước khi mở cho khách

- Nội dung mẫu còn placeholder (SPEC mục 9): tên và nội dung đánh giá `[...]`, giá mẫu, ảnh, bài viết. Sửa trong `/admin` sau khi deploy.
- Thông báo lịch hẹn mới chỉ ghi log — theo dõi trang *Lịch hẹn* trong admin cho tới khi nối kênh thông báo.
- Shop (`/san-pham`, `/gio-hang`) chưa làm (SPEC bước 6).
- Trang render khi có request (image build không cần API); dữ liệu cache 5 phút và cập nhật ngay khi admin lưu.
