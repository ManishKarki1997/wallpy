-- DropForeignKey
ALTER TABLE "Color" DROP CONSTRAINT "Color_wallpaperId_fkey";

-- DropForeignKey
ALTER TABLE "Purity" DROP CONSTRAINT "Purity_wallpaperId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_wallpaperId_fkey";

-- DropForeignKey
ALTER TABLE "Uploader" DROP CONSTRAINT "Uploader_wallpaperId_fkey";

-- DropForeignKey
ALTER TABLE "Wallhaven" DROP CONSTRAINT "Wallhaven_wallpaperId_fkey";

-- AddForeignKey
ALTER TABLE "Color" ADD CONSTRAINT "Color_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uploader" ADD CONSTRAINT "Uploader_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purity" ADD CONSTRAINT "Purity_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallhaven" ADD CONSTRAINT "Wallhaven_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
