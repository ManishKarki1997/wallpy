import { Elysia } from "elysia";
import {  scrapeWallhaven } from "./helpers/parseWallhaven";
import { WALLHAVEN_PREFIX, Wallhaven } from "./db/wallhaven";
import { runWallhavenCRON } from "./cron/wallhaven-cron";
import { SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST } from "./constants";

const app = new Elysia()

app.get("/", async ({ query }) => {


  const {
    page = 1,
    limit,
    sortBy = 'imageId',
    sortOrder = 'asc',
    searchTerm = ''
  } = query;


  const wallpaperModel = new Wallhaven(WALLHAVEN_PREFIX);

  const allWallpapers = await wallpaperModel.getAll({
    page: +page,
    limit: limit? +limit : undefined,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
    searchTerm
  })
  return allWallpapers

});

app.get('/scrape', async ({ query }) => {
  try {

    let {
      totalPages,
      page = 1,
      pageType = "latest"
    } = query

    if(pageType === 'latest'){
      totalPages = String(SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST)
      }else{
      totalPages = String(SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST)
    }   

    const scrapeDetails = await scrapeWallhaven({ page: +page, totalPages: +totalPages,pageType: pageType as "latest" | "toplist" });

    return {
      message: `Finished scraping wallpapers`,
      details: scrapeDetails
    }
    // return {
    //   walls:wallpaperDetails
    // }

  } catch (error) {
    console.error(error)
    return new Response("Something went wrong while scraping wallpapers")
  }
})

runWallhavenCRON()

app.listen(3000, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
})

