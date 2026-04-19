/*
  Warnings:

  - You are about to drop the column `category` on the `Material` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Material_category_idx";

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Material_categoryId_idx" ON "Material"("categoryId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
