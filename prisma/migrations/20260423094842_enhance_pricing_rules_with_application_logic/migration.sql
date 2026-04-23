/*
  Warnings:

  - You are about to drop the column `email` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Address` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PricingRuleApplication" AS ENUM ('PER_ORDER', 'PER_ITEM', 'ON_SUBTOTAL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "PricingRuleScope" AS ENUM ('ORDER_TOTAL', 'SUBTOTAL', 'TOTAL_QUANTITY', 'PER_PRODUCT');

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "phoneNumber";

-- AlterTable
ALTER TABLE "PricingRule" ADD COLUMN     "application" "PricingRuleApplication" NOT NULL DEFAULT 'PER_ORDER',
ADD COLUMN     "conditions" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scope" "PricingRuleScope" NOT NULL DEFAULT 'ORDER_TOTAL';
