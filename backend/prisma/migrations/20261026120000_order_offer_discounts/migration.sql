-- Record product offer discounts on orders (existing orders had no offer pricing)
ALTER TABLE "Order" ADD COLUMN "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "OrderItem" ADD COLUMN "originalPrice" DOUBLE PRECISION;
ALTER TABLE "OrderItem" ADD COLUMN "offerId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "offerName" TEXT;

CREATE INDEX "OrderItem_offerId_idx" ON "OrderItem"("offerId");

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
