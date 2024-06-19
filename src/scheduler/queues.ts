import { Queue } from "bullmq";

const redisHost = process.env.REDIS_HOST || 'localhost';

export const residConnection = {
  host: redisHost,
  port: 6379
}
export const scrapeWallhavenQueue = new Queue("ScrapeWallhavenQueue", { connection: residConnection });
