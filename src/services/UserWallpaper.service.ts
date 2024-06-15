import { DEFAULT_PAGINATION_SIZE } from "../constants";
import { prisma } from "../db/prisma"
import { generateWallpaperId } from "../helpers/uuid";
import { IScrapedMetadata, IWallhaven } from "../types/wallhaven"
import { IListWallpapers } from "../types/wallpaper";



export const  listWallpapers = async({
  limit=DEFAULT_PAGINATION_SIZE,
  page = 1,
  search = ""
}: IListWallpapers) =>  {

  const totalWalls = await prisma.wallpaper.count({
    where: {      
      ...(search && search.trim() && {
        name: {
          contains: search || '',
        },
        tags:{
          some:{
            name:{
              contains: search || ''
            }
          }
        }
      })
    },
  });

  let wallpapers = await prisma.wallpaper.findMany({
    where: {      
      ...(search && search.trim() && {
        name: {
          contains: search || '',
        },
        tags:{
          some:{
            name:{
              contains: search || ''
            }
          }
        }
      })
    },
    select:{
      id:true,
      uuid:true,
      url:true,
      wallSource:true,
      // uploader:{
      //   select:{
      //     name:true,
      //     avatar:true,
      //   }
      // },
      // colors:{
      //   select:{
      //     color:true,
      //     url:true
      //   }
      // },
      wallpaper:{
        select:{
          imageId:true,
          id:true,
          src:true,
          thumbSrc:true,
          category:true
        }
      }
    },
    skip: (+page === 0 ? 0 : +page -1) * +limit,
    take: +limit,
    orderBy:{
      createdAt:"desc"
    }
  });

  // for some reason,some wallpapers dont have wallpaper obj (probably someting wrong while saving to db)
  wallpapers = wallpapers.filter(wall=> wall.wallpaper)

  return {
    total: totalWalls,
    wallpapers,
  };
}