-- DropForeignKey
ALTER TABLE "WallpaperTag" DROP CONSTRAINT "WallpaperTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "WallpaperTag" DROP CONSTRAINT "WallpaperTag_wallpaperId_fkey";

-- AddForeignKey
ALTER TABLE "WallpaperTag" ADD CONSTRAINT "WallpaperTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallpaperTag" ADD CONSTRAINT "WallpaperTag_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
