/*
  Warnings:

  - Changed the type of `employeeId` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- Truncate all dependent data before changing column type
TRUNCATE TABLE "User" CASCADE;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "employeeId",
ADD COLUMN     "employeeId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");
