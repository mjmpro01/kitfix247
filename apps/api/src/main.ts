import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { json } from 'express';
import { AppModule } from './app.module';
import { uploadDir } from './admin/uploads/local-disk.storage';

async function bootstrap() {
  // apps/api/.env (JWT_SECRET, UPLOAD_DIR…) — biến đã có trong môi trường được giữ nguyên.
  if (existsSync('.env')) process.loadEnvFile('.env');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  // Sau proxy/CDN thì bật TRUST_PROXY để rate limit thấy đúng IP khách.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Bài viết dài cần body lớn hơn; route công khai giữ giới hạn nhỏ để chống spam.
  app.use('/admin', json({ limit: '1mb' }));
  app.use(json({ limit: '32kb' }));
  // File tải lên (bản local). SVG có thể chứa script → chặn chạy script khi mở trực tiếp.
  app.useStaticAssets(uploadDir(), {
    prefix: '/uploads/',
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`KitFix247 API: http://localhost:${port}`);
}
bootstrap();
