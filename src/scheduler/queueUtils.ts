import { Job } from "bullmq"
import { scrapeWallhavenQueue } from "./wallhavenScheduler"

export const getAllJobIds = async () => {
  const jobs = await scrapeWallhavenQueue.getJobs(["active", "waiting", "delayed", "completed"])
  const uniqueJobIds = Array.from(new Set(jobs.map(job => job.id)))
  return uniqueJobIds
}

export const stopAllWallpaperJobs = async ({ jobIds }: { jobIds?: string[] }) => {

  try {
    const jobs = await scrapeWallhavenQueue.getJobs(["active", "waiting", "delayed", "completed"])

    const _handleDeleteJob = (job: Job<any, any, string>) => {
      // logger.info(`Stopping job ${job.id}`)
      job.remove()
    }

    if (jobs.length) {
      jobs.forEach(job => {

        if (!jobIds?.length) {
          _handleDeleteJob(job)
        } else {
          const shouldDeleteThisJob = jobIds.find(id => id === job.id)
          if (shouldDeleteThisJob) {
            _handleDeleteJob(job)
          }
        }
      })
    }
  } catch (error) {

  }
}