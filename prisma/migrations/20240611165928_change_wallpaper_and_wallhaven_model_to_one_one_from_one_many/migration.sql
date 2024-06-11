/*
  Warnings:

  - A unique constraint covering the columns `[wallpaperId]` on the table `Wallhaven` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Wallhaven_wallpaperId_key" ON "Wallhaven"("wallpaperId");
