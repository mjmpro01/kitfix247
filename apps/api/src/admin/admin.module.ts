import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SettingsService } from '../settings/settings.service';
import { AdminAuthGuard } from './auth/admin-auth.guard';
import { AuthController } from './auth/auth.controller';
import { jwtOptions } from './auth/jwt-config';
import { BookingsAdminController } from './bookings.admin.controller';
import { BrandsAdminController } from './brands.admin.controller';
import { OrdersAdminController } from './orders.admin.controller';
import { PostsAdminController } from './posts.admin.controller';
import { ProductsAdminController } from './products.admin.controller';
import { PrismaErrorsFilter } from './prisma-errors.filter';
import { ReviewsAdminController } from './reviews.admin.controller';
import { ServicesAdminController } from './services.admin.controller';
import { SettingsAdminController } from './settings.admin.controller';
import { StatsAdminController } from './stats.admin.controller';
import { LocalDiskStorage } from './uploads/local-disk.storage';
import { FileStorage } from './uploads/storage';
import { UploadsController } from './uploads/uploads.controller';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
  controllers: [
    AuthController,
    StatsAdminController,
    BookingsAdminController,
    ServicesAdminController,
    BrandsAdminController,
    UploadsController,
    PostsAdminController,
    ReviewsAdminController,
    SettingsAdminController,
    ProductsAdminController,
    OrdersAdminController,
  ],
  providers: [
    SettingsService,
    { provide: FileStorage, useClass: LocalDiskStorage },
    { provide: APP_GUARD, useClass: AdminAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorsFilter },
  ],
})
export class AdminModule {}
