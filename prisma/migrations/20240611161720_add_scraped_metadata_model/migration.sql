-- CreateTable
CREATE TABLE "ScrapedMetaData" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "page" INTEGER NOT NULL,

    CONSTRAINT "ScrapedMetaData_pkey" PRIMARY KEY ("id")
);
