/*
  Warnings:

  - You are about to drop the column `parentId` on the `Category` table. All the data in the column will be lost.
  - Made the column `serviceId` on table `Category` required. This step will fail if there are existing NULL values in that column.

*/

-- CreateTable for Subcategory first
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- Migrate data: Insert categories with parentId into Subcategory table
INSERT INTO "Subcategory" ("id", "categoryId", "name", "slug", "description", "createdAt", "updatedAt")
SELECT "id", "parentId", "name", "slug", "description", "createdAt", "updatedAt"
FROM "Category"
WHERE "parentId" IS NOT NULL;

-- Update existing Category records: set serviceId from those with parentId
UPDATE "Category" c1
SET "serviceId" = c2."serviceId"
FROM "Category" c2
WHERE c1."parentId" = c2."id" AND c1."serviceId" IS NULL;

-- For any remaining NULL serviceIds (shouldn't happen), set a default
UPDATE "Category"
SET "serviceId" = '00000000-0000-0000-0000-000000000000'
WHERE "serviceId" IS NULL;

-- Now drop the old constraints and columns
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";

DROP INDEX IF EXISTS "Category_parentId_idx";

-- Drop the parentId column
ALTER TABLE "Category" DROP COLUMN "parentId";

-- Make serviceId NOT NULL
ALTER TABLE "Category" ALTER COLUMN "serviceId" SET NOT NULL;

-- Update Product table
ALTER TABLE "Product" ADD COLUMN "subcategoryId" TEXT;
ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL;

-- Create indexes for Subcategory
CREATE UNIQUE INDEX "Subcategory_slug_key" ON "Subcategory"("slug");
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");
CREATE INDEX "Subcategory_slug_idx" ON "Subcategory"("slug");

-- Create indexes for Category
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- Add foreign keys
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
