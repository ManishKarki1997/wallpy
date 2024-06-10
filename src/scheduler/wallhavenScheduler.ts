import { Queue, Worker } from 'bullmq'
import { scrapeWallhaven } from '../helpers/parseWallhaven';
import { IJobHandler, IQueueJob } from '../types/queue';

const redisHost = process.env.REDIS_HOST || 'localhost';

const connection = {
  host: redisHost,
  port: 6379
}

const jobHandlers: { [key: string]: IJobHandler } = {
  scrapeWallhaven
}

const processJob = async (job: IQueueJob) => {
  const { name, data, } = job
  const handler = jobHandlers[name]

  if (handler) {
    await handler(data)
  }
}

export const scrapeWallhavenQueue = new Queue("ScrapeWallhavenQueue", { connection });

const worker = new Worker("ScrapeWallhavenQueue", processJob, {
  connection,
  removeOnComplete: {
    age: 0,
    count: 0
  },
  removeOnFail: {
    age: 0,
    count: 0
  }
})


worker.on('failed', (job, err) => {
  console.error(`Job ${job?.name} failed with error ${err.message}`);
});
