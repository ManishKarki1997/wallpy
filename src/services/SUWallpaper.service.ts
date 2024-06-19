import { Job } from "bullmq";
import { DEFAULT_PAGINATION_SIZE } from "../constants";
import { prisma } from "../db/prisma"
import { generateWallpaperId } from "../helpers/uuid";
// import { logger } from "../logger";
import { IScrapedMetadata, IWallhaven } from "../types/wallhaven"
import { IListWallpapers } from "../types/wallpaper";
import { scrapeWallhavenQueue } from "../scheduler/wallhavenScheduler";

export const saveWallpapers = async (wallpapers: IWallhaven[]) => {
  let transaction;

  try {

    const wallpapersObj = wallpapers.reduce((acc: any, wallpaper: IWallhaven) => {
      acc[wallpaper.imageId] = {
        ...acc[wallpaper.imageId],
        purity: wallpaper.metadata?.purity,
        uploader: wallpaper.uploader,
        tags: wallpaper.tags,
        colors: wallpaper.colors,
      }
      acc[wallpaper.imageId] = wallpaper
      return acc;
    }, {});

    transaction = prisma.$transaction(async (_tx) => {


      const newWallpapers = await prisma.wallpaper.createManyAndReturn({
        skipDuplicates: true,
        data: wallpapers.map(wallpaper => ({
          uuid: generateWallpaperId(),
          name: wallpaper.imageId,
          url: wallpaper.url,
          wallSource: "WALLHAVEN",
          size: wallpaper.metadata?.size,
          imageType: wallpaper.metadata?.imageType,
          views: wallpaper.metadata?.views,
        }))
      })


      const wallhavenWalls = await prisma.wallhaven.createManyAndReturn({
        skipDuplicates: true,
        data: newWallpapers.map(newWall => {
          const originalWallpaperDetail = wallpapersObj[newWall.name] as IWallhaven
          return ({
            purity: originalWallpaperDetail?.metadata?.purity,
            wallpaperId: newWall.id,
            imageId: originalWallpaperDetail.imageId,
            thumbSrc: originalWallpaperDetail.thumbSrc,
            src: originalWallpaperDetail.src,
            resolution: originalWallpaperDetail.resolution || "",
            stars: originalWallpaperDetail.stars,
            category: originalWallpaperDetail.metadata?.category
          })
        })
      })

      const newTags = await prisma.tag.createManyAndReturn({
        skipDuplicates: true,
        data: wallhavenWalls
          .map(wallpaper => {
            const originalWallpaperDetail = wallpapersObj[wallpaper.imageId] as IWallhaven
            const tags = originalWallpaperDetail.tags || []
            // @ts-ignore
            const finalTags = tags.map(tag => ({
              name: tag.name,
              url: tag?.url,

            }))
            return finalTags
          }).flat()
          .filter(c => c.name)
      })


      await prisma.uploader.createMany({
        skipDuplicates: true,
        data: wallhavenWalls.map(wallhavenWall => {
          const originalWallpaperDetail = wallpapersObj[wallhavenWall.imageId] as IWallhaven

          return ({
            name: originalWallpaperDetail.uploader?.name || "",
            avatar: originalWallpaperDetail.uploader?.avatar || "",
            url: originalWallpaperDetail.uploader?.url || "",
            wallpaperId: wallhavenWall.wallpaperId,
          })
        }).filter(wall => wall.name)
      })

      await prisma.color.createMany({
        data: wallhavenWalls
          .map(wallpaper => {
            const originalWallpaperDetail = wallpapersObj[wallpaper.imageId] as IWallhaven
            const colors = originalWallpaperDetail.colors || []
            // @ts-ignore
            const finalColors = colors.map(color => ({
              color: color.color,
              url: color.url,
              wallpaperId: wallpaper.wallpaperId
            }))
            return finalColors
          }).flat()
          .filter(c => c.color),
        skipDuplicates: true
      })

      // populate join table of tags and wallpapers
      const wallpaperTagData: Array<{ wallpaperId: number; tagId: number; }> = [];
      newWallpapers.forEach((wallpaper) => {
        newTags.forEach((tag) => {
          wallpaperTagData.push({
            wallpaperId: wallpaper.id,
            tagId: tag.id,
          });
        });
      });

      // Create associations in WallpaperTag within the transaction
      await prisma.wallpaperTag.createMany({
        skipDuplicates: true,
        data: wallpaperTagData,
      });

    })



  } catch (error) {
    // if(error?.message?.includes("Unique constraint")) return
    console.error("Error saving wallpapers to postgres db", error?.message)
  }
}

export const setScrapedMetaData = async (payload: IScrapedMetadata) => {

  //   await prisma.$executeRaw`
  //   INSERT INTO "ScrapedMetaData" ("source", "name", "page")
  //   VALUES (${payload.source}, ${payload.pageType}, ${payload.currentPage})
  //   ON CONFLICT ("source", "name")
  //   DO UPDATE SET "page" = ${payload.currentPage};
  // `;

  //   // upsert didn't quite work because the where clause couldn't determine the record, so trying the longer way
  const existingMetadata = await prisma.scrapedMetaData.findFirst({
    where: {
      name: payload.pageType,
      source: payload.source
    }
  })

  if (existingMetadata) {
    // update
    await prisma.scrapedMetaData.updateMany({
      data: {
        page: payload.currentPage
      },
      where: {
        name: payload.pageType,
        source: payload.source
      }
    })
  } else {
    // create new record
    await prisma.scrapedMetaData.create({
      data: {
        page: payload.currentPage,
        name: payload.pageType,
        source: payload.source
      }
    })
  }
}

export const getScrapedMetaData = async (payload: Omit<IScrapedMetadata, "currentPage">) => {
  return prisma.scrapedMetaData.findFirst({
    where: {
      name: payload.pageType,
      source: payload.source
    }
  })
}


export const listWallpapers = async ({
  limit = DEFAULT_PAGINATION_SIZE,
  page = 1,
  search = ""
}: IListWallpapers) => {
  const totalWalls = await prisma.wallpaper.count({
    where: {
      name: {
        contains: search || '',
      },
      tags: {
        some: {
          name: {
            contains: search || ''
          }
        }
      }
    },
  });

  const wallpapers = await prisma.wallpaper.findMany({
    where: {
      name: {
        contains: search || '',
      },
      tags: {
        some: {
          name: {
            contains: search || ''
          }
        }
      }
    },
    skip: +page * +limit,
    take: +limit,
  });

  return {
    total: totalWalls,
    wallpapers,
  };
}
