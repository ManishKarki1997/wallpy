/*
  Warnings:

  - A unique constraint covering the columns `[source,name]` on the table `ScrapedMetaData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ScrapedMetaDataSource" AS ENUM ('Wallhaven');

-- AlterTable
ALTER TABLE "ScrapedMetaData" ADD COLUMN     "source" "ScrapedMetaDataSource" NOT NULL DEFAULT 'Wallhaven';

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedMetaData_source_name_key" ON "ScrapedMetaData"("source", "name");
