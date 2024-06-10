import { Redis } from "ioredis";
import { redis } from "../redis";
import { IBulkInsertResponse, IScrapedMetadata, IWallhaven } from "../types/wallhaven";

export const WALLHAVEN_PREFIX = 'wallhaven';

export class Wallhaven {
  private redis: Redis;
  private prefix: string;

  constructor(prefix = 'wallpaper') {
    this.redis = redis;
    this.prefix = prefix;
  }

  async getAll(
    {
      page = 1,
      limit = Number.MAX_SAFE_INTEGER,
      sortBy = 'imageId',
      sortOrder = 'asc',
      searchTerm = ''
    }: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      searchTerm?: string;
    }
  ): Promise<IWallhaven[]> {
    let keys = await this.redis.keys(`${this.prefix}:*`);
    const pipeline = this.redis.pipeline();

    
    const start = (page - 1) * limit;
    keys = keys.slice(start, start + limit);
    
    
    keys.forEach((key) => {
      pipeline.hgetall(key);
    });

    const results = await pipeline.exec();

    if (!results) {
      return []
    }

    let wallpapers = results.map((result, index) => {
      const data = result[1] as IWallhaven;
      return {
        imageId: keys[index].split(':')[1],
        thumbSrc: data.thumbSrc,
        src: data.src,
        url: data.src,
        resolution: data.resolution,
        stars: data.stars ? (data?.stars) : undefined,
        metadata: data?.metadata,
        colors: data?.colors,
        tags: data?.tags,
        uploader: data?.uploader,        
      };
    });

    if(sortBy){
      wallpapers.sort((a, b) => {
        // @ts-ignore
        const aValue = a[sortBy] || "";
        // @ts-ignore
        const bValue = b[sortBy] || "";

        if (sortOrder === 'asc') {
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
          return 0;
        } else {
          if (aValue > bValue) return -1;
          if (aValue < bValue) return 1;
          return 0;
        }
      });
    }

    if (searchTerm) {
      wallpapers = wallpapers.filter(wallpaper =>
          wallpaper.imageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wallpaper.thumbSrc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wallpaper.src.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wallpaper?.resolution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (wallpaper.stars && wallpaper.stars?.toString()?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }

    return wallpapers;
  }

  async create(wallpaper: IWallhaven): Promise<void> {
    const key = `${this.prefix}:${wallpaper.imageId}`;
    await this.redis.hmset(key, {
      thumbSrc: wallpaper.thumbSrc,
      src: wallpaper.src,
      resolution: wallpaper.resolution || '',
      stars: wallpaper.stars?.toString() || '',
    });
  }

  async setScrapedDetails({
    currentPage=1,
    pageType = "latest"
  }:IScrapedMetadata): Promise<void> {
    const key = `${this.prefix}:${pageType}_metadata`;
    await this.redis.hmset(key, {
      currentPage,
      pageType
    });
  }

  async getScrapedDetails({    
    pageType = "latest"
  }:{pageType: "latest" | "toplist"}): Promise<any> {
    const key = `${this.prefix}:${pageType}_metadata`;
    return this.redis.hgetall(key);
  }

  
  async getById(imageId: string): Promise<IWallhaven | null> {
    const key = `${this.prefix}:${imageId}`;
    const wallpaperData = await this.redis.hgetall(key);
    if (Object.keys(wallpaperData).length === 0) {
      return null; // Wallpaper not found
    }
    return {
      url: wallpaperData.url,
      imageId,
      thumbSrc: wallpaperData.thumbSrc,
      src: wallpaperData.src,
      resolution: wallpaperData.resolution,
      stars: wallpaperData.stars ? parseInt(wallpaperData.stars) : undefined,
    };
  }

  async update(imageId: string, updates: Partial<IWallhaven>): Promise<void> {
    const key = `${this.prefix}:${imageId}`;
    const updateData: { [key: string]: string } = {};
    if (updates.thumbSrc) updateData.thumbSrc = updates.thumbSrc;
    if (updates.src) updateData.src = updates.src;
    if (updates.resolution) updateData.resolution = updates.resolution;
    if (updates.stars !== undefined) updateData.stars = updates.stars.toString();
    await this.redis.hmset(key, updateData);
  }

  async delete(imageId: string): Promise<void> {
    const key = `${this.prefix}:${imageId}`;
    await this.redis.del(key);
  }

  async deleteAll(): Promise<number> {
    const keys = await this.redis.keys(`${this.prefix}:*`);

    if (keys.length === 0) {
        // No wallpapers found for the given prefix
        return 0;
    }

    // Use pipeline for efficient deletion
    const pipeline = this.redis.pipeline();

    keys.forEach((key) => {
        pipeline.del(key);
    });

    // Execute the pipeline to delete all keys
    const results = await pipeline.exec();

    if(!results || !Array.isArray(results) || results?.length === 0) 0;

    // Count the number of keys deleted
    const deletedCount = results?.reduce((count, result) => {
        if (result[0] === null) {
            // Key was successfully deleted
            return count + 1;
        } else {
            // Key deletion failed
            // Handle error or retry if needed
            return count;
        }
    }, 0);

    return deletedCount || 0;
}

  async bulkInsert(wallpapers: IWallhaven[]): Promise<IBulkInsertResponse> {
    const pipeline = this.redis.pipeline();

    let imageExists = false

    for(const wallpaper of wallpapers){
      const key = `${this.prefix}:${wallpaper.imageId}`;

      const _imageExists = await this.redis.exists(key);      

      if(_imageExists){
        imageExists = !!_imageExists
      }

      pipeline.hmset(key, {
        thumbSrc: wallpaper.thumbSrc,
        src: wallpaper.src,
        resolution: wallpaper.resolution || '',
        stars: wallpaper.stars?.toString() || '',
        metadata: JSON.stringify(wallpaper?.metadata || {}),
        tags: JSON.stringify(wallpaper?.tags || {}),
        colors: JSON.stringify(wallpaper?.colors || []),
        uploader: JSON.stringify(wallpaper?.uploader || {}),
      });  
    }

    await pipeline.exec();

    return {
      imageExists
    }
  }

}