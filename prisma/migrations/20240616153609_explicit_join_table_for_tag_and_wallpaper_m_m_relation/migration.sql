-- CreateTable
CREATE TABLE "ScrapedMetaData" (
    "id" SERIAL NOT NULL,
    "source" "ScrapedMetaDataSource" NOT NULL DEFAULT 'Wallhaven',
    "name" VARCHAR(255) NOT NULL,
    "page" INTEGER NOT NULL,

    CONSTRAINT "ScrapedMetaData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedMetaData_source_name_key" ON "ScrapedMetaData"("source", "name");
