-- Bài giới thiệu: dịch vụ (dưới hero) và hãng (mục "Sửa chữa" ở trang hãng).
ALTER TABLE `brands` ADD COLUMN `repair_md` LONGTEXT NULL;
ALTER TABLE `services` ADD COLUMN `intro_md` LONGTEXT NULL;

-- Sản phẩm: hãng, giá gốc, nội dung chi tiết, đường dẫn trang chi tiết.
ALTER TABLE `products` ADD COLUMN `brand_id` INTEGER NULL,
    ADD COLUMN `compare_at_price` INTEGER NULL,
    ADD COLUMN `content_md` LONGTEXT NULL,
    ADD COLUMN `slug` VARCHAR(200) NULL;

-- Sản phẩm đã có: slug lấy từ SKU (duy nhất sẵn), admin đổi lại sau nếu muốn.
UPDATE `products` SET `slug` = LOWER(`sku`) WHERE `slug` IS NULL;

ALTER TABLE `products` MODIFY `slug` VARCHAR(200) NOT NULL;

CREATE UNIQUE INDEX `products_slug_key` ON `products`(`slug`);
CREATE INDEX `products_brand_id_idx` ON `products`(`brand_id`);
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
