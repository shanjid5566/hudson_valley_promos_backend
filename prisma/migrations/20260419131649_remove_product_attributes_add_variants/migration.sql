/*
  Warnings:

  - You are about to drop the `AttributeOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductAttribute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AttributeOption" DROP CONSTRAINT "AttributeOption_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAttribute" DROP CONSTRAINT "ProductAttribute_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "variants" JSONB;

-- DropTable
DROP TABLE "AttributeOption";

-- DropTable
DROP TABLE "ProductAttribute";

-- DropEnum
DROP TYPE "AttributeType";
