/*
  Warnings:

  - You are about to drop the column `variants` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrintingMethod` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AttributeInputType" AS ENUM ('CHECKBOX', 'RADIO', 'PILLS', 'RICH_PILLS', 'COLOR_SWATCHES', 'DROPDOWN');

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_categoryId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "variants",
ADD COLUMN     "attributes" JSONB;

-- DropTable
DROP TABLE "Material";

-- DropTable
DROP TABLE "PrintingMethod";

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeInputType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeOption" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "subtext" TEXT,
    "colorHex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAttribute_categoryId_idx" ON "ProductAttribute"("categoryId");

-- CreateIndex
CREATE INDEX "AttributeOption_attributeId_idx" ON "AttributeOption"("attributeId");

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
