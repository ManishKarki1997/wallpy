/*
  Warnings:

  - You are about to drop the `Purity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Purity" DROP CONSTRAINT "Purity_wallpaperId_fkey";

-- AlterTable
ALTER TABLE "Wallhaven" ADD COLUMN     "purity" TEXT;

-- DropTable
DROP TABLE "Purity";
