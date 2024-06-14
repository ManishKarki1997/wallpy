import { Elysia } from "elysia";
import { getPageTotalCount, scrapeWallhaven } from "./helpers/parseWallhaven";
import { WALLHAVEN_PREFIX, Wallhaven } from "./db/wallhaven";
import { runWallhavenCRON } from "./cron/wallhaven-cron";
import { DEFAULT_PAGINATION_SIZE, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST, WALLHAVEN_LATEST_FETCH_TOTAL_PAGE_URL, WALLHAVEN_TOPLIST_FETCH_TOTAL_PAGE_URL } from "./constants";
import { scrapeWallhavenQueue } from "./scheduler/wallhavenScheduler";
import { saveWallpapers } from "./services/SUWallpaper.service";
import { listWallpapers } from "./services/UserWallpaper.service";


const adminAPI = new Elysia({prefix:"su"})
.get("/scrape", async({ query }) => {
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
    // const existingJob = await scrapeWallhavenQueue.getJob("scrapeWallhaven")
    const existingJob = await scrapeWallhavenQueue.getJobState(uniqueJobId)

    if(existingJob && existingJob === "waiting"){
      return new Response("Job already in queue")
  }

    await scrapeWallhavenQueue.add("scrapeWallhaven",
      { page: +page, totalPages: +totalPages, pageType: pageType as "latest" | "toplist" },
      {jobId:uniqueJobId}
    )

    console.log(`Job added to queue`, { page: +page, totalPages: +totalPages, pageType: pageType as "latest" | "toplist" })

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

const app = new Elysia()
.use(adminAPI)
.use(usersAPI)



runWallhavenCRON()

app.listen(9001, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
})

