/*
  Warnings:

  - You are about to drop the column `wallpaperId` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_wallpaperId_fkey";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "wallpaperId";

-- CreateTable
CREATE TABLE "_TagToWallpaper" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TagToWallpaper_AB_unique" ON "_TagToWallpaper"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToWallpaper_B_index" ON "_TagToWallpaper"("B");

-- AddForeignKey
ALTER TABLE "_TagToWallpaper" ADD CONSTRAINT "_TagToWallpaper_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToWallpaper" ADD CONSTRAINT "_TagToWallpaper_B_fkey" FOREIGN KEY ("B") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
