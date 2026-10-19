-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(64) NOT NULL,
    `value` JSON NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `short_name` VARCHAR(80) NOT NULL,
    `short_hint` VARCHAR(160) NOT NULL,
    `card_text` VARCHAR(255) NOT NULL,
    `lead` TEXT NOT NULL,
    `device` VARCHAR(80) NOT NULL,
    `faults_title` VARCHAR(160) NOT NULL,
    `icon` VARCHAR(40) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `show_home` BOOLEAN NOT NULL DEFAULT true,
    `seo_title` VARCHAR(160) NULL,
    `seo_desc` VARCHAR(320) NULL,

    UNIQUE INDEX `services_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_faults` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `cause` TEXT NOT NULL,
    `price_from` INTEGER NOT NULL,
    `price_to` INTEGER NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,

    INDEX `service_faults_service_id_idx`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `question` VARCHAR(255) NOT NULL,
    `answer` TEXT NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,

    INDEX `service_faqs_service_id_idx`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `show_home` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `service_id` INTEGER NULL,
    `name` VARCHAR(160) NOT NULL,
    `duration` VARCHAR(60) NOT NULL,
    `price_from` INTEGER NOT NULL,
    `price_to` INTEGER NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `process_steps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `n` INTEGER NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_name` VARCHAR(120) NOT NULL,
    `area` VARCHAR(120) NOT NULL,
    `device` VARCHAR(120) NOT NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'hidden') NOT NULL DEFAULT 'pending',
    `show_home` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `logo_url` VARCHAR(512) NULL,
    `logo_style` ENUM('gray', 'color') NOT NULL DEFAULT 'gray',
    `description` TEXT NULL,
    `devices` JSON NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `show_home` BOOLEAN NOT NULL DEFAULT true,
    `seo_title` VARCHAR(160) NULL,
    `seo_desc` VARCHAR(320) NULL,

    UNIQUE INDEX `brands_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(200) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content_md` LONGTEXT NOT NULL,
    `cover_url` VARCHAR(512) NULL,
    `cover_alt` VARCHAR(255) NULL,
    `category_id` INTEGER NOT NULL,
    `device` VARCHAR(80) NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `focus_keyword` VARCHAR(120) NULL,
    `meta_title` VARCHAR(160) NULL,
    `meta_desc` VARCHAR(320) NULL,
    `seo_score` INTEGER NOT NULL DEFAULT 0,
    `read_minutes` INTEGER NOT NULL DEFAULT 1,
    `author` VARCHAR(120) NOT NULL,
    `published_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_brands` (
    `post_id` INTEGER NOT NULL,
    `brand_id` INTEGER NOT NULL,

    PRIMARY KEY (`post_id`, `brand_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `device` VARCHAR(80) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('new', 'called', 'assigned', 'done', 'cancelled') NOT NULL DEFAULT 'new',
    `technician` VARCHAR(120) NULL,
    `source` ENUM('form', 'call', 'zalo') NOT NULL DEFAULT 'form',
    `ip` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `called_at` DATETIME(3) NULL,

    INDEX `bookings_phone_created_at_idx`(`phone`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(64) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,
    `price` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `image_url` VARCHAR(512) NULL,
    `icon` VARCHAR(40) NOT NULL DEFAULT 'wrench',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',

    UNIQUE INDEX `products_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `customer_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `payment` ENUM('cod', 'bank', 'momo', 'zalopay') NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `subtotal` INTEGER NOT NULL,
    `shipping_fee` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `orders_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `qty` INTEGER NOT NULL,
    `unit_price` INTEGER NOT NULL,

    PRIMARY KEY (`order_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `service_faults` ADD CONSTRAINT `service_faults_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_faqs` ADD CONSTRAINT `service_faqs_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_items` ADD CONSTRAINT `price_items_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `price_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_items` ADD CONSTRAINT `price_items_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_brands` ADD CONSTRAINT `post_brands_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_brands` ADD CONSTRAINT `post_brands_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
