#!/usr/bin/env sh
# Chạy TRÊN VPS: kéo image mới từ OCIR rồi khởi động lại. Chạy lại được nhiều lần;
# seed CHỈ chạy khi CSDL còn trống (lần đầu).
set -eu
cd "$(dirname "$0")"
ENV_FILE=${ENV_FILE:-.env.production}
[ -f "$ENV_FILE" ] || { echo "Thiếu $ENV_FILE — sao chép từ .env.production.example"; exit 1; }
DC="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"

echo "1/4 Kéo image"
[ "${SKIP_PULL:-0}" = 1 ] || $DC pull

echo "2/4 Khởi động MySQL + API (API tự chạy prisma migrate deploy)"
$DC up -d --wait mysql api

echo "3/4 Seed dữ liệu mẫu + tài khoản admin nếu CSDL còn trống"
if $DC exec -T api node -e "new (require('@prisma/client').PrismaClient)().setting.count().then(n=>process.exit(n?1:0))"; then
  $DC exec -T api npx prisma db seed
else
  echo "    CSDL đã có dữ liệu — bỏ qua seed"
fi

echo "4/4 Khởi động web + Caddy"
$DC up -d --wait --remove-orphans web caddy
docker image prune -f >/dev/null
$DC ps
