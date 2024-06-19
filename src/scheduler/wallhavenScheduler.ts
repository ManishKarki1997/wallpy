import { Queue, Worker } from 'bullmq'
import { scrapeWallhaven } from '../helpers/parseWallhaven';
import { IJobHandler, IQueueJob } from '../types/queue';
import { logger } from '../logger';
import { residConnection } from './queues';

const redisHost = process.env.REDIS_HOST || 'localhost';

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

// scrapeWallhavenQueue.on("progress", (job, progress) => {
//   logger.info(`Job ${job?.name} progress: ${progress}`)
// })

const worker = new Worker("ScrapeWallhavenQueue", processJob, {
  connection: residConnection,
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
