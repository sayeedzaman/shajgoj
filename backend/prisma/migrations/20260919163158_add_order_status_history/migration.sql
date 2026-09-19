-- Track every order status transition so the order tracker can show a real timeline
-- (when each step actually happened), not just the current status.
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: give every existing order a starting history entry matching its current
-- status, timestamped at order creation, so old orders don't render an empty tracker.
INSERT INTO "OrderStatusHistory" ("id", "status", "createdAt", "orderId")
SELECT gen_random_uuid()::text, "status", "createdAt", "id" FROM "Order";
