-- Rename shipping fee settings to reflect actual Dhaka / Outside Dhaka usage
ALTER TABLE "StoreSettings" RENAME COLUMN "standardShippingFee" TO "dhakaShippingFee";
ALTER TABLE "StoreSettings" RENAME COLUMN "expressShippingFee" TO "outsideDhakaShippingFee";

-- Store subtotal and shipping cost per order so admins can adjust shipping independently
ALTER TABLE "Order" ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing orders: best-effort, treat prior total as subtotal (shipping unknown)
UPDATE "Order" SET "subtotal" = "total" WHERE "subtotal" = 0;
