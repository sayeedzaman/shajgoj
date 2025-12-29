-- CreateTable
CREATE TABLE "Type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "typeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product"
  ADD COLUMN "subCategoryId" TEXT;

-- Migrate existing products to have a default subcategory
-- First, we'll need to create default Types and SubCategories for each existing Category
-- This migration assumes you'll handle data migration separately or manually

-- DropForeignKey (will be added after data migration)
-- ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- CreateIndex
CREATE INDEX "Type_categoryId_idx" ON "Type"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Type_slug_categoryId_key" ON "Type"("slug", "categoryId");

-- CreateIndex
CREATE INDEX "SubCategory_typeId_idx" ON "SubCategory"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_slug_typeId_key" ON "SubCategory"("slug", "typeId");

-- AddForeignKey
ALTER TABLE "Type" ADD CONSTRAINT "Type_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: The following steps need to be done after data migration:
-- 1. Make subCategoryId NOT NULL
-- 2. Add the foreign key constraint for Product.subCategoryId
-- 3. Drop the categoryId column from Product
