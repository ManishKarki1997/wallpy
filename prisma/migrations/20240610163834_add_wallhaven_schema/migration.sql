-- CreateTable
CREATE TABLE "Color" (
    "id" SERIAL NOT NULL,
    "color" TEXT NOT NULL,
    "url" TEXT,
    "wallpaperId" INTEGER NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "wallpaperId" INTEGER NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Uploader" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "url" TEXT,
    "wallpaperId" INTEGER NOT NULL,

    CONSTRAINT "Uploader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "wallpaperId" INTEGER NOT NULL,

    CONSTRAINT "Purity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallhaven" (
    "id" SERIAL NOT NULL,
    "imageId" TEXT NOT NULL,
    "thumbSrc" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "stars" INTEGER,
    "category" TEXT,
    "wallpaperId" INTEGER NOT NULL,

    CONSTRAINT "Wallhaven_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallpaper" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "wallSource" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" TEXT,
    "imageType" TEXT,
    "views" TEXT,

    CONSTRAINT "Wallpaper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uploader_wallpaperId_key" ON "Uploader"("wallpaperId");

-- CreateIndex
CREATE UNIQUE INDEX "Purity_wallpaperId_key" ON "Purity"("wallpaperId");

-- AddForeignKey
ALTER TABLE "Color" ADD CONSTRAINT "Color_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uploader" ADD CONSTRAINT "Uploader_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purity" ADD CONSTRAINT "Purity_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallhaven" ADD CONSTRAINT "Wallhaven_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
