import { scrapeWallhaven } from '../helpers/parseWallhaven';
import { Queue, Worker } from 'bullmq'
import { IJobHandler, IQueueJob } from '../types/queue';

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
const residConnection = {
  host: redisHost,
  port: 6379
}
const scrapeWallhavenQueue = new Queue("ScrapeWallhavenQueue", { connection: residConnection });

const worker = new Worker("ScrapeWallhavenQueue", processJob, {
  connection: residConnection,
  removeOnComplete: {
    age: 0,
    count: 0
  },
  removeOnFail: {
    age: 0,
    count: 0
  },
})


worker.on('failed', (job, err) => {
  console.error(`Job ${job?.name} failed with error ${err.message}`);
});


export { scrapeWallhavenQueue }