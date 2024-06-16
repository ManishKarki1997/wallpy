import { DEFAULT_PAGINATION_SIZE } from "../constants";
import { prisma } from "../db/prisma"
import { generateWallpaperId } from "../helpers/uuid";
import { IScrapedMetadata, IWallhaven } from "../types/wallhaven"
import { IListCategories, IListWallpapers } from "../types/wallpaper";



export const listWallpapers = async ({
  limit = DEFAULT_PAGINATION_SIZE,
  page = 1,
  search = ""
}: IListWallpapers) => {
  const totalWalls = await prisma.wallpaper.count({
    where: {
      ...(search && search.trim() &&
      {
        OR: [
          {
            name: {
              contains: search || '',
              mode: "insensitive",
            },
          },
          {
            wallpaper: {
              category: {
                contains: search || '',
                mode: "insensitive",
              }
            },
          },
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: search,
                    mode: "insensitive"
                  }
                }
              }
            }
          },
        ]
      }
      )
    },
  });

  let wallpapers = await prisma.wallpaper.findMany({
    where: {
      ...(search && search.trim() && {

        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: search,
                    mode: "insensitive"
                  }
                }
              }
            }
          },
          {
            wallpaper: {
              category: {
                contains: search,
                mode: "insensitive"
              }
            }
          }
        ]
      })
    },
    select: {
      id: true,
      uuid: true,
      url: true,
      wallSource: true,
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
      wallpaper: {
        select: {
          imageId: true,
          id: true,
          src: true,
          thumbSrc: true,
          category: true
        }
      }
    },
    skip: (+page === 0 ? 0 : +page - 1) * +limit,
    take: +limit,
    orderBy: {
      createdAt: "desc"
    }
  });

  // for some reason,some wallpapers dont have wallpaper obj (probably someting wrong while saving to db)
  wallpapers = wallpapers.filter(wall => wall.wallpaper)

  return {
    total: totalWalls,
    wallpapers,
  };
}


export const listCategories = async ({
  limit = DEFAULT_PAGINATION_SIZE,
  page = 1,
  search = ""
}: IListCategories) => {

  const totalTags = await prisma.tag.count({
    where: {
      ...(search && search.trim() && {
        name: {
          contains: search,
          mode: "insensitive"
        }
      })
    }
  })


  const offset = (+page === 0 ? 0 : +page - 1) * +limit;

  const query = `
  SELECT
      t.id,
      t.name,
      COUNT(w.id) AS wallpaper_count
  FROM
      "Tag" t
  LEFT JOIN
      "WallpaperTag" wt ON t.id = wt."tagId"
  LEFT JOIN
      "Wallpaper" w ON wt."wallpaperId" = w.id
  WHERE
      t.name ILIKE '%' || $1 || '%'
  GROUP BY
      t.id, t.name
  ORDER BY
      wallpaper_count DESC
  LIMIT $2 OFFSET $3;
`;

  const params = [search.trim() || '', limit, offset];


  const tags = await prisma.tag.findMany({
    where: {
      ...(search && search.trim() && {
        name: {
          contains: search,
          mode: "insensitive"
        }
      })
    },
    select: {
      id: true,
      name: true
    },
    skip: (+page === 0 ? 0 : +page - 1) * +limit,
    take: +limit
  })

  function serializeTags(tags) {
    return tags.map(tag => ({
      ...tag,
      id: tag.id.toString(), // Convert BigInt to String
      wallpaper_count: Number(tag.wallpaper_count) // Convert to Number if necessary
    }));
  }

  const rawTags = await prisma.$queryRawUnsafe(query, ...params);

  const serializedTags = serializeTags(rawTags);


  return {
    total: totalTags,
    // tags,
    rawTags: serializedTags
  };
}