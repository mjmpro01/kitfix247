#!/usr/bin/env sh
# Chạy TRÊN MÁY DEV: build image api + web và đẩy lên Oracle Container Registry (OCIR).
#   REGISTRY=sin.ocir.io/<namespace>/kitfix247 PLATFORMS=linux/arm64 ./scripts/push-images.sh
# Cần `docker login <region>.ocir.io` trước (xem DEPLOY.md).
set -eu
cd "$(dirname "$0")/.."
REGISTRY=${REGISTRY:?Đặt REGISTRY, vd sin.ocir.io/axabcdef1234/kitfix247}
TAG=${TAG:-$(date +%Y%m%d-%H%M)}
# VPS Ampere (ARM) = linux/arm64 · VPS AMD/Intel = linux/amd64 — kiểm tra bằng `uname -m` trên VPS.
PLATFORMS=${PLATFORMS:-linux/amd64}

# Builder hỗ trợ build chéo kiến trúc và --push.
docker buildx inspect kitfix-builder >/dev/null 2>&1 || docker buildx create --name kitfix-builder --driver docker-container >/dev/null
for target in api web; do
  echo "==> $REGISTRY/$target:$TAG ($PLATFORMS)"
  docker buildx build --builder kitfix-builder --platform "$PLATFORMS" --target "$target" \
    -t "$REGISTRY/$target:$TAG" -t "$REGISTRY/$target:latest" --push .
done
echo "Xong. Trên VPS đặt TAG=$TAG trong .env.production (hoặc để latest) rồi chạy ./deploy.sh"
