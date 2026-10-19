# KitFix247 — một Dockerfile cho cả api và web (chọn bằng --target).
# Build + đẩy lên Oracle Container Registry: scripts/push-images.sh (xem DEPLOY.md).
# Image không gắn với tên miền hay CSDL nào: cấu hình đọc từ biến môi trường lúc chạy.

FROM node:20-bookworm-slim AS base
# openssl: Prisma engine cần; corepack: đúng phiên bản pnpm trong package.json.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@8.6.12 --activate
WORKDIR /repo

# ---------- Cài phụ thuộc (cache theo lockfile) ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build:packages

# ---------- API ----------
FROM build AS api-build
RUN pnpm --filter @kitfix/api build

# Giữ cả devDependencies để chạy được `prisma migrate deploy` và seed lần đầu trong container.
FROM api-build AS api
ENV NODE_ENV=production
WORKDIR /repo/apps/api
EXPOSE 4000
# Chờ CSDL sẵn sàng (thử lại tối đa ~2 phút) rồi chạy migration và khởi động API.
CMD ["sh", "-c", "for i in $(seq 1 24); do npx prisma migrate deploy && exec node dist/main.js; echo 'CSDL chưa sẵn sàng, thử lại sau 5 giây'; sleep 5; done; exit 1"]

# ---------- Web ----------
FROM build AS web-build
# Build không cần API: SKIP_PRERENDER=1 → trang render khi có request (dữ liệu cache 5 phút theo tag).
# Form đặt lịch gọi đường dẫn tương đối /api (Caddy chuyển vào API) nên image dùng được cho mọi tên miền.
ENV NEXT_PUBLIC_API_URL=/api SKIP_PRERENDER=1 NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @kitfix/web build

FROM node:20-bookworm-slim AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 SKIP_PRERENDER=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN useradd --uid 1001 --create-home kitfix
COPY --from=web-build --chown=kitfix /repo/apps/web/.next/standalone ./
COPY --from=web-build --chown=kitfix /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build --chown=kitfix /repo/apps/web/public ./apps/web/public
USER kitfix
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
