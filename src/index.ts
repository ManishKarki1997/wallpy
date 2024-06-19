import { Elysia } from "elysia";
import { WALLHAVEN_PREFIX, Wallhaven } from "./db/wallhaven";
import { runWallhavenCRON } from "./cron/wallhaven-cron";
import { APP_NAME, DEFAULT_PAGINATION_SIZE, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST, WALLHAVEN_LATEST_FETCH_TOTAL_PAGE_URL, WALLHAVEN_TOPLIST_FETCH_TOTAL_PAGE_URL } from "./constants";
import { listCategories, listWallpapers } from "./services/UserWallpaper.service";
import { setupSocketLogger } from "./socket/socket";
import { logger } from "./logger";
import { scrapeWallhavenQueue } from "./scheduler/wallhavenScheduler";
import { handleEmitAllJobs, handleSocketEvents } from "./socket/handleSocketEvents";

const adminAPI = new Elysia({ prefix: "su" })
  .get("/scrape", async ({ query }) => {
    try {

      let {
        totalPages,
        page = 1,
        pageType = "latest"
      } = query


      if (pageType === 'latest') {
        totalPages = String(SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST)
      } else {
        totalPages = String(SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST)
      }

      const uniqueJobId = `scrapeWallhaven-${pageType}`
      const existingJob = await scrapeWallhavenQueue.getJobState(uniqueJobId)

      if (existingJob && (existingJob === "waiting" || existingJob === 'active')) {
        return new Response("Job already in queue")
      }

      // await scrapeWallhaven({ page: +page, totalPages: +totalPages, pageType: pageType as "latest" | "toplist" })

      await scrapeWallhavenQueue.add("scrapeWallhaven",
        { page: +page, totalPages: +totalPages, pageType: pageType as "latest" | "toplist" },
        { jobId: uniqueJobId },
      )

      handleEmitAllJobs()
      logger.info(`Job added to queue`, { page: +page, totalPages: +totalPages, pageType: pageType as "latest" | "toplist" })

      return {
        message: `Scraping job added to queue.`,
      }


    } catch (error) {
      console.error(error)
      return new Response("Something went wrong while scraping wallpapers")
    }
  })


const usersAPI = new Elysia()
  .get("/", async ({ query }) => {
    const {
      page = 1,
      limit,
      sortBy = 'imageId',
      sortOrder = 'asc',
      searchTerm = ''
    } = query;


    // const wallpaperModel = new Wallhaven(WALLHAVEN_PREFIX);

    const data = await listWallpapers({
      limit: limit ? +limit : DEFAULT_PAGINATION_SIZE,
      page: +page,
      search: searchTerm,
      sortBy,
      sortOrder
    })

    return data
  })

usersAPI.get("/categories", async ({ query }) => {
  const {
    page = 1,
    limit,
    sortBy = 'name',
    sortOrder = 'asc',
    searchTerm = ''
  } = query;


  // const wallpaperModel = new Wallhaven(WALLHAVEN_PREFIX);

  const data = await listCategories({
    limit: limit ? +limit : DEFAULT_PAGINATION_SIZE,
    page: +page,
    search: searchTerm,
    sortBy,
    sortOrder
  })

  return data
})

const app = new Elysia()
  .use(adminAPI)
  .use(usersAPI)



runWallhavenCRON()
const socket = setupSocketLogger()
handleSocketEvents(socket)

app.listen(9001, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
})

