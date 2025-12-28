-- CreateTable
CREATE TABLE "Concern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concern_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "concernId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Concern_name_key" ON "Concern"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Concern_slug_key" ON "Concern"("slug");

-- CreateIndex
CREATE INDEX "Product_concernId_idx" ON "Product"("concernId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "Concern"("id") ON DELETE SET NULL ON UPDATE CASCADE;
