/*
  Warnings:

  - A unique constraint covering the columns `[imageId]` on the table `Wallhaven` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Wallpaper` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uuid` to the `Wallpaper` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wallpaper" ADD COLUMN     "uuid" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wallhaven_imageId_key" ON "Wallhaven"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallpaper_uuid_key" ON "Wallpaper"("uuid");
