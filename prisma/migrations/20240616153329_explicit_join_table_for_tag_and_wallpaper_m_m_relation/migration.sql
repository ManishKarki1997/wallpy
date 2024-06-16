/*
  Warnings:

  - You are about to drop the `ScrapedMetaData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TagToWallpaper` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TagToWallpaper" DROP CONSTRAINT "_TagToWallpaper_A_fkey";

-- DropForeignKey
ALTER TABLE "_TagToWallpaper" DROP CONSTRAINT "_TagToWallpaper_B_fkey";

-- DropTable
DROP TABLE "ScrapedMetaData";

-- DropTable
DROP TABLE "_TagToWallpaper";

-- CreateTable
CREATE TABLE "WallpaperTag" (
    "tagId" INTEGER NOT NULL,
    "wallpaperId" INTEGER NOT NULL,

    CONSTRAINT "WallpaperTag_pkey" PRIMARY KEY ("tagId","wallpaperId")
);

-- AddForeignKey
ALTER TABLE "WallpaperTag" ADD CONSTRAINT "WallpaperTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallpaperTag" ADD CONSTRAINT "WallpaperTag_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
