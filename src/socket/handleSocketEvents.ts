import { Socket } from "socket.io-client";
import { APP_NAME, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST } from "../constants";
import { scrapeWallhavenQueue } from "../scheduler/wallhavenScheduler";
import { getSocket } from "./socket";
import { getAllJobIds, stopAllWallpaperJobs } from "../scheduler/queueUtils";

export const handleSocketEvents = (socket: Socket | null) => {
  if (!socket) return;


  socket?.on("connect", () => {
    console.log(`Connected to logger server`)

    // setInterval(() => {
    //   logger.info("Hello from logger server")
    // }, 1000)
  })

  socket?.on("connect_error", (err) => {
    console.error("Couldn't connect to the logging server. connect_error ", err)
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
  const socket = getSocket()
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

  const existingJob = await scrapeWallhavenQueue.getJobState(uniqueJobId)

  if (existingJob && (existingJob === "waiting" || existingJob === 'active')) {
    return new Response("Job already in queue")
  } else if (existingJob === 'failed') {
    scrapeWallhavenQueue.remove(uniqueJobId)
  }


  await scrapeWallhavenQueue.add("scrapeWallhaven",
    { page: +page, totalPages: +totalPages, pageType: jobName as "latest" | "toplist" },
    { jobId: uniqueJobId }
  )
}