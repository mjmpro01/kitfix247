import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsController } from './settings/settings.controller';
import { SettingsService } from './settings/settings.service';
import { ServicesController } from './services/services.controller';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';
import { ContentController } from './content/content.controller';
import { PostsController } from './content/posts.controller';
import { NotifyService } from './notify/notify.service';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AdminModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }])],
  controllers: [SettingsController, ServicesController, BookingsController, ContentController, PostsController],
  providers: [SettingsService, BookingsService, NotifyService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
