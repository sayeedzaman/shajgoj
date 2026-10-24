-- Payment method / status for orders (existing orders are Cash on Delivery)
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'BKASH', 'NAGAD', 'UPAY', 'ROCKET');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED');

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD';
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Order" ADD COLUMN "paymentSender" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentTrxId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);

-- Delivered COD orders were paid in cash
UPDATE "Order" SET "paymentStatus" = 'PAID', "paidAt" = "updatedAt" WHERE "status" = 'DELIVERED';

CREATE UNIQUE INDEX "Order_paymentMethod_paymentTrxId_key" ON "Order"("paymentMethod", "paymentTrxId");

-- Mobile banking settings
ALTER TABLE "StoreSettings" ALTER COLUMN "bkashEnabled" SET DEFAULT true;
ALTER TABLE "StoreSettings" ALTER COLUMN "nagadEnabled" SET DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "upayEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "rocketEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "mobilePaymentNumber" TEXT NOT NULL DEFAULT '+8801835286271';
UPDATE "StoreSettings" SET "bkashEnabled" = true, "nagadEnabled" = true;
