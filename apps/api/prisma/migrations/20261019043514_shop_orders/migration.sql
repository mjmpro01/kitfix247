/*
  Warnings:

  - Added the required column `product_name` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `product_name` VARCHAR(200) NOT NULL,
    MODIFY `unit_price` INTEGER NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `ip` VARCHAR(64) NULL,
    MODIFY `subtotal` INTEGER NULL,
    MODIFY `shipping_fee` INTEGER NULL,
    MODIFY `total` INTEGER NULL;

-- CreateIndex
CREATE INDEX `orders_phone_created_at_idx` ON `orders`(`phone`, `created_at`);

-- CreateIndex
CREATE INDEX `orders_status_created_at_idx` ON `orders`(`status`, `created_at`);
