import io, { Socket } from 'socket.io-client'
import { APP_NAME, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST } from '../constants'
import dotenv from 'dotenv';
import { logger } from '../logger';
import { getAllJobIds, stopAllWallpaperJobs } from '../services/SUWallpaper.service';
import { scrapeWallhavenQueue } from '../scheduler/queues';

dotenv.config()

let socket: Socket | null = null;

export const setupSocketLogger = () => {
  socket = io(process.env.LOGGER_SERVER_URL || "http://192.168.1.162:7000", {
    rejectUnauthorized: false,
    secure: false,
    transports: ['websocket'],
  })

  socket?.on("connect", () => {
    logger.info(`Connected to logger server`)

    // setInterval(() => {
    //   logger.info("Hello from logger server")
    // }, 1000)
  })

  socket?.on("connect_error", (err) => {
    logger.error("Couldn't connect to the logging server. connect_error ", err)
  })

  socket?.emit("JOIN", {
    name: APP_NAME,
  })

  socket.on("STOP_JOBS", async (payload) => {
    const { jobIds } = payload
    await stopAllWallpaperJobs(jobIds)
    socket?.emit("STOP_ALL_JOBS")
    handleEmitAllJobs()
  })

  socket.on("GET_ALL_JOBS", async () => {
    handleEmitAllJobs()
  })

  socket.on("ADD_JOB", async (payload) => {
    handleAddWallhavenJob(payload.jobName)
    handleEmitAllJobs()
  })
}

export const handleEmitAllJobs = async () => {
  const allJobIds = await getAllJobIds()
  socket?.emit("GET_ALL_JOBS", {
    jobs: allJobIds,
    payload: {
      name: APP_NAME
    }
  })
}

const handleAddWallhavenJob = async (jobName: string) => {
  const page = 1;
  let totalPages = 1
  if (jobName === 'latest') {
    totalPages = (SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST)
  } else {
    totalPages = (SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST)
  }

  const uniqueJobId = `scrapeWallhaven-${jobName}`
  await scrapeWallhavenQueue.add("scrapeWallhaven",
    { page: +page, totalPages: +totalPages, pageType: jobName as "latest" | "toplist" },
    { jobId: uniqueJobId }
  )
}

export const getSocket = () => {
  if (!socket) {
    return null
    // throw new Error('Socket is not initialized');
  }
  return socket;
};