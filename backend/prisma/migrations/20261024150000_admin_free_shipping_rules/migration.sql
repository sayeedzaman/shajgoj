-- Free shipping becomes fully admin-controlled. Starting values keep the rule that was
-- previously hardcoded at checkout (free from 2000 or 20 items), so charges don't change.
ALTER TABLE "StoreSettings" ADD COLUMN "freeShippingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreSettings" ADD COLUMN "freeShippingMinItems" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "StoreSettings" ALTER COLUMN "freeShippingThreshold" SET DEFAULT 2000;
UPDATE "StoreSettings" SET "freeShippingThreshold" = 2000;
